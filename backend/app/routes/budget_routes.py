from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from sqlalchemy import func
from app.extensions import db
from app.models.budget import Budget, BudgetCategory
from app.models.transaction import Transaction
from app.services.ai_service import call_groq_llm

budget_bp = Blueprint('budget', __name__, url_prefix='/api/budgets')

@budget_bp.route('', methods=['GET', 'POST'])
@jwt_required()
def handle_budgets():
    user_id = get_jwt_identity()

    if request.method == 'POST':
        data = request.get_json() or {}
        month = int(data.get('month', date.today().month))
        year = int(data.get('year', date.today().year))
        total_income = float(data.get('total_income', 0.0))
        savings_target = float(data.get('savings_target', 0.0))
        categories = data.get('categories', [])

        # Check existing
        budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
        if not budget:
            budget = Budget(
                user_id=user_id,
                month=month,
                year=year,
                total_income=total_income,
                savings_target=savings_target,
                notes=data.get('notes', '')
            )
            db.session.add(budget)
            db.session.flush()
        else:
            budget.total_income = total_income
            budget.savings_target = savings_target
            budget.notes = data.get('notes', budget.notes)
            # Remove old categories to replace
            BudgetCategory.query.filter_by(budget_id=budget.id).delete()

        total_budgeted = 0.0
        for cat in categories:
            cname = cat.get('category_name')
            alloc = float(cat.get('allocated_amount', 0.0))
            thresh = int(cat.get('alert_threshold_percent', 80))
            if cname and alloc > 0:
                bcat = BudgetCategory(budget_id=budget.id, category_name=cname, allocated_amount=alloc, alert_threshold_percent=thresh)
                db.session.add(bcat)
                total_budgeted += alloc

        budget.total_budgeted = total_budgeted
        db.session.commit()
        return jsonify({'status': 'success', 'budget': budget.to_dict()}), 201

    # GET
    budgets = Budget.query.filter_by(user_id=user_id).order_by(Budget.year.desc(), Budget.month.desc()).all()
    return jsonify({
        'status': 'success',
        'budgets': [b.to_dict() for b in budgets]
    }), 200

@budget_bp.route('/<string:budget_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def mutate_budget(budget_id):
    user_id = get_jwt_identity()
    budget = Budget.query.filter_by(id=budget_id, user_id=user_id).first()
    if not budget:
        return jsonify({'status': 'error', 'message': 'Budget not found.'}), 404

    if request.method == 'DELETE':
        db.session.delete(budget)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Budget deleted.'}), 200

    data = request.get_json() or {}
    if 'total_income' in data:
        budget.total_income = float(data['total_income'])
    if 'savings_target' in data:
        budget.savings_target = float(data['savings_target'])
    if 'notes' in data:
        budget.notes = data['notes']

    db.session.commit()
    return jsonify({'status': 'success', 'budget': budget.to_dict()}), 200

@budget_bp.route('/insights', methods=['GET'])
@jwt_required()
def get_budget_insights():
    user_id = get_jwt_identity()
    today = date.today()
    month = int(request.args.get('month', today.month))
    year = int(request.args.get('year', today.year))

    budget = Budget.query.filter_by(user_id=user_id, month=month, year=year).first()
    
    # Calculate actual spending per category for this month
    txs = Transaction.query.filter(
        Transaction.user_id == user_id,
        Transaction.transaction_type == 'DEBIT',
        func.extract('month', Transaction.transaction_date) == month,
        func.extract('year', Transaction.transaction_date) == year
    ).all()

    actual_by_cat = {}
    total_spent = 0.0
    for t in txs:
        c = t.category or 'Other'
        actual_by_cat[c] = actual_by_cat.get(c, 0.0) + float(t.amount)
        total_spent += float(t.amount)

    category_reports = []
    alerts = []

    if budget and budget.categories:
        for bcat in budget.categories:
            cname = bcat.category_name
            alloc = float(bcat.allocated_amount)
            spent = round(actual_by_cat.get(cname, 0.0), 2)
            remaining = round(alloc - spent, 2)
            consumed_pct = round((spent / alloc * 100), 1) if alloc > 0 else 0.0

            if consumed_pct >= bcat.alert_threshold_percent:
                alerts.append(f"Alert: You have consumed {consumed_pct}% of your {cname} budget (₹{spent:,.2f} of ₹{alloc:,.2f}).")

            category_reports.append({
                'category_name': cname,
                'allocated': alloc,
                'spent': spent,
                'remaining': remaining,
                'consumed_percent': consumed_pct
            })

    # AI spending forecast & advice
    days_in_month = 30
    days_elapsed = min(today.day, days_in_month)
    days_remaining = max(1, days_in_month - days_elapsed)
    daily_run_rate = total_spent / days_elapsed if days_elapsed > 0 else 0.0
    projected_spend = round(total_spent + (daily_run_rate * days_remaining), 2)

    ai_prompt = [
        {"role": "system", "content": "You are an intelligent personal finance budgeting advisor. Provide 2 concise sentences of insight."},
        {"role": "user", "content": f"Budget: ₹{budget.total_budgeted if budget else 0}, Spent to date: ₹{total_spent}, Projected: ₹{projected_spend}, Alerts: {alerts}"}
    ]
    ai_insights = call_groq_llm(ai_prompt)

    return jsonify({
        'status': 'success',
        'month': month,
        'year': year,
        'summary': {
            'budgeted': float(budget.total_budgeted) if budget else 0.0,
            'spent': round(total_spent, 2),
            'remaining': round((float(budget.total_budgeted) if budget else 0.0) - total_spent, 2),
            'projected_monthly_spend': projected_spend,
            'days_remaining': days_remaining
        },
        'categories': category_reports,
        'alerts': alerts,
        'ai_insight': ai_insights.get('content', 'Budget tracking active.')
    }), 200
