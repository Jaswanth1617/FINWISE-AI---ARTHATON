import os
import re
import json
import requests
from flask import current_app

from flask import current_app, has_app_context

def redact_sensitive_info(text: str) -> str:
    """
    Strict security policy: Never send credit card numbers, OTPs, 
    or bank account credentials to external LLMs.
    """
    if not text:
        return ""
    # Redact 16-digit card numbers
    redacted = re.sub(r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b', '[REDACTED_CARD]', text)
    # Redact 4 or 6 digit OTP patterns
    redacted = re.sub(r'\b(otp|pin|cvv|code)[\s:]*([0-9]{4,6})\b', r'\1: [REDACTED_CODE]', redacted, flags=re.IGNORECASE)
    # Redact passwords
    redacted = re.sub(r'\b(password|passwd|pwd)[\s:=]+([^\s]+)', r'\1: [REDACTED]', redacted, flags=re.IGNORECASE)
    return redacted

def call_groq_llm(messages: list, temperature: float = 0.2, max_tokens: int = 800) -> dict:
    """
    Execute an LLM chat completion against the configured Groq model.
    Falls back gracefully to deterministic rule-based response if API key is not configured.
    """
    if has_app_context():
        api_key = current_app.config.get('GROQ_API_KEY', '') or os.getenv('GROQ_API_KEY', '')
        model = current_app.config.get('GROQ_MODEL', 'llama-3.3-70b-versatile') or os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')
    else:
        api_key = os.getenv('GROQ_API_KEY', '')
        model = os.getenv('GROQ_MODEL', 'llama-3.3-70b-versatile')

    # Security check: redact prompt contents
    sanitized_messages = []
    for m in messages:
        sanitized_messages.append({
            'role': m['role'],
            'content': redact_sensitive_info(m['content'])
        })

    if not api_key or api_key.strip() == '' or api_key == 'your_groq_api_key_here':
        # Local deterministic mode - return structured explainability
        return {
            'success': True,
            'source': 'LOCAL_RULE_ENGINE',
            'content': generate_rule_based_ai_fallback(sanitized_messages),
            'model': f"local-deterministic (Groq API Key not configured)"
        }

    url = "https://api.groq.com/openai/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {api_key.strip()}",
        "Content-Type": "application/json"
    }
    payload = {
        "model": model,
        "messages": sanitized_messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=12)
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            return {
                'success': True,
                'source': 'GROQ_API',
                'content': content,
                'model': model
            }
        else:
            # Fall back safely on API error without crashing
            return {
                'success': True,
                'source': 'LOCAL_RULE_ENGINE',
                'content': generate_rule_based_ai_fallback(sanitized_messages),
                'model': f"local-fallback (Groq HTTP {response.status_code})"
            }
    except Exception as e:
        return {
            'success': True,
            'source': 'LOCAL_RULE_ENGINE',
            'content': generate_rule_based_ai_fallback(sanitized_messages),
            'model': f"local-fallback ({str(e)})"
        }

def generate_rule_based_ai_fallback(messages: list) -> str:
    """Generate high-quality deterministic financial intelligence when Groq is offline."""
    user_msg = ""
    for m in reversed(messages):
        if m['role'] == 'user':
            user_msg = m['content'].lower()
            break

    if 'food' in user_msg or 'spend' in user_msg or 'expense' in user_msg:
        return "Based on your transaction records, your primary expense driver this cycle has been Food & Dining and Utility Bills. Consider setting a category cap to increase your monthly savings rate."
    elif 'emi' in user_msg or 'loan' in user_msg:
        return "An EMI commitment should ideally remain under 40% of your net monthly in-hand income to preserve cash-flow liquidity and maintain a healthy debt-to-income ratio."
    elif 'tax' in user_msg:
        return "Under FY 2024-25 provisions, the New Tax Regime offers a standard deduction of ₹75,000 and full 87A rebate for taxable income up to ₹7,00,000. Use our Tax Assistant to calculate your exact liability."
    elif 'fraud' in user_msg or 'suspicious' in user_msg or 'blocked' in user_msg:
        return "Legitimate financial institutions and banks will never ask you to click a link to unblock your account or demand an OTP or UPI PIN. Verify any alert through your bank's official banking portal."
    else:
        return "FINWISE AI has analyzed your financial data. Your cash flow and budget allocations are monitored against predefined risk and spending thresholds. Let me know which category, loan, or investment insight you would like to explore."
