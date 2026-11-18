import os
from flask import Blueprint, request, jsonify, send_file
from app.services.dataset_service import (
    get_datasets_overview,
    query_smishing_dataset,
    query_scam_features_dataset,
    query_financial_dataset,
    get_data_dir
)
from app.services.fraud_service import analyze_message_risk

dataset_bp = Blueprint('datasets', __name__, url_prefix='/api/datasets')

@dataset_bp.route('/overview', methods=['GET'])
def get_overview():
    """Returns dataset summary stats and breakdown across all 3 integrated research datasets."""
    try:
        overview = get_datasets_overview()
        return jsonify({'status': 'success', 'overview': overview}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dataset_bp.route('/smishing', methods=['GET'])
def get_smishing_data():
    """Paginated search across the 84,863 SMS Smishing Dataset."""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(100, max(5, int(request.args.get('per_page', 20))))
        label_filter = request.args.get('label', 'all').lower()
        search = request.args.get('search', '').strip()

        result = query_smishing_dataset(page=page, per_page=per_page, label_filter=label_filter, search=search)
        return jsonify({'status': 'success', **result}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dataset_bp.route('/scam-features', methods=['GET'])
def get_scam_features_data():
    """Paginated search across the 5,971 INFO-4360 Scam Features Corpus."""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(100, max(5, int(request.args.get('per_page', 20))))
        label_filter = request.args.get('label', 'all').lower()
        search = request.args.get('search', '').strip()

        result = query_scam_features_dataset(page=page, per_page=per_page, label_filter=label_filter, search=search)
        return jsonify({'status': 'success', **result}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dataset_bp.route('/financial', methods=['GET'])
def get_financial_data():
    """Paginated search across the 2,393 12-Month Banking Transactions Dataset."""
    try:
        page = int(request.args.get('page', 1))
        per_page = min(100, max(5, int(request.args.get('per_page', 20))))
        search = request.args.get('search', '').strip()

        result = query_financial_dataset(page=page, per_page=per_page, search=search)
        return jsonify({'status': 'success', **result}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dataset_bp.route('/test-message', methods=['POST'])
def test_dataset_message():
    """
    Evaluates any message from the datasets using the Scam Feature Extractor
    and Algorithmic Threat Engine.
    """
    try:
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        if not message:
            return jsonify({'status': 'error', 'message': 'Message is required.'}), 400

        result = analyze_message_risk(message)
        return jsonify({'status': 'success', 'result': result}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@dataset_bp.route('/download/<dataset_key>', methods=['GET'])
def download_dataset(dataset_key: str):
    """Allows downloading the raw CSV dataset file directly."""
    allowed_files = {
        'smishing': ('smishing/Combined-Labeled-Dataset.csv', 'Smishing-Dataset-84k.csv'),
        'scam_features': ('scam_features/Dataset_5971.csv', 'INFO-4360-Scam-Features.csv'),
        'financial': ('financial/synthetic_12_month_statement.csv', '12-Month-Financial-Statement.csv')
    }

    if dataset_key not in allowed_files:
        return jsonify({'status': 'error', 'message': 'Invalid dataset key.'}), 400

    rel_path, download_name = allowed_files[dataset_key]
    file_path = get_data_dir() / rel_path

    if not file_path.exists():
        return jsonify({'status': 'error', 'message': 'Dataset file not found.'}), 404

    return send_file(str(file_path), as_attachment=True, download_name=download_name)
