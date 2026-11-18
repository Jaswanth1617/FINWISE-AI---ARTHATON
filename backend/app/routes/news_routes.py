from flask import Blueprint, request, jsonify
from app.services.ai_service import call_groq_llm

news_bp = Blueprint('news', __name__, url_prefix='/api/news')

DEFAULT_NEWS_FEED = [
    {
        'id': 'news-1',
        'title': 'RBI Holds Repo Rate Steady at 6.5%, Emphasizes Inflation Glidepath',
        'source': 'Financial Express',
        'published_at': '2025-02-14',
        'summary': 'The Reserve Bank of India’s Monetary Policy Committee voted to keep the policy repo rate unchanged at 6.50% while monitoring food price pressures and liquidity dynamics.',
        'sentiment': 'Neutral',
        'sentiment_score': 0.05,
        'affected_sectors': ['Banking', 'Real Estate', 'Automobile'],
        'financial_implication': 'Borrowers will see stable home and personal loan EMI rates in the near term; fixed deposit yields remain attractive.'
    },
    {
        'id': 'news-2',
        'title': 'India GST Collections Cross ₹1.82 Lakh Crore in Monthly Surge',
        'source': 'Economic Times',
        'published_at': '2025-02-12',
        'summary': 'Buoyant consumer demand, manufacturing activity and enhanced compliance drove monthly Gross GST collections to record highs across key industrial states.',
        'sentiment': 'Positive',
        'sentiment_score': 0.85,
        'affected_sectors': ['Consumer Goods', 'Logistics', 'Retail'],
        'financial_implication': 'Indicates strong domestic consumption momentum and fiscal space for public infrastructure expenditure.'
    },
    {
        'id': 'news-3',
        'title': 'Global Crude Volatility Impacts Logistics Costs and Oil Marketing Companies',
        'source': 'Business Standard',
        'published_at': '2025-02-10',
        'summary': 'Geopolitical supply route adjustments prompted fluctuations in Brent crude prices, adding margin pressure on aviation and transport companies.',
        'sentiment': 'Negative',
        'sentiment_score': -0.65,
        'affected_sectors': ['Aviation', 'Oil & Gas', 'Paints & Chemicals'],
        'financial_implication': 'Potential uptick in freight costs and temporary pressure on downstream refining margins.'
    }
]

@news_bp.route('/feed', methods=['GET'])
def get_news_feed():
    return jsonify({
        'status': 'success',
        'articles': DEFAULT_NEWS_FEED
    }), 200

@news_bp.route('/analyse', methods=['POST'])
def analyse_custom_news():
    data = request.get_json() or {}
    article_text = data.get('article', '').strip()
    title = data.get('title', 'User Submitted Article')

    if not article_text:
        return jsonify({'status': 'error', 'message': 'Article text is required.'}), 400

    # Rule-based sentiment scoring fallback
    pos_words = ['growth', 'surge', 'profit', 'gain', 'expansion', 'bullish', 'high', 'record', 'dividend', 'boost', 'upward']
    neg_words = ['drop', 'fall', 'loss', 'decline', 'crash', 'inflation', 'crisis', 'risk', 'deficit', 'slump', 'bearish', 'penalty']

    text_lower = article_text.lower()
    pos_count = sum(1 for w in pos_words if w in text_lower)
    neg_count = sum(1 for w in neg_words if w in text_lower)

    if pos_count > neg_count:
        sentiment = 'Positive'
        score = min(0.9, 0.3 + (pos_count - neg_count) * 0.15)
    elif neg_count > pos_count:
        sentiment = 'Negative'
        score = max(-0.9, -0.3 - (neg_count - pos_count) * 0.15)
    else:
        sentiment = 'Neutral'
        score = 0.0

    # Use Groq for comprehensive financial synthesis
    ai_prompt = [
        {"role": "system", "content": "You are a senior financial analyst. Analyze this news article. Provide: 1. A 2-sentence summary. 2. Affected companies or sectors. 3. Practical financial implications for retail investors or businesses. Format strictly as JSON with keys: summary, affected_sectors (array), financial_implication."},
        {"role": "user", "content": f"Title: {title}\nArticle: {article_text[:1200]}"}
    ]
    ai_resp = call_groq_llm(ai_prompt)

    return jsonify({
        'status': 'success',
        'analysis': {
            'title': title,
            'sentiment': sentiment,
            'sentiment_score': round(score, 2),
            'ai_synthesis': ai_resp.get('content', 'Article sentiment analysis completed.'),
            'disclaimer': 'Sentiment analysis is educational and should not be construed as financial trading advice.'
        }
    }), 200
