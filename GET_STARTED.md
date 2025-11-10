# XAM-HEID Deployment - Getting Started

## Current Status
Your XAM-HEID repository is set up and ready to deploy! However, you need to install the Google Cloud SDK first.

## Option 1: Install Google Cloud SDK (Recommended for Full Deployment)

### Install on macOS
```bash
# Using Homebrew (recommended)
brew install --cask google-cloud-sdk

# OR download the installer
# Visit: https://cloud.google.com/sdk/docs/install
```

### After Installation
```bash
# Initialize gcloud
gcloud init

# Login to your Google account
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com run.googleapis.com secretmanager.googleapis.com

# Create secret for Gemini API key
echo -n "your-actual-gemini-api-key" | gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic" \
  --data-file=-

# Now run the deployment script
export GCP_PROJECT_ID="your-actual-project-id"
export GEMINI_API_KEY="your-actual-api-key"
export VERCEL_URL="your-app.vercel.app"  # After frontend deployment
./deploy-backend.sh
```

---

## Option 2: Test Locally First (No Cloud Deployment Needed)

You can run the entire application locally to test the Gemini AI integration before deploying to the cloud!

### Step 1: Get Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the key

### Step 2: Set Up Environment

**Frontend (.env.local):**
```bash
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_AI_FEATURES=true
EOF
```

**Backend (streamlit_backend/api/.env):**
```bash
cat > streamlit_backend/api/.env << 'EOF'
GEMINI_API_KEY=paste-your-actual-key-here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENABLE_GEMINI_AI=true
FALLBACK_TO_ML=true
GEMINI_MODEL=gemini-pro
LOG_LEVEL=INFO
EOF
```

**Important:** Replace `paste-your-actual-key-here` with your real Gemini API key!

### Step 3: Install Dependencies

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd streamlit_backend/api
pip install -r requirements.txt
cd ../..
```

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

### Step 5: Test It!
1. Open browser: [http://localhost:3000](http://localhost:3000)
2. Select a disease (e.g., "Heart Disease")
3. Select year and demographics
4. Click "Analyze" in AI Policy Advisor
5. You should see **Gemini AI** insights!

### Step 6: Verify AI is Working
Open browser console (F12) and check:
- No CORS errors ✅
- Backend health: [http://localhost:8000/api/health_check](http://localhost:8000/api/health_check)
- Should show `"gemini_ai": "active"` in the response

---

## Option 3: Deploy Frontend Only (Vercel)

You can deploy just the frontend to Vercel and test with the local backend:

### Deploy to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod

# During setup:
# - Framework: Vite
# - Build Command: npm run build
# - Output Directory: dist
```

### Set Environment Variables in Vercel
In Vercel dashboard → Environment Variables:
- `VITE_API_BASE_URL`: `http://localhost:8000` (for testing)
- `VITE_ENABLE_AI_FEATURES`: `true`

Later, update `VITE_API_BASE_URL` to your Cloud Run URL when backend is deployed.

---

## What You Need to Deploy to Production

### Prerequisites Checklist
- [ ] Google Cloud account with billing enabled
- [ ] `gcloud` CLI installed (see Option 1)
- [ ] Gemini API key from Google AI Studio
- [ ] Vercel account (free tier is fine)
- [ ] GitHub repository access

### Deployment Order
1. **Local Testing** (Option 2) - Verify everything works
2. **Backend to Cloud Run** (Option 1) - Get backend URL
3. **Frontend to Vercel** (Option 3) - Point to backend URL
4. **Update CORS** - Allow Vercel domain in Cloud Run

---

## Quick Start (Local Development)

If you just want to see it working locally right now:

```bash
# 1. Get Gemini API key from https://makersuite.google.com/app/apikey

# 2. Create backend .env file
cat > streamlit_backend/api/.env << 'EOF'
GEMINI_API_KEY=YOUR_KEY_HERE
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENABLE_GEMINI_AI=true
FALLBACK_TO_ML=true
EOF

# 3. Create frontend .env.local file
cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_AI_FEATURES=true
EOF

# 4. Install and run backend
cd streamlit_backend/api
pip install -r requirements.txt
uvicorn main:app --reload --port 8000 &

# 5. Install and run frontend (in new terminal)
cd ../..
npm install
npm run dev
```

Then visit [http://localhost:3000](http://localhost:3000)

---

## Troubleshooting

### "Module not found" errors
```bash
# Frontend
npm install

# Backend
cd streamlit_backend/api
pip install -r requirements.txt
```

### Backend won't start
```bash
# Check Python version (need 3.9+)
python --version

# Install dependencies explicitly
pip install fastapi uvicorn pandas mlxtend scikit-learn google-generativeai python-dotenv pydantic
```

### Gemini API errors
- Verify your API key is valid
- Check you've enabled Gemini API in Google Cloud Console
- Ensure no rate limits hit
- System will automatically fall back to ML if Gemini fails

### CORS errors
- Make sure backend is running on port 8000
- Check `.env.local` has `VITE_API_BASE_URL=http://localhost:8000`
- Verify no typos in ALLOWED_ORIGINS

---

## Next Steps

1. **Right Now**: Test locally (Option 2)
2. **Today**: Deploy frontend to Vercel (Option 3)
3. **This Week**: Install gcloud and deploy backend (Option 1)
4. **Production**: Connect everything and go live!

---

## Need Help?

- **Gemini API**: [Google AI Studio](https://makersuite.google.com/)
- **Cloud Run**: [GCP Documentation](https://cloud.google.com/run/docs)
- **Vercel**: [Vercel Docs](https://vercel.com/docs)
- **Issues**: [GitHub Issues](https://github.com/supzammy/XAM-HEID/issues)

See `QUICKSTART.md`, `DEPLOYMENT.md`, and `VERCEL_DEPLOYMENT.md` for detailed guides!
