import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RawStateData, Disease, AnalysisResponse } from '../types';

interface AIPolicyAdvisorProps {
  fullDataset: Record<number, RawStateData[]>;
  filters: {
    disease: string;
    demographic: string;
    subCategory: string | null;
    year: number;
  };
  analysis: AnalysisResponse | null;
  setAnalysis: (analysis: AnalysisResponse | null) => void;
}

// A simple component to render markdown-like text
const MarkdownRenderer: React.FC<{ text: string }> = ({ text }) => {
    const lines = text.split('\n').filter(line => line.trim() !== '');
    return (
        <div className="space-y-2 text-sm">
            {lines.map((line, index) => {
                const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>');
                return <p key={index} dangerouslySetInnerHTML={{ __html: bolded }} />;
            })}
        </div>
    );
};

const AIPolicyAdvisor: React.FC<AIPolicyAdvisorProps> = ({ fullDataset, filters, analysis, setAnalysis }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [questionInput, setQuestionInput] = useState('');
  const [isAnswering, setIsAnswering] = useState(false);
  const [qaAnswer, setQaAnswer] = useState<string | null>(null);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  const latestFilters = useRef(filters);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [isAnalyzing, analysis]);

  const fetchInsights = useCallback(async (currentFilters: typeof filters) => {
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const yearData = fullDataset[currentFilters.year];
      if (!yearData) throw new Error("No data for selected year");

      // The backend loads its own data, so we only need to send filters.
      const demographics: Record<string, string> = {};
      if (currentFilters.demographic && currentFilters.subCategory) {
        demographics[currentFilters.demographic] = currentFilters.subCategory;
      }

      // Use environment variable for backend URL, fallback to localhost for development
      const backendUrl = 'http://127.0.0.1:8000';
      
      console.log('Calling backend:', `${backendUrl}/api/mine_patterns`);
      console.log('Filters:', { disease: currentFilters.disease, year: currentFilters.year, demographics });
      
      const response = await fetch(`${backendUrl}/api/mine_patterns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          disease: currentFilters.disease,
          year: currentFilters.year,
          demographics: demographics,
          min_support: 0.01,  // Lowered from 0.1 to find more patterns
          min_confidence: 0.3  // Lowered from 0.5 to find more patterns
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error:', response.status, errorText);
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Backend response:', result);
      
      // Transform the backend's association rules into the format the UI expects.
      const transformedAnalysis: AnalysisResponse = {
        summary: result.rules.length > 0 
          ? `Found ${result.rules.length} potential correlation patterns for **${currentFilters.disease}** in **${currentFilters.year}**. These patterns highlight relationships between different demographic factors.`
          : `No significant patterns found for **${currentFilters.disease}** in **${currentFilters.year}** with the current demographic filters. Try adjusting filters or the ML model found insufficient data to generate reliable patterns (Rule of 11 privacy protection may have suppressed small sample sizes).`,
        patterns: result.rules.map((rule: any) => ({
          title: `Pattern: ${rule.antecedent.join(', ')} → ${rule.consequent.join(', ')}`,
          description: `When we see high rates in '${rule.antecedent.join(' & ')}', there's a ${Math.round(rule.confidence * 100)}% chance of also seeing high rates in '${rule.consequent.join(' & ')}'. This pattern appeared in ${Math.round(rule.support * 100)}% of the analyzed areas.`,
        })),
        questions: [], // AI-generated questions are removed.
      };

      if (latestFilters.current === currentFilters) {
        setAnalysis(transformedAnalysis);
      }

    } catch (error) {
      console.error("Error fetching patterns from backend:", error);
      if (latestFilters.current === currentFilters) {
        setAnalysis({ 
          summary: "Sorry, I couldn't connect to the backend ML service. Please ensure the backend is running at http://localhost:8000 and try again.", 
          patterns: [], 
          questions: [] 
        });
      }
    } finally {
      if (latestFilters.current === currentFilters) {
        setIsAnalyzing(false);
      }
    }
  }, [fullDataset, setAnalysis]);

  const askQuestion = async () => {
    if (!questionInput.trim()) return;
    
    setIsAnswering(true);
    setQaAnswer(null);
    
    try {
      const backendUrl = 'http://127.0.0.1:8000';
      const demographics: Record<string, string> = {};
      if (filters.demographic && filters.subCategory) {
        demographics[filters.demographic] = filters.subCategory;
      }

      console.log('Asking question:', questionInput);
      
      const response = await fetch(`${backendUrl}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disease: filters.disease,
          year: filters.year,
          demographics: demographics,
          query: questionInput
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('QA response:', result);
      setQaAnswer(result.answer || 'No answer available');
      
    } catch (error) {
      console.error("Error asking question:", error);
      setQaAnswer("Sorry, I couldn't process your question. Please ensure the backend is running.");
    } finally {
      setIsAnswering(false);
    }
  };

  useEffect(() => {
    latestFilters.current = filters;
    fetchInsights(filters);
  }, [filters, fetchInsights]);


  return (
    <div className="bg-brand-surface bg-opacity-70 p-3 md:p-4 rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="text-sm md:text-base font-semibold text-brand-teal">ML Pattern Analysis</h3>
      </div>
      
      <div ref={chatHistoryRef} className="flex-grow space-y-3 overflow-y-auto pr-1 md:pr-2 min-h-0 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Analysis & Patterns Section */}
        <div className="bg-black bg-opacity-25 p-2.5 md:p-3 rounded-md mb-3 border border-gray-700 flex-shrink-0">
          {isAnalyzing && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse"></div><span>Analyzing dataset with local ML model...</span>
              </div>
          )}
          {!isAnalyzing && analysis && (
              <div className="space-y-4">
                  <div>
                      <h4 className="text-sm font-bold text-brand-teal mb-1">Summary</h4>
                      <MarkdownRenderer text={analysis.summary} />
                  </div>
                  {analysis.patterns.length > 0 && (
                      <div>
                          <h4 className="text-sm font-bold text-brand-teal mb-2">Discovered Patterns</h4>
                          <div className="space-y-2">
                          {analysis.patterns.map((pattern, i) => (
                              <div key={i} className="p-2 bg-gray-900 bg-opacity-50 rounded-md">
                                  <p className="font-semibold text-white text-sm">{pattern.title}</p>
                                  <p className="text-xs text-gray-300">{pattern.description}</p>
                              </div>
                          ))}
                          </div>
                      </div>
                  )}
              </div>
          )}
        </div>

        {/* Q&A Section */}
        <div className="bg-black bg-opacity-25 p-2.5 md:p-3 rounded-md border border-gray-700 flex-shrink-0">
          <h4 className="text-xs md:text-sm font-bold text-brand-teal mb-2">Ask a Question</h4>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={questionInput}
              onChange={(e) => setQuestionInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !isAnswering && questionInput.trim() && askQuestion()}
              placeholder="e.g., Which state has the highest rate?"
              className="flex-1 bg-gray-900 text-white px-3 py-2.5 md:py-2 rounded-md text-xs md:text-sm border border-gray-600 focus:outline-none focus:border-brand-teal touch-manipulation"
              disabled={isAnswering}
            />
            <button
              onClick={askQuestion}
              disabled={isAnswering || !questionInput.trim()}
              className="w-full sm:w-auto px-4 py-2.5 md:py-2 bg-brand-teal text-brand-bg font-semibold rounded-md hover:bg-opacity-80 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm touch-manipulation"
            >
              {isAnswering ? 'Asking...' : 'Ask'}
            </button>
          </div>
          
          {qaAnswer && (
            <div className="mt-3 p-2 md:p-2.5 bg-gray-900 bg-opacity-50 rounded-md">
              <p className="text-xs md:text-sm text-gray-300 break-words">{qaAnswer}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIPolicyAdvisor;