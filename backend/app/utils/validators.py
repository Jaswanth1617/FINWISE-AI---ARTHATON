import re
from datetime import datetime

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
GSTIN_REGEX = re.compile(r'^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')
PHONE_REGEX = re.compile(r'^\+?[0-9]{10,15}$')

def validate_email(email):
    """Check if email matches RFC standard regex."""
    if not email or not isinstance(email, str):
        return False
    return bool(EMAIL_REGEX.match(email.strip()))

def validate_password_strength(password):
    """
    Ensure password has at least:
    - 8 characters
    - 1 uppercase letter
    - 1 lowercase letter
    - 1 digit
    """
    if not password or len(password) < 8:
        return False, "Password must be at least 8 characters long."
    if not re.search(r'[A-Z]', password):
        return False, "Password must contain at least one uppercase letter."
    if not re.search(r'[a-z]', password):
        return False, "Password must contain at least one lowercase letter."
    if not re.search(r'[0-9]', password):
        return False, "Password must contain at least one digit."
    return True, "Password meets security requirements."

def validate_gstin(gstin):
    """Validate 15-character Indian Goods and Services Tax Identification Number."""
    if not gstin:
        return True # Optional field
    return bool(GSTIN_REGEX.match(gstin.strip().upper()))

def validate_phone(phone):
    """Validate standard international or Indian phone numbers."""
    if not phone:
        return True
    return bool(PHONE_REGEX.match(phone.strip()))

def parse_flexible_date(date_str):
    """Parse dates in various standard formats (DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY, etc)."""
    if not date_str:
        return None
    date_str = str(date_str).strip()
    formats = [
        "%Y-%m-%d",
        "%d-%m-%Y",
        "%d/%m/%Y",
        "%m/%d/%Y",
        "%Y/%m/%d",
        "%d %b %Y",
        "%d-%b-%Y",
        "%d %B %Y"
    ]
    for fmt in formats:
        try:
            return datetime.strptime(date_str, fmt).date()
        except ValueError:
            continue
    return None
