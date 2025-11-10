# Google Cloud Run Deployment Configuration
# This file documents the deployment process for XAM-HEID backend

## Prerequisites
- Google Cloud account with billing enabled
- gcloud CLI installed and configured
- Docker installed (for local testing)
- GEMINI_API_KEY from Google AI Studio

## Environment Setup

### 1. Install gcloud CLI
```bash
# macOS
brew install --cask google-cloud-sdk

# Or download from: https://cloud.google.com/sdk/docs/install
```

### 2. Initialize gcloud
```bash
gcloud init
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### 3. Set up Google Secret Manager for API keys
```bash
# Create secret for Gemini API key
echo -n "your-gemini-api-key-here" | gcloud secrets create GEMINI_API_KEY \
    --replication-policy="automatic" \
    --data-file=-

# Grant Cloud Run access to the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

## Deployment Methods

### Option 1: Automated Deployment (Recommended)
```bash
# Set environment variables
export GCP_PROJECT_ID="your-gcp-project-id"
export GCP_REGION="us-central1"
export GEMINI_API_KEY="your-api-key"
export VERCEL_URL="your-app.vercel.app"  # After frontend deployment

# Run deployment script
chmod +x deploy-backend.sh
./deploy-backend.sh
```

### Option 2: Manual Deployment
```bash
cd streamlit_backend/api

# Build the container
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/xam-heid-backend

# Deploy to Cloud Run
gcloud run deploy xam-heid-backend \
    --image gcr.io/YOUR_PROJECT_ID/xam-heid-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --set-env-vars "ENABLE_GEMINI_AI=true,FALLBACK_TO_ML=true,ALLOWED_ORIGINS=https://your-app.vercel.app" \
    --memory 512Mi \
    --port 8080
```

### Option 3: Docker Build + Cloud Run (Two-step)
```bash
# Build locally
cd streamlit_backend/api
docker build -t gcr.io/YOUR_PROJECT_ID/xam-heid-backend .

# Push to Google Container Registry
docker push gcr.io/YOUR_PROJECT_ID/xam-heid-backend

# Deploy
gcloud run deploy xam-heid-backend \
    --image gcr.io/YOUR_PROJECT_ID/xam-heid-backend \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

## Configuration

### Environment Variables
Set these in Cloud Run service configuration:

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key (use Secret Manager) | `AI...` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `https://app.vercel.app` |
| `ENABLE_GEMINI_AI` | Enable/disable Gemini features | `true` |
| `FALLBACK_TO_ML` | Fallback to ML if AI fails | `true` |
| `GEMINI_MODEL` | Gemini model to use | `gemini-pro` |
| `LOG_LEVEL` | Logging verbosity | `INFO` |
| `PORT` | Server port (set by Cloud Run) | `8080` |

### Update CORS after Vercel deployment
```bash
gcloud run services update xam-heid-backend \
    --region us-central1 \
    --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
```

## Testing

### Test health endpoint
```bash
SERVICE_URL=$(gcloud run services describe xam-heid-backend --region us-central1 --format 'value(status.url)')
curl $SERVICE_URL/api/health_check
```

### Test AI insights
```bash
curl -X POST "$SERVICE_URL/api/ai_insights" \
    -H "Content-Type: application/json" \
    -d '{
        "disease": "Heart Disease",
        "year": 2023,
        "min_support": 0.05,
        "min_confidence": 0.6
    }'
```

## CI/CD Integration

### GitHub Actions (Recommended)
Create `.github/workflows/deploy-backend.yml`:

```yaml
name: Deploy Backend to Cloud Run

on:
  push:
    branches:
      - main
    paths:
      - 'streamlit_backend/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - id: 'auth'
        uses: 'google-github-actions/auth@v1'
        with:
          credentials_json: '${{ secrets.GCP_SA_KEY }}'
      
      - name: 'Set up Cloud SDK'
        uses: 'google-github-actions/setup-gcloud@v1'
      
      - name: 'Deploy to Cloud Run'
        run: |
          cd streamlit_backend/api
          gcloud builds submit --tag gcr.io/${{ secrets.GCP_PROJECT_ID }}/xam-heid-backend
          gcloud run deploy xam-heid-backend \
            --image gcr.io/${{ secrets.GCP_PROJECT_ID }}/xam-heid-backend \
            --region us-central1 \
            --platform managed
```

## Monitoring and Logs

### View logs
```bash
gcloud run services logs read xam-heid-backend --region us-central1 --limit 50
```

### Monitor in Google Cloud Console
1. Navigate to Cloud Run in GCP Console
2. Click on `xam-heid-backend` service
3. View Metrics, Logs, and Revisions

## Cost Optimization

- **Auto-scaling**: Min instances = 0, Max instances = 10
- **Resources**: 512Mi memory, 1 CPU (adjust based on load)
- **Timeout**: 300s (for heavy ML operations)
- **Cold starts**: ~2-3 seconds typical

### Free Tier
Cloud Run free tier includes:
- 2 million requests/month
- 360,000 GB-seconds memory
- 180,000 vCPU-seconds

## Troubleshooting

### Issue: CORS errors
**Solution**: Update ALLOWED_ORIGINS to include your Vercel URL

### Issue: Secret not found
**Solution**: Ensure secret exists and service account has access:
```bash
gcloud secrets describe GEMINI_API_KEY
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
    --member="serviceAccount:PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor"
```

### Issue: 503 Service Unavailable
**Solution**: Check logs, increase memory/CPU, or adjust timeout

### Issue: Container fails to start
**Solution**: Test locally first:
```bash
docker build -t test-backend streamlit_backend/api
docker run -p 8000:8000 -e GEMINI_API_KEY=test test-backend
```

## Security Best Practices

1. **Never commit API keys** - Use Secret Manager
2. **Limit CORS origins** - Only allow your Vercel domain
3. **Use HTTPS only** - Cloud Run provides automatic SSL
4. **Regular updates** - Keep dependencies updated
5. **IAM roles** - Follow principle of least privilege

## Architecture

```
┌─────────────────┐
│  Vercel         │
│  (Frontend)     │
└────────┬────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│  Cloud Run      │
│  (Backend API)  │
├─────────────────┤
│  - FastAPI      │
│  - ML Engine    │
│  - Gemini AI    │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  Secret Manager │
│  (API Keys)     │
└─────────────────┘
```
