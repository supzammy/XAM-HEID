# XAM-HEID: Health Equity Intelligence Dashboard

<img width="1438" height="761" alt="Screenshot 2025-11-10 at 3 05 31 AM" src="https://github.com/user-attachments/assets/0b24f05e-0491-4ded-96bd-50bcab3b58ff" />

XAM Health Equity Intelligence Dashboard (XAM HEID) is an **AI-powered platform** that reveals healthcare disparities via synthetic data modeled on hospital records. It uses **Google Gemini AI** and custom machine learning to detect regional and demographic patterns for heart disease, diabetes, and cancer, enabling accessible insights with strict privacy compliance.

# Project Mission
The goal of this project is to democratize access to healthcare data. We empower policymakers, researchers, and public health officials to identify, understand, and address health inequities in the United States.

By simplifying complex datasets and leveraging **AI** to highlight significant, often hidden, patterns, this tool aims to drive data-informed decisions that can lead to more equitable health outcomes for all communities.

# Data Source & Privacy
This dashboard utilizes a synthetically generated dataset designed to mimic the structure and complexity of real-world healthcare information, such as that from the Healthcare Cost and Utilization Project (HCUP). This approach allows for robust development and demonstration without compromising real patient privacy.

A core feature of our methodology is strict adherence to the "Rule of 11". To ensure confidentiality, any data point representing fewer than 11 individuals is suppressed and marked as 'Suppressed' on the map. This is a critical privacy-preserving technique used in public health reporting.

##  Core Features & Methodology
The dashboard quantifies disparities using a **Disparity Index**, calculated as the percentage difference between the highest and lowest values in the currently filtered dataset. A higher index indicates greater inequality across states.

The **AI Policy Advisor** is the heart of the platform, now powered by **Google Gemini AI** for natural language insights and analysis. It provides:
- Real-time AI-driven health equity analysis
- Non-obvious correlation discovery
- Interactive Q&A for data exploration
- Automatic fallback to custom ML when AI is unavailable
- Exportable PDF reports for policy discussions

Users can export both high-fidelity visual reports and AI-generated briefs in PDF format, making insights portable and actionable for policy discussions.


## Project Vision & Evolution

At the outset, our goal was to develop a health equity dashboard that leverages AI and machine learning to identify and visualize healthcare disparities. We envisioned an intuitive, interactive tool that could help policymakers and researchers uncover actionable insights from complex healthcare data.

However, as the project evolved, we went beyond these original expectations. Instead of relying on a generic third-party AI, we developed a **custom machine learning pipeline** designed specifically for health equity analysis. This project now stands as a robust, privacy-first, and scalable platform with extensible ML components and a well-structured backend.

## Key Features & Innovations

- **Google Gemini AI Integration:** Advanced natural language insights powered by Gemini API with intelligent fallback to custom ML when unavailable
- **Custom ML Pipeline:** Association rule mining model (`mlxtend`) to automatically uncover meaningful disparity patterns
- **Synthetic & Privacy-First Data:** Operates on synthetic data with strict adherence to the **"Rule of 11"** for confidentiality
- **⚡ Interactive Frontend:** Dynamic React + TypeScript interface with real-time filtering and visualization
- **Hybrid Cloud Architecture:** Frontend on Vercel, Backend API on Google Cloud Run for optimal scalability
- **Secure API Design:** Environment-based configuration, CORS protection, and Secret Manager integration

## 🛠️ Technology Stack

