import math
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta

# ==============================================================================
# 1. LOAN & EMI CALCULATIONS (REDUCING BALANCE FORMULA)
# ==============================================================================

def calculate_reducing_emi(principal: float, annual_rate: float, tenure_months: int):
    """
    Standard reducing balance EMI formula:
    E = P * r * (1 + r)^n / ((1 + r)^n - 1)
    where:
    P = Principal loan amount
    r = Monthly interest rate (annual_rate / 12 / 100)
    n = Tenure in months
    """
    if principal <= 0 or tenure_months <= 0:
        return {
            'monthly_emi': 0.0,
            'total_interest': 0.0,
            'total_payment': 0.0,
            'schedule': []
        }

    monthly_rate = (annual_rate / 12.0) / 100.0
    
    if monthly_rate == 0:
        emi = principal / tenure_months
        total_interest = 0.0
    else:
        compounded = (1 + monthly_rate) ** tenure_months
        emi = principal * monthly_rate * compounded / (compounded - 1)
        total_interest = (emi * tenure_months) - principal

    emi = round(emi, 2)
    total_interest = round(total_interest, 2)
    total_payment = round(principal + total_interest, 2)

    return {
        'principal': round(principal, 2),
        'annual_interest_rate': round(annual_rate, 2),
        'tenure_months': tenure_months,
        'monthly_emi': emi,
        'total_interest': total_interest,
        'total_payment': total_payment
    }

def generate_amortization_schedule(principal: float, annual_rate: float, tenure_months: int, start_date=None, extra_monthly_payment: float = 0.0):
    """Generate month-by-month repayment schedule and calculate prepayment savings."""
    if start_date is None:
        start_date = date.today()

    calc = calculate_reducing_emi(principal, annual_rate, tenure_months)
    monthly_emi = calc['monthly_emi']
    monthly_rate = (annual_rate / 12.0) / 100.0

    schedule = []
    balance = principal
    month_idx = 1
    total_interest_paid = 0.0

    while balance > 0 and month_idx <= tenure_months * 2: # safety ceiling
        interest_comp = round(balance * monthly_rate, 2)
        total_interest_paid += interest_comp
        
        base_principal_comp = monthly_emi - interest_comp
        actual_principal_comp = base_principal_comp + extra_monthly_payment
        
        if actual_principal_comp >= balance:
            actual_principal_comp = balance
            actual_emi = round(balance + interest_comp, 2)
            balance = 0.0
        else:
            balance = round(balance - actual_principal_comp, 2)
            actual_emi = round(actual_principal_comp + interest_comp, 2)

        payment_date = start_date + relativedelta(months=month_idx)
        
        schedule.append({
            'installment_number': month_idx,
            'payment_date': payment_date.isoformat(),
            'beginning_balance': round(balance + actual_principal_comp, 2),
            'emi_amount': actual_emi,
            'principal_component': round(actual_principal_comp, 2),
            'interest_component': interest_comp,
            'ending_balance': balance
        })

        if balance <= 0:
            break
        month_idx += 1

    return {
        'summary': calc,
        'actual_tenure_months': len(schedule),
        'months_saved': max(0, tenure_months - len(schedule)),
        'total_interest_paid': round(total_interest_paid, 2),
        'interest_saved': round(max(0.0, calc['total_interest'] - total_interest_paid), 2),
        'schedule': schedule[:120] # Return up to first 120 installments for UI performance
    }


# ==============================================================================
# 2. INDIAN INCOME TAX ENGINE (FY 2024-25 / AY 2025-26)
# ==============================================================================

def calculate_income_tax_india(gross_income: float, deductions: dict = None):
    """
    Configurable Indian Income Tax Calculator comparing Old Regime vs New Regime.
    Rules aligned with FY 2024-25 (AY 2025-26):
    
    New Regime:
    - Standard deduction: ₹75,000 (updated in Budget 2024)
    - Slabs:
      0 - 3,00,000: Nil
      3,00,001 - 7,00,000: 5%
      7,00,001 - 10,00,000: 10%
      10,00,001 - 12,00,000: 15%
      12,00,001 - 15,00,000: 20%
      Above 15,00,000: 30%
    - Rebate u/s 87A: If net taxable income <= ₹7,00,000, tax liability is Nil.
    - 4% Health & Education cess.
    
    Old Regime:
    - Standard deduction: ₹50,000
    - Chapter VI-A deductions (80C up to 1.5L, 80D up to 25k/50k, HRA, etc.)
    - Slabs:
      0 - 2,50,000: Nil
      2,50,001 - 5,00,000: 5%
      5,00,001 - 10,00,000: 20%
      Above 10,00,000: 30%
    - Rebate u/s 87A: If net taxable income <= ₹5,00,000, tax liability is Nil.
    - 4% Health & Education cess.
    """
    if deductions is None:
        deductions = {}

    gross = float(gross_income)
    ded_80c = min(float(deductions.get('80c', 0.0)), 150000.0) # Cap at 1.5 lakh
    ded_80d = min(float(deductions.get('80d', 0.0)), 50000.0)  # Max health insurance
    hra = float(deductions.get('hra', 0.0))
    other_ded = float(deductions.get('other', 0.0))

    # --- NEW REGIME COMPUTATION ---
    new_std_deduction = 75000.0
    new_taxable_income = max(0.0, gross - new_std_deduction)
    
    new_tax = 0.0
    new_slabs_breakdown = []

    # Slabs for New Regime
    slabs_new = [
        (300000, 700000, 0.05, "₹3,00,001 - ₹7,00,000 @ 5%"),
        (700000, 1000000, 0.10, "₹7,00,001 - ₹10,00,000 @ 10%"),
        (1000000, 1200000, 0.15, "₹10,00,001 - ₹12,00,000 @ 15%"),
        (1200000, 1500000, 0.20, "₹12,00,001 - ₹15,00,000 @ 20%"),
        (1500000, float('inf'), 0.30, "Above ₹15,00,000 @ 30%")
    ]

    for lower, upper, rate, label in slabs_new:
        if new_taxable_income > lower:
            taxable_in_slab = min(new_taxable_income, upper) - lower
            slab_tax = taxable_in_slab * rate
            new_tax += slab_tax
            new_slabs_breakdown.append({
                'slab': label,
                'taxable_amount': round(taxable_in_slab, 2),
                'rate': f"{int(rate * 100)}%",
                'tax': round(slab_tax, 2)
            })

    # Section 87A rebate for New Regime (taxable income up to 7 lakh)
    new_rebate = 0.0
    if new_taxable_income <= 700000.0:
        new_rebate = new_tax
        new_tax = 0.0
    
    new_cess = round(new_tax * 0.04, 2)
    new_total_tax = round(new_tax + new_cess, 2)

    # --- OLD REGIME COMPUTATION ---
    old_std_deduction = 50000.0
    total_old_deductions = old_std_deduction + ded_80c + ded_80d + hra + other_ded
    old_taxable_income = max(0.0, gross - total_old_deductions)

    old_tax = 0.0
    old_slabs_breakdown = []

    slabs_old = [
        (250000, 500000, 0.05, "₹2,50,001 - ₹5,00,000 @ 5%"),
        (500000, 1000000, 0.20, "₹5,00,001 - ₹10,00,000 @ 20%"),
        (1000000, float('inf'), 0.30, "Above ₹10,00,000 @ 30%")
    ]

    for lower, upper, rate, label in slabs_old:
        if old_taxable_income > lower:
            taxable_in_slab = min(old_taxable_income, upper) - lower
            slab_tax = taxable_in_slab * rate
            old_tax += slab_tax
            old_slabs_breakdown.append({
                'slab': label,
                'taxable_amount': round(taxable_in_slab, 2),
                'rate': f"{int(rate * 100)}%",
                'tax': round(slab_tax, 2)
            })

    # Section 87A rebate for Old Regime (taxable income up to 5 lakh)
    old_rebate = 0.0
    if old_taxable_income <= 500000.0:
        old_rebate = old_tax
        old_tax = 0.0

    old_cess = round(old_tax * 0.04, 2)
    old_total_tax = round(old_tax + old_cess, 2)

    # Recommendation
    if new_total_tax < old_total_tax:
        recommended = "New Regime"
        savings = round(old_total_tax - new_total_tax, 2)
    elif old_total_tax < new_total_tax:
        recommended = "Old Regime"
        savings = round(new_total_tax - old_total_tax, 2)
    else:
        recommended = "Both Equal"
        savings = 0.0

    return {
        'financial_year': "2024-25",
        'assessment_year': "2025-26",
        'gross_income': gross,
        'new_regime': {
            'standard_deduction': new_std_deduction,
            'taxable_income': round(new_taxable_income, 2),
            'base_tax': round(new_tax, 2),
            'rebate_87a': round(new_rebate, 2),
            'health_education_cess': new_cess,
            'total_tax': new_total_tax,
            'breakdown': new_slabs_breakdown
        },
        'old_regime': {
            'standard_deduction': old_std_deduction,
            'total_deductions': round(total_old_deductions, 2),
            'deduction_80c': ded_80c,
            'deduction_80d': ded_80d,
            'hra': hra,
            'other_deductions': other_ded,
            'taxable_income': round(old_taxable_income, 2),
            'base_tax': round(old_tax, 2),
            'rebate_87a': round(old_rebate, 2),
            'health_education_cess': old_cess,
            'total_tax': old_total_tax,
            'breakdown': old_slabs_breakdown
        },
        'recommended_regime': recommended,
        'tax_savings': savings
    }


