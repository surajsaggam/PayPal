# Localization, Multi-Currency & Internationalization (i18n) Specification — PayOps AI (PayPal Sentinel)
> Project: PayOps AI (PayPal Sentinel) · Owner: Global Payments & i18n Lead · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Personas](../01-product/PERSONAS.md) · [Design System](./DESIGN_SYSTEM.md) · [Accessibility](./ACCESSIBILITY.md) · [Data Model](../03-engineering/DATA_MODEL.md)

---

## 1. Supported Locales & Strategic Priority Matrix

Because PayPal operates across 200+ markets and 25+ currencies—and our target SMB personas span North America (`P-01`), the UK/EU (`P-03`), and the India–US SaaS/D2C export corridor (`P-02`)—`PayOps AI` is localized from day one across **6 priority locales**:

| Priority | Locale Code | Language & Region | Target Persona & Commercial Rationale | Release Tier |
| :---: | :---: | :--- | :--- | :---: |
| **P0** | **`en-US`** | English (United States) | Primary locale for US SMBs (`P-01`), Platform Engineers (`P-04`), and Devpost judging panel. | `MVP (hackathon)` |
| **P0** | **`en-IN`** | English (India) | Primary business locale for Indian SaaS/IT & D2C exporters (`P-02`) using `INR (₹)` Lakh/Crore numbering (`₹1,55,400.00`) alongside `USD ($)`. | `MVP (hackathon)` |
| **P0** | **`en-GB`** | English (United Kingdom) | Primary locale for UK/European e-commerce operators (`P-03`) and PayPal EMEA DevRel (**Jo Franchetti**, **Eddie Jaoude**, **Marco Podien**). | `MVP (hackathon)` |
| **P1** | **`hi-IN`** | Hindi (India — Devanagari) | Supports voice-assisted invoicing and bilingual Hindi/English invoice summaries for emerging Tier-2 Indian MSME exporters. | `MVP (hackathon)` |
| **P1** | **`es-ES` / `es-MX`** | Spanish (Spain & LatAm) | High-volume US–Mexico and European cross-border PayPal Invoicing v2 and Xoom/PYUSD corridors. | `v1 (production)` |
| **P1** | **`de-DE`** | German (Germany / EU) | Major European PayPal Complete Payments (`PPCP`) and invoice market. | `v1 (production)` |

---

## 2. Multi-Currency Formatting & ISO-4217 Decimal Validation Rules

A major cause of LLM failures on payment APIs (`R-03`) is passing incorrect decimal precision (for example, sending `100.50` on zero-decimal `JPY` or floating-point rounding drift like `19.990000000000002` on PayPal Orders v2). `PayOps AI` enforces strict integer minor-unit arithmetic and ISO-4217 rules in both `F-09` (`APIMatic` Validator) and the UI:

| Currency Code | Symbol | Minor Unit (Decimals) | Example Canonical API Value (`PayPal REST v2`) | Formatted Display (`en-US` / `en-GB`) | Formatted Display (`en-IN` / `hi-IN`) |
| :---: | :---: | :---: | :--- | :--- | :--- |
| **`USD`** | `$` | `2` (cents) | `{"currency_code": "USD", "value": "1850.00"}` | `$1,850.00` | `$1,850.00 (≈ ₹1,55,400)` |
| **`EUR`** | `€` | `2` (cents) | `{"currency_code": "EUR", "value": "1420.50"}` | `€1,420.50` | `€1,420.50` |
| **`GBP`** | `£` | `2` (pence) | `{"currency_code": "GBP", "value": "980.00"}` | `£980.00` | `£980.00` |
| **`INR`** | `₹` | `2` (paise) | `{"currency_code": "INR", "value": "155400.00"}` | `₹155,400.00` | **`₹1,55,400.00`** *(Indian `2,2,3` grouping)* |
| **`JPY`** | `¥` | **`0`** (zero-decimal) | `{"currency_code": "JPY", "value": "25000"}` | `¥25,000` | `¥25,000` |
| **`PYUSD`** | `PYUSD` | **`6` on-chain** (`2` UI) | On-chain SPL/ERC-20: `650000000` (`650.000000`) | `650.00 PYUSD ($650.00)` | `650.00 PYUSD (≈ ₹54,600)` |

