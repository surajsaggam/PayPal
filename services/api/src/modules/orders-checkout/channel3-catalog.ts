/**
 * PayOps AI (PayPal Sentinel) — Channel3 B2B Catalog Discovery Bridge (F-12)
 * Queries Channel3 normalized B2B SKU catalog with 2,000ms timeout and automatic deterministic
 * local PayPal Catalog fallback when CHANNEL3_API_KEY is sandbox_channel3_demo_key or offline.
 */

import { envConfig } from "../../config/env.js";

export interface Channel3SkuItem {
  skuId: string;
  name: string;
  category: string;
  unitPriceUsd: string;
  unitPriceMinor: number;
  currencyCode: "USD";
  inStock: boolean;
  supplierVerified: boolean;
  source: "channel3-live" | "channel3-sandbox-catalog";
}

const SANDBOX_CHANNEL3_CATALOG: ReadonlyArray<Channel3SkuItem> = [
  {
    skuId: "C3-88210",
    name: "Kraft Eco-Mailer 12x9 (500-Pack)",
    category: "SUSTAINABLE_PACKAGING",
    unitPriceUsd: "390.00",
    unitPriceMinor: 39000,
    currencyCode: "USD",
    inStock: true,
    supplierVerified: true,
    source: "channel3-sandbox-catalog",
  },
  {
    skuId: "C3-99104",
    name: "Organic Combed Cotton Yarn Cone (50kg Lot)",
    category: "TEXTILE_RAW_MATERIALS",
    unitPriceUsd: "1250.00",
    unitPriceMinor: 125000,
    currencyCode: "USD",
    inStock: true,
    supplierVerified: true,
    source: "channel3-sandbox-catalog",
  },
  {
    skuId: "C3-77412",
    name: "Industrial Loom Tension Sensor Array Model X",
    category: "MANUFACTURING_IOT",
    unitPriceUsd: "1850.00",
    unitPriceMinor: 185000,
    currencyCode: "USD",
    inStock: true,
    supplierVerified: true,
    source: "channel3-sandbox-catalog",
  },
];

export async function searchChannel3Catalog(query?: string): Promise<{
  query: string;
  items: Channel3SkuItem[];
  source: "channel3-live" | "channel3-sandbox-catalog";
  apiKeyConfigured: boolean;
}> {
  const q = (query ?? "").trim().toLowerCase();

  if (envConfig.isLiveChannel3Configured && process.env.VITEST !== "true") {
    try {
      const res = await fetch(
        `https://api.channel3.ai/v1/products/search?q=${encodeURIComponent(q)}`,
        {
          headers: {
            Authorization: `Bearer ${envConfig.channel3ApiKey}`,
            "X-API-Key": envConfig.channel3ApiKey,
            Accept: "application/json",
          },
          signal: AbortSignal.timeout(2000),
        }
      );
      if (res.ok) {
        const data = (await res.json()) as { items?: Channel3SkuItem[] };
        if (Array.isArray(data.items) && data.items.length > 0) {
          return {
            query: query ?? "",
            items: data.items,
            source: "channel3-live",
            apiKeyConfigured: true,
          };
        }
      }
    } catch {
      // Fallback to deterministic Sandbox catalog
    }
  }

  const filtered = q
    ? SANDBOX_CHANNEL3_CATALOG.filter(
        (item) =>
          item.skuId.toLowerCase().includes(q) ||
          item.name.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
      )
    : [...SANDBOX_CHANNEL3_CATALOG];

  return {
    query: query ?? "",
    items: filtered.length > 0 ? filtered : [...SANDBOX_CHANNEL3_CATALOG],
    source: "channel3-sandbox-catalog",
    apiKeyConfigured: envConfig.isLiveChannel3Configured,
  };
}
