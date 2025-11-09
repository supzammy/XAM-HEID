"""
FastAPI backend for XAM HEID ML services.
Exposes endpoints for filtering, mining, and QA using the backend modules.
"""
import sys
from pathlib import Path

# Add the project root to the Python path
sys.path.append(str(Path(__file__).parent.parent.parent))

from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import JSONResponse
from fastapi.encoders import jsonable_encoder
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import math
import numpy as np
from typing import Optional, Dict, Any
import pandas as pd

from streamlit_backend.data_loader import load_data, filter_dataset, aggregate_by_state, apply_rule_of_11
from streamlit_backend.pattern_mining import make_transactions, run_apriori, summarize_rules
from streamlit_backend.qa import answer_query

app = FastAPI(title="XAM HEID ML Backend")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173", # Vite default port
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


DATA_PATH = Path(__file__).parent.parent / 'data' / 'synthetic_health.csv'

def get_data():
    return load_data(str(DATA_PATH))

def normalize_disease_name(disease_name: str) -> str:
    """Converts 'Heart Disease' to 'heart_disease'."""
    return disease_name.lower().replace(' ', '_')

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
    try:
        df = get_data()
        # normalize the disease name to match dataframe column names
        disease_normalized = normalize_disease_name(req.disease)
        filtered = filter_dataset(df, disease=disease_normalized, year=req.year, demographics=req.demographics)

        agg = aggregate_by_state(filtered, disease=disease_normalized)
        agg = apply_rule_of_11(agg)
        # Convert NaN (numpy) to JSON-friendly None
        agg_clean = agg.where(pd.notnull(agg), None)

        # Prepare records and sanitize values (replace NaN/inf with None, convert numpy scalars)
        records = agg_clean.to_dict(orient='records')

        def sanitize_value(v):
            # convert numpy scalar to native
            if isinstance(v, (np.integer, np.int64, np.int32)):
                return int(v)
            if isinstance(v, (np.floating, np.float64, np.float32)):
                fv = float(v)
                return None if not math.isfinite(fv) else fv
            if isinstance(v, (np.bool_,)):
                return bool(v)
            # native floats
            if isinstance(v, float):
                return None if not math.isfinite(v) else v
            return v

        sanitized = []
        for r in records:
            newr = {k: sanitize_value(v) for k, v in r.items()}
            sanitized.append(newr)

        encoded = jsonable_encoder(sanitized)
        return JSONResponse(content=encoded)
    except ValueError as e:
        # Expected validation error from filter_dataset mapping/validation
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Unexpected error: include the error text in the response for debugging
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mine_patterns")
def mine_patterns_endpoint(req: MiningRequest):
    df = get_data()
    disease_normalized = normalize_disease_name(req.disease)
    try:
        filtered = filter_dataset(df, disease=disease_normalized, year=req.year, demographics=req.demographics)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # The make_transactions function now handles the Rule of 11 internally
    tx = make_transactions(filtered, disease=disease_normalized)
    
    if tx.empty:
        return {"rules": []}

    fi, rules = run_apriori(tx, min_support=req.min_support, min_threshold=req.min_confidence)
    summarized = summarize_rules(rules, top_n=10)
    return {"rules": summarized}

@app.post("/qa")
def qa_endpoint(req: QARequest):
    df = get_data()
    disease_normalized = normalize_disease_name(req.disease)
    try:
        filtered = filter_dataset(df, disease=disease_normalized, year=req.year, demographics=req.demographics)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Aggregate and apply Rule of 11 before answering
    agg = aggregate_by_state(filtered, disease=disease_normalized)
    agg_secure = apply_rule_of_11(agg)

    # The answer_query function should be adapted to handle aggregated and suppressed data
    answer = answer_query(agg_secure, req.query, default_year=req.year)
    return {"answer": answer}
