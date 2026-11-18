import os
from pathlib import Path
import pandas as pd
from app.services.fraud_service import extract_signal_features, analyze_message_risk

# Module-level cache for dataframes
_DATA_CACHE = {
    'smishing': None,
    'scam_features': None,
    'financial': None
}

def get_data_dir() -> Path:
    """Resolve the data directory reliably."""
    candidate = Path(__file__).resolve().parents[3] / 'data'
    if candidate.exists():
        return candidate
    candidate2 = Path('data').resolve()
    if candidate2.exists():
        return candidate2
    return Path('../data').resolve()

def load_smishing_df() -> pd.DataFrame:
    global _DATA_CACHE
    if _DATA_CACHE['smishing'] is not None:
        return _DATA_CACHE['smishing']
    
    path = get_data_dir() / 'smishing' / 'Combined-Labeled-Dataset.csv'
    if not path.exists():
        return pd.DataFrame(columns=['message', 'spam label', 'smishing label'])
    
    df = pd.read_csv(str(path), low_memory=False)
    # Standardize column names
    df.columns = [c.strip().lower() for c in df.columns]
    # Handle NaN in message
    df['message'] = df['message'].fillna('').astype(str)
    # Ensure smishing label is numeric or string
    df['is_smishing'] = df['smishing label'].apply(lambda x: 1 if str(x).strip() in ['1', '1.0', 'Smishing', 'smishing'] else 0)
    _DATA_CACHE['smishing'] = df
    return df

def load_scam_features_df() -> pd.DataFrame:
    global _DATA_CACHE
    if _DATA_CACHE['scam_features'] is not None:
        return _DATA_CACHE['scam_features']
    
    path = get_data_dir() / 'scam_features' / 'Dataset_5971.csv'
    if not path.exists():
        return pd.DataFrame(columns=['LABEL', 'TEXT', 'URL', 'EMAIL', 'PHONE'])
    
    df = pd.read_csv(str(path), low_memory=False)
    df.columns = [c.strip().upper() for c in df.columns]
    df['TEXT'] = df['TEXT'].fillna('').astype(str)
    df['LABEL'] = df['LABEL'].fillna('ham').astype(str)
    df['IS_SMISHING'] = df['LABEL'].apply(lambda x: 1 if x.lower() in ['smishing', 'spam'] else 0)
    _DATA_CACHE['scam_features'] = df
    return df

def load_financial_df() -> pd.DataFrame:
    global _DATA_CACHE
    if _DATA_CACHE['financial'] is not None:
        return _DATA_CACHE['financial']
    
    path = get_data_dir() / 'financial' / 'synthetic_12_month_statement.csv'
    if not path.exists():
        return pd.DataFrame(columns=['Date', 'Description', 'Debit', 'Credit', 'Balance'])
    
    df = pd.read_csv(str(path), low_memory=False)
    _DATA_CACHE['financial'] = df
    return df

def get_datasets_overview() -> dict:
    """Returns overview statistics across all 3 integrated research datasets."""
    smish_df = load_smishing_df()
    scam_df = load_scam_features_df()
    fin_df = load_financial_df()

    smish_total = len(smish_df)
    smish_count = int(smish_df['is_smishing'].sum()) if smish_total > 0 else 0
    smish_legit = smish_total - smish_count

    scam_total = len(scam_df)
    scam_count = int(scam_df['IS_SMISHING'].sum()) if scam_total > 0 else 0
    scam_legit = scam_total - scam_count

    fin_total = len(fin_df)

    return {
        'total_records_all_datasets': smish_total + scam_total + fin_total,
        'smishing_dataset': {
            'name': 'Smishing Research Corpus (Combined-Labeled-Dataset)',
            'source_repo': 'https://github.com/shaghayegh-hp/Smishing_Dataset.git',
            'file_name': 'Combined-Labeled-Dataset.csv',
            'total_records': smish_total,
            'smishing_records': smish_count,
            'legitimate_records': smish_legit,
            'smishing_percentage': round((smish_count / smish_total * 100), 1) if smish_total > 0 else 0,
            'fields': ['message', 'spam label', 'smishing label']
        },
        'scam_features_dataset': {
            'name': 'Scam Text Signal Features Corpus (INFO-4360)',
            'source_repo': 'https://github.com/nmbenton/INFO-4360-Project.git',
            'file_name': 'Dataset_5971.csv',
            'total_records': scam_total,
            'flagged_records': scam_count,
            'benign_records': scam_legit,
            'fields': ['LABEL', 'TEXT', 'URL', 'EMAIL', 'PHONE']
        },
        'financial_dataset': {
            'name': '12-Month Indian Bank Statement Transactions',
            'source_repo': 'https://github.com/abhiminav/personal-finance-intelligence.git',
            'file_name': 'synthetic_12_month_statement.csv',
            'total_records': fin_total,
            'fields': ['Date', 'Description', 'Debit', 'Credit', 'Balance']
        }
    }

