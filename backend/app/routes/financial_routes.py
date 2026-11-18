import os
import uuid
from pathlib import Path
from werkzeug.utils import secure_filename
from flask import Blueprint, request, jsonify, current_app, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app.extensions import db
from app.models.transaction import Transaction, UploadedDocument, FinancialAccount
from app.services.document_service import parse_pdf_statement, parse_csv_file, parse_excel_file
from app.services.fraud_service import detect_transaction_anomalies
from app.utils.security import log_audit_event
from app.utils.validators import parse_flexible_date

financial_bp = Blueprint('financial', __name__, url_prefix='/api/financial')

@financial_bp.route('/sample-statements', methods=['GET'])
def get_sample_statements():
    """
    Returns available authentic sample statements for 1-click evaluation.
    """
    samples = [
        {
            'id': 'synthetic_12_month_statement.csv',
            'title': '12-Month Comprehensive Bank Statement (Authentic Indian Transactions)',
            'description': '2,393 realistic transactions over 12 months with UPI, NEFT, IMPS, BBPS utility, Groceries (Blinkit, D-Mart, Zepto), Dining (Swiggy, Zomato), Salary, Rent & SIP investments.',
            'format': 'CSV',
            'file_name': 'synthetic_12_month_statement.csv',
            'source': 'personal-finance-intelligence research benchmark'
        },
        {
            'id': 'synthetic_12_month_statement.pdf',
            'title': '12-Month Multi-Page Bank Statement (PDF)',
            'description': 'Multi-page formatted bank statement with running balance and transaction narrations.',
            'format': 'PDF',
            'file_name': 'synthetic_12_month_statement.pdf',
            'source': 'personal-finance-intelligence research benchmark'
        },
        {
            'id': 'sample_bank_statement.csv',
            'title': 'Standard Retail Account Statement',
            'description': 'Clean baseline account statement containing typical salary, grocery, utility, and transfer entries.',
            'format': 'CSV',
            'file_name': 'sample_bank_statement.csv',
            'source': 'FinWise Retail Standard'
        },
        {
            'id': 'bank_a_user_001.csv',
            'title': 'Salary & Household Expense Account (Bank A)',
            'description': 'Multi-month active household checking account with recurring utility and UPI payments.',
            'format': 'CSV',
            'file_name': 'bank_a_user_001.csv',
            'source': 'Multi-Bank Evaluation Dataset'
        }
    ]
    return jsonify({'status': 'success', 'samples': samples}), 200

@financial_bp.route('/load-sample', methods=['POST'])
@jwt_required()
def load_sample_statement():
    """
    Loads and parses an authentic sample statement directly into the user's account.
    """
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    sample_id = data.get('sample_id', 'synthetic_12_month_statement.csv')
    
    allowed_samples = {
        'synthetic_12_month_statement.csv',
        'synthetic_12_month_statement.pdf',
        'sample_bank_statement.csv',
        'sample_bank_statement.pdf',
        'bank_a_user_001.csv',
        'bank_b_user_001.csv',
        'bank_c_user_001.csv'
    }
    
    if sample_id not in allowed_samples:
        return jsonify({'status': 'error', 'message': f'Invalid sample ID {sample_id}'}), 400
        
    base_dir = Path(__file__).resolve().parents[3]
    sample_path = base_dir / 'docs' / 'sample_data' / sample_id
    if not sample_path.exists():
        sample_path = Path('docs/sample_data') / sample_id
        
    if not sample_path.exists():
        return jsonify({'status': 'error', 'message': f'Sample file {sample_id} not found on server.'}), 404

    ext = sample_id.rsplit('.', 1)[-1].lower()

    # Create UploadedDocument
    doc = UploadedDocument(
        user_id=user_id,
        filename=f"SAMPLE_{sample_id}",
        original_filename=sample_id,
        file_type=ext,
        file_size_bytes=os.path.getsize(str(sample_path)),
        status='PROCESSING'
    )
    db.session.add(doc)
    db.session.flush()

    try:
        if ext == 'pdf':
            extracted_records = parse_pdf_statement(str(sample_path))
        else:
            extracted_records = parse_csv_file(str(sample_path))

        extracted_records = detect_transaction_anomalies(extracted_records)

        account = FinancialAccount.query.filter_by(user_id=user_id).first()
        acc_id = account.id if account else None

        saved_count = 0
        duplicate_count = 0

        # Load first 250 records by default or custom limit
        limit = data.get('limit', 250)
        records_to_process = extracted_records[:limit] if limit and limit > 0 else extracted_records

        for r in records_to_process:
            existing = Transaction.query.filter_by(
                user_id=user_id,
                transaction_date=r['transaction_date'],
                amount=r['amount'],
                description=r['description']
            ).first()

            if existing:
                duplicate_count += 1
                continue

            tx = Transaction(
                user_id=user_id,
                account_id=acc_id,
                document_id=doc.id,
                transaction_date=r['transaction_date'],
                description=r['description'],
                normalized_description=r.get('normalized_description'),
                transaction_type=r['transaction_type'],
                amount=r['amount'],
                balance_after=r.get('balance_after'),
                category=r.get('category', 'Other'),
                is_suspicious=r.get('is_suspicious', False),
                suspicion_reason=r.get('suspicion_reason'),
                is_duplicate=r.get('is_duplicate', False),
                is_demo=False
            )
            db.session.add(tx)
            saved_count += 1

        doc.status = 'PROCESSED'
        doc.records_extracted = saved_count
        db.session.commit()

        log_audit_event(user_id, 'STATEMENT_SAMPLE_LOADED', 'UploadedDocument', doc.id, f"Loaded {saved_count} records from sample {sample_id}")

        return jsonify({
            'status': 'success',
            'message': f"Successfully parsed and loaded {saved_count} records from {sample_id} ({duplicate_count} duplicates skipped).",
            'document': doc.to_dict(),
            'records_extracted': saved_count,
            'duplicates_skipped': duplicate_count,
            'total_in_sample': len(extracted_records)
        }), 201

    except Exception as e:
        db.session.rollback()
        doc.status = 'FAILED'
        doc.error_message = str(e)
        db.session.commit()
        return jsonify({'status': 'error', 'message': f"Extraction error: {str(e)}"}), 500

