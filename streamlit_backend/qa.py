"""
QA module implementing a simple rule-based conversational interface for disparity queries.
Provides a light NLP-capable skeleton: keyword-based intent extraction and optional transformer-backed
answering when a model is available.
"""
import re
from typing import Tuple, Dict, Any, Optional
import pandas as pd


def extract_intent(query: str) -> Dict[str, Any]:
    """Very small intent extractor: identifies disease, metric, and comparator keywords.
    Returns a dict with keys like {'intent':'top_states','disease':'diabetes','metric':'rate'}
    """
    q = query.lower()
    intent = {}
    # disease
    for d in ['diabetes','heart disease','heart_disease','cancer','heart']:
        if d in q:
            intent['disease'] = 'diabetes' if 'diabetes' in q else ('heart_disease' if 'heart' in q or 'heart disease' in q or 'heart_disease' in q else 'cancer')
            break
    # top/k
    m = re.search(r"top\s+(\d+)|highest|largest|most", q)
    if m:
        intent['intent'] = 'top_states'
        if m.group(1):
            intent['k'] = int(m.group(1))
    # trend
    if 'trend' in q or 'trends' in q or 'over time' in q:
        intent['intent'] = 'trend'
    # compare
    if 'vs' in q or 'versus' in q or 'compare' in q:
        intent['intent'] = 'compare'
        # simple: detect low vs high income
        if 'low' in q and 'high' in q:
            intent['compare_groups'] = ['Low','High']
    # filter by year
    y = re.search(r"(19|20)\d{2}", q)
    if y:
        intent['year'] = int(y.group(0))
    return intent


def answer_query(df: pd.DataFrame, query: str, default_year: Optional[int]=None) -> str:
    """Return a human-readable answer to simple disparity queries using the provided dataset.
    The function uses `extract_intent` to route to aggregation functions.
    This version expects a pre-aggregated and privacy-suppressed DataFrame.
    """
    intent = extract_intent(query)
    # The disease is now implicit in the aggregated 'cases' and 'rate' columns
    year = intent.get('year', default_year)

    # Filter out suppressed data before answering
    df_safe = df[df['suppressed'] == False].copy()
    if df_safe.empty:
        return "Sorry, there is not enough data to answer this query without violating privacy rules."

    if intent.get('intent') == 'top_states' or 'top_states' in intent:
        k = intent.get('k', 5)
        sub = df_safe.copy()
        if year:
            sub = sub[sub['year']==year]
        
        # Data is already aggregated, just sort and select top N
        top = sub.sort_values('rate', ascending=False).head(k)
        
        lines = [f"Top {k} states by disparity rate{(' in '+str(year)) if year else ''}:\n"]
        for _, row in top.iterrows():
            lines.append(f"- {row['state']}: {row['cases']:.0f} cases / {row['population']:.0f} pop -> rate={row['rate']:.3%}")
        return '\n'.join(lines)

    # The 'compare' and 'trend' intents are more complex with pre-aggregated data
    # because the original demographic groups might not be present.
    # For the MVP, we will return a message indicating this limitation.
    if intent.get('intent') == 'compare':
        return "Sorry, detailed demographic comparisons are not supported in this Q&A version when data is aggregated for privacy."

    if intent.get('intent') == 'trend' or 'trend' in query:
        # We can show a trend if the aggregation was done by year
        if 'year' in df_safe.columns:
            grp = df_safe.groupby('year').agg(
                cases=('cases', 'sum'),
                population=('population', 'sum')
            )
            grp['rate'] = grp['cases'] / grp['population']
            lines = [f"Trend for the selected condition (yearly):\n"]
            for y, row in grp.iterrows():
                lines.append(f"- {y}: {row['cases']:.0f} cases / {row['population']:.0f} pop -> rate={row['rate']:.3%}")
            return '\n'.join(lines)
        else:
            return "Sorry, trend analysis requires data to be grouped by year, which is not available in the current view."

    # Default fallback
    return "Sorry, I couldn't parse that query precisely. Try asking 'Which states have the highest rates in 2020?'"
