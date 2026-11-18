from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from app.extensions import db
from app.models.loan import LoanRecord, LoanSchedule
from app.utils.calculations import calculate_reducing_emi, generate_amortization_schedule

loan_bp = Blueprint('loan', __name__, url_prefix='/api/loans')

@loan_bp.route('/calculate-emi', methods=['POST'])
@jwt_required()
def calculate_emi():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    principal = float(data.get('principal', 500000.0))
    annual_rate = float(data.get('interest_rate', 8.5))
    tenure_months = int(data.get('tenure_months', 60))
    loan_type = data.get('loan_type', 'Personal Loan')
    loan_name = data.get('loan_name', f"{loan_type} Plan")
    save_to_portfolio = bool(data.get('save', False))
    extra_monthly_payment = float(data.get('extra_monthly_payment', 0.0))

    if principal <= 0 or annual_rate <= 0 or tenure_months <= 0:
        return jsonify({'status': 'error', 'message': 'Principal, interest rate, and tenure must be positive.'}), 400

    calc_res = generate_amortization_schedule(principal, annual_rate, tenure_months, extra_monthly_payment=extra_monthly_payment)

    saved_loan_id = None
    if save_to_portfolio:
        loan = LoanRecord(
            user_id=user_id,
            loan_name=loan_name,
            loan_type=loan_type,
            principal_amount=principal,
            annual_interest_rate=annual_rate,
            tenure_months=tenure_months,
            calculated_emi=calc_res['summary']['monthly_emi'],
            total_interest=calc_res['summary']['total_interest'],
            total_payment=calc_res['summary']['total_payment'],
            start_date=date.today()
        )
        db.session.add(loan)
        db.session.commit()
        saved_loan_id = loan.id

    return jsonify({
        'status': 'success',
        'calculation': calc_res,
        'saved_loan_id': saved_loan_id,
        'credit_score_guidance': {
            'credit_mix_factor': 'Maintaining a healthy mix of secured (home/auto) and unsecured (credit card/personal) loans positively influences credit scoring models.',
            'repayment_discipline': 'On-time monthly EMI payments account for ~35% of standard CIBIL/Experian credit score weightage.',
            'utilization_ratio': 'Keep revolving credit card utilization below 30% of authorized limits.',
            'disclaimer': 'Calculations are mathematical estimates based on reducing balance formulas. Loan approval is subject to institutional underwriting.'
        }
    }), 200

@loan_bp.route('/compare', methods=['POST'])
@jwt_required()
def compare_loans():
    data = request.get_json() or {}
    scenarios = data.get('scenarios', [])
    if not scenarios or len(scenarios) < 2:
        return jsonify({'status': 'error', 'message': 'At least two loan scenarios are required for comparison.'}), 400

    results = []
    for s in scenarios:
        p = float(s.get('principal', 100000.0))
        r = float(s.get('interest_rate', 9.0))
        n = int(s.get('tenure_months', 36))
        label = s.get('label', f"{n}M @ {r}%")
        
        calc = calculate_reducing_emi(p, r, n)
        calc['label'] = label
        results.append(calc)

    # Sort scenarios by total interest
    sorted_by_interest = sorted(results, key=lambda x: x['total_interest'])
    lowest_interest_label = sorted_by_interest[0]['label']
    savings_diff = round(sorted_by_interest[-1]['total_interest'] - sorted_by_interest[0]['total_interest'], 2)

    return jsonify({
        'status': 'success',
        'scenarios': results,
        'recommendation': f"Scenario '{lowest_interest_label}' minimizes total interest liability, saving ₹{savings_diff:,.2f} over the loan lifetime."
    }), 200

@loan_bp.route('/history', methods=['GET'])
@jwt_required()
def get_loan_history():
    user_id = get_jwt_identity()
    loans = LoanRecord.query.filter_by(user_id=user_id).order_by(LoanRecord.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'loans': [l.to_dict() for l in loans]
    }), 200
