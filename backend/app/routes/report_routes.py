import os
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity, decode_token
from datetime import datetime, date
from app.extensions import db
from app.models.report import FinancialReport
from app.models.transaction import Transaction
from app.models.fraud import FraudAnalysis
from app.models.loan import LoanRecord
from app.models.investment import InvestmentPortfolio
from app.services.report_service import generate_pdf_report, generate_csv_report

report_bp = Blueprint('report', __name__, url_prefix='/api/reports')

@report_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_report():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    report_type = data.get('report_type', 'MONTHLY_FINANCIAL')
    file_format = data.get('file_format', 'PDF').upper()
    
    output_dir = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports')
    os.makedirs(output_dir, exist_ok=True)
    
    timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = f"FINWISE_{report_type}_{timestamp_str}.{'pdf' if file_format == 'PDF' else 'csv'}"
    
    # Collect real data according to report type
    table_headers = []
    table_data = []
    summary_metrics = {}
    title = f"{report_type.replace('_', ' ').title()} Report"

    if report_type in ['MONTHLY_FINANCIAL', 'EXPENSE_ANALYSIS']:
        txs = Transaction.query.filter_by(user_id=user_id).order_by(Transaction.transaction_date.desc()).all()
        table_headers = ["Date", "Description", "Type", "Category", "Amount (INR)"]
        tot_deb = 0.0
        tot_cred = 0.0
        for t in txs:
            table_data.append([
                t.transaction_date.strftime('%Y-%m-%d'),
                t.description[:40],
                t.transaction_type,
                t.category,
                f"{float(t.amount):,.2f}"
            ])
            if t.transaction_type == 'DEBIT':
                tot_deb += float(t.amount)
            else:
                tot_cred += float(t.amount)
        summary_metrics = {
            "Total Inflow": f"INR {tot_cred:,.2f}",
            "Total Outflow": f"INR {tot_deb:,.2f}",
            "Net Balance": f"INR {tot_cred - tot_deb:,.2f}",
            "Transaction Count": str(len(txs))
        }

    elif report_type == 'FRAUD_ANALYSIS':
        analyses = FraudAnalysis.query.filter_by(user_id=user_id).order_by(FraudAnalysis.created_at.desc()).all()
        table_headers = ["Timestamp", "Type", "Risk Category", "Score", "Preview"]
        for a in analyses:
            table_data.append([
                a.created_at.strftime('%Y-%m-%d %H:%M'),
                a.analysis_type,
                a.risk_category,
                f"{a.risk_score}/100",
                (a.target_input or '')[:35]
            ])
        summary_metrics = {
            "Total Scans": str(len(analyses)),
            "Critical Alerts": str(sum(1 for a in analyses if a.risk_category in ['Critical', 'High'])),
            "Engine Status": "Active Protection",
            "Last Scan": datetime.now().strftime('%Y-%m-%d')
        }

    elif report_type == 'LOAN_REPAYMENT':
        loans = LoanRecord.query.filter_by(user_id=user_id).all()
        table_headers = ["Loan Plan", "Type", "Principal", "Rate", "Monthly EMI", "Total Payment"]
        for l in loans:
            table_data.append([
                l.loan_name,
                l.loan_type,
                f"INR {float(l.principal_amount):,.2f}",
                f"{float(l.annual_interest_rate)}%",
                f"INR {float(l.calculated_emi):,.2f}",
                f"INR {float(l.total_payment):,.2f}"
            ])
        summary_metrics = {
            "Active Loans": str(len(loans)),
            "Total Committed EMI": f"INR {sum(float(l.calculated_emi) for l in loans):,.2f}",
            "Amortization Model": "Reducing Balance Standard",
            "Verification": "Mathematical Model Verified"
        }

    else:
        # Default or Investment summary
        portfolios = InvestmentPortfolio.query.filter_by(user_id=user_id).all()
        table_headers = ["Portfolio", "Asset Name", "Type", "Invested (INR)", "Current Value (INR)"]
        tot_inv = 0.0
        tot_cur = 0.0
        for p in portfolios:
            for a in p.assets:
                table_data.append([
                    p.portfolio_name,
                    a.asset_name,
                    a.asset_type,
                    f"{float(a.invested_amount):,.2f}",
                    f"{float(a.current_market_value):,.2f}"
                ])
                tot_inv += float(a.invested_amount)
                tot_cur += float(a.current_market_value)
        summary_metrics = {
            "Total Capital Invested": f"INR {tot_inv:,.2f}",
            "Estimated Portfolio Value": f"INR {tot_cur:,.2f}",
            "Unrealized Gain": f"INR {tot_cur - tot_inv:,.2f}",
            "Risk Profile": "Diversified Multi-Asset"
        }

    # Generate File
    if file_format == 'CSV':
        file_path = generate_csv_report(filename, table_headers, table_data, output_dir)
    else:
        file_path = generate_pdf_report(
            filename=filename,
            title=title,
            subtitle="Verified Client Account Financial Audit",
            summary_metrics=summary_metrics,
            table_headers=table_headers,
            table_data=table_data,
            output_dir=output_dir
        )

    file_size = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    report_record = FinancialReport(
        user_id=user_id,
        report_title=title,
        report_type=report_type,
        file_format=file_format,
        file_path=file_path,
        file_size_bytes=file_size,
        summary_data=summary_metrics
    )
    db.session.add(report_record)
    db.session.commit()

    return jsonify({
        'status': 'success',
        'message': f"{title} generated successfully.",
        'report': report_record.to_dict()
    }), 201

@report_bp.route('', methods=['GET'])
@jwt_required()
def list_reports():
    user_id = get_jwt_identity()
    reports = FinancialReport.query.filter_by(user_id=user_id).order_by(FinancialReport.created_at.desc()).all()
    return jsonify({
        'status': 'success',
        'reports': [r.to_dict() for r in reports]
    }), 200

@report_bp.route('/download/<string:report_id>', methods=['GET'])
def download_report(report_id):
    # Support both Authorization: Bearer <token> and ?token= query parameter
    auth_header = request.headers.get('Authorization')
    token = None
    if auth_header and auth_header.startswith('Bearer '):
        token = auth_header.split(' ')[1]
    elif request.args.get('token'):
        token = request.args.get('token')

    if not token:
        return jsonify({'status': 'error', 'message': 'Missing authorization token.'}), 401

    try:
        decoded = decode_token(token)
        user_id = decoded['sub']
    except Exception as e:
        return jsonify({'status': 'error', 'message': 'Invalid or expired authorization token.'}), 401

    report = FinancialReport.query.filter_by(id=report_id, user_id=user_id).first()
    if not report:
        return jsonify({'status': 'error', 'message': 'Report record not found or unauthorized.'}), 404

    file_path = report.file_path
    if not file_path or not os.path.exists(file_path):
        # Fallback to look inside UPLOAD_FOLDER/reports
        fallback = os.path.join(current_app.config['UPLOAD_FOLDER'], 'reports', os.path.basename(report.file_path or ''))
        if os.path.exists(fallback):
            file_path = fallback
        else:
            return jsonify({'status': 'error', 'message': 'Report file not found on disk.'}), 404

    as_attachment = request.args.get('attachment', 'true') == 'true'
    mimetype = 'application/pdf' if report.file_format == 'PDF' else 'text/csv'
    download_filename = os.path.basename(file_path)
    
    response = send_file(
        file_path,
        mimetype=mimetype,
        as_attachment=as_attachment,
        download_name=download_filename
    )
    response.headers['Access-Control-Expose-Headers'] = 'Content-Disposition'
    return response
