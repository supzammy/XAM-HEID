# XAM-HEID: Health Equity Intelligence Dashboard
**A Submission for LaserHack 2025 (HealthTech & AI Themes)**

<img width="1438" height="761" alt="Screenshot 2025-11-10 at 3 05 31 AM" src="https://github.com/user-attachments/assets/0b24f05e-0491-4ded-96bd-50bcab3b58ff" />

XAM Health Equity Intelligence Dashboard (XAM HEID) is an AI-powered platform that reveals healthcare disparities via synthetic data modeled on hospital records. It uses machine learning to detect regional and demographic patterns for heart disease, diabetes, and cancer, enabling accessible insights with strict privacy compliance.

# Project Mission
The goal of this project is to democratize access to healthcare data. We empower policymakers, researchers, and public health officials to identify, understand, and address health inequities in the United States.

By simplifying complex datasets and leveraging AI to highlight significant, often hidden, patterns, this tool aims to drive data-informed decisions that can lead to more equitable health outcomes for all communities.

# Data Source & Privacy
This dashboard utilizes a synthetically generated dataset designed to mimic the structure and complexity of real-world healthcare information, such as that from the Healthcare Cost and Utilization Project (HCUP). This approach allows for robust development and demonstration without compromising real patient privacy.

A core feature of our methodology is strict adherence to the "Rule of 11". To ensure confidentiality, any data point representing fewer than 11 individuals is suppressed and marked as 'Suppressed' on the map. This is a critical privacy-preserving technique used in public health reporting.

# Core Features & Methodology
The dashboard quantifies disparities using a Disparity Index, calculated as the percentage difference between the highest and lowest values in the currently filtered dataset. A higher index indicates greater inequality across states.

The AI Policy Advisor is the heart of the platform, powered by ML custom made model but in future, if everything goes as planned - we will just use AI cuz its better. Right now I'm not using AI cuz I don't get the funds to get APIs. anyways, I've checked it myself locally. It performs a real-time analysis of the entire dataset for a selected year to uncover non-obvious correlations, provide an instant summary, identify key patterns, and offer an interactive chat to explore the data further.

Users can export both a high-fidelity visual report of the dashboard and a text-based AI Brief in PDF format, making insights portable and actionable for policy discussions.


## Project Vision & Evolution

At the outset, our goal was to develop a health equity dashboard that leverages AI and machine learning to identify and visualize healthcare disparities. We envisioned an intuitive, interactive tool that could help policymakers and researchers uncover actionable insights from complex healthcare data.

However, as the project evolved, we went beyond these original expectations. Instead of relying on a generic third-party AI, we developed a **custom machine learning pipeline** designed specifically for health equity analysis. This project now stands as a robust, privacy-first, and scalable platform with extensible ML components and a well-structured backend.

## Key Features & Innovations

- **Custom ML Pipeline:** The backend uses an association rule mining model (`mlxtend`) to automatically uncover meaningful disparity patterns from the data, providing deeper insights than simple data visualization.
- **Synthetic & Privacy-First Data:** The system operates on synthetic data designed to replicate real-world healthcare records. It strictly adheres to the **"Rule of 11,"** suppressing any data point representing fewer than 11 individuals to guarantee confidentiality.
- **Interactive Frontend:** A dynamic and responsive interface built with React and TypeScript allows users to filter data by condition, year, and demographic group, with immediate updates to maps and charts.
- **Decoupled & Scalable Architecture:** The frontend is a standalone static application, communicating with a powerful FastAPI backend that handles all data processing and machine learning workloads. The backend is containerized with Docker for easy deployment.

## Technology Stack

| Area      | Technologies                                                              |
| :-------- | :------------------------------------------------------------------------ |
| **Frontend**  | `React`, `TypeScript`, `Vite`, `Tailwind CSS`, `Chart.js`, `react-simple-maps` |
| **Backend**   | `Python`, `FastAPI`, `Pandas`, `scikit-learn`, `mlxtend`                    |
| **Deployment**| `Vercel` (Frontend), `Docker` (Backend)                                   |


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


## Local Development

### Prerequisites
- Node.js and npm
- Python 3.9+ and pip

### 1. Running the Frontend
From the project root directory:
```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```
The frontend will be available at `http://localhost:3000`.

### 2. Running the Backend
Navigate to the API directory and run the server:
```bash
# Go to the backend API directory
cd streamlit_backend/api

# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn main:app --reload
```
The backend API will be available at `http://127.0.0.1:8000`.

## Deployment

### Frontend on Vercel
The frontend is configured for seamless deployment to Vercel.
1.  Push your code to a GitHub repository.
2.  Import the repository into Vercel.
3.  Vercel will automatically detect the Vite configuration. Use the default settings:
    - **Build Command:** `npm run build`
    - **Output Directory:** `dist`
4.  Deploy.

### Backend with Docker
The backend is containerized for portability and can be deployed to any service that supports Docker containers (e.g., Google Cloud Run, AWS Fargate, Render, Railway).
```bash
# From the streamlit_backend/api directory
docker build -t xam-heid-backend .
docker run -p 8000:8000 xam-heid-backend
```
