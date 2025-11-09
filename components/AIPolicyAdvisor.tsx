import React, { useState, useRef, useEffect, useCallback } from 'react';
import { RawStateData, ChatMessage, Disease, AnalysisResponse } from '../types';
import { GoogleGenAI, Type } from '@google/genai';

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

// A simple component to render markdown-like text from the AI
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
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatHistoryRef = useRef<HTMLDivElement>(null);
  
  const latestFilters = useRef(filters);

  useEffect(() => {
    if (chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
    }
  }, [messages, isAnalyzing, analysis]);
  
  // Helper to create a data summary for the AI prompt
  const createDataSummary = useCallback((yearData: RawStateData[], disease: string) => {
      const topStates = yearData
        .map(state => {
            const diseaseData = state.diseases[disease as Disease];
            if (!diseaseData) return { name: state.stateName, score: 0 };
            
            const allValues = Object.values(diseaseData.demographics).flatMap(demographic => Object.values(demographic));
            const validValues = allValues.filter(v => v !== null) as number[];
            if (validValues.length < 2) return { name: state.stateName, score: 0 };

            const max = Math.max(...validValues);
            const min = Math.min(...validValues);
            return { name: state.stateName, score: max > 0 ? (max - min) / max : 0 };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      let summary = 'Data summary for top 5 states with highest internal disparity:\n';
      for (const state of topStates) {
          const stateData = yearData.find(s => s.stateName === state.name);
          if (stateData) {
              const diseaseData = stateData.diseases[disease as Disease];
              if (diseaseData) {
                  summary += `- ${state.name}: Race-Black: ${diseaseData.demographics.Race.Black ?? 'N/A'}, Income-Low: ${diseaseData.demographics['Income Level'].Low ?? 'N/A'}, Age-65+: ${diseaseData.demographics.Age['65+'] ?? 'N/A'}\n`;
              }
          }
      }
      return summary;

  }, []);

  const fetchInsights = useCallback(async (currentFilters: typeof filters) => {
    setIsAnalyzing(true);
    setAnalysis(null);
    setMessages([]);

    try {
      const yearData = fullDataset[currentFilters.year];
      if (!yearData) throw new Error("No data for selected year");
        
      const context = `
        You are a data scientist analyzing a health equity dataset for ${currentFilters.disease} in ${currentFilters.year}. Your goal is to uncover non-obvious patterns and correlations between different demographic groups.
        ${createDataSummary(yearData, currentFilters.disease)}
      `;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Based on the provided data context, generate a high-level summary, 2-3 discovered patterns of cross-demographic correlation, and 3 insightful follow-up questions a policymaker might ask.
        Context: ${context}`,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    summary: {
                        type: Type.STRING,
                        description: "A concise, high-level summary of the disparity situation for this disease.",
                    },
                    patterns: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                title: { type: Type.STRING },
                                description: { type: Type.STRING }
                            }
                        },
                        description: "An array of 2-3 discovered patterns highlighting interesting correlations between different demographics (e.g., race, income, age)."
                    },
                    questions: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: "An array of three distinct, insightful follow-up questions based on the patterns."
                    }
                }
            }
        }
      });

      const resultText = response.text.trim();
      const result = JSON.parse(resultText) as AnalysisResponse;
      
      if (latestFilters.current === currentFilters) {
        setAnalysis(result);
      }

    } catch (error) {
      console.error("Error generating initial analysis:", error);
       if (latestFilters.current === currentFilters) {
        setAnalysis({ summary: "Sorry, I encountered an error while analyzing the data. The model may be unavailable. Please try refreshing the filters.", patterns: [], questions: [] });
      }
    } finally {
       if (latestFilters.current === currentFilters) {
        setIsAnalyzing(false);
      }
    }
  }, [fullDataset, createDataSummary, setAnalysis]);

  useEffect(() => {
    latestFilters.current = filters;
    fetchInsights(filters);
  }, [filters, fetchInsights]);

  const handleSendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const newUserMessage: ChatMessage = { role: 'user', text: messageText };
    setMessages(prev => [...prev, newUserMessage]);
    setUserInput('');
    setIsLoading(true);

    try {
      const context = `
        Initial analysis summary: "${analysis?.summary}"
        Discovered patterns: ${analysis?.patterns.map(p => p.title).join(', ')}
        Current Filters are: Year: ${filters.year}, Condition: ${filters.disease}.
      `;
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        config: {
            systemInstruction: "You are an expert health policy analyst. Your role is to help users understand healthcare disparity data and brainstorm potential policy interventions. Be concise, insightful, and base your answers on the context provided. Do not mention that you are an AI.",
        },
      });
      
      const result = await chat.sendMessage({ message: `${context}\n\nUser question: ${messageText}` });

      const newAiMessage: ChatMessage = { role: 'model', text: result.text };
      setMessages(prev => [...prev, newAiMessage]);

    } catch (error) {
      console.error("Error communicating with AI:", error);
      const errorMessage: ChatMessage = { role: 'model', text: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    if (window.confirm("Are you sure you want to clear the chat history? This action cannot be undone.")) {
      setMessages([]);
    }
  };


  return (
    <div className="bg-brand-surface bg-opacity-70 p-4 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-3 flex-shrink-0">
        <h3 className="font-semibold text-brand-teal">AI Policy Advisor</h3>
        {messages.length > 0 && (
          <button
            onClick={handleClearChat}
            className="text-xs text-gray-400 hover:text-white hover:bg-gray-700 px-2 py-1 rounded-md transition-colors"
            title="Clear chat history"
          >
            Clear Chat
          </button>
        )}
      </div>
      
      <div ref={chatHistoryRef} className="flex-grow space-y-3 overflow-y-auto pr-2 min-h-0">
        {/* Analysis & Patterns Section */}
        <div className="bg-black bg-opacity-25 p-3 rounded-md mb-3 border border-gray-700 flex-shrink-0">
          {isAnalyzing && (
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse"></div><span>Analyzing full dataset for hidden patterns...</span>
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

        {/* Quick Questions & Chat Section */}
        {!isAnalyzing && analysis && analysis.questions.length > 0 && messages.length === 0 && (
              <div className="space-y-2 py-2">
                  <h4 className="text-xs font-semibold text-gray-400 px-1">Suggested Questions</h4>
                  {analysis.questions.map((q, i) => (
                      <button key={i} onClick={() => handleSendMessage(q)} className="w-full text-left text-sm p-2 bg-gray-700 hover:bg-gray-600 rounded-md transition-colors text-gray-300">
                          {q}
                      </button>
                  ))}
              </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs md:max-w-md lg:max-w-lg px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-brand-teal text-brand-bg' : 'bg-gray-700 text-brand-light'}`}>
                <MarkdownRenderer text={msg.text} />
              </div>
            </div>
          ))}
          {isLoading && (
              <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-lg text-sm bg-gray-700 text-brand-light">
                      <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse [animation-delay:0.2s]"></div>
                          <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse [animation-delay:0.4s]"></div>
                      </div>
                  </div>
              </div>
          )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput); }} className="flex-shrink-0 flex space-x-2 mt-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Ask about these patterns..."
          disabled={isLoading || isAnalyzing}
          className="flex-grow bg-gray-800 text-sm rounded-md p-2 border border-gray-600 focus:ring-2 focus:ring-brand-teal focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || isAnalyzing || !userInput.trim()}
          className="bg-brand-teal text-brand-bg font-bold px-4 rounded-md disabled:bg-gray-600 transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default AIPolicyAdvisor;