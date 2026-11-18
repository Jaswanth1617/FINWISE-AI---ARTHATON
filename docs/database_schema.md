# FINWISE AI – Relational Database Schema Specification

Target Engine: **PostgreSQL (Supabase Ready) / SQLAlchemy 2.0+**

The database schema is partitioned into 23 normalized tables with foreign keys and cascade rules.

---

## Complete Table Directory

1. **`users`**
   - `id` (VARCHAR 36, PK)
   - `email` (VARCHAR 120, UNIQUE, INDEX)
   - `username` (VARCHAR 80, UNIQUE, INDEX)
   - `password_hash` (VARCHAR 255)
   - `role` (VARCHAR 30: Individual, Student, Small Business Owner, Administrator)
   - `is_active` (BOOLEAN)
   - `created_at`, `updated_at` (TIMESTAMP)

2. **`user_profiles`**
   - `id` (VARCHAR 36, PK)
   - `user_id` (FK -> users.id, UNIQUE)
   - `full_name`, `phone_number`, `occupation` (VARCHAR)
   - `annual_income` (NUMERIC 14, 2)
   - `risk_tolerance` (VARCHAR 30)
   - `currency` (VARCHAR 10: INR)

3. **`financial_accounts`**
   - `id` (VARCHAR 36, PK)
   - `user_id` (FK -> users.id)
   - `account_name`, `institution_name` (VARCHAR)
   - `account_mask` (VARCHAR 10, e.g. XXXX7812)
   - `current_balance` (NUMERIC 14, 2)

4. **`uploaded_documents`**
   - `id` (VARCHAR 36, PK)
   - `user_id` (FK -> users.id)
   - `filename`, `original_filename` (VARCHAR)
   - `file_type` (VARCHAR: pdf, csv, xlsx)
   - `file_size_bytes`, `records_extracted` (INT)
   - `status` (VARCHAR: PROCESSING, PROCESSED, FAILED)

5. **`transactions`**
   - `id` (VARCHAR 36, PK)
   - `user_id` (FK -> users.id, INDEX)
   - `account_id` (FK -> financial_accounts.id)
   - `document_id` (FK -> uploaded_documents.id)
   - `transaction_date` (DATE, INDEX)
   - `description`, `normalized_description` (VARCHAR)
   - `transaction_type` (VARCHAR: DEBIT, CREDIT)
   - `amount` (NUMERIC 14, 2)
   - `balance_after` (NUMERIC 14, 2)
   - `category` (VARCHAR 60: Food, Rent, EMI, Shopping, etc.)
   - `is_suspicious` (BOOLEAN, INDEX)
   - `suspicion_reason` (VARCHAR)
   - `is_duplicate` (BOOLEAN)
   - `is_demo` (BOOLEAN)

6. **`transaction_categories`**
   - `id` (VARCHAR 36, PK)
   - `name` (VARCHAR 60, UNIQUE)
   - `icon`, `color` (VARCHAR)
   - `is_system` (BOOLEAN)

7. **`budgets`**
   - `id` (VARCHAR 36, PK)
   - `user_id` (FK -> users.id)
   - `month` (INT 1-12), `year` (INT)
   - `total_income`, `total_budgeted`, `savings_target` (NUMERIC 14, 2)

8. **`budget_categories`**
   - `id` (VARCHAR 36, PK)
   - `budget_id` (FK -> budgets.id)
   - `category_name` (VARCHAR)
   - `allocated_amount` (NUMERIC 14, 2)
   - `alert_threshold_percent` (INT)

9. **`fraud_analyses`**
   - `id` (VARCHAR 36, PK)
   - `user_id` (FK -> users.id)
   - `analysis_type` (VARCHAR: MESSAGE, URL, TRANSACTION)
   - `target_input` (TEXT)
   - `risk_score` (INT 0-100)
   - `risk_category` (VARCHAR: Low, Medium, High, Critical)
   - `indicators` (JSON)
   - `ai_explanation`, `recommendation` (TEXT)

10. **`suspicious_messages`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `sender_identifier` (VARCHAR)
    - `message_content` (TEXT)
    - `channel` (VARCHAR: SMS, WhatsApp, UPI)

11. **`loan_records`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `loan_name`, `loan_type` (VARCHAR)
    - `principal_amount`, `calculated_emi`, `total_interest`, `total_payment` (NUMERIC 14, 2)
    - `annual_interest_rate` (NUMERIC 5, 2)
    - `tenure_months` (INT)

12. **`loan_schedules`**
    - `id` (VARCHAR 36, PK)
    - `loan_id` (FK -> loan_records.id)
    - `installment_number` (INT)
    - `beginning_balance`, `emi_amount`, `principal_component`, `interest_component`, `ending_balance` (NUMERIC 14, 2)

13. **`investment_portfolios`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `portfolio_name`, `risk_level` (VARCHAR)
    - `total_invested`, `current_value` (NUMERIC 14, 2)

14. **`investment_assets`**
    - `id` (VARCHAR 36, PK)
    - `portfolio_id` (FK -> investment_portfolios.id)
    - `asset_name`, `asset_type` (VARCHAR)
    - `invested_amount`, `current_market_value` (NUMERIC 14, 2)
    - `expected_cagr` (NUMERIC 5, 2)

15. **`tax_calculations`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `financial_year`, `assessment_year` (VARCHAR)
    - `gross_annual_income`, `deduction_80c`, `deduction_80d`, `hra_exemption` (NUMERIC 14, 2)
    - `old_regime_tax`, `new_regime_tax`, `tax_savings` (NUMERIC 14, 2)
    - `recommended_regime` (VARCHAR)

16. **`businesses`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `business_name`, `gstin`, `industry`, `state` (VARCHAR)

17. **`business_transactions`**
    - `id` (VARCHAR 36, PK)
    - `business_id` (FK -> businesses.id)
    - `transaction_date` (DATE)
    - `type` (REVENUE, EXPENSE), `amount` (NUMERIC 14, 2)
    - `gst_rate_percent`, `gst_amount` (NUMERIC)
    - `is_interstate` (BOOLEAN)

18. **`invoices`**
    - `id` (VARCHAR 36, PK)
    - `business_id` (FK -> businesses.id)
    - `invoice_number`, `client_name`, `client_state` (VARCHAR)
    - `subtotal`, `cgst_amount`, `sgst_amount`, `igst_amount`, `total_amount` (NUMERIC 14, 2)
    - `items` (JSON), `status` (VARCHAR: PENDING, PAID)

19. **`financial_reports`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `report_title`, `report_type`, `file_format` (VARCHAR)
    - `file_path` (VARCHAR), `summary_data` (JSON)

20. **`chatbot_conversations`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `title` (VARCHAR)

21. **`chatbot_messages`**
    - `id` (VARCHAR 36, PK)
    - `conversation_id` (FK -> chatbot_conversations.id)
    - `role` (VARCHAR: user, assistant, system)
    - `content` (TEXT), `sources_used` (JSON)

22. **`notifications`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `title`, `message`, `type` (VARCHAR), `is_read` (BOOLEAN)

23. **`audit_logs`**
    - `id` (VARCHAR 36, PK)
    - `user_id` (FK -> users.id)
    - `action`, `resource_type`, `ip_address` (VARCHAR)
    - `details` (TEXT)
