import re
import os
import json
from urllib.parse import urlparse
import numpy as np
from app.services.ai_service import call_groq_llm

# ==============================================================================
# 1. SCAM SIGNAL FEATURE EXTRACTION (FROM INFO-4360-Project & Smishing_Dataset)
# ==============================================================================

def extract_signal_features(text: str) -> dict:
    """
    Extract linguistic and structural signal features based on research models
    from INFO-4360-Project and Smishing_Dataset.
    """
    if not text:
        return {}

    word_count = len(text.split())
    char_count = max(1, len(text))
    digits_count = len(re.findall(r'\d', text))
    caps_count = len(re.findall(r'[A-Z]', text))
    caps_pct = round((caps_count / char_count) * 100, 1)
    
    has_phone = bool(re.search(r'\+?\d{10,}', text))
    has_shortcode = bool(re.search(r'\b\d{4,6}\b', text))
    has_url = bool(re.search(r'https?://|www\.|\.(com|top|xyz|net|org|co\.uk|ly|io|gl|me|cc)\b', text, re.IGNORECASE))
    has_currency = bool(re.search(r'[₹$£€]|(?:rs\.?|inr|ngn|usd)\b', text, re.IGNORECASE))
    exclamation_count = text.count('!')
    
    cta_matches = re.findall(r'\b(?:call|txt|text|reply|click|send|visit|dial|verify|update|claim|login|download)\b', text, re.IGNORECASE)
    call_to_action = len(cta_matches)

    return {
        'word_count': word_count,
        'digits_count': digits_count,
        'caps_pct': caps_pct,
        'has_phone': has_phone,
        'has_shortcode': has_shortcode,
        'has_url': has_url,
        'has_currency': has_currency,
        'exclamation_count': exclamation_count,
        'call_to_action_count': call_to_action,
        'call_to_action_terms': list(set(cta.lower() for cta in cta_matches))
    }

# Core Suspicious Coercion Patterns
SUSPICIOUS_PHRASES = [
    (r'(account|debit card|credit card|pan|kyc).*?(block|suspend|deactivate|expire)', 35, 'Urgent threat of account blocking or KYC suspension'),
    (r'(verify|update|complete).*?(immediately|today|within 24 hours|urgently)', 25, 'High urgency psychological pressure tactic'),
    (r'(share|send|enter).*?(otp|pin|password|cvv)', 40, 'Direct demand for sensitive banking credentials / PIN / OTP'),
    (r'(lottery|won|reward|cashback|prize|congratulations).*?(claim|click|collect)', 30, 'Unsolicited reward or prize claim incentive lure'),
    (r'(apk|download app|install).*?(link|\.apk)', 35, 'Request to sideload external APK or unverified mobile app'),
    (r'(customer care|support|officer).*?(\+?[0-9]{10})', 20, 'Direct phone number posing as bank/utility customer support'),
    (r'(power|electricity|connection).*?(disconnect|cut off).*?(tonight|today|bill)', 35, 'Urgent utility disconnection threat scam'),
    (r'(consignment|parcel|package|delivery).*?(address|incomplete|cannot deliver)', 30, 'Fake parcel/courier address update lure'),
    (r'(refund|overdue penalty).*?(claim|pay immediately)', 20, 'Fake tax/utility refund or penalty avoidance lure')
]

