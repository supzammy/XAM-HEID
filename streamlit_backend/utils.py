"""
Utility helpers for formatting, suppression-aware summaries, and small helpers used by the Streamlit app.
"""
import pandas as pd
from typing import Dict, Any


def summary_disparity(df: pd.DataFrame, disease: str, year: int = None) -> Dict[str, Any]:
    """Compute simple disparity metrics: min/max state rates and disparity index (pct difference).
    Applies Rule of 11 suppression awareness: rows with NaN rates are ignored in min/max.
    """
    sub = df.copy()
    if year:
        sub = sub[sub['year']==year]
    grp = sub.groupby('state')[[disease,'patient_id']].agg(cases=(disease,'sum'), population=('patient_id','count'))
    grp['rate'] = grp['cases'] / grp['population']
    grp = grp.dropna(subset=['rate'])
    if grp.empty:
        return {'message': 'No non-suppressed data available for the selected filters.'}
    min_idx = grp['rate'].idxmin()
    max_idx = grp['rate'].idxmax()
    min_rate = grp.loc[min_idx, 'rate']
    max_rate = grp.loc[max_idx, 'rate']
    disparity_index = (max_rate - min_rate) / max_rate if max_rate > 0 else 0
    return {
        'min_state': min_idx,
        'min_rate': float(min_rate),
        'max_state': max_idx,
        'max_rate': float(max_rate),
        'disparity_index': float(disparity_index)
    }


def pretty_rate(r: float) -> str:
    if pd.isna(r):
        return 'Suppressed'
    return f"{r:.2%}"
