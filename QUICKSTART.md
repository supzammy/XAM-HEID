# XAM-HEID Quick Start Guide


### Step 1: Get Your API Key (Optional but Recommended)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with Google account
3. Create an API key
4. Copy the key (you'll need it in Step 3)

> **Note**: Without an API key, the system will use ML-only mode (still fully functional!)

### Step 2: Clone and Install

```bash
# Clone the repository
git clone https://github.com/supzammy/XAM-HEID.git
cd XAM-HEID

# Install frontend dependencies
npm install

# Install backend dependencies
cd streamlit_backend/api
pip install -r requirements.txt
cd ../..
```

### Step 3: Configure Environment

**Frontend (.env.local)**
```bash
# Create frontend environment file
cat > .env.local << EOF
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_AI_FEATURES=true
EOF
```

**Backend (streamlit_backend/api/.env)**
```bash
# Create backend environment file
cat > streamlit_backend/api/.env << EOF
GEMINI_API_KEY=your_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENABLE_GEMINI_AI=true
FALLBACK_TO_ML=true
EOF
```

Replace `your_api_key_here` with your actual Gemini API key.

### Step 4: Run the Application

**Terminal 1 - Backend:**
```bash
cd streamlit_backend/api
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### Step 5: Open in Browser

Navigate to: [http://localhost:3000](http://localhost:3000)

You should see the Health Equity Intelligence Dashboard!

## ✅ Verify It's Working

1. **Check Backend**: Visit [http://localhost:8000/api/health_check](http://localhost:8000/api/health_check)
   - Should see: `{"status":"healthy",...}`

2. **Check Frontend**: Open browser console (F12)
   - Should see no CORS errors
   - API calls should succeed

3. **Test AI Features**:
   - Select a disease (e.g., "Heart Disease")
   - Select a year (e.g., "2023")
   - Click "Analyze" in AI Policy Advisor panel
   - Should see insights appear (Gemini AI or ML fallback)

## 🐛 Troubleshooting

### Issue: "Module not found" errors

**Fix**:
```bash
# Frontend
npm install

# Backend
cd streamlit_backend/api
pip install -r requirements.txt
```

### Issue: CORS errors in browser console

**Fix**: Check that backend is running and `.env.local` has correct API URL

### Issue: "Gemini AI unavailable"

**Fix**: Either:
1. Add valid `GEMINI_API_KEY` to backend `.env`
2. Or use ML-only mode (works without API key)

### Issue: Port already in use

**Fix**:
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9

# Or use different port
uvicorn main:app --reload --port 8001
# Update VITE_API_BASE_URL to http://localhost:8001
```

## 📚 Next Steps

- **Deploy to Production**: See [DEPLOYMENT.md](./DEPLOYMENT.md) and [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Run Tests**: `cd streamlit_backend/api && pytest -v`
- **Customize Data**: Edit `streamlit_backend/data/synthetic_health.csv`
- **Modify UI**: Components are in `components/` directory

## 🆘 Need Help?

- **Documentation**: Check [README.md](./README.md) for full details
- **Issues**: [GitHub Issues](https://github.com/supzammy/XAM-HEID/issues)
- **API Docs**: Visit [http://localhost:8000/docs](http://localhost:8000/docs) when backend is running

## 🎉 You're All Set!

Enjoy exploring health equity insights with AI-powered analysis!