def analyze_message_risk(message_text: str) -> dict:
    """
    Deterministic signal feature extraction + rule-based heuristic scoring + AI explainability.
    """
    if not message_text:
        return {
            'risk_score': 0,
            'risk_category': 'Low',
            'indicators': ['Empty input provided.'],
            'signal_features': {},
            'explanation': 'No message text to evaluate.',
            'recommendation': 'Please provide a message to analyze.'
        }

    # 1. Extract research signal features
    signals = extract_signal_features(message_text)

    text_lower = message_text.lower()
    detected_indicators = []
    base_score = 0

    # 2. Check phrase patterns
    for pattern, weight, description in SUSPICIOUS_PHRASES:
        if re.search(pattern, text_lower):
            detected_indicators.append(description)
            base_score += weight

    # 3. Incorporate signal features into threat calculation
    if signals.get('has_url'):
        detected_indicators.append('Contains unverified external hyperlink or domain link')
        base_score += 20
    if signals.get('caps_pct', 0) > 30 and signals.get('word_count', 0) > 5:
        detected_indicators.append(f"Excessive capitalization ({signals['caps_pct']}%) often used to manufacture artificial urgency")
        base_score += 10
    if signals.get('call_to_action_count', 0) >= 2:
        detected_indicators.append(f"Aggressive call-to-action commands detected ({', '.join(signals['call_to_action_terms'][:3])})")
        base_score += 15
    if signals.get('has_phone') and ('call' in text_lower or 'contact' in text_lower):
        detected_indicators.append('Includes unverified direct phone number call-out')
        base_score += 10

    # Cap score between 0 and 100
    risk_score = min(100, base_score)

    # Categorize
    if risk_score >= 75:
        risk_category = 'Critical'
    elif risk_score >= 50:
        risk_category = 'High'
    elif risk_score >= 25:
        risk_category = 'Medium'
    else:
        risk_category = 'Low'

    # Synthesize safety action recommendations
    recommendations = []
    if risk_score >= 50:
        recommendations.append("Do not click any embedded links or download attached files or APKs.")
        recommendations.append("Never share OTPs, UPI PINs, passwords, or card details with anyone.")
        recommendations.append("Contact your bank immediately via their official customer care number printed on the back of your debit/credit card.")
    elif risk_score >= 25:
        recommendations.append("Exercise caution and independently verify the sender's identity before interacting.")
    else:
        recommendations.append("No obvious phishing indicators detected. Standard vigilance advised.")

    # Call AI explanation layer with grounding
    ai_prompt = [
        {"role": "system", "content": "You are a cybersecurity expert analyzing suspicious financial communications. Explain in 2-3 concise sentences why this message was flagged and how the user should protect themselves. Be clear, calm, and practical. Note that risk score is an algorithmic estimate."},
        {"role": "user", "content": f"Message: '{message_text}'\nDetected Indicators: {', '.join(detected_indicators) if detected_indicators else 'None'}\nSignal Features: {signals}\nRisk Score: {risk_score}/100"}
    ]
    ai_resp = call_groq_llm(ai_prompt)

    return {
        'risk_score': risk_score,
        'risk_category': risk_category,
        'indicators': detected_indicators if detected_indicators else ['No significant threat indicators detected'],
        'signal_features': signals,
        'explanation': ai_resp.get('content', 'Algorithmic scan completed.'),
        'recommendation': " ".join(recommendations),
        'disclaimer': 'Risk score is an estimate based on signal feature extraction and language heuristics, not a legal or forensic guarantee.'
    }


# ==============================================================================
# 2. SUSPICIOUS URL ANALYSIS
# ==============================================================================

SUSPICIOUS_TLDS = {'.xyz', '.top', '.click', '.loan', '.racing', '.accountant', '.work', '.tk', '.ga', '.ml', '.cf', '.gq', '.zip', '.mov'}
URL_SHORTENERS = {'bit.ly', 'tinyurl.com', 'rb.gy', 'is.gd', 't.co', 'ow.ly', 'cutt.ly'}
BANK_BRANDS = ['hdfc', 'sbi', 'icici', 'axis', 'kotak', 'punjab', 'pnb', 'paytm', 'phonepe', 'gpay', 'paypal', 'cbn']

