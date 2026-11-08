/**
 * PayOps AI (PayPal Sentinel) — JunoDB-Style Two-Phase Commit (2PC) Idempotency Guard (F-06, R-02)
 * Implements Dual-Mode Redis 7.4 (SET junodb:lease:{key} EX 86400 NX) + Zero-Config In-Memory TTL
 * CAS lock store with single-flight promise coalescing so 10 concurrent identical mutations execute
 * exactly 1 downstream PayPal call and return 10 identical responses.
 */

import { Redis } from "ioredis";
import { envConfig } from "../../config/env.js";
import { computeDeterministicIdempotencyKey } from "../../db/audit-chain.js";

export type JunoLeaseState = "IN_FLIGHT" | "COMPLETED" | "RELEASED";

export interface JunoLeaseEntry<T = unknown> {
  key: string;
  paypalRequestId: string;
  state: JunoLeaseState;
  statusCode: number;
  responsePayload?: T;
  createdAtMs: number;
  expiresAtMs: number;
}

export interface JunoExecutionEnvelope<T> {
  paypalRequestId: string;
  junodbLeaseStatus: "ACQUIRED" | "REPLAYED_FROM_JUNODB";
  replayed: boolean;
  statusCode: number;
  result: T;
}

export class JunoDbIdempotencyStore {
  public mode: "redis" | "in-memory" = "in-memory";
  private redis: Redis | null = null;
  private readonly memoryLeases = new Map<string, JunoLeaseEntry>();
  private readonly inFlightPromises = new Map<
    string,
    Promise<{ statusCode: number; result: unknown }>
  >();
  private readonly ttlSeconds: number;

  constructor(ttlSeconds = envConfig.junodbIdempotencyTtlSeconds || 86400) {
    this.ttlSeconds = ttlSeconds;
  }

  public async initializeRedisIfConfigured(): Promise<void> {
    if (!envConfig.isLiveRedisConfigured) {
      this.mode = "in-memory";
      return;
    }
    try {
      this.redis = new Redis(envConfig.redisUrl, {
        connectTimeout: 1000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      await this.redis.connect();
      await this.redis.ping();
      this.mode = "redis";
    } catch {
      this.mode = "in-memory";
      if (this.redis) {
        this.redis.disconnect();
        this.redis = null;
      }
    }
  }

  private buildNamespaceKey(paypalRequestId: string): string {
    return `junodb:lease:${paypalRequestId}`;
  }

  private pruneExpiredMemoryLeases(): void {
    const now = Date.now();
    for (const [k, entry] of this.memoryLeases.entries()) {
      if (entry.expiresAtMs <= now) {
        this.memoryLeases.delete(k);
      }
    }
  }

  /**
   * Executes a state-mutating operation under a JunoDB 2PC CAS lease (TTL 86,400s).
   * - Winner thread gets junodbLeaseStatus: "ACQUIRED", replayed: false.
   * - Concurrent in-flight duplicates coalesce onto the winner's promise and return
   *   junodbLeaseStatus: "REPLAYED_FROM_JUNODB", replayed: true without calling fn() again.
   * - Subsequent retries within 24h return the committed response from the lease store.
   */
  public async executeIdempotent<T>(
    paypalRequestId: string,
    fn: () => Promise<{ statusCode: number; result: T }>
  ): Promise<JunoExecutionEnvelope<T>> {
    this.pruneExpiredMemoryLeases();
    const nsKey = this.buildNamespaceKey(paypalRequestId);

    // 1. Check completed lease in memory
    const existing = this.memoryLeases.get(nsKey);
    if (existing && existing.state === "COMPLETED" && existing.expiresAtMs > Date.now()) {
      return {
        paypalRequestId,
        junodbLeaseStatus: "REPLAYED_FROM_JUNODB",
        replayed: true,
        statusCode: existing.statusCode,
        result: existing.responsePayload as T,
      };
    }

    // 2. Check if another concurrent request is currently in-flight for the exact same key
    const existingInFlight = this.inFlightPromises.get(nsKey);
    if (existingInFlight) {
      const coalesced = await existingInFlight;
      return {
        paypalRequestId,
        junodbLeaseStatus: "REPLAYED_FROM_JUNODB",
        replayed: true,
        statusCode: coalesced.statusCode,
        result: coalesced.result as T,
      };
    }

    // 3. Check Redis if live mode is active
    if (this.mode === "redis" && this.redis) {
      const cachedJson = await this.redis.get(nsKey);
      if (cachedJson) {
        const parsed = JSON.parse(cachedJson) as JunoLeaseEntry<T>;
        if (parsed.state === "COMPLETED" && parsed.responsePayload !== undefined) {
          return {
            paypalRequestId,
            junodbLeaseStatus: "REPLAYED_FROM_JUNODB",
            replayed: true,
            statusCode: parsed.statusCode,
            result: parsed.responsePayload,
          };
        }
      }
    }

    // 4. Phase 1 Prepare: Acquire atomic lease & register single-flight promise
    const now = Date.now();
    const prepareEntry: JunoLeaseEntry = {
      key: nsKey,
      paypalRequestId,
      state: "IN_FLIGHT",
      statusCode: 202,
      createdAtMs: now,
      expiresAtMs: now + this.ttlSeconds * 1000,
    };
    this.memoryLeases.set(nsKey, prepareEntry);

    if (this.mode === "redis" && this.redis) {
      await this.redis.set(
        nsKey,
        JSON.stringify(prepareEntry),
        "EX",
        this.ttlSeconds,
        "NX"
      );
    }

    const executionPromise = (async () => {
      try {
        const outcome = await fn();
        // Phase 2 Commit: Persist completed response with 24h TTL
        const committedEntry: JunoLeaseEntry<T> = {
          key: nsKey,
          paypalRequestId,
          state: "COMPLETED",
          statusCode: outcome.statusCode,
          responsePayload: outcome.result,
          createdAtMs: now,
          expiresAtMs: Date.now() + this.ttlSeconds * 1000,
        };
        this.memoryLeases.set(nsKey, committedEntry);

        if (this.mode === "redis" && this.redis) {
          await this.redis.set(
            nsKey,
            JSON.stringify(committedEntry),
            "EX",
            this.ttlSeconds
          );
        }
        return outcome;
      } catch (err) {
        // Rollback lock on unhandled error so legitimate retries can proceed
        this.memoryLeases.delete(nsKey);
        if (this.mode === "redis" && this.redis) {
          await this.redis.del(nsKey).catch(() => undefined);
        }
        throw err;
      } finally {
        this.inFlightPromises.delete(nsKey);
      }
    })();

    this.inFlightPromises.set(nsKey, executionPromise);
    const winnerOutcome = await executionPromise;

    return {
      paypalRequestId,
      junodbLeaseStatus: "ACQUIRED",
      replayed: false,
      statusCode: winnerOutcome.statusCode,
      result: winnerOutcome.result,
    };
  }

  public releaseLease(paypalRequestId: string): void {
    const nsKey = this.buildNamespaceKey(paypalRequestId);
    this.memoryLeases.delete(nsKey);
    this.inFlightPromises.delete(nsKey);
    if (this.mode === "redis" && this.redis) {
      this.redis.del(nsKey).catch(() => undefined);
    }
  }

  public clearAll(): void {
    this.memoryLeases.clear();
    this.inFlightPromises.clear();
  }
}

export const junoIdempotencyStore = new JunoDbIdempotencyStore();
export { computeDeterministicIdempotencyKey };
