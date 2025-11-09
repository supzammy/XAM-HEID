"""
Synthetic data generator for health equity dashboard.
Generates a realistic-seeming tabular dataset of patient-level records covering
multiple states, years, demographic attributes, and disease indicators.

Usage:
    python generate_synthetic.py --out data/synthetic_health.csv --n 200000

The script is intentionally deterministic by default (seeded) for reproducibility.
"""
import argparse
import numpy as np
import pandas as pd
from pathlib import Path

STATES = [
    'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY'
]

AGE_GROUPS = ['0-17','18-34','35-49','50-64','65+']
SEXES = ['Female','Male','Other']
RACES = ['White','Black','Hispanic','Asian','Other']
INCOME = ['Low','Middle','High']
YEARS = list(range(2015, 2024))
DISEASES = ['heart_disease','diabetes','cancer']


def generate_patient_record(rng):
    state = rng.choice(STATES)
    year = rng.choice(YEARS)
    age = rng.choice(AGE_GROUPS, p=[0.22,0.27,0.2,0.18,0.13])
    sex = rng.choice(SEXES, p=[0.5,0.49,0.01])
    race = rng.choice(RACES, p=[0.6,0.13,0.15,0.08,0.04])
    income = rng.choice(INCOME, p=[0.3,0.5,0.2])

    # Baseline disease risks by age/income/race to create realistic patterns
    base_risk = 0.01
    if age == '50-64':
        base_risk += 0.08
    elif age == '65+':
        base_risk += 0.15
    elif age == '35-49':
        base_risk += 0.03

    if income == 'Low':
        base_risk += 0.02

    # Race-specific small adjustments
    race_adj = {'White':0.0,'Black':0.02,'Hispanic':0.01,'Asian':-0.005,'Other':0.0}
    base_risk += race_adj.get(race,0)

    # State-level modifiers (some states elevated risk)
    state_hotspots = ['MS','WV','AL','LA','KY']
    state_adj = 0.03 if state in state_hotspots else 0.0
    base_risk += state_adj

    # Disease presence simulated with correlated components
    heart = rng.binomial(1, min(0.6, base_risk + 0.05))
    diabetes = rng.binomial(1, min(0.5, base_risk + (0.03 if income=='Low' else 0)))
    cancer = rng.binomial(1, min(0.15, base_risk * 0.7))

    return dict(state=state, year=year, age_group=age, sex=sex, race_ethnicity=race, income_group=income,
                heart_disease=int(heart), diabetes=int(diabetes), cancer=int(cancer))


def generate_dataset(n=100000, seed=42, out_path=None):
    rng = np.random.default_rng(seed)
    records = [generate_patient_record(rng) for _ in range(n)]
    df = pd.DataFrame(records)

    # Add a patient_id for reference
    df['patient_id'] = range(1, len(df)+1)
    cols = ['patient_id','state','year','age_group','sex','race_ethnicity','income_group','heart_disease','diabetes','cancer']
    df = df[cols]

    if out_path:
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)
        df.to_csv(out_path, index=False)
        print(f"Wrote synthetic dataset to {out_path} (n={len(df)})")

    return df


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--out', dest='out', default='streamlit_backend/data/synthetic_health.csv')
    parser.add_argument('--n', dest='n', type=int, default=100000)
    parser.add_argument('--seed', dest='seed', type=int, default=42)
    args = parser.parse_args()
    generate_dataset(n=args.n, seed=args.seed, out_path=args.out)