def query_smishing_dataset(page: int = 1, per_page: int = 20, label_filter: str = 'all', search: str = '') -> dict:
    df = load_smishing_df()
    
    if label_filter == 'smishing':
        filtered = df[df['is_smishing'] == 1]
    elif label_filter == 'legit':
        filtered = df[df['is_smishing'] == 0]
    else:
        filtered = df
        
    if search:
        search_lower = search.lower().strip()
        filtered = filtered[filtered['message'].str.lower().str.contains(search_lower, regex=False)]
        
    total_matches = len(filtered)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    page_records = filtered.iloc[start_idx:end_idx]

    records = []
    for _, row in page_records.iterrows():
        records.append({
            'message': str(row.get('message', '')),
            'is_smishing': int(row.get('is_smishing', 0)),
            'spam_label': str(row.get('spam label', '')),
            'smishing_label': str(row.get('smishing label', ''))
        })

    return {
        'total': total_matches,
        'page': page,
        'per_page': per_page,
        'total_pages': (total_matches + per_page - 1) // per_page if total_matches > 0 else 1,
        'records': records
    }

def query_scam_features_dataset(page: int = 1, per_page: int = 20, label_filter: str = 'all', search: str = '') -> dict:
    df = load_scam_features_df()
    
    if label_filter == 'smishing':
        filtered = df[df['IS_SMISHING'] == 1]
    elif label_filter == 'legit':
        filtered = df[df['IS_SMISHING'] == 0]
    else:
        filtered = df

    if search:
        search_lower = search.lower().strip()
        filtered = filtered[filtered['TEXT'].str.lower().str.contains(search_lower, regex=False)]

    total_matches = len(filtered)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    page_records = filtered.iloc[start_idx:end_idx]

    records = []
    for _, row in page_records.iterrows():
        records.append({
            'label': str(row.get('LABEL', '')),
            'text': str(row.get('TEXT', '')),
            'has_url_label': str(row.get('URL', 'No')),
            'has_email_label': str(row.get('EMAIL', 'No')),
            'has_phone_label': str(row.get('PHONE', 'No')),
            'is_smishing': int(row.get('IS_SMISHING', 0))
        })

    return {
        'total': total_matches,
        'page': page,
        'per_page': per_page,
        'total_pages': (total_matches + per_page - 1) // per_page if total_matches > 0 else 1,
        'records': records
    }

def query_financial_dataset(page: int = 1, per_page: int = 20, search: str = '') -> dict:
    df = load_financial_df()
    filtered = df

    if search:
        search_lower = search.lower().strip()
        filtered = filtered[filtered['Description'].astype(str).str.lower().str.contains(search_lower, regex=False)]

    total_matches = len(filtered)
    start_idx = (page - 1) * per_page
    end_idx = start_idx + per_page
    page_records = filtered.iloc[start_idx:end_idx]

    records = []
    for _, row in page_records.iterrows():
        records.append({
            'date': str(row.get('Date', '')),
            'description': str(row.get('Description', '')),
            'debit': float(row.get('Debit', 0.0)) if pd.notna(row.get('Debit')) else None,
            'credit': float(row.get('Credit', 0.0)) if pd.notna(row.get('Credit')) else None,
            'balance': float(row.get('Balance', 0.0)) if pd.notna(row.get('Balance')) else None
        })

    return {
        'total': total_matches,
        'page': page,
        'per_page': per_page,
        'total_pages': (total_matches + per_page - 1) // per_page if total_matches > 0 else 1,
        'records': records
    }
