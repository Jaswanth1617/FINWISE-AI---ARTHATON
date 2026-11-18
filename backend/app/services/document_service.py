import os
import re
import pandas as pd
import pymupdf
from datetime import datetime
from app.utils.validators import parse_flexible_date

# Comprehensive Indian Merchant & FinTech Resolution Dictionary
MERCHANT_DICTIONARY = {
    'Food': [
        'swiggy', 'zomato', 'restaurant', 'cafe', 'mcdonald', 'starbucks', 'dominos', 'burger',
        'blinkit', 'zepto', 'instamart', 'groceries', 'dining', 'eats', 'pizza', 'subway',
        'kfc', 'biryani', 'chai', 'food', 'bakery', 'hotel'
    ],
    'Shopping': [
        'amazon', 'flipkart', 'myntra', 'zara', 'h&m', 'ajio', 'dmart', 'retail', 'clothing',
        'electronics', 'mall', 'store', 'purchase', 'tatacliq', 'nykaa', 'croma', 'reliance',
        'decathlon', 'ikea', 'supermarket', 'mart'
    ],
    'Transportation': [
        'uber', 'ola', 'rapido', 'fuel', 'petrol', 'diesel', 'metro', 'irctc', 'railway',
        'flight', 'airline', 'toll', 'fastag', 'indian oil', 'bharat petro', 'hpcl', 'makemytrip'
    ],
    'Healthcare': [
        'pharmacy', 'hospital', 'clinic', 'apollo', 'medplus', 'doctor', '1mg', 'pharma',
        'diagnostics', 'medical', 'dentist', 'gym', 'fitness', 'cult.fit', 'curefit', 'health'
    ],
    'Education': [
        'udemy', 'coursera', 'school', 'college', 'university', 'tuition', 'books', 'course',
        'exam', 'fees', 'unacademy', 'byju', 'scaler', 'upgrad'
    ],
    'Entertainment': [
        'netflix', 'spotify', 'hotstar', 'prime video', 'cinema', 'pvr', 'inox', 'movie',
        'game', 'playstation', 'steam', 'youtube', 'bookmyshow', 'disney', 'apple.com/bill'
    ],
    'Bills': [
        'electricity', 'water', 'bescom', 'airtel', 'jio', 'vi', 'broadband', 'wifi', 'utility',
        'gas', 'billdesk', 'recharge', 'tatasky', 'dth', 'bbps'
    ],
    'Rent': [
        'rent', 'landlord', 'housing', 'society maintenance', 'nobroker', 'mygate', 'lease'
    ],
    'EMI': [
        'emi', 'loan', 'bajaj finance', 'hdfc loan', 'icici loan', 'credit card payment',
        'mortgage', 'cred', 'autodebit', 'home loan'
    ],
    'Investments': [
        'zerodha', 'groww', 'upstox', 'mutual fund', 'sip', 'nse', 'bse', 'etmoney', 'kuvera',
        'ppf', 'nps', 'coin', 'smallcase', 'angelone'
    ],
    'Salary': [
        'salary', 'payroll', 'stipend', 'employer', 'wages', 'credited by', 'direct deposit'
    ],
    'Transfers': [
        'upi transfer', 'neft', 'rtgs', 'imps', 'transfer to', 'transfer from', 'self transfer',
        'p2p', 'sent to'
    ]
}

def clean_indian_transaction_narration(raw_desc: str) -> str:
    """
    Normalize messy Indian bank & UPI statement narrations (from personal-finance-intelligence).
    Examples:
      - 'UPI/824287/SWIGGY/ybl' -> 'Swiggy'
      - 'POS 9104 BLINKIT' -> 'Blinkit'
      - 'BBPS/ELECTRICITY/BESCOM' -> 'Bescom Electricity'
      - 'PHONEPE*DMART' -> 'DMart'
    """
    if not raw_desc:
        return "Transaction"

    text = str(raw_desc).strip()

    # Common UPI/IMPS prefixes
    text = re.sub(r'^(UPI|IMPS|NEFT|RTGS|BBPS|POS|ACH|NACH)[\/\s\-_]+', '', text, flags=re.IGNORECASE)
    # Strip numeric reference codes: UPI/123456/Name -> Name
    text = re.sub(r'^[0-9]+[\/\s\-_]+', '', text)
    # Strip VPA handles at the end like /ybl, /okaxis, /paytm
    text = re.sub(r'[\/](ybl|okaxis|okicici|okhdfcbank|paytm|apl|ibl|sbi)$', '', text, flags=re.IGNORECASE)
    # Strip merchant asterisk prefixes: PHONEPE*DMART -> DMart
    text = re.sub(r'^(PHONEPE|PAYTM|GPAY|AMZN|RAZORPAY)[\*\-_]+', '', text, flags=re.IGNORECASE)
    # Remove junk special symbols
    text = re.sub(r'[\*#@]+', ' ', text)
    text = re.sub(r'\s+', ' ', text).strip()

    return text.title() if text else str(raw_desc)[:80]