def analyze_url_risk(url: str) -> dict:
    """
    Safely inspect URL structure WITHOUT visiting the suspicious URL.
    """
    if not url:
        return {'risk_score': 0, 'risk_category': 'Low', 'indicators': ['No URL provided.']}

    url_to_parse = url.strip()
    if not url_to_parse.startswith(('http://', 'https://')):
        url_to_parse = 'http://' + url_to_parse

    parsed = urlparse(url_to_parse)
    hostname = (parsed.hostname or '').lower()

    indicators = []
    score = 0

    if parsed.scheme != 'https':
        score += 25
        indicators.append('Insecure protocol: URL does not use HTTPS encryption')

    if re.match(r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$', hostname):
        score += 50
        indicators.append('Host is a raw IP address rather than a registered domain name')

    if hostname in URL_SHORTENERS:
        score += 35
        indicators.append(f'URL shortening service detected ({hostname}), masking destination domain')

    for tld in SUSPICIOUS_TLDS:
        if hostname.endswith(tld):
            score += 30
            indicators.append(f'High-risk top-level domain detected ({tld})')
            break

    for brand in BANK_BRANDS:
        if brand in hostname:
            legit_domains = [f"{brand}.com", f"{brand}bank.com", f"online{brand}.com", f"{brand}.co.in", f"{brand}.gov.in"]
            if not any(hostname == ld or hostname.endswith('.' + ld) for ld in legit_domains):
                score += 45
                indicators.append(f'Potential brand spoofing detected: name contains "{brand}" on an unverified domain')

    if hostname.count('.') > 3:
        score += 20
        indicators.append('Excessive subdomains detected (often used to obscure spoofed hosts)')
    if hostname.count('-') > 2:
        score += 15
        indicators.append('Multiple hyphens in domain name (common in phishing registration patterns)')

    risk_score = min(100, score)
    if risk_score >= 70:
        risk_cat = 'Critical'
    elif risk_score >= 45:
        risk_cat = 'High'
    elif risk_score >= 20:
        risk_cat = 'Medium'
    else:
        risk_cat = 'Low'

    recommendation = "Do not open this URL or submit any credentials." if risk_score >= 45 else "Verify destination before navigating."

    return {
        'url': url,
        'hostname': hostname,
        'risk_score': risk_score,
        'risk_category': risk_cat,
        'indicators': indicators if indicators else ['No obvious malicious structural patterns detected'],
        'recommendation': recommendation,
        'disclaimer': 'URL was inspected structurally without making network requests. Threat scores are indicative.'
    }


# ==============================================================================
# 3. TRANSACTION ANOMALY DETECTION (STATISTICAL & RECURRING)
# ==============================================================================

def detect_transaction_anomalies(transactions: list) -> list:
    """
    Detect statistical outliers, duplicate payments, and sudden spikes in transaction data.
    """
    if not transactions or len(transactions) < 3:
        return transactions

    debit_amounts = [t['amount'] for t in transactions if t.get('transaction_type') == 'DEBIT']
    if not debit_amounts:
        return transactions

    mean = np.mean(debit_amounts)
    std = np.std(debit_amounts) if len(debit_amounts) > 1 else 0

    seen_signatures = {}

    for t in transactions:
        t_amt = t['amount']
        t_desc = (t.get('description') or '').strip().lower()
        t_date = t.get('transaction_date')
        
        # Duplicate detection signature
        sig = f"{t_date}_{t_amt}_{t_desc[:15]}"
        if sig in seen_signatures:
            t['is_duplicate'] = True
            t['is_suspicious'] = True
            t['suspicion_reason'] = 'Potential duplicate payment detected on same date'
        else:
            seen_signatures[sig] = True

        # Statistical outlier anomaly
        if std > 0 and t.get('transaction_type') == 'DEBIT':
            z_score = (t_amt - mean) / std
            if z_score > 3.0 or (t_amt > mean * 4.0 and t_amt > 10000):
                t['is_suspicious'] = True
                t['suspicion_reason'] = f'Unusual high-value debit (₹{t_amt:,.2f}) significantly above historical average'

    return transactions
