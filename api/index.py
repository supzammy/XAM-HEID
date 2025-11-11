# Vercel serverless function wrapper for FastAPI
from streamlit_backend.api.main import app

# Vercel expects this exact name
handler = app