# ==============================================================================
# 3. INVESTMENT CALCULATIONS (SIP & FD)
# ==============================================================================

def calculate_sip(monthly_investment: float, expected_annual_cagr: float, tenure_years: int):
    """
    Calculate Systematic Investment Plan (SIP) returns.
    Formula: M = P * ((1 + i)^n - 1) / i * (1 + i)
    where:
    P = monthly installment
    i = monthly return rate (expected_cagr / 12 / 100)
    n = total months (years * 12)
    """
    months = tenure_years * 12
    monthly_rate = (expected_annual_cagr / 12.0) / 100.0
    
    total_invested = round(monthly_investment * months, 2)
    
    if monthly_rate == 0:
        maturity_value = total_invested
    else:
        maturity_value = monthly_investment * (((1 + monthly_rate) ** months - 1) / monthly_rate) * (1 + monthly_rate)
    
    maturity_value = round(maturity_value, 2)
    wealth_gain = round(maturity_value - total_invested, 2)

    return {
        'monthly_investment': round(monthly_investment, 2),
        'expected_cagr': round(expected_annual_cagr, 2),
        'tenure_years': tenure_years,
        'total_invested': total_invested,
        'wealth_gain': wealth_gain,
        'maturity_value': maturity_value
    }

def calculate_fd(principal: float, annual_interest_rate: float, tenure_years: float, compounding_frequency_per_year: int = 4):
    """
    Fixed Deposit compound interest calculation:
    A = P * (1 + r/n)^(n*t)
    Default is quarterly compounding (n=4) standard in Indian banking.
    """
    r = annual_interest_rate / 100.0
    n = compounding_frequency_per_year
    t = tenure_years
    
    amount = principal * ((1 + r / n) ** (n * t))
    amount = round(amount, 2)
    interest_earned = round(amount - principal, 2)

    return {
        'principal': round(principal, 2),
        'interest_rate': round(annual_interest_rate, 2),
        'tenure_years': tenure_years,
        'interest_earned': interest_earned,
        'maturity_amount': amount
    }


# ==============================================================================
# 4. GST CALCULATIONS (CGST + SGST vs IGST)
# ==============================================================================

def calculate_gst(amount: float, rate_percent: float, is_interstate: bool = False):
    """
    Calculate GST for intra-state (CGST + SGST) or inter-state (IGST).
    """
    amt = float(amount)
    rate = float(rate_percent)
    tax_total = round(amt * (rate / 100.0), 2)
    
    if is_interstate:
        return {
            'subtotal': amt,
            'gst_rate': rate,
            'is_interstate': True,
            'cgst': 0.0,
            'sgst': 0.0,
            'igst': tax_total,
            'total_tax': tax_total,
            'grand_total': round(amt + tax_total, 2)
        }
    else:
        half_tax = round(tax_total / 2.0, 2)
        return {
            'subtotal': amt,
            'gst_rate': rate,
            'is_interstate': False,
            'cgst': half_tax,
            'sgst': round(tax_total - half_tax, 2),
            'igst': 0.0,
            'total_tax': tax_total,
            'grand_total': round(amt + tax_total, 2)
        }
