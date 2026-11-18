from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import date
from app.extensions import db
from app.models.investment import InvestmentPortfolio, InvestmentAsset
from app.utils.calculations import calculate_sip, calculate_fd

investment_bp = Blueprint('investment', __name__, url_prefix='/api/investments')

@investment_bp.route('/portfolio', methods=['GET', 'POST'])
@jwt_required()
def handle_portfolio():
    user_id = get_jwt_identity()

    if request.method == 'POST':
        data = request.get_json() or {}
        p_name = data.get('portfolio_name', 'My Core Portfolio')
        risk = data.get('risk_level', 'Moderate')
        assets = data.get('assets', [])

        portfolio = InvestmentPortfolio.query.filter_by(user_id=user_id, portfolio_name=p_name).first()
        if not portfolio:
            portfolio = InvestmentPortfolio(
                user_id=user_id,
                portfolio_name=p_name,
                risk_level=risk,
                notes=data.get('notes', '')
            )
            db.session.add(portfolio)
            db.session.flush()
        else:
            InvestmentAsset.query.filter_by(portfolio_id=portfolio.id).delete()

        tot_invested = 0.0
        tot_curr = 0.0

        for a in assets:
            aname = a.get('asset_name', 'Asset')
            atype = a.get('asset_type', 'Mutual Fund')
            inv_amt = float(a.get('invested_amount', 0.0))
            curr_val = float(a.get('current_market_value', inv_amt))
            cagr = float(a.get('expected_cagr', 12.0))

            if inv_amt > 0:
                asset = InvestmentAsset(
                    portfolio_id=portfolio.id,
                    asset_name=aname,
                    asset_type=atype,
                    invested_amount=inv_amt,
                    current_market_value=curr_val,
                    expected_cagr=cagr
                )
                db.session.add(asset)
                tot_invested += inv_amt
                tot_curr += curr_val

        portfolio.total_invested = tot_invested
        portfolio.current_value = tot_curr
        db.session.commit()

        return jsonify({'status': 'success', 'portfolio': portfolio.to_dict()}), 201

    # GET
    portfolios = InvestmentPortfolio.query.filter_by(user_id=user_id).all()
    
    # If no portfolio exists, seed a realistic default portfolio for instant demonstration
    if not portfolios:
        default_p = InvestmentPortfolio(
            user_id=user_id,
            portfolio_name="Wealth Builder Core",
            risk_level="Moderate",
            total_invested=250000.0,
            current_value=284500.0
        )
        db.session.add(default_p)
        db.session.flush()

        default_assets = [
            ("Nifty 50 Index Fund", "Index Fund", 100000.0, 115000.0, 13.5),
            ("Parag Parikh Flexi Cap Fund", "Mutual Fund", 75000.0, 86500.0, 15.2),
            ("HDFC Bank Fixed Deposit", "Fixed Deposit", 50000.0, 53500.0, 7.1),
            ("Sovereign Gold Bond (SGB)", "Gold", 25000.0, 29500.0, 10.5)
        ]
        for name, atype, inv, curr, cagr in default_assets:
            db.session.add(InvestmentAsset(
                portfolio_id=default_p.id,
                asset_name=name,
                asset_type=atype,
                invested_amount=inv,
                current_market_value=curr,
                expected_cagr=cagr
            ))
        db.session.commit()
        portfolios = [default_p]

    return jsonify({
        'status': 'success',
        'portfolios': [p.to_dict() for p in portfolios]
    }), 200

@investment_bp.route('/sip', methods=['POST'])
def calculate_sip_route():
    data = request.get_json() or {}
    monthly = float(data.get('monthly_investment', 5000.0))
    cagr = float(data.get('expected_cagr', 12.0))
    years = int(data.get('tenure_years', 10))

    result = calculate_sip(monthly, cagr, years)
    return jsonify({'status': 'success', 'calculation': result}), 200

@investment_bp.route('/fd', methods=['POST'])
def calculate_fd_route():
    data = request.get_json() or {}
    principal = float(data.get('principal', 100000.0))
    rate = float(data.get('annual_rate', 7.25))
    years = float(data.get('tenure_years', 3))

    result = calculate_fd(principal, rate, years)
    return jsonify({'status': 'success', 'calculation': result}), 200

@investment_bp.route('/analyse', methods=['POST'])
@jwt_required()
def analyse_portfolio():
    user_id = get_jwt_identity()
    portfolios = InvestmentPortfolio.query.filter_by(user_id=user_id).all()
    if not portfolios:
        return jsonify({'status': 'error', 'message': 'No portfolio found.'}), 404

    portfolio = portfolios[0]
    total_inv = float(portfolio.total_invested or 0.0)
    curr_val = float(portfolio.current_value or total_inv)
    total_gain = curr_val - total_inv
    roi_percent = round((total_gain / total_inv * 100), 2) if total_inv > 0 else 0.0

    # Asset allocation breakdown
    allocation = {}
    for a in portfolio.assets:
        atype = a.asset_type
        allocation[atype] = allocation.get(atype, 0.0) + float(a.current_market_value)

    alloc_breakdown = [{'asset_type': k, 'value': round(v, 2), 'percentage': round((v / curr_val * 100), 1) if curr_val > 0 else 0} for k, v in allocation.items()]

    return jsonify({
        'status': 'success',
        'metrics': {
            'total_invested': round(total_inv, 2),
            'current_value': round(curr_val, 2),
            'total_wealth_gain': round(total_gain, 2),
            'roi_percent': roi_percent,
            'asset_allocation': alloc_breakdown
        },
        'educational_note': 'Index funds track a market index with low expense ratios. Diversifying across large-cap index funds and fixed income dampens portfolio volatility.'
    }), 200
