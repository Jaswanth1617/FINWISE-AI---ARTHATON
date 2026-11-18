# FINWISE AI

> **Understand Your Money. Protect Your Future.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Backend: Flask Python 3.14](https://img.shields.io/badge/Backend-Flask%203.1.3-green.svg)](https://flask.palletsprojects.com/)
[![Frontend: React Vite Tailwind](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Tailwind-indigo.svg)](https://vitejs.dev/)
[![AI Engine: Groq Llama-3.3](https://img.shields.io/badge/AI-Groq%20Llama--3.3-cyan.svg)](https://groq.com/)
[![Database: PostgreSQL Supabase Ready](https://img.shields.io/badge/Database-PostgreSQL%20ORM-blue.svg)](https://supabase.com/)

**FINWISE AI** is a unified, production-grade financial intelligence and risk management platform designed for individuals, students, families, and small businesses. 

Unlike static mockups or superficial dashboards, FINWISE AI is an end-to-end, functional fintech system featuring deterministic mathematical calculation engines, document extraction, phishing threat scoring, and an AI copilot grounded in verified user ledger records.

---

## 🌟 Core Platform Modules

1. **AI Financial Data Analyser** – Native parsing of PDF statements via PyMuPDF, CSV, and Excel spreadsheets with automatic categorization and duplicate prevention.
2. **AI Fraud Detection Centre** – Heuristic and LLM risk scoring (0–100) for bank SMS, UPI cashback lures, and passive URL inspection.
3. **Smart Budgeting** – Category spending caps, utilization velocity tracking, threshold alerts, and month-end run-rate forecasts.
4. **Loan & EMI Assistant** – Reducing-balance formula amortizations, prepayment accelerator savings calculator, and credit underwriting guidance.
5. **Investment Intelligence** – Multi-asset allocation tracking, compounding SIP calculator, quarterly-compounded FD calculator, and educational portfolio explanations.
6. **Income Tax Intelligence (India)** – Complete side-by-side comparison of Old vs. New Tax Regimes under FY 2024-25 / AY 2025-26 rules (Finance Act 2024 ready).
7. **Small Business Finance** – Cash-flow tracking, working capital runways, and GST invoice generation with automated CGST/SGST/IGST breakdown and PDF export.
8. **Financial News Intelligence** – Macroeconomic dispatches with sentiment scoring and sectoral impact classification.
9. **FINWISE Assistant** – Context-grounded AI copilot answering natural-language queries about your real spending, loans, and budgets.
10. **Institutional Reports** – 1-Click generation of audit-grade PDF reports (built with ReportLab) and CSV exports.

---

## 🚀 Quick Start Guide (Windows PowerShell)

### Prerequisites
- Python 3.12+ (or Python 3.14)
- Node.js v18+ and npm
- (Optional) Free Groq API Key from [console.groq.com](https://console.groq.com)

### 1. Backend Setup

```powershell
# Navigate to the backend directory
cd backend

# (Optional) Activate your Python virtual environment if using one:
# python -m venv venv
# .\venv\Scripts\Activate.ps1

# Install dependencies
python -m pip install -r requirements.txt

# Run the Flask REST API server
python run.py
```
*The backend starts at `http://127.0.0.1:5000`.*

### 2. Frontend Setup

```powershell
# Open a separate PowerShell terminal and navigate to the frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server
npm run dev
```
*The web interface starts at `http://localhost:3000` with automated proxy to the Flask backend.*

---

## 🏆 10-Step Hackathon Demonstration Workflow

The entire platform can be tested without needing a real bank account:

1. **Step 1: Sign Up / Sign In** – Navigate to `http://localhost:3000`. Click **Explore Live Demo** or **1-Click Demo** on the login page.
2. **Step 2: Seed Demo Financials** – Click the **"Load Demo Data"** button in the top navigation bar to populate realistic sample transactions, loan commitments, and category budgets.
3. **Step 3: Open Financial Analyser** – Go to **Statement Analyser**. Upload `docs/sample_data/sample_bank_statement.csv` or `sample_bank_statement.pdf`. Observe automated date, amount, and category extraction.
4. **Step 4: Review Ledger** – Go to **Transactions** to view debits, credits, category badges, and flagged outlier transactions.
5. **Step 5: Test AI Fraud Detection** – Open **Fraud Detection**. Select the **"KYC Suspension Alert"** sample or paste a phishing SMS. Watch the engine calculate an 85/100 Critical Risk score with pattern indicators and AI explanation.
6. **Step 6: Inspect Suspicious URL** – Switch to the **URL Inspector** tab. Click **"Spoofed Bank Domain"** (`http://hdfc-bank-netbanking-verify.xyz/auth`). Notice how the engine inspects domain structure passively without navigating to the URL.
7. **Step 7: Smart Budgeting** – Visit **Smart Budgeting** to review category utilization bars, 80% threshold warnings, and month-end spending velocity projections.
8. **Step 8: Loan & Prepayment Assistant** – Go to **Loan & EMI Assistant**. Adjust the Principal to ₹10 Lakhs at 8.5% for 15 Years. Set Extra Monthly Payment to ₹2,000 to see tenure and interest saved.
9. **Step 9: Chat with FINWISE Assistant** – Open **FINWISE Assistant**. Click *"Where did most of my money go this month?"* or *"Can I afford an EMI of ₹5,000?"*. Observe context-grounded responses that reference your actual ledger numbers.
10. **Step 10: Generate PDF Audit Report** – Visit **Reports**. Click **"Generate Report"** to produce and download an official, beautifully styled PDF financial audit dossier.

---

## 🔒 Security Architecture

- **Never Stores Sensitive Banking Secrets:** We never store or log bank passwords, card CVVs, UPI PINs, or OTPs.
- **Pre-LLM Redaction:** All sensitive identifiers are sanitized and redacted before reaching any external language model.
- **User-Level Row Isolation:** All database transactions are partitioned strictly by `user_id` enforced in the Flask ORM layer.
- **Deterministic Math:** Financial calculations are never entrusted to an AI model's halluncinations. All interest, tax, and amortization formulas are validated in pure Python.

---

## 🔬 Research Datasets & Feature Engineering Integration

FINWISE AI directly integrates and builds upon three established open-source and academic research works:

1. **Smishing Research Dataset (84,863 Labeled SMS)**:
   - Evaluated against large-scale labeled mobile phishing and legitimate communication corpora.
   - Built-in benchmark explorer in the **AI Fraud Detection Centre** with 1-click evaluation across Banking/KYC suspensions, UPI prize lures, electricity disconnection scams, and OTP interception.

2. **Personal Finance Intelligence Corpus (12-Month Indian Banking Data)**:
   - High-fidelity synthetic dataset containing 2,393 authentic Indian transactions over 12 months with realistic running balances.
   - Comprehensive **UPI / NEFT / IMPS / BBPS / POS** transaction narration normalizer and merchant dictionary mapping entities like `Blinkit`, `D-Mart`, `Zepto`, `Swiggy`, `Bescom`, `Netflix`, `Groww SIP`, and `Rent`.
   - 1-Click instant parsing in the **Financial Statement Analyser** with automatic anomaly detection and idempotent duplicate prevention.

3. **Scam Text Signal Feature Engineering (INFO-4360 Project)**:
   - Multi-feature extraction pipeline extracting lexical and structural markers before LLM explanation:
     - `caps_pct`: Ratio of capitalized characters (urgency marker)
     - `digits_count`: Account / amount / phone number digit density
     - `word_count`: Message length and brevity signals
     - `has_url`: Passive detection of embedded hyperlinks and unverified domains
     - `has_phone`: Extraction of direct customer care phone lures
     - `call_to_action_count`: Command directives (`verify`, `click`, `claim`, `dial`, `update`)
     - `urgency_terms`: High-pressure psychological triggers (`immediately`, `today`, `suspended`)

---

## 🎨 Design System: High-Trust White Theme

FINWISE AI is crafted using a human-made, high-trust fintech aesthetic inspired by Stripe, Mercury, and Ramp:
- **Clean White Theme:** High-contrast `bg-[#FAFAFC]` canvas with pure white cards (`bg-white`), crisp subtle borders (`border-slate-200/90`), and deep navy typography (`text-slate-900`).
- **Human-Crafted Layout:** Distinct functional sections, intuitive breadcrumbs, responsive collapsible navigation, and clear status badges.
- **Zero Generic AI Clichés:** No illegible neon text, unnecessary glassmorphism, or dark-mode eye strain. Every number comes from verified database ledgers or documented benchmarks.

---

## 📁 Repository Structure

```
FINWISE-AI/
    frontend/
        src/
            components/       # Reusable fintech cards, modals, layout
            context/          # Auth context and session management
            pages/            # 17 complete fintech pages
            services/         # Axios API client with JWT interceptor
            styles/           # Tailwind custom color tokens
        package.json
        vite.config.js
    backend/
        app/
            models/           # 23 relational database tables
            routes/           # Modular Flask blueprints
            services/         # PyMuPDF parser, Groq client, ReportLab generator
            utils/            # Reducing EMI, Tax Engine, GST, Security
        tests/                # Automated pytest suite
        run.py                # Server entry point
        requirements.txt
        .env.example
    docs/
        architecture.md       # Full architectural specifications
        database_schema.md    # 23-table relational schema
        api_documentation.md  # REST API endpoint contracts
        sample_data/          # Demonstration CSV & PDF bank statements
    README.md
    .gitignore
```

---

## 📄 License
Released under the MIT License. Built for hackathon demonstration.
