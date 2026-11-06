# Coding Standards, Linting & Security Hygiene — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Staff Software Engineer & Quality Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Frontend](./FRONTEND.md) · [Backend](./BACKEND.md) · [Git Workflow](./GIT_WORKFLOW.md) · [Security Architecture](../06-security-compliance/SECURITY_ARCHITECTURE.md)

---

## 1. Language & Compiler Strictness Standards

To meet the repository hygiene and production engineering bar evaluated by **Eddie Jaoude**, **Karthik Ravi**, and **Himraj Singh**, all code in `PayOps AI` enforces maximum compile-time and lint-time strictness:

### 1.1 TypeScript `5.6.3` (`apps/web`, `services/api`, `packages/*`)
Every `tsconfig.json` inherits from `tsconfig.base.json` with zero implicit `any`:
```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "NodeNext",
    "strict": true,
    "noImplicitAny": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```
- **Formatter & Linter:** **Biome `1.9.4`** + **ESLint `9.14.0`** (`@typescript-eslint/strict-type-checked`).
- **Monetary Math Rule:** Never use IEEE-754 `number` floats for currency addition or discount calculation. Always represent monetary quantities as `bigint` minor units (`amount_minor`, e.g., `185000n` for `$1,850.00`) and serialize to ISO-4217 decimal strings only at the PayPal SDK boundary (`LOCALIZATION.md`).

### 1.2 Python `3.12.7` (`services/risk-dsl`)
- **Formatter, Linter & Type Checker:** **Ruff `0.7.2`** (`ruff check --select ALL` + `ruff format`) and **Mypy `1.13.0` (`--strict`)** with **Pydantic v2 (`2.9.2`)** strict models.
- **No Dynamic Code Execution:** `eval()`, `exec()`, and `pickle.loads()` are strictly banned via Ruff rule `S307`/`S301`. The `Cosmos.AI` DSL compiler (`F-02`) parses expressions exclusively via a whitelist `ast.NodeVisitor`.

---

## 2. Naming & Canonical Identifier Conventions

| Artifact Type | Convention | Concrete Example |
| :--- | :--- | :--- |
| **PostgreSQL Tables & Columns (`DATA_MODEL.md`)** | `snake_case` (plural table names) | `agent_tool_executions`, `paypal_request_id`, `gnn_risk_score` |
| **TypeScript Interfaces & React Components** | `PascalCase` | `PayPalInvoiceRecord`, `<LedgerCommandGrid />` |
| **Functions, Variables & Hooks** | `camelCase` | `acquireIdempotentLease`, `useSseExecutionStream` |
| **Python Modules, Functions & Pydantic Fields** | `snake_case` | `evaluate_policy_dag`, `injection_score` |
| **Environment Variables & Feature Flags** | `SCREAMING_SNAKE_CASE` | `PAYPAL_CLIENT_ID`, `FF_COSMOS_POLICY_STRICT` |
| **Canonical Spec Traceability Comments** | `@canonical <ID>` in module docstrings | `/** @canonical F-06 · E-04 · API-07 */` |

---

## 3. Structured Logging, Error Handling & Zero-PII/Zero-Secret Rules

### 3.1 Typed Error Handling (`RFC 7807`)
- Services never throw raw strings or swallow caught exceptions. All domain operations return `Result<T, PayOpsProblemError>` which maps deterministically to **RFC 7807 (`application/problem+json`)** responses containing `type`, `title`, `status`, `detail`, `trace_id`, and `paypal_request_id`.

### 3.2 Structured JSON Logging & Redaction (`R-07` Mitigation)
All logs use **Pino `9.5.0`** (Node.js) and **structlog `24.4.0`** (Python) with mandatory OpenTelemetry context injection (`trace_id`, `span_id`, `workspace_id`, `paypal_request_id`) and automatic redaction paths:
```typescript
// services/api/src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  redact: {
    paths: [
      'req.headers.authorization',
      '*.clientSecret',
      '*.PAYPAL_CLIENT_SECRET',
      '*.buyer_email',
      '*.recipient_email',
      '*.card_number',
      '*.cvv',
    ],
    censor: '[REDACTED_BY_PAYOPS_PII_GUARD]',
  },
});
```

---

## 4. Code Review & Pre-Merge Verification Checklist

Every pull request must pass automated CI checks and satisfy these 6 engineering invariants before merge:
1. **Idempotency Check:** Does every new PayPal state mutation pass a deterministic `PayPal-Request-Id` through `acquireIdempotentLease` (`F-06`)?
2. **Policy Firewall Check:** Is every new `@paypal/agent-toolkit` tool registered in the `Cosmos.AI` DSL Policy Firewall (`F-02`) and APIMatic schema validator (`F-09`)?
3. **Zero Unfilled Marker Strings:** Does the diff contain complete, production-ready logic and documentation with zero unfinished marker tokens?
4. **Zero Secrets / Zero Raw PII:** Are all credentials loaded from environment variables and all buyer identifiers hashed to `buyer_hash` before logging or LLM prompting?
5. **Accessibility & Tabular Numerals:** Do new UI components support keyboard navigation, ARIA labels, and `tabular-nums` alignment?
6. **Test Coverage:** Are unit and OpenAPI contract tests included with `>= 85%` branch coverage?
