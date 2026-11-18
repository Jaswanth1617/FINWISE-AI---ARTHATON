from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date, timedelta
from sqlalchemy import func
from app.extensions import db
from app.models.transaction import Transaction, FinancialAccount
from app.models.budget import Budget, BudgetCategory
from app.models.loan import LoanRecord
from app.services.ai_service import call_groq_llm

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_dashboard_summary():
    user_id = get_jwt_identity()
    time_filter = request.args.get('filter', 'month') # today, week, month, last_month, all

    today = date.today()
    query = Transaction.query.filter_by(user_id=user_id)

    if time_filter == 'today':
        query = query.filter(Transaction.transaction_date == today)
    elif time_filter == 'week':
        start_week = today - timedelta(days=today.weekday())
        query = query.filter(Transaction.transaction_date >= start_week)
    elif time_filter == 'month':
        start_month = date(today.year, today.month, 1)
        query = query.filter(Transaction.transaction_date >= start_month)
    elif time_filter == 'last_month':
        first_this = date(today.year, today.month, 1)
        last_prev = first_this - timedelta(days=1)
        first_prev = date(last_prev.year, last_prev.month, 1)
        query = query.filter(Transaction.transaction_date >= first_prev, Transaction.transaction_date <= last_prev)

    txs = query.order_by(Transaction.transaction_date.desc()).all()

    total_income = sum(float(t.amount) for t in txs if t.transaction_type == 'CREDIT')
    total_expenses = sum(float(t.amount) for t in txs if t.transaction_type == 'DEBIT')
    monthly_savings = max(0.0, total_income - total_expenses)
    suspicious_count = sum(1 for t in txs if t.is_suspicious)

    # Calculate actual balance across user accounts
    accounts = FinancialAccount.query.filter_by(user_id=user_id).all()
    total_balance = sum(float(a.current_balance) for a in accounts) if accounts else (total_income - total_expenses)

    # Budget utilization
    current_budget = Budget.query.filter_by(user_id=user_id, month=today.month, year=today.year).first()
    budget_total = float(current_budget.total_budgeted) if current_budget else 0.0
    budget_utilized_percent = round((total_expenses / budget_total * 100), 1) if budget_total > 0 else 0.0

    # Financial health score (0-100)
    health_score = 100
    if total_income > 0:
        savings_ratio = (monthly_savings / total_income) * 100
        if savings_ratio < 20:
            health_score -= 20
        elif savings_ratio >= 30:
            health_score += 5
    if suspicious_count > 0:
        health_score -= min(30, suspicious_count * 15)
    if budget_utilized_percent > 90:
        health_score -= 25
    health_score = max(10, min(100, health_score))

    health_status = 'Excellent' if health_score >= 80 else 'Good' if health_score >= 60 else 'Needs Attention'

    # Category distribution
    category_totals = {}
    for t in txs:
        if t.transaction_type == 'DEBIT':
            cat = t.category or 'Other'
            category_totals[cat] = category_totals.get(cat, 0.0) + float(t.amount)

    category_distribution = [{'category': k, 'amount': round(v, 2)} for k, v in category_totals.items()]
    category_distribution.sort(key=lambda x: x['amount'], reverse=True)

    # Upcoming EMIs
    loans = LoanRecord.query.filter_by(user_id=user_id).all()
    upcoming_emis = [{
        'loan_name': l.loan_name,
        'monthly_emi': float(l.calculated_emi),
        'loan_type': l.loan_type
    } for l in loans]

    # Recent transactions
    recent_txs = [t.to_dict() for t in txs[:8]]

    # AI insight generation
    ai_prompt = [
        {"role": "system", "content": "You are a concise fintech analytics engine. Generate exactly two bulleted actionable insights based on these financial stats."},
        {"role": "user", "content": f"Income: ₹{total_income}, Expenses: ₹{total_expenses}, Savings: ₹{monthly_savings}, Suspicious Count: {suspicious_count}, Top Expenses: {category_distribution[:3]}"}
    ]
    ai_insights = call_groq_llm(ai_prompt)

    return jsonify({
        'status': 'success',
        'filter': time_filter,
        'summary': {
            'total_income': round(total_income, 2),
            'total_expenses': round(total_expenses, 2),
            'current_balance': round(total_balance, 2),
            'monthly_savings': round(monthly_savings, 2),
            'budget_utilized_percent': budget_utilized_percent,
            'suspicious_transaction_count': suspicious_count,
            'health_score': health_score,
            'health_status': health_status,
            'transaction_count': len(txs)
        },
        'category_distribution': category_distribution,
        'recent_transactions': recent_txs,
        'upcoming_emis': upcoming_emis,
        'ai_insights': ai_insights.get('content', 'Financial health scan completed.')
    }), 200

@dashboard_bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_dashboard_analytics():
    user_id = get_jwt_identity()
    
    # 6-month historical trend
    today = date.today()
    monthly_trends = []

    for i in range(5, -1, -1):
        target_month_date = today - timedelta(days=i * 30)
        m = target_month_date.month
        y = target_month_date.year
        month_label = target_month_date.strftime("%b %Y")

        txs = Transaction.query.filter(
            Transaction.user_id == user_id,
            func.extract('month', Transaction.transaction_date) == m,
            func.extract('year', Transaction.transaction_date) == y
        ).all()

        inc = sum(float(t.amount) for t in txs if t.transaction_type == 'CREDIT')
        exp = sum(float(t.amount) for t in txs if t.transaction_type == 'DEBIT')
        monthly_trends.append({
            'month': month_label,
            'income': round(inc, 2),
            'expenses': round(exp, 2),
            'savings': round(max(0.0, inc - exp), 2)
        })

    return jsonify({
        'status': 'success',
        'monthly_trends': monthly_trends
    }), 200