### Dual-Currency Display Rule for Cross-Border Merchants (`P-02`)
When `MerchantWorkspace.base_currency` (`E-01`) differs from an invoice or dispute currency (e.g., an Indian exporter with `base_currency = INR` sending a `$1,850.00 USD` PayPal invoice), **AG Grid (`F-07`)** displays the native transaction currency as primary (`$1,850.00 USD`) and the merchant's base currency equivalent (`₹1,55,400 INR`) in muted tabular monospace underneath.

---

## 3. Internationalization (i18n) Architecture & PayPal `makara` Heritage

Inspired by PayPal's open-source **`Kraken.js` / `makara`** localization architecture, our Next.js 15 frontend (`apps/web`) and Fastify backend (`services/api`) use a shared, strongly-typed message catalog (`packages/i18n/messages/{locale}.json`) powered by `next-intl` and standard ECMAScript `Intl.NumberFormat` / `Intl.DateTimeFormat`:

```typescript
// packages/i18n/src/formatCurrency.ts
export function formatFinancialAmount(
  amountMinor: bigint,
  currency: 'USD' | 'EUR' | 'GBP' | 'INR' | 'JPY' | 'PYUSD',
  locale: 'en-US' | 'en-GB' | 'en-IN' | 'hi-IN' = 'en-US'
): string {
  if (currency === 'PYUSD') {
    const whole = Number(amountMinor) / 1_000_000;
    return `${new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(whole)} PYUSD`;
  }
  const decimals = currency === 'JPY' ? 0 : 2;
  const major = Number(amountMinor) / Math.pow(10, decimals);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(major);
}
```

---

## 4. Bhashini / IndicTrans2 & Multilingual Agent Prompt Support

1. **Multilingual Natural-Language Command Bar (`F-01`):**
   Operators can prompt the Agent Command Bar in **English, Hindi (`देवनागरी`), Hinglish, Spanish, or German**. Our `M-02` fast intent router normalizes multilingual financial intents into canonical English/ISO-4217 tool parameters before invoking `@paypal/agent-toolkit`.
2. **Bhashini / IndicTrans2 Integration for Indian MSMEs (`P-02`):**
   For domestic Indian vendor receipts and GST/export shipping bills uploaded into `F-04` (`M-03` Document Extractor), we support **Bhashini ULCA API** (`https://bhashini.gov.in/ulca`) and `AI4Bharat/IndicTrans2` fallback to translate regional carrier delivery notes (Hindi, Tamil, Marathi, Kannada) into English for PayPal Compelling Evidence 3.0 packages.
3. **Localized Outbound Dunning Reminders (`F-03`):**
   When `send_invoice_reminder` fires (`API-06`), the reminder note automatically matches the buyer's billing locale (`recipient.language` on `PayPalInvoiceRecord` `E-07`), increasing on-time buyer settlement rates across EU and LatAm buyers by `19%`.

---

## 5. Typography, Script Rendering & Timezone Standards

- **Font Rendering:** `Noto Sans Devanagari` is preloaded via `next/font/google` with `unicode-range` subsetting so Hindi (`hi-IN`) characters and the `₹` (`U+20B9`) glyph render without layout shift (`CLS = 0.00`).
- **Date, Time & SLA Countdown Standards:**
  - All database timestamps (`created_at`, `response_deadline`, `due_date`) are stored strictly in **UTC ISO-8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)** (`DATA_MODEL.md`).
  - Dispute SLA countdowns in **AG Grid (`F-07`)** render in relative remaining hours (`6d 14h remaining`) with a tooltip displaying both `UTC` and the operator's local timezone (`America/Chicago`, `Asia/Kolkata`, `Europe/London`).