@financial_bp.route('/download-sample/<filename>', methods=['GET'])
def download_sample_file(filename):
    allowed_samples = {
        'synthetic_12_month_statement.csv',
        'synthetic_12_month_statement.pdf',
        'sample_bank_statement.csv',
        'sample_bank_statement.pdf',
        'bank_a_user_001.csv',
        'bank_b_user_001.csv',
        'bank_c_user_001.csv'
    }
    if filename not in allowed_samples:
        return jsonify({'status': 'error', 'message': 'File not found'}), 404
        
    base_dir = Path(__file__).resolve().parents[3]
    file_path = base_dir / 'docs' / 'sample_data' / filename
    if not file_path.exists():
        file_path = Path('docs/sample_data') / filename
    if not file_path.exists():
        return jsonify({'status': 'error', 'message': 'File not found on server'}), 404
        
    return send_file(str(file_path), as_attachment=True, download_name=filename)


@financial_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_statement():
    user_id = get_jwt_identity()

    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': 'No file part in request.'}), 400

    file = request.files['file']
    if not file or file.filename == '':
        return jsonify({'status': 'error', 'message': 'No file selected.'}), 400

    orig_filename = secure_filename(file.filename)
    ext = orig_filename.rsplit('.', 1)[-1].lower() if '.' in orig_filename else ''
    
    if ext not in {'pdf', 'csv', 'xlsx', 'xls'}:
        return jsonify({'status': 'error', 'message': f'Unsupported file type .{ext}. Allowed: PDF, CSV, XLSX'}), 400

    upload_folder = current_app.config['UPLOAD_FOLDER']
    os.makedirs(upload_folder, exist_ok=True)
    
    unique_filename = f"{uuid.uuid4()}_{orig_filename}"
    file_path = os.path.join(upload_folder, unique_filename)
    file.save(file_path)
    file_size = os.path.getsize(file_path)

    # Record document
    doc = UploadedDocument(
        user_id=user_id,
        filename=unique_filename,
        original_filename=orig_filename,
        file_type=ext,
        file_size_bytes=file_size,
        status='PROCESSING'
    )
    db.session.add(doc)
    db.session.flush()

    try:
        # Extract transactions
        if ext == 'pdf':
            extracted_records = parse_pdf_statement(file_path)
        elif ext == 'csv':
            extracted_records = parse_csv_file(file_path)
        else:
            extracted_records = parse_excel_file(file_path)

        # Anomaly detection & duplicate check
        extracted_records = detect_transaction_anomalies(extracted_records)

        # Get default account
        account = FinancialAccount.query.filter_by(user_id=user_id).first()
        acc_id = account.id if account else None

        saved_count = 0
        duplicate_count = 0

        for r in extracted_records:
            # Check duplicate against existing database records
            existing = Transaction.query.filter_by(
                user_id=user_id,
                transaction_date=r['transaction_date'],
                amount=r['amount'],
                description=r['description']
            ).first()

            if existing:
                duplicate_count += 1
                continue

            tx = Transaction(
                user_id=user_id,
                account_id=acc_id,
                document_id=doc.id,
                transaction_date=r['transaction_date'],
                description=r['description'],
                normalized_description=r.get('normalized_description'),
                transaction_type=r['transaction_type'],
                amount=r['amount'],
                balance_after=r.get('balance_after'),
                category=r.get('category', 'Other'),
                is_suspicious=r.get('is_suspicious', False),
                suspicion_reason=r.get('suspicion_reason'),
                is_duplicate=r.get('is_duplicate', False),
                is_demo=False
            )
            db.session.add(tx)
            saved_count += 1

        doc.status = 'PROCESSED'
        doc.records_extracted = saved_count
        db.session.commit()

        log_audit_event(user_id, 'STATEMENT_UPLOADED', 'UploadedDocument', doc.id, f"Extracted: {saved_count}, Duplicates Skipped: {duplicate_count}")

        return jsonify({
            'status': 'success',
            'message': f"Processed {orig_filename}: extracted {saved_count} records ({duplicate_count} duplicates skipped).",
            'document': doc.to_dict(),
            'records_extracted': saved_count,
            'duplicates_skipped': duplicate_count
        }), 201

    except Exception as e:
        db.session.rollback()
        doc.status = 'FAILED'
        doc.error_message = str(e)
        db.session.commit()
        return jsonify({'status': 'error', 'message': f"Extraction error: {str(e)}"}), 500

