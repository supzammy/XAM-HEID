# XAM-HEID Deployment Checklist

Use this checklist to ensure smooth deployment to production.

## 📋 Pre-Deployment Checklist

### Local Development Setup
- [ ] Clone repository: `git clone https://github.com/supzammy/XAM-HEID.git`
- [ ] Install Node.js dependencies: `npm install`
- [ ] Install Python dependencies: `cd streamlit_backend/api && pip install -r requirements.txt`
- [ ] Create `.env.local` for frontend (see `.env.example`)
- [ ] Create `streamlit_backend/api/.env` for backend (see `streamlit_backend/api/.env.example`)
- [ ] Run frontend locally: `npm run dev` → [http://localhost:3000](http://localhost:3000)
- [ ] Run backend locally: `cd streamlit_backend/api && uvicorn main:app --reload`
- [ ] Verify health check: [http://localhost:8000/api/health_check](http://localhost:8000/api/health_check)
- [ ] Test AI integration in browser
- [ ] Run backend tests: `cd streamlit_backend/api && pytest -v`

### Google Cloud Setup
- [ ] Create Google Cloud project
- [ ] Enable billing on project
- [ ] Get project ID: `gcloud config get-value project`
- [ ] Enable APIs:
  ```bash
  gcloud services enable cloudbuild.googleapis.com
  gcloud services enable run.googleapis.com
  gcloud services enable containerregistry.googleapis.com
  gcloud services enable secretmanager.googleapis.com
  ```
- [ ] Get Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- [ ] Create secret in Secret Manager:
  ```bash
  echo -n "YOUR_GEMINI_KEY" | gcloud secrets create GEMINI_API_KEY \
    --replication-policy="automatic" \
    --data-file=-
  ```
- [ ] Grant service account access to secret:
  ```bash
  gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
  ```

### Vercel Setup
- [ ] Create Vercel account at [vercel.com](https://vercel.com)
- [ ] Connect GitHub repository to Vercel
- [ ] Note: Don't deploy yet (need backend URL first)

---

## 🚀 Backend Deployment (Google Cloud Run)

### Step 1: Prepare Environment
```bash
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-central1"
export GEMINI_API_KEY="your-gemini-api-key"
```

### Step 2: Deploy Backend
- [ ] Make deployment script executable: `chmod +x deploy-backend.sh`
- [ ] Run deployment: `./deploy-backend.sh`
- [ ] Or deploy manually:
  ```bash
  cd streamlit_backend/api
  gcloud builds submit --tag gcr.io/$GCP_PROJECT_ID/xam-heid-backend
  gcloud run deploy xam-heid-backend \
    --image gcr.io/$GCP_PROJECT_ID/xam-heid-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --set-env-vars "ENABLE_GEMINI_AI=true,FALLBACK_TO_ML=true"
  ```

### Step 3: Verify Backend
- [ ] Get service URL:
  ```bash
  gcloud run services describe xam-heid-backend \
    --region us-central1 \
    --format 'value(status.url)'
  ```
- [ ] Test health endpoint:
  ```bash
  curl https://YOUR-BACKEND-URL/api/health_check
  ```
- [ ] Expected response:
  ```json
  {
    "status": "healthy",
    "services": {
      "ml_engine": "active",
      "gemini_ai": "active"
    }
  }
  ```
- [ ] Save backend URL for frontend configuration

---

## 🌐 Frontend Deployment (Vercel)

### Step 1: Configure Vercel Project
- [ ] Go to Vercel dashboard
- [ ] Click "Import Project"
- [ ] Select XAM-HEID repository
- [ ] Configure settings:
  - **Framework Preset**: Vite
  - **Root Directory**: `./`
  - **Build Command**: `npm run build` (auto-detected)
  - **Output Directory**: `dist` (auto-detected)

### Step 2: Set Environment Variables
In Vercel project settings → Environment Variables:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_BASE_URL` | `https://your-backend-xyz.run.app` | Production |
| `VITE_ENABLE_AI_FEATURES` | `true` | Production |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Preview |
| `VITE_API_BASE_URL` | `http://localhost:8000` | Development |

- [ ] Add environment variables in Vercel
- [ ] Use actual Cloud Run URL for production

### Step 3: Deploy Frontend
- [ ] Click "Deploy" in Vercel
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Get deployment URL: `https://your-app.vercel.app`
- [ ] Test deployment in browser

### Step 4: Update Backend CORS
- [ ] Update Cloud Run CORS to allow Vercel domain:
  ```bash
  gcloud run services update xam-heid-backend \
    --region us-central1 \
    --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
  ```
- [ ] Wait ~1 minute for update to propagate

---

## ✅ Post-Deployment Verification

### Frontend Testing
- [ ] Visit Vercel URL: `https://your-app.vercel.app`
- [ ] Page loads without errors
- [ ] Open browser console (F12)
- [ ] No CORS errors
- [ ] Select disease and year filters
- [ ] Click "Analyze" in AI Policy Advisor
- [ ] Verify insights load (should see "Gemini AI" or "ML Pattern Mining")
- [ ] Test Q&A feature
- [ ] Test PDF export
- [ ] Test on mobile device

### Backend Testing
- [ ] Health check responds:
  ```bash
  curl https://your-backend-xyz.run.app/api/health_check
  ```
- [ ] AI insights endpoint works:
  ```bash
  curl -X POST "https://your-backend-xyz.run.app/api/ai_insights" \
    -H "Content-Type: application/json" \
    -d '{"disease":"Heart Disease","year":2023}'
  ```
- [ ] Check Cloud Run logs:
  ```bash
  gcloud run services logs read xam-heid-backend --region us-central1 --limit 50
  ```

### Security Verification
- [ ] HTTPS enforced on both frontend and backend
- [ ] CORS only allows Vercel domain
- [ ] API keys not exposed in frontend code
- [ ] Secrets in Secret Manager (not environment variables)
- [ ] No sensitive data in error messages

### Performance Testing
- [ ] Frontend loads in < 3 seconds
- [ ] API responses in < 2 seconds
- [ ] AI insights generate in < 10 seconds
- [ ] Map renders smoothly
- [ ] Charts update quickly

---

## 🔧 Troubleshooting

### Issue: CORS errors in browser
**Fix:**
```bash
# Verify CORS setting
gcloud run services describe xam-heid-backend \
  --region us-central1 \
  --format='value(spec.template.spec.containers[0].env)'

# Update if needed
gcloud run services update xam-heid-backend \
  --region us-central1 \
  --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app
```

### Issue: "Gemini AI unavailable"
**Check:**
- [ ] Secret exists: `gcloud secrets describe GEMINI_API_KEY`
- [ ] Service account has access
- [ ] ENABLE_GEMINI_AI=true in Cloud Run
- [ ] Valid API key

**Fallback:** System should work with ML-only mode

### Issue: 503 Service Unavailable
**Check:**
- [ ] Cloud Run logs for errors
- [ ] Container starting successfully
- [ ] Enough memory allocated (512Mi minimum)

### Issue: Build fails on Vercel
**Fix:**
```bash
# Test build locally
npm run build

# If successful, commit and push
git add .
git commit -m "Fix build"
git push
```

---

## 📊 Monitoring Setup

### Cloud Run Monitoring
- [ ] Set up Cloud Monitoring
- [ ] Configure alerts for:
  - High error rate (> 5%)
  - High latency (> 5s)
  - Low availability (< 99%)
- [ ] Set up log-based metrics

### Vercel Analytics
- [ ] Enable Vercel Analytics
- [ ] Monitor:
  - Page views
  - API calls
  - Core Web Vitals
  - Error rate

---

## 🎯 Success Criteria

### Deployment Complete When:
- [x] Backend deployed to Cloud Run
- [x] Frontend deployed to Vercel
- [x] CORS configured correctly
- [x] AI features working (or graceful fallback)
- [x] No errors in production
- [x] Performance acceptable
- [x] Security verified
- [x] Monitoring active

---

## 📝 Production URLs

Fill in after deployment:

```
Frontend (Vercel): https://___________________.vercel.app
Backend (Cloud Run): https://___________________.run.app
```

---

## 🔄 Continuous Deployment

### Automatic Deployments
- **Frontend**: Vercel auto-deploys on push to `main` branch
- **Backend**: Manual deployment or set up GitHub Actions

### GitHub Actions (Optional)
Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]
    paths: ['streamlit_backend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      - run: |
          cd streamlit_backend/api
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/xam-heid-backend
          gcloud run deploy xam-heid-backend --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/xam-heid-backend --region us-central1
```

- [ ] Set up GitHub Actions (optional)
- [ ] Add `GCP_SA_KEY` secret to GitHub
- [ ] Test automated deployment

---

## ✨ Deployment Complete!

Congratulations! Your XAM-HEID platform is now live with:
- ✅ AI-powered health equity insights
- ✅ Global CDN delivery
- ✅ Scalable cloud infrastructure
- ✅ Secure API integration
- ✅ Professional deployment

**Next Steps:**
1. Share the URL with stakeholders
2. Gather user feedback
3. Monitor performance and errors
4. Plan feature enhancements

---

*For detailed guides, see:*
- `QUICKSTART.md` - Local development
- `DEPLOYMENT.md` - Cloud Run deployment
- `VERCEL_DEPLOYMENT.md` - Vercel deployment
- `README.md` - Full documentation