def categorize_description(description: str, tx_type: str = 'DEBIT') -> str:
    """Classify transaction into fintech categories."""
    if not description:
        return 'Other'
    
    desc_lower = description.lower()
    
    if tx_type == 'CREDIT' and any(kw in desc_lower for kw in ['salary', 'payroll', 'stipend', 'employer']):
        return 'Salary'
        
    for category, keywords in MERCHANT_DICTIONARY.items():
        for kw in keywords:
            if kw in desc_lower:
                return category
                
    return 'Other'

def parse_csv_file(file_path: str) -> list:
    """Parse CSV statement files with dynamic column mapping."""
    df = pd.read_csv(file_path)
    return process_dataframe(df)

def parse_excel_file(file_path: str) -> list:
    """Parse Excel files (.xlsx, .xls)."""
    df = pd.read_excel(file_path)
    return process_dataframe(df)

def process_dataframe(df: pd.DataFrame) -> list:
    """Normalize tabular dataframe records into standardized transaction dictionaries."""
    col_map = {col: str(col).strip().lower() for col in df.columns}
    df = df.rename(columns=col_map)
    
    date_col = next((c for c in df.columns if any(k in c for k in ['date', 'txn date', 'transaction date', 'value date'])), None)
    desc_col = next((c for c in df.columns if any(k in c for k in ['desc', 'narration', 'particulars', 'detail', 'remarks'])), None)
    debit_col = next((c for c in df.columns if any(k in c for k in ['debit', 'withdrawal', 'dr'])), None)
    credit_col = next((c for c in df.columns if any(k in c for k in ['credit', 'deposit', 'cr'])), None)
    amount_col = next((c for c in df.columns if any(k in c for k in ['amount', 'txn amount'])), None)
    balance_col = next((c for c in df.columns if any(k in c for k in ['balance', 'bal'])), None)

    records = []
    
    for idx, row in df.iterrows():
        raw_date = row.get(date_col)
        parsed_date = parse_flexible_date(raw_date)
        if not parsed_date:
            continue

        raw_desc = str(row.get(desc_col, 'Unknown Transaction')) if desc_col else 'Transaction'
        norm_desc = clean_indian_transaction_narration(raw_desc)
        
        amount = 0.0
        tx_type = 'DEBIT'
        
        if debit_col and pd.notna(row[debit_col]) and float(row[debit_col] or 0) > 0:
            amount = abs(float(row[debit_col]))
            tx_type = 'DEBIT'
        elif credit_col and pd.notna(row[credit_col]) and float(row[credit_col] or 0) > 0:
            amount = abs(float(row[credit_col]))
            tx_type = 'CREDIT'
        elif amount_col and pd.notna(row[amount_col]):
            val = float(row[amount_col])
            amount = abs(val)
            tx_type = 'CREDIT' if val > 0 else 'DEBIT'
        else:
            continue

        balance = None
        if balance_col and pd.notna(row[balance_col]):
            try:
                balance = float(row[balance_col])
            except (ValueError, TypeError):
                balance = None

        category = categorize_description(norm_desc, tx_type)

        records.append({
            'transaction_date': parsed_date,
            'description': raw_desc,
            'normalized_description': norm_desc,
            'transaction_type': tx_type,
            'amount': round(amount, 2),
            'balance_after': round(balance, 2) if balance is not None else None,
            'category': category
        })

    return records

def parse_pdf_statement(file_path: str) -> list:
    """
    Extract transaction records from standard bank statement PDFs using PyMuPDF.
    """
    doc = pymupdf.open(file_path)
    full_text = ""
    for page in doc:
        full_text += page.get_text() + "\n"
    doc.close()

    lines = full_text.splitlines()
    records = []
    
    date_regex = re.compile(r'(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{1,2}\s+[A-Za-z]{3}\s+\d{4})')
    amount_regex = re.compile(r'([0-9,]+\.\d{2})')

    for line in lines:
        line_clean = line.strip()
        date_match = date_regex.search(line_clean)
        if not date_match:
            continue

        raw_date = date_match.group(1)
        parsed_date = parse_flexible_date(raw_date)
        if not parsed_date:
            continue

        amounts = amount_regex.findall(line_clean)
        if not amounts:
            continue

        clean_amounts = [float(a.replace(',', '')) for a in amounts]
        amount = clean_amounts[0]
        
        is_credit = any(k in line_clean.lower() for k in ['cr', 'credit', 'salary', 'deposit'])
        tx_type = 'CREDIT' if is_credit else 'DEBIT'
        
        balance = clean_amounts[-1] if len(clean_amounts) > 1 else None

        desc = line_clean.replace(raw_date, '')
        for a in amounts:
            desc = desc.replace(a, '')
        desc = re.sub(r'\s+', ' ', desc).strip()
        norm_desc = clean_indian_transaction_narration(desc)
        category = categorize_description(norm_desc, tx_type)

        records.append({
            'transaction_date': parsed_date,
            'description': desc if desc else "Bank Transaction",
            'normalized_description': norm_desc if norm_desc else "Bank Transaction",
            'transaction_type': tx_type,
            'amount': round(amount, 2),
            'balance_after': round(balance, 2) if balance is not None else None,
            'category': category
        })

    return records
