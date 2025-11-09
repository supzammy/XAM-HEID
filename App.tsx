import React, { useState, useMemo, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AboutPage from './components/AboutPage';
import { generateMockData, demographicCategories, availableYears } from './data/mockData';
import { Disease, Demographic, StateData, RawStateData, DashboardStats, AnalysisResponse } from './types';
import { DISEASES, DEMOGRAPHICS } from './constants';


function App() {
  // Data state
  const [allData] = useState<Record<number, RawStateData[]>>(() => generateMockData());

  // Filter states
  const [selectedDisease, setSelectedDisease] = useState<Disease>(DISEASES[0]);
  const [selectedDemographic, setSelectedDemographic] = useState<Demographic>(DEMOGRAPHICS[0]);
  const [selectedDemographicDetail, setSelectedDemographicDetail] = useState<string | null>(demographicCategories[DEMOGRAPHICS[0]][0]);
  const [selectedYear, setSelectedYear] = useState<number>(availableYears[availableYears.length - 1]);
  
  // View state
  const [activeView, setActiveView] = useState<'dashboard' | 'about'>('dashboard');

  // Derived/shared state for dashboard
  const [stats, setStats] = useState<DashboardStats>({ disparityIndex: '0%', highest: 'N/A', lowest: 'N/A', trend: 'neutral' });
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  
  useEffect(() => {
    // When the main demographic changes, reset the sub-category to the first available option if the current one is not valid.
    const subCategories = demographicCategories[selectedDemographic] || [];
    if (!subCategories.includes(selectedDemographicDetail || '')) {
      setSelectedDemographicDetail(subCategories[0] || null);
    }
  }, [selectedDemographic, selectedDemographicDetail]);

  const filteredData = useMemo((): StateData[] => {
    const yearData = allData[selectedYear] || [];
    
    return yearData.map(state => {
      const diseaseData = state.diseases[selectedDisease];
      const demographicData = diseaseData?.demographics[selectedDemographic];
      
      let aggregateValue: number | null = null;
      
      if (demographicData) {
        if (selectedDemographicDetail) {
          aggregateValue = demographicData[selectedDemographicDetail] ?? null;
        } else {
          // If no sub-category is selected, calculate an average of all sub-categories.
          const values = Object.values(demographicData).filter(v => v !== null) as number[];
          if (values.length > 0) {
              aggregateValue = values.reduce((sum, val) => sum + val, 0) / values.length;
          }
        }
      }

      return {
        stateCode: state.stateCode,
        stateName: state.stateName,
        value: aggregateValue ? Math.round(aggregateValue) : null,
      };
    });
  }, [allData, selectedYear, selectedDisease, selectedDemographic, selectedDemographicDetail]);

  const Header = () => (
    <header className="bg-brand-surface p-4 flex justify-between items-center flex-shrink-0 border-b border-gray-800">
      <div className="flex items-center space-x-3">
        <svg className="w-8 h-8 text-brand-teal" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93L15 8h-2V4.07zM15 10h2l-1.13.93C15.45 11.45 15.13 12 15 12v-2zm0 4h2c.74 0 1.37-.35 1.75-.84L20.25 12H15v2zm-2-6h-2v2h2V8zm0 4h-2v2h2v-2zm0 4h-2v2h2v-2zm-8 .25c.37.52.89.92 1.48 1.19l-1.03.88-1.5-2.6-1.45.87.5 2.18c-.9-.44-1.7-1.04-2.32-1.77L4.75 16h2l.25.25z"/></svg>
  <h1 className="text-xl font-bold text-white">XAM HEID</h1>
      </div>
      <nav className="flex space-x-4">
        <button
          onClick={() => setActiveView('dashboard')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeView === 'dashboard' ? 'bg-brand-teal text-brand-bg shadow' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          Dashboard
        </button>
        <button
          onClick={() => setActiveView('about')}
          className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${activeView === 'about' ? 'bg-brand-teal text-brand-bg shadow' : 'text-gray-300 hover:bg-gray-700'}`}
        >
          About
        </button>
      </nav>
    </header>
  );

  return (
    <div className="bg-brand-bg text-brand-light font-sans h-screen flex flex-col">
      <Header />
      <div className="flex-grow flex min-h-0">
        <Sidebar
          selectedDisease={selectedDisease}
          setSelectedDisease={setSelectedDisease}
          selectedDemographic={selectedDemographic}
          setSelectedDemographic={setSelectedDemographic}
          selectedDemographicDetail={selectedDemographicDetail}
          setSelectedDemographicDetail={setSelectedDemographicDetail}
          selectedYear={selectedYear}
          setSelectedYear={setSelectedYear}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          {activeView === 'dashboard' ? (
            <Dashboard 
              data={filteredData}
              fullDataset={allData}
              filters={{
                disease: selectedDisease,
                demographic: selectedDemographic,
                subCategory: selectedDemographicDetail,
                year: selectedYear,
              }}
              stats={stats}
              setStats={setStats}
              analysis={analysis}
              setAnalysis={setAnalysis}
            />
          ) : (
            <AboutPage />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
