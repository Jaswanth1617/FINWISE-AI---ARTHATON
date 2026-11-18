# FINWISE AI – System Architecture Documentation

**Product:** FINWISE AI  
**Tagline:** Understand Your Money. Protect Your Future.  
**Classification:** Unified AI-Powered Financial Intelligence & Risk Mitigation Engine  

---

## 1. High-Level Architectural Diagram

```
+---------------------------------------------------------------------------------------+
|                                    CLIENT LAYER                                       |
|                                                                                       |
|  [React 18 Single Page Application (Vite)]                                            |
|  - Tailwind CSS Deep Fintech Palette (#101828, #5146E5, #06B6D4)                     |
|  - Recharts Visualizations (Income Trends, Asset Allocation, Budget Progress)        |
|  - JWT Interceptor / Axios Client                                                     |
|  - Role-Aware Protected Routing (Individual, Student, Small Business Owner)          |
+-------------------------------------------+-------------------------------------------+
                                            |
                                 REST HTTPS / JSON
                                            |
+-------------------------------------------v-------------------------------------------+
|                                APPLICATION BACKEND                                    |
|                                                                                       |
|  [Flask REST API Application Factory]                                                 |
|  - Flask-JWT-Extended Authorization & RBAC Filter                                     |
|  - Strict Multi-Tenant User Row Isolation                                             |
|  - PyMuPDF / Pandas / OpenPyXL File Extraction Pipeline                               |
|  - Deterministic Math Engines (Reducing EMI, FY 24-25 Indian Income Tax, SIP, GST)    |
|  - ReportLab PDF & CSV Streaming Exporter                                             |
+-------------------+-----------------------------------------------+-------------------+
                    |                                               |
         Database Transactions                           AI & Language Analysis
                    |                                               |
+-------------------v-------------------+       +-------------------v-------------------+
|          PERSISTENCE LAYER            |       |         COGNITIVE AI LAYER            |
|                                       |       |                                       |
|  [PostgreSQL / Supabase ORM]          |       |  [Groq LLM Llama-3.3-70B API]         |
|  - 23 Normalized Domain Tables        |       |  - Heuristic Pre-Filter & Scoring     |
|  - Foreign Key Constraints            |       |  - Redaction of Passwords/Cards/OTPs  |
|  - Audit Log Trails & History         |       |  - Deterministic Rule-Engine Fallback |
+---------------------------------------+       +---------------------------------------+
```

---

## 2. Core Architectural Pillars

### A. Strict Deterministic Financial Integrity
All financial calculations (reducing balance loan amortization, Section 87A income tax liability, compound interest SIP maturity, and GST splits) are computed directly in Python using standard financial formulas. AI language models are never trusted with arithmetic calculations.

### B. Cognitive Explainability & Grounding
Groq LLMs (`llama-3.3-70b-versatile` / `llama-3.1-8b-instant`) are deployed strictly for natural language synthesis, threat explanation, and contextual advisory. Before any query reaches an LLM, PII and sensitive banking credentials (card numbers, OTPs, passwords) are automatically redacted.

### C. Zero-Dependency Local Fallback
If the Groq API key is unconfigured or network connectivity is interrupted, the platform automatically switches to its local deterministic rule engine, providing complete functionality without crashing.
