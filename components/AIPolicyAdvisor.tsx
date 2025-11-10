import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RawStateData, Disease, AnalysisResponse } from '../types';
import { api, isAIEnabled } from '../services/apiService';

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
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
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
    setHasAnalyzed(true);

    try {
      const yearData = fullDataset[currentFilters.year];
      if (!yearData) throw new Error("No data for selected year");

      // Build demographics filter
      const demographics: Record<string, string> = {};
      if (currentFilters.demographic && currentFilters.subCategory) {
        demographics[currentFilters.demographic] = currentFilters.subCategory;
      }

      console.log('Fetching insights for:', { 
        disease: currentFilters.disease, 
        year: currentFilters.year, 
        demographics,
        aiEnabled: isAIEnabled()
      });

      // Use AI insights endpoint if enabled, otherwise use pattern mining
      const result = isAIEnabled()
        ? await api.getAIInsights({
            disease: currentFilters.disease,
            year: currentFilters.year,
            demographics,
          })
        : await api.minePatterns({
            disease: currentFilters.disease,
            year: currentFilters.year,
            demographics,
          });

      console.log('Backend response:', result);

      // Transform response based on source
      let transformedAnalysis: AnalysisResponse;

      if (result.source === 'gemini_ai') {
        // AI-enhanced insights
        transformedAnalysis = {
          summary: result.insights || 'AI insights generated successfully.',
          patterns: (result.ml_patterns || []).map((rule: any) => ({
            title: `Pattern: ${rule.antecedent?.join(', ') || 'N/A'} → ${rule.consequent?.join(', ') || 'N/A'}`,
            description: `When we see high rates in '${rule.antecedent?.join(' & ')}', there's a ${Math.round((rule.confidence || 0) * 100)}% chance of also seeing high rates in '${rule.consequent?.join(' & ')}'. This pattern appeared in ${Math.round((rule.support || 0) * 100)}% of the analyzed areas.`,
          })),
          questions: [],
          aiSource: 'Gemini AI',
        };
      } else if (result.source === 'ml_only') {
        // ML-only fallback
        transformedAnalysis = {
          summary: result.insights || `Analysis complete for **${currentFilters.disease}** in **${currentFilters.year}**.`,
          patterns: (result.ml_patterns || []).map((rule: any) => ({
            title: `Pattern: ${rule.antecedent?.join(', ') || 'N/A'} → ${rule.consequent?.join(', ') || 'N/A'}`,
            description: `When we see high rates in '${rule.antecedent?.join(' & ')}', there's a ${Math.round((rule.confidence || 0) * 100)}% chance of also seeing high rates in '${rule.consequent?.join(' & ')}'. This pattern appeared in ${Math.round((rule.support || 0) * 100)}% of the analyzed areas.`,
          })),
          questions: [],
          aiSource: 'ML Pattern Mining',
        };
      } else {
        // Legacy pattern mining response
        const rules = result.rules || [];
        transformedAnalysis = {
          summary: rules.length > 0
            ? `Found ${rules.length} potential correlation patterns for **${currentFilters.disease}** in **${currentFilters.year}**. These patterns highlight relationships between different demographic factors.`
            : `No significant patterns found for **${currentFilters.disease}** in **${currentFilters.year}** with the current demographic filters. Try adjusting filters or the ML model found insufficient data to generate reliable patterns (Rule of 11 privacy protection may have suppressed small sample sizes).`,
          patterns: rules.map((rule: any) => ({
            title: `Pattern: ${rule.antecedent.join(', ')} → ${rule.consequent.join(', ')}`,
            description: `When we see high rates in '${rule.antecedent.join(' & ')}', there's a ${Math.round(rule.confidence * 100)}% chance of also seeing high rates in '${rule.consequent.join(' & ')}'. This pattern appeared in ${Math.round(rule.support * 100)}% of the analyzed areas.`,
          })),
          questions: [],
          aiSource: 'Association Rule Mining',
        };
      }

      if (latestFilters.current === currentFilters) {
        setAnalysis(transformedAnalysis);
      }

    } catch (error) {
      console.error("Error fetching insights from backend:", error);
      if (latestFilters.current === currentFilters) {
        setAnalysis({
          summary: `Sorry, couldn't connect to the backend service. ${error instanceof Error ? error.message : 'Please try again.'}`,
          patterns: [],
          questions: [],
          aiSource: 'Error',
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
      const demographics: Record<string, string> = {};
      if (filters.demographic && filters.subCategory) {
        demographics[filters.demographic] = filters.subCategory;
      }

      console.log('Asking question:', questionInput);
      
      const result = await api.askQuestion({
        disease: filters.disease,
        year: filters.year,
        demographics,
        query: questionInput,
      });

      console.log('QA response:', result);
      setQaAnswer(result.answer || 'No answer available');
      
    } catch (error) {
      console.error("Error asking question:", error);
      setQaAnswer(`Sorry, I couldn't process your question. ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setIsAnswering(false);
    }
  };

  useEffect(() => {
    // Reset analyzed state when filters change
    setHasAnalyzed(false);
    latestFilters.current = filters;
  }, [filters]);

  const handleAnalyzeClick = () => {
    fetchInsights(filters);
  };


  return (
    <div className="bg-brand-surface bg-opacity-70 p-3 md:p-4 rounded-lg h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <div className="flex-1">
          <h3 className="text-sm md:text-base font-semibold text-brand-teal">
            AI Policy Advisor
            {analysis?.aiSource && (
              <span className="ml-2 text-xs font-normal text-gray-400">
                • {analysis.aiSource}
              </span>
            )}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {isAIEnabled() ? 'Powered by Google Gemini AI' : 'ML Pattern Analysis'}
          </p>
        </div>
        <button
          onClick={handleAnalyzeClick}
          disabled={isAnalyzing}
          className="px-4 py-2 bg-brand-teal text-brand-bg font-semibold rounded-md hover:bg-opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs md:text-sm flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="w-3 h-3 border-2 border-brand-bg border-t-transparent rounded-full animate-spin"></div>
              Analyzing...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              Analyze
            </>
          )}
        </button>
      </div>
      
      <div ref={chatHistoryRef} className="flex-grow space-y-3 overflow-y-auto pr-1 md:pr-2 min-h-0 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
        {/* Q&A Section - Moved to Top */}
        <div className="bg-black bg-opacity-25 p-2.5 md:p-3 rounded-md border border-gray-700 flex-shrink-0">
          <h4 className="text-lg md:text-xl font-bold text-brand-teal mb-1">Ask a Question</h4>
          <p className="text-xs text-gray-400 mb-3">Ask me anything</p>
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

        {/* Analysis & Patterns Section */}
        <div className="bg-black bg-opacity-25 p-2.5 md:p-3 rounded-md mb-3 border border-gray-700 flex-shrink-0">
          {isAnalyzing && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse"></div>
                  <span>{isAIEnabled() ? 'Analyzing with AI...' : 'Mining patterns...'}</span>
              </div>
          )}
          {!isAnalyzing && !hasAnalyzed && (
              <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <p className="text-gray-400 text-sm mb-2">Ready to analyze health equity data</p>
                  <p className="text-gray-500 text-xs">Select your filters and click <span className="text-brand-teal font-semibold">Analyze</span> to generate AI-powered insights</p>
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