@financial_bp.route('/transactions', methods=['GET', 'POST'])
@jwt_required()
def handle_transactions():
    user_id = get_jwt_identity()

    if request.method == 'POST':
        data = request.get_json() or {}
        tx_date = parse_flexible_date(data.get('transaction_date')) or date.today()
        desc = data.get('description', '').strip()
        amt = float(data.get('amount', 0.0))
        tx_type = data.get('transaction_type', 'DEBIT').upper()
        category = data.get('category', 'Other')

        if not desc or amt <= 0:
            return jsonify({'status': 'error', 'message': 'Valid description and positive amount required.'}), 400

        tx = Transaction(
            user_id=user_id,
            transaction_date=tx_date,
            description=desc,
            normalized_description=desc,
            transaction_type=tx_type,
            amount=amt,
            category=category,
            is_demo=False
        )
        db.session.add(tx)
        db.session.commit()
        return jsonify({'status': 'success', 'transaction': tx.to_dict()}), 201

    # GET query with search, filter, and pagination
    category = request.args.get('category')
    search = request.args.get('search')
    tx_type = request.args.get('type')
    suspicious_only = request.args.get('suspicious') == 'true'
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 50))

    query = Transaction.query.filter_by(user_id=user_id)

    if category and category != 'All':
        query = query.filter_by(category=category)
    if tx_type and tx_type in ['DEBIT', 'CREDIT']:
        query = query.filter_by(transaction_type=tx_type)
    if suspicious_only:
        query = query.filter_by(is_suspicious=True)
    if search:
        query = query.filter(Transaction.description.ilike(f"%{search.strip()}%"))

    total_count = query.count()
    txs = query.order_by(Transaction.transaction_date.desc()).offset((page - 1) * per_page).limit(per_page).all()

    return jsonify({
        'status': 'success',
        'total': total_count,
        'page': page,
        'per_page': per_page,
        'transactions': [t.to_dict() for t in txs]
    }), 200

@financial_bp.route('/transactions/<string:tx_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def mutate_transaction(tx_id):
    user_id = get_jwt_identity()
    tx = Transaction.query.filter_by(id=tx_id, user_id=user_id).first()
    if not tx:
        return jsonify({'status': 'error', 'message': 'Transaction not found.'}), 404

    if request.method == 'DELETE':
        db.session.delete(tx)
        db.session.commit()
        return jsonify({'status': 'success', 'message': 'Transaction deleted.'}), 200

    # PUT
    data = request.get_json() or {}
    if 'category' in data:
        tx.category = data['category']
    if 'description' in data:
        tx.description = data['description']
    if 'amount' in data:
        tx.amount = float(data['amount'])
    if 'transaction_type' in data:
        tx.transaction_type = data['transaction_type']
    if 'is_suspicious' in data:
        tx.is_suspicious = bool(data['is_suspicious'])
    if 'suspicion_reason' in data:
        tx.suspicion_reason = data['suspicion_reason']

    db.session.commit()
    return jsonify({'status': 'success', 'transaction': tx.to_dict()}), 200

@financial_bp.route('/analysis', methods=['GET'])
@jwt_required()
def get_financial_analysis():
    user_id = get_jwt_identity()
    txs = Transaction.query.filter_by(user_id=user_id).all()

    total_txs = len(txs)
    total_debits = sum(float(t.amount) for t in txs if t.transaction_type == 'DEBIT')
    total_credits = sum(float(t.amount) for t in txs if t.transaction_type == 'CREDIT')
    
    cat_counts = {}
    for t in txs:
        cat_counts[t.category] = cat_counts.get(t.category, 0) + 1

    largest_debits = [t.to_dict() for t in sorted([t for t in txs if t.transaction_type == 'DEBIT'], key=lambda x: x.amount, reverse=True)[:5]]

    return jsonify({
        'status': 'success',
        'metrics': {
            'total_transactions': total_txs,
            'total_inflow': round(total_credits, 2),
            'total_outflow': round(total_debits, 2),
            'net_cashflow': round(total_credits - total_debits, 2),
            'category_counts': cat_counts,
            'largest_debits': largest_debits
        }
    }), 200
