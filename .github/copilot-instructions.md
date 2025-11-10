<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization -->

# XAM-HEID Project Instructions

## Project Overview
XAM-HEID is a health equity intelligence dashboard with hybrid cloud architecture:
- **Frontend**: React + TypeScript + Vite deployed on Vercel
- **Backend**: FastAPI + Google Gemini AI + ML deployed on Google Cloud Run
- **AI Integration**: Google Gemini Pro with ML fallback

## Key Features
- Google Gemini AI for health equity insights
- Custom ML pattern mining (association rules)
- Privacy-first (Rule of 11)
- Hybrid deployment (Vercel + Cloud Run)
- Secure environment variable management

## Development Workflow

### Local Development
1. Set up environment variables (see .env.example files)
2. Run frontend: `npm run dev` (port 3000)
3. Run backend: `cd streamlit_backend/api && uvicorn main:app --reload` (port 8000)

### Testing
- Backend tests: `cd streamlit_backend/api && pytest test_*.py -v`
- Manual testing checklist in README.md

### Deployment
- Frontend: Auto-deploy to Vercel on push to main
- Backend: Use `./deploy-backend.sh` or manual gcloud commands
- See DEPLOYMENT.md and VERCEL_DEPLOYMENT.md for details

## Code Style
- TypeScript/React: Follow existing patterns
- Python: PEP 8, type hints where applicable
- Comments: Explain "why" not "what"
- Security: Never commit API keys or secrets

## Architecture Notes
- API calls use `services/apiService.ts` (not direct fetch)
- AI service has automatic fallback to ML
- CORS configured for Vercel domain
- All secrets in environment variables or Secret Manager
