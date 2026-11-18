from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
from app.extensions import db
from app.models.report import ChatbotConversation, ChatbotMessage
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.loan import LoanRecord
from app.services.ai_service import call_groq_llm, redact_sensitive_info

assistant_bp = Blueprint('assistant', __name__, url_prefix='/api/assistant')

@assistant_bp.route('/chat', methods=['POST'])
@jwt_required()
def chat_with_assistant():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    user_query = data.get('message', '').strip()
    conversation_id = data.get('conversation_id')

    if not user_query:
        return jsonify({'status': 'error', 'message': 'Message cannot be empty.'}), 400

    # Retrieve or create conversation
    conv = None
    if conversation_id:
        conv = ChatbotConversation.query.filter_by(id=conversation_id, user_id=user_id).first()
    if not conv:
        conv = ChatbotConversation(user_id=user_id, title=user_query[:50])
        db.session.add(conv)
        db.session.flush()

    # Save user message
    user_msg_record = ChatbotMessage(
        conversation_id=conv.id,
        role='user',
        content=redact_sensitive_info(user_query)
    )
    db.session.add(user_msg_record)

    # Context retrieval from authenticated user's records ONLY
    recent_txs = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.transaction_date.desc()).limit(10).all()
    tx_context = [f"{t.transaction_date}: {t.description} ({t.category}) = ₹{t.amount} [{t.transaction_type}]" for t in recent_txs]
    
    current_budget = Budget.query.filter_by(user_id=user_id).order_by(Budget.year.desc(), Budget.month.desc()).first()
    budget_context = f"Monthly Budget: ₹{current_budget.total_budgeted}, Target Savings: ₹{current_budget.savings_target}" if current_budget else "No active budget set."
    
    loans = LoanRecord.query.filter_by(user_id=user_id).all()
    loan_context = [f"{l.loan_name}: Principal ₹{l.principal_amount}, EMI ₹{l.calculated_emi}" for l in loans]

    system_prompt = f"""You are FINWISE Assistant, a secure, empathetic, and highly analytical AI financial copilot.
You have access ONLY to the authenticated user's verified financial context:
- Recent Transactions: {'; '.join(tx_context) if tx_context else 'None'}
- Budgeting Context: {budget_context}
- Active Loans: {'; '.join(loan_context) if loan_context else 'None'}

Rules:
1. Answer questions accurately based on this financial context.
2. If asked about spending, cite specific categories and amounts from their data.
3. If they ask about an EMI affordability, check their expenses and warn if total EMI exceeds 40% of income.
4. Never reveal banking passwords, OTPs, or assume unverified data.
5. Keep explanations direct, concise, and helpful."""

    # Build prompt history
    past_messages = ChatbotMessage.query.filter_by(conversation_id=conv.id).order_by(ChatbotMessage.created_at.asc()).limit(6).all()
    groq_messages = [{"role": "system", "content": system_prompt}]
    for m in past_messages:
        groq_messages.append({"role": m.role, "content": m.content})

    ai_result = call_groq_llm(groq_messages)
    assistant_reply = ai_result.get('content', "I have reviewed your financial accounts and am ready to assist with budget analysis or transaction questions.")

    # Save assistant message
    asst_msg_record = ChatbotMessage(
        conversation_id=conv.id,
        role='assistant',
        content=assistant_reply,
        sources_used=['transactions', 'budgets', 'loans']
    )
    db.session.add(asst_msg_record)
    conv.updated_at = datetime.utcnow()
    db.session.commit()

    return jsonify({
        'status': 'success',
        'conversation_id': conv.id,
        'message': asst_msg_record.to_dict(),
        'source': ai_result.get('source')
    }), 200

@assistant_bp.route('/history', methods=['GET'])
@jwt_required()
def get_conversations():
    user_id = get_jwt_identity()
    convs = ChatbotConversation.query.filter_by(user_id=user_id).order_by(ChatbotConversation.updated_at.desc()).all()
    return jsonify({
        'status': 'success',
        'conversations': [c.to_dict() for c in convs]
    }), 200
