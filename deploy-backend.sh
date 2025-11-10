#!/bin/bash
# Google Cloud Run Deployment Script for XAM-HEID Backend
# This script builds and deploys the backend API to Google Cloud Run

set -e  # Exit on error

# Configuration
PROJECT_ID="${GCP_PROJECT_ID:-your-gcp-project-id}"
REGION="${GCP_REGION:-us-central1}"
SERVICE_NAME="xam-heid-backend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== XAM-HEID Backend Deployment to Google Cloud Run ===${NC}"
echo ""

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}Error: gcloud CLI is not installed${NC}"
    echo "Please install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if required environment variables are set
if [ "$PROJECT_ID" == "your-gcp-project-id" ]; then
    echo -e "${YELLOW}Warning: GCP_PROJECT_ID not set. Please set it:${NC}"
    echo "  export GCP_PROJECT_ID=your-actual-project-id"
    exit 1
fi

# Check if GEMINI_API_KEY is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${YELLOW}Warning: GEMINI_API_KEY not set${NC}"
    echo "The application will run in ML-only mode without AI features."
    echo "To enable AI features, set: export GEMINI_API_KEY=your-api-key"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo -e "${GREEN}Step 1: Authenticating with Google Cloud${NC}"
gcloud auth login --brief

echo -e "${GREEN}Step 2: Setting project${NC}"
gcloud config set project "$PROJECT_ID"

echo -e "${GREEN}Step 3: Enabling required APIs${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

echo -e "${GREEN}Step 4: Building Docker image${NC}"
cd streamlit_backend/api
gcloud builds submit --tag "$IMAGE_NAME" .

echo -e "${GREEN}Step 5: Deploying to Cloud Run${NC}"

# Prepare environment variables
ENV_VARS="ENABLE_GEMINI_AI=true"
ENV_VARS="${ENV_VARS},FALLBACK_TO_ML=true"
ENV_VARS="${ENV_VARS},GEMINI_MODEL=gemini-pro"
ENV_VARS="${ENV_VARS},LOG_LEVEL=INFO"
ENV_VARS="${ENV_VARS},PORT=8080"

# Get the Vercel frontend URL if available
if [ -n "$VERCEL_URL" ]; then
    ENV_VARS="${ENV_VARS},ALLOWED_ORIGINS=https://${VERCEL_URL},http://localhost:3000,http://localhost:5173"
else
    ENV_VARS="${ENV_VARS},ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173"
    echo -e "${YELLOW}Note: VERCEL_URL not set. Update ALLOWED_ORIGINS after Vercel deployment${NC}"
fi

# Deploy to Cloud Run
gcloud run deploy "$SERVICE_NAME" \
    --image "$IMAGE_NAME" \
    --platform managed \
    --region "$REGION" \
    --allow-unauthenticated \
    --set-env-vars "$ENV_VARS" \
    --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest" \
    --memory 512Mi \
    --cpu 1 \
    --timeout 300 \
    --max-instances 10 \
    --min-instances 0 \
    --port 8080

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo ""

# Get the service URL
SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --platform managed --region "$REGION" --format 'value(status.url)')

echo -e "${GREEN}Backend API URL:${NC} $SERVICE_URL"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test the API: curl $SERVICE_URL/api/health_check"
echo "2. Update your frontend .env with: VITE_API_BASE_URL=$SERVICE_URL"
echo "3. If you haven't set GEMINI_API_KEY as a secret, run:"
echo "   echo -n 'your-api-key' | gcloud secrets create GEMINI_API_KEY --data-file=-"
echo ""
echo -e "${GREEN}To update CORS for Vercel after frontend deployment:${NC}"
echo "  gcloud run services update $SERVICE_NAME --region $REGION \\"
echo "    --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app"
echo ""
