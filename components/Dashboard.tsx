import React, { useMemo, useState, useEffect } from 'react';
import { StateData, RawStateData, DashboardStats, AnalysisResponse } from '../types';
import MapChart from './MapChart';
import AIPolicyAdvisor from './AIPolicyAdvisor';
import BarChart from './BarChart';
import StateDetailView from './StateDetailView';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  const [isExportingPDF, setIsExportingPDF] = useState(false);

  const exportToPDF = async () => {
    setIsExportingPDF(true);
    try {
      const dashboardElement = document.getElementById('dashboard-content');
      if (!dashboardElement) {
        alert('Dashboard content not found');
        return;
      }

      // Capture the dashboard as canvas
      const canvas = await html2canvas(dashboardElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#0a0f1e'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4'); // landscape orientation
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      // Add AI analysis on a second page if available
      if (analysis && analysis.summary) {
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.setTextColor(20, 184, 166); // brand teal
        pdf.text('AI Policy Brief', 15, 20);
        
        pdf.setFontSize(10);
        pdf.setTextColor(0, 0, 0);
        const lines = pdf.splitTextToSize(analysis.summary, pdfWidth - 30);
        pdf.text(lines, 15, 35);
      }

      pdf.save(`XAM-HEID-Report-${filters.disease}-${filters.year}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExportingPDF(false);
    }
  };

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
      <div id="dashboard-content" className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Main Content: Map and Stats */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          <div className="bg-brand-surface p-4 rounded-lg flex-shrink-0">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-2 gap-3">
                <div>
                  <h2 className="text-xl lg:text-2xl font-bold text-brand-light">Disparity Analysis for {filters.year}</h2>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <button
                    onClick={exportToPDF}
                    disabled={isExportingPDF}
                    className="w-full sm:w-auto px-4 py-2 bg-brand-teal text-brand-bg font-semibold rounded-lg hover:bg-opacity-80 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                  >
                    {isExportingPDF ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Exporting...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Export PDF
                      </>
                    )}
                  </button>
                  <div className="text-left text-xs text-gray-400">
                      <p>Showing data for: <span className="font-semibold text-brand-teal">{filters.disease}</span></p>
                      <p>Filtered by: <span className="font-semibold text-brand-teal">{filters.demographic} {filters.subCategory ? `(${filters.subCategory})` : ''}</span></p>
                  </div>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-700 bg-black bg-opacity-20 p-4 rounded-lg gap-4 sm:gap-0">
              <StatDisplay title="Disparity Index" value={stats.disparityIndex} trend={stats.trend} />
              <div className="sm:px-4 pt-4 sm:pt-0"><StatDisplay title="Highest Disparity" value={stats.highest} /></div>
              <div className="sm:pl-4 pt-4 sm:pt-0"><StatDisplay title="Lowest Disparity" value={stats.lowest} /></div>
            </div>
          </div>
          <div className="flex-grow bg-brand-surface rounded-lg p-2 min-h-0 h-64 lg:h-auto">
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
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          <div className="h-64 lg:h-1/3 bg-brand-surface rounded-lg p-4 flex flex-col min-h-0">
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
          <div className="h-96 lg:h-2/3 flex flex-col min-h-0">
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