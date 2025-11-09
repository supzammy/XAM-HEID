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

      // Instead of calling an AI, we now call our own backend's ML endpoint.
      const response = await fetch('http://127.0.0.1:8000/api/mine_patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          data: yearData,
          disease: currentFilters.disease,
          // These parameters can be adjusted for more/less strict pattern mining
          min_support: 0.2, 
          min_confidence: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`Backend error: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Transform the backend's association rules into the format the UI expects.
      const transformedAnalysis: AnalysisResponse = {
        summary: `Found ${result.rules.length} potential correlation patterns for **${currentFilters.disease}** in **${currentFilters.year}**. These patterns highlight relationships between different demographic factors.`,
        patterns: result.rules.map((rule: any) => ({
          title: `Pattern: ${rule.antecedents.join(', ')} → ${rule.consequents.join(', ')}`,
          description: `When we see high rates in '${rule.antecedents.join(' & ')}', there's a ${Math.round(rule.confidence * 100)}% chance of also seeing high rates in '${rule.consequents.join(' & ')}'. This pattern appeared in ${Math.round(rule.support * 100)}% of the analyzed areas.`,
        })),
        questions: [], // AI-generated questions are removed.
      };

      if (latestFilters.current === currentFilters) {
        setAnalysis(transformedAnalysis);
      }

    } catch (error) {
      console.error("Error fetching patterns from backend:", error);
       if (latestFilters.current === currentFilters) {
        setAnalysis({ summary: "Sorry, I couldn't connect to the backend ML service. Please ensure the backend is running and try again.", patterns: [], questions: [] });
      }
    } finally {
       if (latestFilters.current === currentFilters) {
        setIsAnalyzing(false);
      }
    }
  }, [fullDataset, setAnalysis]);

  useEffect(() => {
    latestFilters.current = filters;
    fetchInsights(filters);
  }, [filters, fetchInsights]);


  return (
    <div className="bg-brand-surface bg-opacity-70 p-4 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="font-semibold text-brand-teal">ML Pattern Analysis</h3>
      </div>
      
      <div ref={chatHistoryRef} className="flex-grow space-y-3 overflow-y-auto pr-2 min-h-0">
        {/* Analysis & Patterns Section */}
        <div className="bg-black bg-opacity-25 p-3 rounded-md mb-3 border border-gray-700 flex-shrink-0">
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
      </div>
    </div>
  );
};

export default AIPolicyAdvisor;