# Unit Economics, 3-Year Financial Projections & Capital Strategy (`FINANCIALS.md`)
> Project: PayOps AI (PayPal Sentinel) · Owner: Chief Financial Officer (Roelof Botha, Warren Buffett & David Sacks Lens) · Status: Approved v1.0 · Last updated: 2026-11-05
> Related: [Project Brief](../00-overview/PROJECT_BRIEF.md) · [Business Model](./BUSINESS_MODEL.md) · [GTM](./GTM.md) · [Cost](../05-ops/COST.md)

## 1. SaaS & Performance Unit Economics (David Sacks & Roelof Botha Benchmarks)

*Exchange Rate Baseline: **$1.00 USD = ₹84.00 INR**.*

| Unit Economic Metric | **SMB Growth Segment** (`$49/mo` base) | **Mid-Market Pro Segment** (`$199/mo` base) | **Blended Portfolio Average** | Elite B2B FinTech SaaS Benchmark (Craft / Sequoia) |
|---|---|---|---|---|
| **Monthly Base SaaS ARPU** | `$49.00` (`₹4,116`) | `$199.00` (`₹16,716`) | **`$79.00`** (`₹6,636`) | `$50–$250` |
| **Monthly Performance / Dispute Recovery ARPU** | `$24.50` (`₹2,058`)<br>*(Avg $490/mo won disputes @ 5%)* | `$115.00` (`₹9,660`)<br>*(Disputes + PYUSD settlement bps)* | **`$42.60`** (`₹3,578`) | Usage/take-rate upside |
| **Total Monthly Revenue per Active Merchant (`ARPU`)** | **$73.50 / mo** (`₹6,174 / mo`) | **$314.00 / mo** (`₹26,376 / mo`) | **$121.60 / mo** (**`₹10,214 / mo`**) | — |
| **Monthly Infrastructure + AI Token COGS (`COST.md`)** | `$1.10 / mo` (`₹92.40`) | `$2.85 / mo` (`₹239.40`) | **`$1.30 / mo`** (**`₹109.20 / mo`**) | `< 15%` of ARPU |
| **PayPal Subscription Billing Processing Cost (`2.99%`)** | `$2.20 / mo` (`₹184.80`) | `$9.39 / mo` (`₹788.76`) | **`$3.64 / mo`** (**`₹305.76 / mo`**) | `~3%` |
| **Gross Margin (`$` / `₹` and `%`)** | `$70.20` (`95.5%`) | `$301.76` (`96.1%`) | **`$116.66 / mo` (`95.9%`)** | **`> 80%`** |
| **Customer Acquisition Cost (`CAC`, Blended Paid + Viral $K=0.576$)** | `$68.00` (`₹5,712`) | `$240.00` (`₹20,160`) | **`$85.00`** (**`₹7,140`**) | — |
| **CAC Payback Period (Gross Margin Adjusted)** | **0.97 Months** (`29 days`) | **0.80 Months** (`24 days`) | **0.73 Months (`22 days`)** | `< 12 Months` (Best-in-class `< 3 mo`) |
| **Monthly Logo Churn / Net Dollar Retention (`NDR`)** | `2.1% / mo` · `112% NDR` | `0.8% / mo` · `134% NDR` | **`1.8% / mo` · `122% NDR`** | `> 110% NDR` |
| **Customer Lifetime Value (`LTV = Gross Margin / Churn`)** | `$3,343` (`₹2,80,812`) | `$37,720` (`₹31,68,480`) | **`$6,481`** (**`₹5,44,404`**) | — |
| **`LTV : CAC` Ratio** | **`49.2x`** | **`157.2x`** | **`76.2x`** | `> 5.0x` |

---

## 2. Three-Year Financial Projections (`Year 1` to `Year 3` in `$` USD and `₹` INR)

### Key Model Assumptions
1. **Merchant Mix**: `80%` SMB Growth (`$49/mo` + performance fee) and `20%` Mid-Market Pro / Enterprise (`$199–$999/mo` + performance fee), plus a free PLG Starter funnel converting at `14.5%` within 30 days.
2. **Headcount Scaling**: Year 1: `4` core builders (founders); Year 2: `14` FTEs (engineering, AI/risk, PayPal partner sales, compliance); Year 3: `38` FTEs.
3. **Cloud & AI Cost Scaling**: Incorporates `COST.md` scaling curves (Anthropic Prompt Caching + `M-02` QLoRA vLLM distillation + self-hosted `JunoDB`/ONNX `M-04`).

