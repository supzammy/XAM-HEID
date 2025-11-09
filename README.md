<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tB_oGdeZxuo-WklqeCqz9yHKDw93l72b

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploying the frontend to Vercel

We recommend deploying the React/Vite frontend to Vercel as a static site. The repository includes a `vercel.json` that tells Vercel to build the project using the `dist` output produced by `vite build`.

Steps:

1. Commit and push your branch to GitHub.
2. Go to https://vercel.com and import your GitHub repository (New Project -> Import Git Repository).
3. Vercel will detect the project. Ensure the Build Command is `npm run build` and the Output Directory is `dist`.
4. Set any environment variables required by your app (for example, an API URL) in the Vercel project settings under "Environment Variables".
5. Deploy. The site will be available on a vercel.app URL.

Notes about the ML backend

- Vercel is ideal for serving the frontend. For the Python ML backend (pattern mining / QA), we recommend a separate hosting option (Cloud Run, Render, Railway, or a container on any provider) because the model workloads may require long-running processes and Python runtime support.
- If you want to host lightweight Python endpoints on Vercel, it's possible with Vercel Serverless Functions (Python) but has limitations. I can scaffold a FastAPI service and Dockerfile and show you how to deploy to Render or Cloud Run.

