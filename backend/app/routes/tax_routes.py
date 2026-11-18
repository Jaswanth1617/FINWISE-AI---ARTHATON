from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models.business import TaxCalculation
from app.utils.calculations import calculate_income_tax_india
from app.services.ai_service import call_groq_llm

tax_bp = Blueprint('tax', __name__, url_prefix='/api/tax')

@tax_bp.route('/calculate', methods=['POST'])
@jwt_required()
def calculate_tax():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    gross_income = float(data.get('annual_income', 1200000.0))
    deductions = {
        '80c': float(data.get('deduction_80c', 150000.0)),
        '80d': float(data.get('deduction_80d', 25000.0)),
        'hra': float(data.get('hra_exemption', 0.0)),
        'other': float(data.get('other_deductions', 0.0))
    }

    result = calculate_income_tax_india(gross_income, deductions)

    # Save to user tax calculations history
    calc_record = TaxCalculation(
        user_id=user_id,
        financial_year=result['financial_year'],
        assessment_year=result['assessment_year'],
        gross_annual_income=gross_income,
        deduction_80c=deductions['80c'],
        deduction_80d=deductions['80d'],
        hra_exemption=deductions['hra'],
        other_deductions=deductions['other'],
        old_regime_tax=result['old_regime']['total_tax'],
        new_regime_tax=result['new_regime']['total_tax'],
        recommended_regime=result['recommended_regime'],
        tax_savings=result['tax_savings'],
        computation_breakdown=result
    )
    db.session.add(calc_record)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'result': result,
        'record_id': calc_record.id,
        'disclaimer': 'Tax calculation is an informational projection under the Finance Act 2024 provisions. Consult a qualified Chartered Accountant (CA) for official statutory filings.'
    }), 200

@tax_bp.route('/compare-regimes', methods=['POST'])
def compare_regimes():
    data = request.get_json() or {}
    gross_income = float(data.get('annual_income', 1000000.0))
    deductions = {
        '80c': float(data.get('deduction_80c', 150000.0)),
        '80d': float(data.get('deduction_80d', 25000.0)),
        'hra': float(data.get('hra_exemption', 0.0)),
        'other': float(data.get('other_deductions', 0.0))
    }
    result = calculate_income_tax_india(gross_income, deductions)
    return jsonify({'status': 'success', 'comparison': result}), 200

@tax_bp.route('/explain', methods=['POST'])
def explain_tax_query():
    data = request.get_json() or {}
    query = data.get('query', 'Which tax regime should I choose?')
    
    ai_prompt = [
        {"role": "system", "content": "You are a specialized Indian Income Tax AI assistant. Explain Indian tax law (Old vs New regime FY 24-25 / AY 25-26, Section 80C, 80D, standard deduction) clearly and practically. Keep explanations under 4 sentences."},
        {"role": "user", "content": query}
    ]
    resp = call_groq_llm(ai_prompt)
    return jsonify({
        'status': 'success',
        'response': resp.get('content', 'Tax explanation generated.'),
        'disclaimer': 'Educational tax advisory only.'
    }), 200
