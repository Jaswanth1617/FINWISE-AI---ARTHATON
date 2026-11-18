import pytest
import json
from datetime import date
from app import create_app
from app.extensions import db
from app.models.user import User
from app.utils.calculations import calculate_reducing_emi, calculate_income_tax_india, calculate_sip, calculate_gst
from app.services.fraud_service import analyze_message_risk, analyze_url_risk

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.session.remove()
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_user_registration_and_login(client):
    """Test user registration, password hashing and JWT token issuance."""
    # Register
    reg_res = client.post('/api/auth/register', json={
        'email': 'investor@finwise.ai',
        'username': 'investor1',
        'password': 'SecurePassword123',
        'full_name': 'Aarav Sharma',
        'role': 'Individual'
    })
    assert reg_res.status_code == 201
    data = reg_res.get_json()
    assert data['status'] == 'success'
    assert 'access_token' in data
    assert data['user']['email'] == 'investor@finwise.ai'

    # Login
    login_res = client.post('/api/auth/login', json={
        'login': 'investor@finwise.ai',
        'password': 'SecurePassword123'
    })
    assert login_res.status_code == 200
    login_data = login_res.get_json()
    assert 'access_token' in login_data

def test_reducing_emi_calculation():
    """Verify deterministic reducing balance loan calculations."""
    # Principal: 10,00,000, 10% annual rate, 120 months (10 years)
    result = calculate_reducing_emi(1000000, 10.0, 120)
    assert result['monthly_emi'] == 13215.07
    assert result['total_payment'] > 1000000
    assert result['total_interest'] > 0

def test_indian_tax_calculation_old_vs_new():
    """Test Indian income tax rules under FY 2024-25 provisions."""
    res = calculate_income_tax_india(1200000, {'80c': 150000, '80d': 25000})
    assert res['financial_year'] == '2024-25'
    assert 'new_regime' in res
    assert 'old_regime' in res
    assert res['recommended_regime'] in ['New Regime', 'Old Regime', 'Both Equal']

def test_gst_calculation_intra_vs_interstate():
    """Test GST splitting: CGST+SGST for intra-state vs IGST for inter-state."""
    intra = calculate_gst(100000, 18.0, is_interstate=False)
    assert intra['cgst'] == 9000.0
    assert intra['sgst'] == 9000.0
    assert intra['igst'] == 0.0

    inter = calculate_gst(100000, 18.0, is_interstate=True)
    assert inter['cgst'] == 0.0
    assert inter['sgst'] == 0.0
    assert inter['igst'] == 18000.0

def test_fraud_message_detection():
    """Test phishing message identification."""
    suspicious_sms = "Dear customer, your bank account will be blocked today. Click http://hdfc-verify-kyc.top/update to complete KYC immediately."
    res = analyze_message_risk(suspicious_sms)
    assert res['risk_score'] >= 50
    assert res['risk_category'] in ['High', 'Critical']
    assert len(res['indicators']) >= 2

def test_fraud_url_detection():
    """Test malicious URL structural inspection."""
    suspicious_url = "http://192.168.1.1/sbi-netbanking-login"
    res = analyze_url_risk(suspicious_url)
    assert res['risk_score'] >= 50
    assert 'raw IP address' in str(res['indicators'])

def test_fraud_benchmark_samples(client):
    """Test retrieval of authentic research smishing benchmark samples."""
    res = client.get('/api/fraud/benchmark-samples')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'success'
    assert len(data['samples']) >= 5
    assert any('SBI' in s['title'] or 'HDFC' in s['title'] for s in data['samples'])

def test_financial_sample_statements(client):
    """Test retrieval of authentic sample bank statements."""
    res = client.get('/api/financial/sample-statements')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'success'
    assert any(s['id'] == 'synthetic_12_month_statement.csv' for s in data['samples'])

