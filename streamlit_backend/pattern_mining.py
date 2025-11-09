"""
Pattern mining utilities using mlxtend (apriori) to discover associations between demographic attributes
and disease presence at the aggregated level. The module exposes functions to transform patient-level
rows into transaction-style data and run apriori + rule extraction.
"""
import pandas as pd
from mlxtend.frequent_patterns import apriori, association_rules
from typing import List, Tuple, Dict, Any


def make_transactions(df: pd.DataFrame, disease: str, groupby: List[str] = ['state','year','income_group']) -> pd.DataFrame:
    """Create a one-hot-encoded transaction table where each row corresponds to a grouped cell (e.g., state-year-income)
    and columns include demographic buckets and disease indicators (e.g., 'income=Low', 'age=65+', 'disease=diabetes').
    """
    # create labeled categorical columns
    df = df.copy()
    df['income_label'] = 'income=' + df['income_group'].astype(str)
    df['age_label'] = 'age=' + df['age_group'].astype(str)
    df['sex_label'] = 'sex=' + df['sex'].astype(str)
    df['race_label'] = 'race=' + df['race_ethnicity'].astype(str)

    # For transaction mining, we aggregate by group and derive prevalence flags
    group_cols = groupby
    agg = df.groupby(group_cols).agg(
        population=('patient_id','count'),
        cases=(disease,'sum')
    ).reset_index()
    # A group is considered to have the disease if prevalence > threshold (e.g., >0)
    agg['has_disease'] = (agg['cases'] > 0).astype(int)

    # We'll construct transactions at patient-level-like granularity by sampling
    # from the original records within each group and converting to items. For speed, we'll reduce duplicates.
    # Simpler: represent each group as a transaction composed of the group's dominant demographic labels.

    # Determine modal values per group
    def modal_label(sub, col, prefix):
        return prefix + '=' + sub[col].mode().iat[0]

    items = []
    grouped = df.groupby(group_cols)
    for name, sub in grouped:
        income = modal_label(sub, 'income_group', 'income')
        age = modal_label(sub, 'age_group', 'age')
        sex = modal_label(sub, 'sex', 'sex')
        race = modal_label(sub, 'race_ethnicity', 'race')
        disease_flag = 'has_' + disease if sub[disease].sum() > 0 else 'no_' + disease
        itemset = [income, age, sex, race, disease_flag]
        items.append({'transaction': itemset})

    # Convert to one-hot encoded frame
    # Build DataFrame with each item as a column
    all_items = set(it for row in items for it in row['transaction'])
    rows = []
    for row in items:
        presence = {it: (1 if it in row['transaction'] else 0) for it in all_items}
        rows.append(presence)
    tx = pd.DataFrame(rows)
    return tx


def run_apriori(transactions: pd.DataFrame, min_support: float = 0.05, min_threshold: float = 0.6):
    """Run apriori and extract association rules. Returns frequent itemsets and rules DataFrames.
    `min_threshold` parameter maps to min_confidence for association_rules.
    """
    frequent_itemsets = apriori(transactions, min_support=min_support, use_colnames=True)
    if frequent_itemsets.empty:
        return frequent_itemsets, pd.DataFrame()
    rules = association_rules(frequent_itemsets, metric="confidence", min_threshold=min_threshold)
    # Sort by lift/confidence for interesting rules
    rules = rules.sort_values(['lift','confidence'], ascending=False)
    return frequent_itemsets, rules


def summarize_rules(rules: pd.DataFrame, top_n: int = 10) -> List[Dict[str, Any]]:
    """Return a simplified list of top rules with human-readable antecedent/consequent.
    """
    out = []
    for _, row in rules.head(top_n).iterrows():
        out.append({
            'antecedent': tuple(sorted(list(row['antecedents']))),
            'consequent': tuple(sorted(list(row['consequents']))),
            'support': float(row['support']),
            'confidence': float(row['confidence']),
            'lift': float(row['lift'])
        })
    return out
