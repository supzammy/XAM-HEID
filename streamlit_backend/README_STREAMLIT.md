
# ARCHIVED: Streamlit prototype

This file previously documented how to run the Streamlit prototype for the ML backend. The active project no longer uses Streamlit.

The implementation has been archived in `streamlit_archive/`. The useful backend modules remain under `streamlit_backend/`:

- `data_loader.py` — data loading / filtering / Rule-of-11 helpers
- `pattern_mining.py` — apriori + rule extraction utilities
- `qa.py` — simple keyword-based QA engine
- `generate_synthetic.py` — synthetic dataset generator

If you later decide to expose the ML backend to the React frontend, I can scaffold a small FastAPI service that reuses these modules and provides endpoints for filtering, mining, and Q&A.
```bash

