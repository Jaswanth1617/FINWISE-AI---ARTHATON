from datetime import date, datetime, timedelta, timezone
from app.extensions import db
from app.models.user import User, UserProfile
from app.models.transaction import FinancialAccount, Transaction
from app.models.budget import Budget, BudgetCategory
from app.models.loan import LoanRecord, LoanSchedule
from app.models.investment import InvestmentPortfolio, InvestmentAsset
from app.models.business import Business, BusinessTransaction, Invoice, TaxCalculation
from app.models.fraud import FraudAnalysis, SuspiciousMessage
from app.utils.calculations import calculate_reducing_emi, generate_amortization_schedule

def seed_hardcoded_user_data(user_id: str):
    """
    Populates comprehensive, realistic fintech records across ALL 9 modules for the specified user.
    """
    user = User.query.get(user_id)
    if not user:
        return

    # 1. Profile
    if not user.profile:
        user.profile = UserProfile(
            user_id=user.id,
            full_name=user.username.replace('1', '').capitalize() + " Sharma",
            occupation="Senior Software Architect",
            annual_income=1800000.00,
            risk_tolerance="Moderate",
            currency="INR",
            phone_number="+91 98765 43210"
        )
    else:
        user.profile.occupation = user.profile.occupation or "Senior Software Architect"
        user.profile.annual_income = user.profile.annual_income or 1800000.00

    # 2. Financial Accounts
    acc1 = FinancialAccount.query.filter_by(user_id=user_id, account_mask="XXXX7812").first()
    if not acc1:
        acc1 = FinancialAccount(
            user_id=user_id,
            account_name="HDFC Salary & Primary Checking",
            institution_name="HDFC Bank",
            account_mask="XXXX7812",
            current_balance=84250.00
        )
        db.session.add(acc1)

    acc2 = FinancialAccount.query.filter_by(user_id=user_id, account_mask="XXXX3401").first()
    if not acc2:
        acc2 = FinancialAccount(
            user_id=user_id,
            account_name="ICICI Emergency Reserve",
            institution_name="ICICI Bank",
            account_mask="XXXX3401",
            current_balance=250000.00
        )
        db.session.add(acc2)

    db.session.flush()

    # 3. Clean up previous demo transactions and seed fresh realistic entries
    Transaction.query.filter_by(user_id=user_id, is_demo=True).delete()

    today = date.today()
    y = today.year
    m = today.month

    # Helper for month offsets
    def get_date(month_offset, day):
        # target month
        tm = m - month_offset
        ty = y
        while tm <= 0:
            tm += 12
            ty -= 1
        max_d = 28
        return date(ty, tm, min(day, max_d))

    tx_templates = [
        # Current month
        (get_date(0, 1), "Salary Credit - TechCorp Global", "Salary", "CREDIT", 75000.00, 115000.00, False, None),
        (get_date(0, 2), "Landlord Rental Transfer - Indiranagar", "Rent", "DEBIT", 20000.00, 95000.00, False, None),
        (get_date(0, 3), "Swiggy Gourmet Dinner", "Food", "DEBIT", 680.00, 94320.00, False, None),
        (get_date(0, 4), "Uber Airport Premier Ride", "Transportation", "DEBIT", 540.00, 93780.00, False, None),
        (get_date(0, 5), "Amazon India Electronics - Noise Cancelling Headphones", "Shopping", "DEBIT", 3499.00, 90281.00, False, None),
        (get_date(0, 6), "Blinkit Quick Groceries", "Food", "DEBIT", 485.00, 89796.00, False, None),
        (get_date(0, 7), "BESCOM Electricity Utility Bill", "Bills", "DEBIT", 1850.00, 87946.00, False, None),
        (get_date(0, 8), "D-Mart Monthly Supermarket", "Food", "DEBIT", 4230.00, 83716.00, False, None),
        (get_date(0, 10), "HDFC Home Loan AutoDebit", "EMI", "DEBIT", 18500.00, 65216.00, False, None),
        (get_date(0, 11), "Zepto 10-Min Delivery", "Food", "DEBIT", 320.00, 64896.00, False, None),
        (get_date(0, 12), "Zerodha Monthly Nifty Index SIP", "Investments", "DEBIT", 10000.00, 54896.00, False, None),
        (get_date(0, 13), "Netflix Monthly 4K Subscription", "Entertainment", "DEBIT", 649.00, 54247.00, False, None),
        (get_date(0, 14), "Apollo Pharmacy Prescription Medicines", "Healthcare", "DEBIT", 890.00, 53357.00, False, None),
        (get_date(0, 15), "Airtel Fiber Broadband Bill", "Bills", "DEBIT", 1040.00, 52317.00, False, None),
        (get_date(0, 16), "Unusual High Debit - Card Withdrawal International ATM", "Other", "DEBIT", 45000.00, 7317.00, True, "Statistical outlier: 7.2x higher than 30-day baseline debit"),
        (get_date(0, 17), "Swiggy Gourmet Dinner Duplicate", "Food", "DEBIT", 680.00, 6637.00, True, "Potential duplicate charge detected on same merchant within 14 days"),
        (get_date(0, 18), "Freelance UI Consulting Bonus", "Salary", "CREDIT", 25000.00, 31637.00, False, None),
        (get_date(0, 19), "Spotify Premium Family", "Entertainment", "DEBIT", 179.00, 31458.00, False, None),
        (get_date(0, 20), "Ola City Commute", "Transportation", "DEBIT", 310.00, 31148.00, False, None),
        
        # Month -1
        (get_date(1, 1), "Salary Credit - TechCorp Global", "Salary", "CREDIT", 75000.00, 106000.00, False, None),
        (get_date(1, 2), "Landlord Rental Transfer - Indiranagar", "Rent", "DEBIT", 20000.00, 86000.00, False, None),
        (get_date(1, 4), "Zomato Dineout Family Meal", "Food", "DEBIT", 1850.00, 84150.00, False, None),
        (get_date(1, 8), "BESCOM Electricity Utility Bill", "Bills", "DEBIT", 1620.00, 82530.00, False, None),
        (get_date(1, 10), "HDFC Home Loan AutoDebit", "EMI", "DEBIT", 18500.00, 64030.00, False, None),
        (get_date(1, 12), "Zerodha Monthly Nifty Index SIP", "Investments", "DEBIT", 10000.00, 54030.00, False, None),
        (get_date(1, 15), "Nike Running Shoes - Myntra", "Shopping", "DEBIT", 4200.00, 49830.00, False, None),
        (get_date(1, 22), "Apollo Dental Clinic Checkup", "Healthcare", "DEBIT", 1500.00, 48330.00, False, None),

        # Month -2
        (get_date(2, 1), "Salary Credit - TechCorp Global", "Salary", "CREDIT", 75000.00, 95000.00, False, None),
        (get_date(2, 2), "Landlord Rental Transfer - Indiranagar", "Rent", "DEBIT", 20000.00, 75000.00, False, None),
        (get_date(2, 8), "BESCOM Electricity Utility Bill", "Bills", "DEBIT", 1450.00, 73550.00, False, None),
        (get_date(2, 10), "HDFC Home Loan AutoDebit", "EMI", "DEBIT", 18500.00, 55050.00, False, None),
        (get_date(2, 12), "Zerodha Monthly Nifty Index SIP", "Investments", "DEBIT", 10000.00, 45050.00, False, None),
    ]

    for tx_date, desc, cat, tx_type, amt, bal, susp, reason in tx_templates:
        tx = Transaction(
            user_id=user_id,
            account_id=acc1.id,
            transaction_date=tx_date,
            description=desc,
            normalized_description=desc,
            category=cat,
            transaction_type=tx_type,
            amount=amt,
            balance_after=bal,
            is_suspicious=susp,
            suspicion_reason=reason,
            is_demo=True
        )
        db.session.add(tx)

    # 4. Budget
    cur_budget = Budget.query.filter_by(user_id=user_id, month=m, year=y).first()
    if not cur_budget:
        cur_budget = Budget(
            user_id=user_id,
            month=m,
            year=y,
            total_income=75000.00,
            total_budgeted=54000.00,
            savings_target=21000.00,
            notes=f"Active Budget ({m}/{y})"
        )
        db.session.add(cur_budget)
        db.session.flush()

        caps = [
            ("Food", 8000.00),
            ("Rent", 20000.00),
            ("Shopping", 5000.00),
            ("Bills", 4000.00),
            ("EMI", 18500.00),
            ("Transportation", 3000.00),
            ("Entertainment", 2000.00)
        ]
        for cname, alloc in caps:
            db.session.add(BudgetCategory(budget_id=cur_budget.id, category_name=cname, allocated_amount=alloc))

    # 5. Loans
    loan1 = LoanRecord.query.filter_by(user_id=user_id, loan_name="HDFC Home Loan").first()
    if not loan1:
        emi_calc = calculate_reducing_emi(2500000, 8.50, 240)
        loan1 = LoanRecord(
            user_id=user_id,
            loan_name="HDFC Home Loan",
            loan_type="Home Loan",
            principal_amount=2500000.00,
            annual_interest_rate=8.50,
            tenure_months=240,
            calculated_emi=emi_calc['monthly_emi'],
            total_interest=emi_calc['total_interest'],
            total_payment=emi_calc['total_payment'],
            start_date=get_date(6, 1)
        )
        db.session.add(loan1)
        db.session.flush()

        # Add initial 6 schedule installments
        sched_res = generate_amortization_schedule(2500000, 8.50, 240, start_date=get_date(6, 1))
        for s in sched_res.get('schedule', [])[:6]:
            db.session.add(LoanSchedule(
                loan_id=loan1.id,
                installment_number=s['installment_number'],
                payment_date=get_date(6 - s['installment_number'], 10),
                beginning_balance=s['beginning_balance'],
                emi_amount=s['emi_amount'],
                principal_component=s['principal_component'],
                interest_component=s['interest_component'],
                ending_balance=s['ending_balance']
            ))

    loan2 = LoanRecord.query.filter_by(user_id=user_id, loan_name="SBI Car Loan").first()
    if not loan2:
        emi_calc2 = calculate_reducing_emi(650000, 8.75, 60)
        loan2 = LoanRecord(
            user_id=user_id,
            loan_name="SBI Car Loan",
            loan_type="Vehicle Loan",
            principal_amount=650000.00,
            annual_interest_rate=8.75,
            tenure_months=60,
            calculated_emi=emi_calc2['monthly_emi'],
            total_interest=emi_calc2['total_interest'],
            total_payment=emi_calc2['total_payment'],
            start_date=get_date(12, 1)
        )
        db.session.add(loan2)

    # 6. Investment Portfolio
    portfolio = InvestmentPortfolio.query.filter_by(user_id=user_id).first()
    if not portfolio:
        portfolio = InvestmentPortfolio(
            user_id=user_id,
            portfolio_name="Core Wealth Growth Portfolio",
            risk_level="Moderate",
            total_invested=420000.00,
            current_value=486500.00,
            notes="Diversified equity and fixed income holdings"
        )
        db.session.add(portfolio)
        db.session.flush()

        assets = [
            ("Nifty 50 Index Mutual Fund", "Mutual Fund", 180000.00, 212400.00, 43.6, 13.5, get_date(18, 1)),
            ("Parag Parikh Flexi Cap Fund", "Mutual Fund", 120000.00, 144600.00, 29.7, 15.2, get_date(14, 5)),
            ("Sovereign Gold Bonds (SGB 2028)", "Gold", 60000.00, 68500.00, 14.1, 9.0, get_date(24, 10)),
            ("HDFC Fixed Deposit (7.25% p.a.)", "Fixed Deposit", 60000.00, 61000.00, 12.6, 7.25, get_date(6, 15))
        ]
        for aname, atype, inv, cur, alloc, cagr, pdate in assets:
            db.session.add(InvestmentAsset(
                portfolio_id=portfolio.id,
                asset_name=aname,
                asset_type=atype,
                invested_amount=inv,
                current_market_value=cur,
                allocation_percentage=alloc,
                expected_cagr=cagr,
                purchase_date=pdate
            ))

    # 7. Tax Record
    tax_rec = TaxCalculation.query.filter_by(user_id=user_id, financial_year="2024-25").first()
    if not tax_rec:
        tax_rec = TaxCalculation(
            user_id=user_id,
            financial_year="2024-25",
            assessment_year="2025-26",
            gross_annual_income=1500000.00,
            deduction_80c=150000.00,
            deduction_80d=25000.00,
            standard_deduction=75000.00,
            old_regime_tax=187200.00,
            new_regime_tax=145600.00,
            recommended_regime="New Regime",
            tax_savings=41600.00,
            computation_breakdown={
                "old_regime_slabs": [
                    {"slab": "Up to ₹2,50,000", "rate": "Nil", "tax": 0.0},
                    {"slab": "₹2,50,001 - ₹5,00,000", "rate": "5%", "tax": 12500.0},
                    {"slab": "₹5,00,001 - ₹10,00,000", "rate": "20%", "tax": 100000.0},
                    {"slab": "Above ₹10,00,000", "rate": "30%", "tax": 67500.0}
                ],
                "new_regime_slabs": [
                    {"slab": "Up to ₹3,00,000", "rate": "Nil", "tax": 0.0},
                    {"slab": "₹3,00,001 - ₹7,00,000", "rate": "5%", "tax": 20000.0},
                    {"slab": "₹7,00,001 - ₹10,00,000", "rate": "10%", "tax": 30000.0},
                    {"slab": "₹10,00,001 - ₹12,00,000", "rate": "15%", "tax": 30000.0},
                    {"slab": "₹12,00,001 - ₹15,00,000", "rate": "20%", "tax": 60000.0}
                ]
            }
        )
        db.session.add(tax_rec)

    # 8. Small Business & Invoices
    biz = Business.query.filter_by(user_id=user_id).first()
    if not biz:
        biz = Business(
            user_id=user_id,
            business_name="Apex Digital Studio & Media",
            gstin="29AAACA1234B1Z5",
            industry="Design & Technology Services",
            state="Karnataka",
            address="100 Feet Road, Indiranagar, Bengaluru 560038"
        )
        db.session.add(biz)
        db.session.flush()

        # Business Transactions
        db.session.add(BusinessTransaction(
            business_id=biz.id,
            transaction_date=get_date(0, 5),
            description="Client Retainer - Zenith Retail Technologies",
            type="REVENUE",
            category="Consulting",
            amount=85000.00,
            gst_rate_percent=18.0,
            gst_amount=15300.00,
            is_interstate=False
        ))
        db.session.add(BusinessTransaction(
            business_id=biz.id,
            transaction_date=get_date(0, 12),
            description="UI Engineering Milestone - Hyperion Cloud Systems",
            type="REVENUE",
            category="Software Development",
            amount=120000.00,
            gst_rate_percent=18.0,
            gst_amount=21600.00,
            is_interstate=True
        ))
        db.session.add(BusinessTransaction(
            business_id=biz.id,
            transaction_date=get_date(0, 8),
            description="Figma & Adobe Creative Cloud Subscription",
            type="EXPENSE",
            category="Software Licenses",
            amount=14500.00,
            gst_rate_percent=18.0,
            gst_amount=2610.00,
            is_interstate=False
        ))
        db.session.add(BusinessTransaction(
            business_id=biz.id,
            transaction_date=get_date(0, 15),
            description="Contractor Specialist Payroll",
            type="EXPENSE",
            category="Payroll",
            amount=45000.00,
            gst_rate_percent=0.0,
            gst_amount=0.0,
            is_interstate=False
        ))

        # Invoices
        inv1 = Invoice(
            business_id=biz.id,
            invoice_number="INV-2026-001",
            client_name="Zenith Retail Technologies Pvt Ltd",
            client_gstin="29BBBCB5678C1Z2",
            client_state="Karnataka",
            client_email="finance@zenithretail.in",
            invoice_date=get_date(0, 2),
            due_date=get_date(0, 17),
            subtotal=85000.00,
            tax_rate=18.0,
            cgst_amount=7650.00,
            sgst_amount=7650.00,
            igst_amount=0.00,
            total_amount=100300.00,
            items=[
                {"description": "Fintech UI Design System & Component Library", "quantity": 1, "unit_price": 60000.0, "amount": 60000.0},
                {"description": "User Journey Prototyping & Usability Evaluation", "quantity": 1, "unit_price": 25000.0, "amount": 25000.0}
            ],
            status="PAID"
        )
        db.session.add(inv1)

        inv2 = Invoice(
            business_id=biz.id,
            invoice_number="INV-2026-002",
            client_name="Hyperion Cloud Systems LLC",
            client_gstin="27CCCCD9012D1Z4",
            client_state="Maharashtra",
            client_email="accounts@hyperioncloud.com",
            invoice_date=get_date(0, 10),
            due_date=get_date(0, 25),
            subtotal=120000.00,
            tax_rate=18.0,
            cgst_amount=0.00,
            sgst_amount=0.00,
            igst_amount=21600.00,
            total_amount=141600.00,
            items=[
                {"description": "Full-Stack React Dashboard Implementation", "quantity": 1, "unit_price": 85000.0, "amount": 85000.0},
                {"description": "REST API Integration & JWT Security Auditing", "quantity": 1, "unit_price": 35000.0, "amount": 35000.0}
            ],
            status="SENT"
        )
        db.session.add(inv2)

    # 9. Fraud Detection Scans
    scan1 = FraudAnalysis.query.filter_by(user_id=user_id, analysis_type="MESSAGE").first()
    if not scan1:
        scan1 = FraudAnalysis(
            user_id=user_id,
            analysis_type="MESSAGE",
            target_input="Dear SBI User, your NetBanking account has been suspended due to pending KYC. Click http://sbi-verify.top immediately.",
            risk_score=85,
            risk_category="Critical",
            indicators=[
                "Urgent threat of account blocking or KYC suspension",
                "High urgency psychological pressure tactic",
                "Direct demand for sensitive credentials",
                "Contains unverified external hyperlink or domain link"
            ],
            ai_explanation="The message simulates an urgent bank suspension notice with an unverified external hyperlink to harvest NetBanking credentials.",
            recommendation="Do not open the link or provide OTP, PIN or banking credentials. Contact your bank using its official communication channels."
        )
        db.session.add(scan1)
        db.session.flush()

        db.session.add(SuspiciousMessage(
            user_id=user_id,
            sender_identifier="AX-SBIINB-ALERT",
            message_content="Dear SBI User, your NetBanking account has been suspended due to pending KYC. Click http://sbi-verify.top immediately.",
            channel="SMS",
            status="ANALYZED",
            analysis_id=scan1.id
        ))

    scan2 = FraudAnalysis.query.filter_by(user_id=user_id, analysis_type="URL").first()
    if not scan2:
        scan2 = FraudAnalysis(
            user_id=user_id,
            analysis_type="URL",
            target_input="http://hdfc-bank-netbanking-verify.xyz/auth",
            risk_score=75,
            risk_category="High",
            indicators=[
                "High-risk top-level domain (.xyz) frequently associated with credential harvesting",
                "Brand spoofing: Reputable banking brand 'hdfc' embedded in non-official domain"
            ],
            recommendation="Never enter passwords, OTPs, or debit card CVVs on this website. Navigate exclusively to https://netbanking.hdfcbank.com."
        )
        db.session.add(scan2)

    db.session.commit()
    print(f"Hardcoded demo data seeded successfully for user: {user.email}")


def seed_default_demo_user():
    """
    Creates the default demo user (investor@finwise.ai / password123) if not present,
    and seeds all 9 modules with rich hardcoded data.
    """
    demo_email = "investor@finwise.ai"
    user = User.query.filter_by(email=demo_email).first()
    if not user:
        user = User(
            email=demo_email,
            username="investor1",
            role="Individual",
            is_active=True
        )
        user.set_password("password123")
        db.session.add(user)
        db.session.commit()
        print(f"Created default demo user: {demo_email}")

    seed_hardcoded_user_data(user.id)
