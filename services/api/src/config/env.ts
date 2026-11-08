/**
 * PayOps AI (PayPal Sentinel) — Typed Environment & Dual-Mode Detection Loader
 * Automatically detects live credentials vs. zero-config Sandbox / offline replay fallbacks.
 */

export interface PayOpsEnvConfig {
  nodeEnv: string;
  port: number;
  paypalEnvironment: "sandbox" | "live";
  paypalApiBaseUrl: string;
  paypalClientId: string;
  paypalClientSecret: string;
  paypalWebhookId: string;
  paypalPartnerAttributionId: string;
  databaseUrl: string;
  redisUrl: string;
  junodbIdempotencyTtlSeconds: number;
  anthropicApiKey: string;
  m01PrimaryModel: string;
  openaiApiKey: string;
  m02RouterModel: string;
  m05EmbeddingModel: string;
  geminiApiKey: string;
  m03VisionModel: string;
  m04OnnxModelPath: string;
  defaultAutonomyLevel: "L0" | "L1" | "L2" | "L3" | "L4";
  policyMaxSingleAutoRefundUsd: number;
  policyMaxDailyRefundVelocityUsd: number;
  policyMaxSingleAutoInvoiceUsd: number;
  policyMaxGnnRiskScoreAuto: number;
  elasticCloudId: string;
  elasticApiKey: string;
  elasticAuditIndex: string;
  solanaRpcUrl: string;
  pyusdSolanaMintAddress: string;
  pyusdEthereumContractAddress: string;
  jwtEd25519PrivateKeyBase64: string;
  kmsWorkspaceMasterKeyHex: string;
  webauthnRpId: string;
  webauthnRpOrigin: string;
  demoOfflineReplayFallback: string;
  channel3ApiKey: string;
  zapierWebhookUrl: string;
  isLivePostgresConfigured: boolean;
  isLiveRedisConfigured: boolean;
  isLivePayPalConfigured: boolean;
  isLiveLlmConfigured: boolean;
  isLiveElasticConfigured: boolean;
  isLiveChannel3Configured: boolean;
}

function isPlaceholderOrEmpty(value: string | undefined, placeholders: string[]): boolean {
  if (!value || value.trim().length === 0) {
    return true;
  }
  const trimmed = value.trim();
  return placeholders.some((p) => trimmed.includes(p));
}

