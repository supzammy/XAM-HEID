import React, { useMemo, useState, useEffect } from 'react';
import { StateData, RawStateData, DashboardStats, AnalysisResponse } from '../types';
import MapChart from './MapChart';
import AIPolicyAdvisor from './AIPolicyAdvisor';
import BarChart from './BarChart';
import StateDetailView from './StateDetailView';

interface DashboardProps {
  data: StateData[];
  fullDataset: Record<number, RawStateData[]>;
  filters: {
    disease: string;
    demographic: string;
    subCategory: string | null;
    year: number;
  };
  stats: DashboardStats;
  setStats: (stats: DashboardStats) => void;
  analysis: AnalysisResponse | null;
  setAnalysis: (analysis: AnalysisResponse | null) => void;
}

const TrendIndicator: React.FC<{ trend: 'up' | 'down' | 'neutral' }> = ({ trend }) => {
    if (trend === 'neutral') return <span className="text-gray-400 ml-2">--</span>;
    const isUp = trend === 'up';
    return (
        <span className={`ml-2 flex items-center font-bold ${isUp ? 'text-red-400' : 'text-green-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isUp 
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /> 
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                }
            </svg>
        </span>
    );
};


const StatDisplay: React.FC<{ title: string; value: string; trend?: 'up' | 'down' | 'neutral' }> = ({ title, value, trend }) => (
  <div className="text-center">
    <h4 className="text-sm text-gray-400 uppercase tracking-wider">{title}</h4>
    <p className="text-3xl font-bold text-brand-teal mt-1 flex items-center justify-center">
        {value}
        {trend && <TrendIndicator trend={trend} />}
    </p>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ data, fullDataset, filters, stats, setStats, analysis, setAnalysis }) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [selectedStateCode, setSelectedStateCode] = useState<string | null>(null);
  const [topNCount, setTopNCount] = useState(5);
  const barCountOptions = [5, 10, 15];

  const getDisparityIndex = (yearData: StateData[]): number => {
    const validData = yearData.filter(d => d.value !== null);
    if (validData.length < 2) return 0;
    const values = validData.map(d => d.value as number);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return max > 0 ? ((max - min) / max * 100) : 0;
  };
  
  useEffect(() => {
    const validData = data.filter(d => d.value !== null);
    
    let highestState = 'N/A', lowestState = 'N/A', disparityIndex = 0, trend: 'up' | 'down' | 'neutral' = 'neutral';

    if (validData.length > 0) {
        const values = validData.map(d => d.value as number);
        const min = Math.min(...values);
        const max = Math.max(...values);
        lowestState = validData.find(d => d.value === min)?.stateName || 'N/A';
        highestState = validData.find(d => d.value === max)?.stateName || 'N/A';
        disparityIndex = getDisparityIndex(data);

        const prevYear = filters.year - 1;
        if (fullDataset[prevYear]) {
            const prevYearRawData = fullDataset[prevYear];
            const prevYearFilteredData = prevYearRawData.map(state => {
                const diseaseData = state.diseases[filters.disease as keyof typeof state.diseases];
                const demographicData = diseaseData?.demographics[filters.demographic as keyof typeof diseaseData.demographics];
                let aggregateValue: number | null = null;
                if (demographicData) {
                    if (filters.subCategory) {
                        aggregateValue = demographicData[filters.subCategory] ?? null;
                    } else {
                        const values = Object.values(demographicData).filter(v => v !== null) as number[];
                        aggregateValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : null;
                    }
                }
                return {
                    stateCode: state.stateCode,
                    stateName: state.stateName,
                    value: aggregateValue ? Math.round(aggregateValue) : null,
                };
            });
            const prevDisparityIndex = getDisparityIndex(prevYearFilteredData);
            if (prevDisparityIndex !== 0 && disparityIndex > prevDisparityIndex) trend = 'up';
            if (prevDisparityIndex !== 0 && disparityIndex < prevDisparityIndex) trend = 'down';
        }
    }

    setStats({
      disparityIndex: disparityIndex.toFixed(1) + '%',
      highest: highestState,
      lowest: lowestState,
      trend,
    });
  }, [data, filters, fullDataset, setStats]);

  return (
    <div className="h-full">
      <div id="dashboard-content" className="flex gap-6 h-full">
        {/* Main Content: Map and Stats */}
        <div className="w-2/3 flex flex-col gap-6">
          <div className="bg-brand-surface p-4 rounded-lg flex-shrink-0">
            <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-2xl font-bold text-brand-light">Disparity Analysis for {filters.year}</h2>
                </div>
                <div className="text-right text-xs text-gray-400">
                    <p>Showing data for: <span className="font-semibold text-brand-teal">{filters.disease}</span></p>
                    <p>Filtered by: <span className="font-semibold text-brand-teal">{filters.demographic} {filters.subCategory ? `(${filters.subCategory})` : ''}</span></p>
                </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-700 bg-black bg-opacity-20 p-4 rounded-lg">
              <StatDisplay title="Disparity Index" value={stats.disparityIndex} trend={stats.trend} />
              <div className="px-4"><StatDisplay title="Highest Disparity" value={stats.highest} /></div>
              <div className="pl-4"><StatDisplay title="Lowest Disparity" value={stats.lowest} /></div>
            </div>
          </div>
          <div className="flex-grow bg-brand-surface rounded-lg p-2 min-h-0">
            <MapChart 
              data={data} 
              hoveredState={hoveredState} 
              setHoveredState={setHoveredState} 
              selectedStateCode={selectedStateCode}
              setSelectedStateCode={setSelectedStateCode}
            />
          </div>
        </div>

        {/* Side Panel: Analysis */}
        <div className="w-1/3 flex flex-col gap-6">
          <div className="h-1/3 bg-brand-surface rounded-lg p-4 flex flex-col min-h-0">
            <div className="flex justify-between items-center mb-2 flex-shrink-0">
                <h3 className="font-semibold text-brand-teal">Top {topNCount} States by Disparity</h3>
                <div className="flex space-x-1 p-0.5 bg-gray-900 rounded-md">
                    {barCountOptions.map(count => (
                        <button
                            key={count}
                            onClick={() => setTopNCount(count)}
                            className={`text-xs px-2 py-0.5 rounded transition-colors duration-200 ${topNCount === count ? 'bg-brand-teal text-brand-bg font-bold shadow' : 'bg-transparent text-gray-400 hover:bg-gray-700'}`}
                        >
                            {count}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-grow min-h-0">
              <BarChart 
                data={data} 
                numberOfBars={topNCount} 
                hoveredState={hoveredState} 
                setHoveredState={setHoveredState}
                selectedStateCode={selectedStateCode}
                setSelectedStateCode={setSelectedStateCode} 
              />
            </div>
          </div>
          <div className="h-2/3 flex flex-col min-h-0">
              <AIPolicyAdvisor 
                fullDataset={fullDataset} 
                filters={filters}
                analysis={analysis}
                setAnalysis={setAnalysis}
              />
          </div>
        </div>
      </div>
      {selectedStateCode && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setSelectedStateCode(null)}
        >
            <StateDetailView
              stateCode={selectedStateCode}
              fullDataset={fullDataset}
              filters={filters}
              onClose={() => setSelectedStateCode(null)}
            />
        </div>
      )}
    </div>
  );
};

export default Dashboard;