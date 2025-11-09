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
    """
    intent = extract_intent(query)
    disease = intent.get('disease', 'diabetes')
    year = intent.get('year', default_year)

    if intent.get('intent') == 'top_states' or 'top_states' in intent:
        k = intent.get('k', 5)
        sub = df.copy()
        if year:
            sub = sub[sub['year']==year]
        grp = sub.groupby('state')[[disease,'patient_id']].agg(cases=(disease,'sum'), population=('patient_id','count'))
        grp['rate'] = grp['cases'] / grp['population']
        grp = grp.sort_values('rate', ascending=False)
        top = grp.head(k)
        lines = [f"Top {k} states by {disease} rate{(' in '+str(year)) if year else ''}:\n"]
        for st, row in top.iterrows():
            lines.append(f"- {st}: {row['cases']} cases / {int(row['population'])} pop -> rate={row['rate']:.3%}")
        return '\n'.join(lines)

    if intent.get('intent') == 'compare':
        groups = intent.get('compare_groups', ['Low','High'])
        sub = df.copy()
        if year:
            sub = sub[sub['year']==year]
        lines = [f"Comparing {disease} rates for {groups[0]} vs {groups[1]} in {year or 'all years'}:\n"]
        for g in groups:
            grp = sub[sub['income_group']==g]
            cases = grp[disease].sum()
            pop = grp.shape[0]
            rate = cases / pop if pop>0 else 0
            lines.append(f"- {g}: {int(cases)} cases / {pop} pop -> rate={rate:.3%}")
        return '\n'.join(lines)

    if intent.get('intent') == 'trend' or 'trend' in query:
        sub = df.copy()
        grp = sub.groupby('year')[[disease,'patient_id']].agg(cases=(disease,'sum'), population=('patient_id','count'))
        grp['rate'] = grp['cases'] / grp['population']
        lines = [f"Trend for {disease} (yearly):\n"]
        for y,row in grp.iterrows():
            lines.append(f"- {y}: {int(row['cases'])} cases / {int(row['population'])} pop -> rate={row['rate']:.3%}")
        return '\n'.join(lines)

    # Default fallback
    return "Sorry, I couldn't parse that query precisely. Try asking 'Which states have the highest diabetes rates in 2020?' or 'Compare low vs high income diabetes rates'."