| Area          | Technologies                                                              |
| :------------ | :------------------------------------------------------------------------ |
| **Frontend**  | `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `Chart.js`, `react-simple-maps` |
| **Backend**   | `Python`, `FastAPI`, `Pandas`, `scikit-learn`, `mlxtend`, `Google Gemini AI` |
| **AI/ML**     | `Google Gemini Pro`, Association Rule Mining, Statistical Analysis |
| **Deployment**| `Vercel` (Frontend), `Google Cloud Run` (Backend), `Docker` |
| **Security**  | `Secret Manager`, Environment Variables, CORS, HTTPS |


# Screenshots:

**Dashboard**

<img width="1433" height="752" alt="Screenshot 2025-11-09 at 7 02 06 AM" src="https://github.com/user-attachments/assets/e0eb5c2a-f870-4454-8eff-f4343950ae0a" />

**About Section**

<img width="1437" height="748" alt="Screenshot 2025-11-10 at 3 07 33 AM" src="https://github.com/user-attachments/assets/b70adb23-470f-4531-a30b-971e558fa187" />
<img width="1435" height="423" alt="Screenshot 2025-11-10 at 3 07 43 AM" src="https://github.com/user-attachments/assets/bf22a461-d55b-4920-aaf6-5e6f3349ccf8" />


**Features**

<img width="416" height="151" alt="Screenshot 2025-11-10 at 3 06 22 AM" src="https://github.com/user-attachments/assets/2127e275-e2c2-43c2-be1e-0b9d7b70979f" />

<img width="424" height="247" alt="Screenshot 2025-11-10 at 3 06 15 AM" src="https://github.com/user-attachments/assets/fbb62994-85b8-42c4-bdb1-809cd8ed5782" />

**More Screenshots**

<img width="1219" height="708" alt="Screenshot 2025-11-10 at 3 05 42 AM" src="https://github.com/user-attachments/assets/894ca7cb-6429-4258-b245-dcc844aaa579" />
<img width="1438" height="761" alt="Screenshot 2025-11-10 at 3 05 31 AM" src="https://github.com/user-attachments/assets/a845905c-3cfb-4aef-83e6-ec9398720611" />
<img width="1430" height="750" alt="Screenshot 2025-11-10 at 3 05 08 AM" src="https://github.com/user-attachments/assets/8d28ee5b-bda3-44b5-bf18-805b6b7e8640" />


## Architecture

### Hybrid Cloud Deployment

```
┌─────────────────────────────────────────────────────────────┐
│                         Users                               │
│                    (Global Access)                          │
└──────────────┬────────────────────────┬─────────────────────┘
               │                        │
         HTTPS │                        │ HTTPS
               ↓                        ↓
    ┌──────────────────┐     ┌──────────────────┐
    │   Vercel CDN     │     │  Google Cloud    │
    │   (Frontend)     │────→│  Run (Backend)   │
    ├──────────────────┤     ├──────────────────┤
    │ • React SPA      │     │ • FastAPI        │
    │ • TypeScript     │     │ • Gemini AI      │
    │ • Vite Build     │     │ • ML Engine      │
    │ • Auto SSL       │     │ • Secret Mgr     │
    └──────────────────┘     └──────────────────┘
```

### Data Flow

1. **User Interaction** → Frontend (Vercel)
2. **API Requests** → Backend (Cloud Run) via HTTPS
3. **AI Processing** → Gemini API (if available) or ML fallback
4. **Data Privacy** → Rule of 11 applied before returning
5. **Response** → JSON back to frontend
6. **Visualization** → Interactive charts and maps

## 🚦 Local Development

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+ and pip
- Google Gemini API key (get from [Google AI Studio](https://makersuite.google.com/app/apikey))

### 1. Environment Setup

**Frontend (.env.local)**
```bash
# Copy example file
cp .env.example .env.local

# Edit .env.local
VITE_API_BASE_URL=http://localhost:8000
VITE_ENABLE_AI_FEATURES=true
```

**Backend (streamlit_backend/api/.env)**
```bash
# Copy example file
cp streamlit_backend/api/.env.example streamlit_backend/api/.env

# Edit streamlit_backend/api/.env
GEMINI_API_KEY=your_api_key_here
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
ENABLE_GEMINI_AI=true
FALLBACK_TO_ML=true
```

### 2. Running the Frontend
From the project root directory:
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```
The frontend will be available at `http://localhost:3000`.

### 3. Running the Backend
Navigate to the API directory and run the server:
```bash
# Go to the backend API directory
cd streamlit_backend/api

# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload --port 8000
```
The backend API will be available at `http://127.0.0.1:8000`.

### 4. Verify Integration
- Open `http://localhost:3000` in your browser
- Check browser console for API connection status
- Test AI Policy Advisor by selecting filters and clicking "Analyze"
- Should see Gemini AI insights if API key is configured correctly

## Testing

### Run Backend Tests
```bash
cd streamlit_backend/api
pytest test_*.py -v
```

### Test Coverage
```bash
pytest --cov=. --cov-report=html
```