| Financial Line Item | **Year 1 (`2027`)** | **Year 2 (`2028`)** | **Year 3 (`2029`)** |
|---|---|---|---|
| **Ending Active Paying Merchants** | **1,200** | **10,000** | **45,000** |
| **Gross Payment & Invoice Volume Orchestrated (`TPV`)** | **$180M** (`₹1,512 Cr`) | **$1.65B** (`₹13,860 Cr`) | **$8.10B** (`₹68,040 Cr`) |
| **SaaS Subscription ARR** | **$1,137,600** (`₹9.56 Cr`) | **$9,480,000** (`₹79.63 Cr`) | **$42,660,000** (`₹358.34 Cr`) |
| **Performance & Dispute Recovery Revenue** | **$388,800** (`₹3.27 Cr`) | **$5,112,000** (`₹42.94 Cr`) | **$23,004,000** (`₹193.23 Cr`) |
| **Total Recognized Revenue (`GAAP`)** | **$940,000** (`₹7.90 Cr`)<br>*(Ending ARR: **$1.53M**)* | **$8,950,000** (`₹75.18 Cr`)<br>*(Ending ARR: **$14.59M**)* | **$41,200,000** (`₹346.08 Cr`)<br>*(Ending ARR: **$65.66M**)* |
| **COGS (Cloud Infra, AI Tokens, PayPal Billing Fees)** | `$58,200` (`₹48.89 Lakh`) | `$465,400` (`₹3.91 Cr`) | `$1,895,200` (`₹15.92 Cr`) |
| **Gross Profit** | **$881,800** (`₹7.41 Cr`) | **$8,484,600** (`₹71.27 Cr`) | **$39,304,800** (`₹330.16 Cr`) |
| **Gross Margin (`%`)** | **`93.8%`** | **`94.8%`** | **`95.4%`** |
| **R&D / Engineering & AI Evals Expense** | `$420,000` (`₹3.53 Cr`) | `$2,450,000` (`₹20.58 Cr`) | `$7,800,000` (`₹65.52 Cr`) |
| **Sales, Marketing & Partner Co-Sell (`CAC`)** | `$115,000` (`₹96.60 Lakh`) | `$920,000` (`₹7.73 Cr`) | `$3,950,000` (`₹33.18 Cr`) |
| **G&A, Legal, SOC 2 Type II & PCI-DSS Audits** | `$95,000` (`₹79.80 Lakh`) | `$580,000` (`₹4.87 Cr`) | `$1,850,000` (`₹15.54 Cr`) |
| **EBITDA / Operating Income** | **+$251,800** (**`+₹2.12 Cr`**) | **+$4,534,600** (**`+₹38.09 Cr`**) | **+$25,704,800** (**`+₹215.92 Cr`**) |
| **EBITDA Margin (`%`)** | **`+26.8%`** *(Default Alive in Y1)* | **`+50.7%`** | **`+62.4%`** |

---

## 3. Capital Efficiency, Non-Dilutive Grants & Funding Path

1. **Stage 0 — PayPal AI Hackathon Prize Stack (`$29,500+` Non-Dilutive Capital + Credits)**:
   - Target Prize Stack: **Overall 1st Place ($12,000)** + **Best Use of Agentic Commerce ($5,000)** / **Best Use of PayPal + AI ($5,000)** + **Best Use of AG Grid ($5,000)** + **Best Use of APIMatic ($1,000 + 6-mo Business Sub)** + **Best Use of Bryntum ($1,000)** + **Best Use of Render ($1,000 Credits)**.
   - Because our 100-merchant MVP infrastructure costs only `$110.30/mo` net of Render credits (`COST.md`), the hackathon prize pool alone funds **18+ months of zero-burn operations** to reach `$1.5M ARR` ("Default Alive" per **Paul Graham**).
2. **Stage 1 — India & Global Non-Dilutive Grants**:
   - **Startup India Seed Fund Scheme (SISFS)**: Up to `₹20 Lakh` (`~$23,800`) grant for PoC validation and `₹50 Lakh` (`~$59,500`) debt/convertible debenture for MSME cross-border trade automation.
   - **MeitY Startup Hub (MSH) / IndiaAI Mission Compute Credits**: Subsidized GPU compute for `M-02` and `M-04` Indic/cross-border fine-tuning (`FINE_TUNING.md`).
3. **Stage 2 — Strategic Venture Round (Optional Seed / Series A)**:
   - Strategic alignment with **PayPal Ventures**, **Sequoia Capital / Peak XV**, **Founders Fund**, and **Craft Ventures** to scale native PPCP & `PYUSD` treasury rails globally.
