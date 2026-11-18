# FINWISE AI – REST API Specification

Base URL: `/api`  
Security: `Authorization: Bearer <JWT_ACCESS_TOKEN>`

---

## 1. Authentication & Identity
- `POST /api/auth/register`
  - Body: `{ email, username, password, full_name, role, annual_income }`
  - Response: `201 Created` with `{ user, access_token, refresh_token }`
- `POST /api/auth/login`
  - Body: `{ login, password }`
  - Response: `200 OK` with `{ user, access_token, refresh_token }`
- `POST /api/auth/logout`
  - Headers: JWT Bearer
  - Response: `200 OK`
- `GET /api/auth/profile`
  - Response: User profile attributes and risk settings
- `POST /api/auth/seed-demo-data`
  - Pre-populates verified transactions, accounts, and budgets for hackathon testing.

## 2. Dashboard Intelligence
- `GET /api/dashboard/summary?filter=today|week|month|last_month`
  - Inflows, outflows, balance, budget utilization, suspicious flags, AI insights.
- `GET /api/dashboard/analytics`
  - 6-month historical cash-flow trends.

## 3. Financial Statements & Ledger
- `POST /api/financial/upload`
  - Form-data: `file` (.pdf, .csv, .xlsx)
  - PyMuPDF and Pandas extraction pipeline.
- `GET /api/financial/transactions?category=&search=&type=&suspicious=`
  - Filtered transactions with pagination.
- `POST /api/financial/transactions`
  - Manual transaction creation.
- `DELETE /api/financial/transactions/{id}`
  - Ledger deletion.

## 4. AI Fraud Detection Centre
- `POST /api/fraud/analyse-message`
  - Body: `{ message, channel, sender }`
  - Returns heuristic score, risk category (Low, Medium, High, Critical), indicators, Groq explanation, and safety actions.
- `POST /api/fraud/analyse-url`
  - Body: `{ url }`
  - Passive structural inspection of homoglyphs, IP addresses, shorteners, and TLDs.
- `GET /api/fraud/history`
  - User threat scan log.

## 5. Smart Budgeting
- `GET /api/budgets/insights`
  - Actual vs allocated spending, velocity projection, threshold alerts.
- `POST /api/budgets`
  - Setup category monthly caps.

## 6. Loan & EMI Assistant
- `POST /api/loans/calculate-emi`
  - Body: `{ principal, interest_rate, tenure_months, extra_monthly_payment }`
  - Returns reducing balance monthly EMI, total interest, prepayment savings, and credit advice.
- `POST /api/loans/compare`
  - Side-by-side scenario comparator.

## 7. Investment Intelligence
- `GET /api/investments/portfolio`
  - Multi-asset holdings and valuation.
- `POST /api/investments/sip`
  - SIP future value calculator.
- `POST /api/investments/fd`
  - Quarterly compounded FD returns.

## 8. Tax Assistant
- `POST /api/tax/calculate`
  - Body: `{ annual_income, deduction_80c, deduction_80d, hra_exemption }`
  - Compares FY 2024-25 Old vs New Tax Regime, computes Section 87A rebate and 4% cess.
- `POST /api/tax/explain`
  - Chatbot query explanation.

## 9. Small Business Finance
- `GET /api/business/profile`
- `GET /api/business/invoices`
- `POST /api/business/invoices`
  - Generates GST invoice and ReportLab PDF document with intra/inter-state tax breakdown.
- `GET /api/business/cashflow`
  - Monthly working capital metrics.

## 10. Financial News
- `GET /api/news/feed`
  - Economic dispatches with sentiment classifications and sectoral impacts.
- `POST /api/news/analyse`
  - Custom article sentiment analyzer.

## 11. FINWISE Assistant (Copilot)
- `POST /api/assistant/chat`
  - Body: `{ message, conversation_id }`
  - Context-grounded response answering questions based on the authenticated user's ledger.

## 12. Institutional Reports
- `POST /api/reports/generate`
  - Body: `{ report_type, file_format: "PDF"|"CSV" }`
  - Generates downloadable audit reports.
- `GET /api/reports/download/{id}`
  - Streams compiled PDF or CSV.
