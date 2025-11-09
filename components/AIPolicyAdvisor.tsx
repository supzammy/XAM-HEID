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
      // Temporary: Skip backend call for Vercel deployment
      // Show a placeholder message instead
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate loading

      const transformedAnalysis: AnalysisResponse = {
        summary: `ML Pattern Analysis for **${currentFilters.disease}** in **${currentFilters.year}** is currently being prepared. The advanced pattern mining backend will be deployed soon to provide deep insights into health equity disparities across demographics.`,
        patterns: [
          {
            title: "Backend Deployment In Progress",
            description: "The ML-powered association rule mining engine is being deployed. Once live, it will analyze demographic patterns and correlations to identify actionable insights for reducing health disparities."
          }
        ],
        questions: [],
      };

      if (latestFilters.current === currentFilters) {
        setAnalysis(transformedAnalysis);
      }

    } catch (error) {
      console.error("Error:", error);
      if (latestFilters.current === currentFilters) {
        setAnalysis({ 
          summary: "ML Pattern Analysis will be available soon. The dashboard's interactive map and charts are fully functional.", 
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