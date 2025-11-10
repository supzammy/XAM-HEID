/**
 * API Configuration Service
 * Handles backend API URL resolution for local dev and production (Vercel + Cloud Run)
 */

/**
 * Get the backend API base URL based on environment
 * - Local dev: http://localhost:8000 or http://<device-ip>:8000 for mobile testing
 * - Production: Google Cloud Run URL set via VITE_API_BASE_URL
 */
export function getApiBaseUrl(): string {
  // Check for environment variable (set in Vercel or .env.local)
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  
  if (envUrl) {
    return envUrl;
  }
  
  // Fallback for local development
  // Allow mobile devices on same network to connect
  if (typeof window !== 'undefined' && window.location.hostname) {
    const host = window.location.hostname;
    const proto = window.location.protocol;
    
    // If accessing via localhost, use localhost for backend too
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
    
    // If accessing via network IP (e.g., mobile device), use same IP for backend
    return `${proto}//${host}:8000`;
  }
  
  // Ultimate fallback
  return 'http://127.0.0.1:8000';
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  const enabled = import.meta.env.VITE_ENABLE_AI_FEATURES;
  return enabled === undefined || enabled === 'true';
}

/**
 * API client for backend requests
 */
export const api = {
  /**
   * Filter data by disease, year, and demographics
   */
  async filter(params: {
    disease: string;
    year?: number;
    demographics?: Record<string, string>;
  }) {
    const response = await fetch(`${getApiBaseUrl()}/filter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`Filter API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Mine patterns using association rules (ML-only)
   */
  async minePatterns(params: {
    disease: string;
    year?: number;
    demographics?: Record<string, string>;
    min_support?: number;
    min_confidence?: number;
  }) {
    const response = await fetch(`${getApiBaseUrl()}/api/mine_patterns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        min_support: 0.01,
        min_confidence: 0.3,
        ...params,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`Pattern mining API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Get AI-driven insights (NEW - uses Gemini API with ML fallback)
   */
  async getAIInsights(params: {
    disease: string;
    year?: number;
    demographics?: Record<string, string>;
    min_support?: number;
    min_confidence?: number;
  }) {
    const response = await fetch(`${getApiBaseUrl()}/api/ai_insights`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        min_support: 0.05,
        min_confidence: 0.6,
        ...params,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`AI insights API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Ask a question (enhanced with Gemini AI)
   */
  async askQuestion(params: {
    disease: string;
    year?: number;
    demographics?: Record<string, string>;
    query: string;
  }) {
    const response = await fetch(`${getApiBaseUrl()}/qa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    
    if (!response.ok) {
      throw new Error(`QA API error: ${response.statusText}`);
    }
    
    return response.json();
  },

  /**
   * Health check
   */
  async healthCheck() {
    const response = await fetch(`${getApiBaseUrl()}/api/health_check`);
    
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    
    return response.json();
  },
};
