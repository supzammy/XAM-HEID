# XAM-HEID
XAM Health Equity Intelligence Dashboard (XAM HEID) is an AI-powered platform that reveals healthcare disparities via synthetic data modeled on hospital records. It uses machine learning to detect regional and demographic patterns for heart disease, diabetes, and cancer, enabling accessible insights with strict privacy compliance.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. If the application requires API keys or other secrets, create a `.env.local` file and add them there.
3. Run the app:
   `npm run dev`

## Deploying the Frontend to Vercel

We recommend deploying the React/Vite frontend to Vercel as a static site. The repository includes a `vercel.json` that tells Vercel to build the project using the `dist` output produced by `vite build`.

**Steps:**

1. Commit and push your branch to GitHub.
2. Go to https://vercel.com and import your GitHub repository (New Project -> Import Git Repository).
3. Vercel will detect the project. Ensure the Build Command is `npm run build` and the Output Directory is `dist`.
4. Set any environment variables required by your app (for example, an API URL) in the Vercel project settings under "Environment Variables".
5. Deploy. The site will be available on a vercel.app URL.

## Notes about the ML Backend

- Vercel is ideal for serving the frontend. For the Python ML backend (pattern mining / QA), we recommend a separate hosting option (like Google Cloud Run, Render, or Railway) because the model workloads may require long-running processes and specific Python runtime support.
- The backend is a FastAPI service, and a `Dockerfile` is included for easy containerization and deployment.
