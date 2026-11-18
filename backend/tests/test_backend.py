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
        'email': 'new_user@finwise.ai',
        'username': 'new_user1',
        'password': 'SecurePassword123',
        'full_name': 'Aarav Sharma',
        'role': 'Individual'
    })
    assert reg_res.status_code == 201
    data = reg_res.get_json()
    assert data['status'] == 'success'
    assert 'access_token' in data
    assert data['user']['email'] == 'new_user@finwise.ai'

    # Login
    login_res = client.post('/api/auth/login', json={
        'login': 'new_user@finwise.ai',
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

def test_datasets_overview_and_records(client):
    """Test integrated datasets overview endpoint and pagination."""
    res = client.get('/api/datasets/overview')
    assert res.status_code == 200
    data = res.get_json()
    assert data['status'] == 'success'
    assert data['overview']['total_records_all_datasets'] >= 80000
    assert data['overview']['smishing_dataset']['total_records'] == 84863
    assert data['overview']['scam_features_dataset']['total_records'] == 5971

    # Query smishing records
    smish_res = client.get('/api/datasets/smishing?page=1&per_page=10&label=smishing')
    assert smish_res.status_code == 200
    smish_data = smish_res.get_json()
    assert smish_data['status'] == 'success'
    assert len(smish_data['records']) == 10
    assert all(r['is_smishing'] == 1 for r in smish_data['records'])

    # Test test-message
    test_res = client.post('/api/datasets/test-message', json={
        'message': 'Dear SBI User, your NetBanking is suspended. Verify at http://sbi-verify.top immediately.'
    })
    assert test_res.status_code == 200
    test_data = test_res.get_json()
    assert test_data['status'] == 'success'
    assert test_data['result']['risk_score'] >= 50
    assert 'signal_features' in test_data['result']

def test_hardcoded_seeder(app):
    """Test full hardcoded data seeding across all modules."""
    from app.models.user import User
    from app.models.transaction import Transaction
    from app.models.loan import LoanRecord
    from app.models.investment import InvestmentPortfolio
    from app.models.business import Business, TaxCalculation
    from app.models.budget import Budget
    from app.models.fraud import FraudAnalysis
    from app.utils.seeder import seed_default_demo_user

    with app.app_context():
        seed_default_demo_user()
        demo = User.query.filter_by(email="investor@finwise.ai").first()
        assert demo is not None
        assert Transaction.query.filter_by(user_id=demo.id).count() >= 20
        assert LoanRecord.query.filter_by(user_id=demo.id).count() >= 1
        assert InvestmentPortfolio.query.filter_by(user_id=demo.id).count() >= 1
        assert Business.query.filter_by(user_id=demo.id).count() >= 1
        assert TaxCalculation.query.filter_by(user_id=demo.id).count() >= 1
        assert Budget.query.filter_by(user_id=demo.id).count() >= 1
        assert FraudAnalysis.query.filter_by(user_id=demo.id).count() >= 1



