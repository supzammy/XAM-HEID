"""
FastAPI backend for XAM HEID ML services.
Exposes endpoints for filtering, mining, and QA using the backend modules.
"""
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import Optional, Dict, Any
import pandas as pd
from pathlib import Path

from streamlit_backend.data_loader import load_data, filter_dataset, aggregate_by_state, apply_rule_of_11
from streamlit_backend.pattern_mining import make_transactions, run_apriori, summarize_rules
from streamlit_backend.qa import answer_query

app = FastAPI(title="XAM HEID ML Backend")

DATA_PATH = Path(__file__).parent.parent / 'data' / 'synthetic_health.csv'

def get_data():
    return load_data(str(DATA_PATH))

class FilterRequest(BaseModel):
    disease: str
    year: Optional[int] = None
    demographics: Optional[Dict[str, Any]] = None

class MiningRequest(BaseModel):
    disease: str
    year: Optional[int] = None
    demographics: Optional[Dict[str, Any]] = None
    min_support: float = 0.05
    min_confidence: float = 0.6

class QARequest(BaseModel):
    disease: str
    year: Optional[int] = None
    demographics: Optional[Dict[str, Any]] = None
    query: str

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/filter")
def filter_endpoint(req: FilterRequest):
    df = get_data()
    filtered = filter_dataset(df, disease=req.disease, year=req.year, demographics=req.demographics)
    agg = aggregate_by_state(filtered, disease=req.disease)
    agg = apply_rule_of_11(agg)
    return agg.to_dict(orient="records")

@app.post("/mining")
def mining_endpoint(req: MiningRequest):
    df = get_data()
    filtered = filter_dataset(df, disease=req.disease, year=req.year, demographics=req.demographics)
    tx = make_transactions(filtered, disease=req.disease)
    fi, rules = run_apriori(tx, min_support=req.min_support, min_threshold=req.min_confidence)
    summarized = summarize_rules(rules, top_n=10)
    return {"rules": summarized}

@app.post("/qa")
def qa_endpoint(req: QARequest):
    df = get_data()
    filtered = filter_dataset(df, disease=req.disease, year=req.year, demographics=req.demographics)
    answer = answer_query(filtered, req.query, default_year=req.year)
    return {"answer": answer}