export function loadEnvConfig(): PayOpsEnvConfig {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const redisUrl = process.env.REDIS_URL ?? "";
  const paypalClientId = process.env.PAYPAL_CLIENT_ID ?? "";
  const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET ?? "";
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY ?? "";
  const openaiApiKey = process.env.OPENAI_API_KEY ?? "";
  const elasticCloudId = process.env.ELASTIC_CLOUD_ID ?? "";
  const elasticApiKey = process.env.ELASTIC_API_KEY ?? "";
  const channel3ApiKey = process.env.CHANNEL3_API_KEY ?? "sandbox_channel3_demo_key";

  const isLivePostgresConfigured =
    process.env.FORCE_LIVE_POSTGRES === "true" ||
    (!isPlaceholderOrEmpty(databaseUrl, [
      "payops_local_dev_pw@localhost",
      "example",
      "placeholder",
    ]) &&
      databaseUrl.startsWith("postgres"));

  const isLiveRedisConfigured =
    process.env.FORCE_LIVE_REDIS === "true" ||
    (!isPlaceholderOrEmpty(redisUrl, ["localhost:6379", "example", "placeholder"]) &&
      redisUrl.startsWith("redis"));

  const isLivePayPalConfigured =
    !isPlaceholderOrEmpty(paypalClientId, ["your_paypal_sandbox_client_id_here", "example"]) &&
    !isPlaceholderOrEmpty(paypalClientSecret, [
      "your_paypal_sandbox_client_secret_here",
      "example",
    ]);

  const isLiveLlmConfigured =
    !isPlaceholderOrEmpty(anthropicApiKey, ["sk-ant-api03-example", "your_"]) ||
    !isPlaceholderOrEmpty(openaiApiKey, ["sk-proj-example", "your_"]);

  const isLiveElasticConfigured =
    !isPlaceholderOrEmpty(elasticCloudId, ["your_elastic_cloud_id_here", "example"]) &&
    !isPlaceholderOrEmpty(elasticApiKey, ["your_elastic_cloud_api_key_here", "example"]);

  const isLiveChannel3Configured = !isPlaceholderOrEmpty(channel3ApiKey, [
    "sandbox_channel3_demo_key",
    "your_",
    "example",
  ]);

  return {
    nodeEnv: process.env.NODE_ENV ?? "development",
    port: Number(process.env.PORT ?? 4000),
    paypalEnvironment: (process.env.PAYPAL_ENVIRONMENT as "sandbox" | "live") ?? "sandbox",
    paypalApiBaseUrl: process.env.PAYPAL_API_BASE_URL ?? "https://api-m.sandbox.paypal.com",
    paypalClientId,
    paypalClientSecret,
    paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID ?? "WH-2WR32451HC0233532-67976317FL4543714",
    paypalPartnerAttributionId:
      process.env.PAYPAL_PARTNER_ATTRIBUTION_ID ?? "PayOpsAI_Hackathon_PPCP",
    databaseUrl,
    redisUrl,
    junodbIdempotencyTtlSeconds: Number(process.env.JUNODB_IDEMPOTENCY_TTL_SECONDS ?? 86400),
    anthropicApiKey,
    m01PrimaryModel: process.env.M01_PRIMARY_MODEL ?? "claude-3-5-sonnet-20241022",
    openaiApiKey,
    m02RouterModel: process.env.M02_ROUTER_MODEL ?? "gpt-4o-mini-2024-07-18",
    m05EmbeddingModel: process.env.M05_EMBEDDING_MODEL ?? "text-embedding-3-small",
    geminiApiKey: process.env.GEMINI_API_KEY ?? "",
    m03VisionModel: process.env.M03_VISION_MODEL ?? "gemini-1.5-pro-002",
    m04OnnxModelPath:
      process.env.M04_ONNX_MODEL_PATH ?? "./ai/models/payops-graphsage-lgbm-v1.2.onnx",
    defaultAutonomyLevel:
      (process.env.DEFAULT_AUTONOMY_LEVEL as "L0" | "L1" | "L2" | "L3" | "L4") ?? "L3",
    policyMaxSingleAutoRefundUsd: Number(process.env.POLICY_MAX_SINGLE_AUTO_REFUND_USD ?? 250.0),
    policyMaxDailyRefundVelocityUsd: Number(
      process.env.POLICY_MAX_DAILY_REFUND_VELOCITY_USD ?? 500.0
    ),
    policyMaxSingleAutoInvoiceUsd: Number(
      process.env.POLICY_MAX_SINGLE_AUTO_INVOICE_USD ?? 5000.0
    ),
    policyMaxGnnRiskScoreAuto: Number(process.env.POLICY_MAX_GNN_RISK_SCORE_AUTO ?? 0.35),
    elasticCloudId,
    elasticApiKey,
    elasticAuditIndex: process.env.ELASTIC_AUDIT_INDEX ?? "payops-immutable-audit-180d",
    solanaRpcUrl: process.env.SOLANA_RPC_URL ?? "https://api.devnet.solana.com",
    pyusdSolanaMintAddress:
      process.env.PYUSD_SOLANA_MINT_ADDRESS ?? "2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo",
    pyusdEthereumContractAddress: "0x6c3ea9036406852006290770BEdFcAbA0e23A0e8",
    jwtEd25519PrivateKeyBase64:
      process.env.JWT_ED25519_PRIVATE_KEY_BASE64 ??
      "MC4CAQAwBQYDK2VwBCIEIFBheU9wc0FpU2VudGluZWxFZDI1NTE5RGV2S2V5MzI=",
    kmsWorkspaceMasterKeyHex:
      process.env.KMS_WORKSPACE_MASTER_KEY_HEX ??
      "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    webauthnRpId: process.env.WEBAUTHN_RP_ID ?? "localhost",
    webauthnRpOrigin: process.env.WEBAUTHN_RP_ORIGIN ?? "http://localhost:3000",
    demoOfflineReplayFallback: process.env.FF_DEMO_OFFLINE_REPLAY_FALLBACK ?? "auto",
    channel3ApiKey,
    zapierWebhookUrl:
      process.env.ZAPIER_WEBHOOK_URL ?? "https://hooks.zapier.com/hooks/catch/demo/payops-sentinel",
    isLivePostgresConfigured,
    isLiveRedisConfigured,
    isLivePayPalConfigured,
    isLiveLlmConfigured,
    isLiveElasticConfigured,
    isLiveChannel3Configured,
  };
}

export const envConfig = loadEnvConfig();
