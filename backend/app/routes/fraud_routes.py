import json
from pathlib import Path
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models.fraud import FraudAnalysis, SuspiciousMessage
from app.models.transaction import Transaction
from app.services.fraud_service import analyze_message_risk, analyze_url_risk
from app.utils.security import log_audit_event

fraud_bp = Blueprint('fraud', __name__, url_prefix='/api/fraud')

@fraud_bp.route('/benchmark-samples', methods=['GET'])
def get_benchmark_samples():
    """
    Returns authentic benchmark smishing samples derived from research datasets
    (84,863 labeled smishing corpus + Indian UPI / banking threat patterns).
    """
    try:
        base_dir = Path(__file__).resolve().parents[3]
        sample_path = base_dir / 'docs' / 'sample_data' / 'smishing_benchmark.json'
        if not sample_path.exists():
            sample_path = Path('docs/sample_data/smishing_benchmark.json').resolve()
        
        if sample_path.exists():
            with open(sample_path, 'r', encoding='utf-8') as f:
                samples = json.load(f)
            return jsonify({'status': 'success', 'samples': samples}), 200
        return jsonify({'status': 'success', 'samples': []}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@fraud_bp.route('/analyse-message', methods=['POST'])
@jwt_required()
def analyse_message():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    message_text = data.get('message', '').strip()
    channel = data.get('channel', 'SMS')

    if not message_text:
        return jsonify({'status': 'error', 'message': 'Message text is required.'}), 400

    result = analyze_message_risk(message_text)

    # Save analysis in database
    analysis = FraudAnalysis(
        user_id=user_id,
        analysis_type='MESSAGE',
        target_input=message_text[:300], # Redacted preview
        risk_score=result['risk_score'],
        risk_category=result['risk_category'],
        indicators=result['indicators'],
        ai_explanation=result['explanation'],
        recommendation=result['recommendation']
    )
    db.session.add(analysis)
    db.session.flush()

    msg_record = SuspiciousMessage(
        user_id=user_id,
        sender_identifier=data.get('sender', 'Unknown Sender'),
        message_content=message_text,
        channel=channel,
        analysis_id=analysis.id
    )
    db.session.add(msg_record)
    db.session.commit()

    log_audit_event(user_id, 'FRAUD_ANALYSIS_MESSAGE', 'FraudAnalysis', analysis.id, f"Risk: {result['risk_category']}")

    return jsonify({
        'status': 'success',
        'analysis': analysis.to_dict(),
        'result': result
    }), 200

@fraud_bp.route('/analyse-url', methods=['POST'])
@jwt_required()
def analyse_url():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    url = data.get('url', '').strip()

    if not url:
        return jsonify({'status': 'error', 'message': 'URL string is required.'}), 400

    result = analyze_url_risk(url)

    analysis = FraudAnalysis(
        user_id=user_id,
        analysis_type='URL',
        target_input=url,
        risk_score=result['risk_score'],
        risk_category=result['risk_category'],
        indicators=result['indicators'],
        recommendation=result['recommendation']
    )
    db.session.add(analysis)
    db.session.commit()

    log_audit_event(user_id, 'FRAUD_ANALYSIS_URL', 'FraudAnalysis', analysis.id, f"Risk: {result['risk_category']}")

    return jsonify({
        'status': 'success',
        'analysis': analysis.to_dict(),
        'result': result
    }), 200

@fraud_bp.route('/analyse-transaction', methods=['POST'])
@jwt_required()
def analyse_transaction():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    tx_id = data.get('transaction_id')

    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()
    if not tx:
        return jsonify({'status': 'error', 'message': 'Transaction not found.'}), 404

    # Calculate risk score based on transaction flags
    risk_score = 80 if tx.is_suspicious else 10
    risk_cat = 'High' if tx.is_suspicious else 'Low'
    indicators = [tx.suspicion_reason] if tx.suspicion_reason else ['Regular transactional pattern within historical norms']

    analysis = FraudAnalysis(
        user_id=user_id,
        analysis_type='TRANSACTION',
        target_input=f"{tx.transaction_date} | {tx.description} | ₹{tx.amount}",
        risk_score=risk_score,
        risk_category=risk_cat,
        indicators=indicators,
        ai_explanation=f"Transaction evaluated against 30-day baseline. Debit amount: ₹{tx.amount:,.2f}.",
        recommendation="If you did not authorize this charge, temporarily lock your card and alert your issuing bank." if tx.is_suspicious else "No immediate action required."
    )
    db.session.add(analysis)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'analysis': analysis.to_dict()
    }), 200

@fraud_bp.route('/history', methods=['GET'])
@jwt_required()
def get_fraud_history():
    user_id = get_jwt_identity()
    records = FraudAnalysis.query.filter_by(user_id=user_id).order_by(FraudAnalysis.created_at.desc()).limit(30).all()
    return jsonify({
        'status': 'success',
        'history': [r.to_dict() for r in records]
    }), 200
