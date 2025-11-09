
import React, { useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';
import { RawStateData, Disease } from '../types';

interface StateDetailViewProps {
  stateCode: string;
  fullDataset: Record<number, RawStateData[]>;
  filters: {
    year: number;
    disease: string;
    demographic: string;
    subCategory: string | null;
  };
  onClose: () => void;
}

const DemoChart: React.FC<{ title: string, data: {[key: string]: number | null} }> = ({ title, data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstance = useRef<Chart | null>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const ctx = chartRef.current.getContext('2d');
        if (!ctx) return;
        
        const labels = Object.keys(data);
        const values = Object.values(data);

        chartInstance.current = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Incidence per 10k',
                    data: values,
                    backgroundColor: 'rgba(0, 245, 212, 0.6)',
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: '#9ca3af' }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                    y: { ticks: { color: '#e5e7eb' }, grid: { display: false } }
                },
                plugins: { legend: { display: false }, title: { display: true, text: title, color: '#f1f5f9' } }
            }
        });

    }, [data, title]);

    return <canvas ref={chartRef} />;
};

const StateDetailView: React.FC<StateDetailViewProps> = ({ stateCode, fullDataset, filters, onClose }) => {
  const stateData = useMemo(() => {
    const yearData = fullDataset[filters.year];
    if (!yearData) return null;
    return yearData.find(d => d.stateCode === stateCode);
  }, [fullDataset, filters.year, stateCode]);
  
  const diseaseData = useMemo(() => {
      if (!stateData) return null;
      return stateData.diseases[filters.disease as Disease];
  }, [stateData, filters.disease]);

  return (
    <div 
      className="bg-brand-surface p-6 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold text-white">
          {stateData?.stateName} ({stateData?.stateCode}) - {filters.year}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p className="text-gray-300 mb-4 flex-shrink-0">
        Detailed demographic breakdown for <strong className="text-brand-teal mx-1">{filters.disease}</strong>.
      </p>
      <div className="flex-grow min-h-0 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-6 p-2">
        {diseaseData ? (
            Object.entries(diseaseData.demographics).map(([key, value]) => (
                <div key={key} className="bg-black bg-opacity-25 rounded-lg p-3">
                    <DemoChart title={`By ${key}`} data={value} />
                </div>
            ))
        ) : (
            <div className="col-span-2 text-center text-gray-400">Data not available for this state and condition.</div>
        )}
      </div>
    </div>
  );
};

export default StateDetailView;