### Manual Testing Checklist
- [ ] Frontend loads without errors
- [ ] Backend health check returns OK
- [ ] Data filtering works
- [ ] Map visualization updates
- [ ] AI insights generate (Gemini or ML fallback)
- [ ] Q&A responds correctly
- [ ] PDF export functions
- [ ] CORS works across origins

##  Deployment

### Frontend Deployment (Vercel)

**Quick Deploy:**
1. Push code to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Set environment variables:
   - `VITE_API_BASE_URL`: Your Cloud Run backend URL
   - `VITE_ENABLE_AI_FEATURES`: `true`
4. Deploy automatically

**Detailed Guide:** See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

### Backend Deployment (Google Cloud Run)

**Automated Deployment:**
```bash
# Set environment variables
export GCP_PROJECT_ID="your-project-id"
export GEMINI_API_KEY="your-api-key"
export VERCEL_URL="your-app.vercel.app"

# Run deployment script
chmod +x deploy-backend.sh
./deploy-backend.sh
```

**Manual Deployment:**
```bash
cd streamlit_backend/api

# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/xam-heid-backend
gcloud run deploy xam-heid-backend \
  --image gcr.io/PROJECT_ID/xam-heid-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets "GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

**Detailed Guide:** See [DEPLOYMENT.md](./DEPLOYMENT.md)

### Post-Deployment

1. **Update Frontend Environment**
   ```bash
   # In Vercel dashboard, set:
   VITE_API_BASE_URL=https://your-backend-xyz.run.app
   ```

2. **Update Backend CORS**
   ```bash
   gcloud run services update xam-heid-backend \
     --update-env-vars ALLOWED_ORIGINS=https://your-app.vercel.app
   ```

3. **Test Integration**
   - Visit your Vercel URL
   - Open browser console
   - Verify no CORS errors
   - Test AI features

## 🔐 Security & Privacy

## 🔐 Security & Privacy

### Data Privacy - Rule of 11
All data is **synthetically generated** and strictly adheres to the "Rule of 11":
- Any data point representing <11 individuals is suppressed
- Marked as "Suppressed" on visualizations
- Prevents identification of small groups
- Compliant with healthcare privacy standards

### API Security
- **Environment Variables**: Sensitive keys never committed to code
- **Secret Manager**: Google Cloud Secret Manager for production
- **CORS**: Restricted to authorized origins only
- **HTTPS**: Enforced on all production endpoints
- **Rate Limiting**: Configurable request limits

### Secure Deployment Checklist
- [x] API keys in environment variables
- [x] CORS configured for specific domains
- [x] HTTPS enforced (auto via Vercel & Cloud Run)
- [x] Secrets in Google Secret Manager
- [x] No sensitive data in client-side code
- [x] Regular dependency updates

## 📚 API Documentation

### Base URL
- **Development**: `http://localhost:8000`
- **Production**: `https://your-backend-xyz.run.app`

### Endpoints

#### `GET /api/health_check`
Health check with service status
```json
{
  "status": "healthy",
  "services": {
    "ml_engine": "active",
    "gemini_ai": "active"
  }
}
```

#### `POST /api/ai_insights`
Get AI-driven health equity insights (NEW)
```json
{
  "disease": "Heart Disease",
  "year": 2023,
  "demographics": {"Age": "65+"}
}
```

#### `POST /api/mine_patterns`
ML pattern mining (legacy, still supported)
```json
{
  "disease": "Diabetes",
  "year": 2023,
  "min_support": 0.05
}
```

#### `POST /qa`
Ask questions about the data (AI-enhanced)
```json
{
  "disease": "Cancer",
  "year": 2023,
  "query": "What are the main disparities?"
}
```

##  Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Development Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure tests pass before submitting PR

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- Healthcare Cost and Utilization Project (HCUP) for data inspiration
- Google Gemini AI for advanced natural language processing
- Open source community for amazing tools and libraries

##  Contact

- **Repository**: [github.com/supzammy/XAM-HEID](https://github.com/supzammy/XAM-HEID)
- **Demo**: [xamheid.vercel.app](https://xamheid.vercel.app)
- **Issues**: [GitHub Issues](https://github.com/supzammy/XAM-HEID/issues)

---

**Built with ❤️ for health equity | Powered by Google Gemini AI & Custom ML**
