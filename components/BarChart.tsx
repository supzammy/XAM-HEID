import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { StateData } from '../types';

interface BarChartProps {
  data: StateData[];
  numberOfBars?: number;
  hoveredState: string | null;
  setHoveredState: (stateName: string | null) => void;
  selectedStateCode: string | null;
  setSelectedStateCode: (stateCode: string | null) => void;
}

const BarChart: React.FC<BarChartProps> = ({ data, numberOfBars = 5, hoveredState, setHoveredState, selectedStateCode, setSelectedStateCode }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  const topData = data
    .filter(d => d.value !== null)
    .sort((a, b) => (b.value ?? 0) - (a.value ?? 0))
    .slice(0, numberOfBars);

  useEffect(() => {
    if (!chartRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;
    
    const backgroundColors = topData.map(d => 
        d.stateCode === selectedStateCode ? 'rgba(0, 245, 212, 1)' :
        d.stateName === hoveredState ? 'rgba(0, 245, 212, 0.8)' : 
        'rgba(0, 245, 212, 0.6)'
    );
    const borderColors = topData.map(d => 
        d.stateCode === selectedStateCode ? '#00F5D4' : 'transparent'
    );
    const borderWidths = topData.map(d => 
        d.stateCode === selectedStateCode ? 2 : 1
    );

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topData.map(d => d.stateCode),
        datasets: [
          {
            label: 'Disparity Value',
            data: topData.map(d => d.value),
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            borderWidth: borderWidths,
            hoverBackgroundColor: 'rgba(0, 245, 212, 1)',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        onClick: (event, elements) => {
            if (elements.length > 0) {
                const index = elements[0].index;
                const state = topData[index];
                if (state) {
                    const code = state.stateCode;
                    // Fix: Use the `selectedStateCode` prop to determine the next state, as the prop type doesn't support a function callback.
                    setSelectedStateCode(selectedStateCode === code ? null : code);
                }
            }
        },
        onHover: (event, elements) => {
            const canvas = chartRef.current;
            if (canvas) {
                canvas.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            }
            if (elements.length > 0) {
                const index = elements[0].index;
                const state = topData[index];
                if (state && hoveredState !== state.stateName) {
                    setHoveredState(state.stateName);
                }
            } else {
                if (hoveredState !== null) {
                     setHoveredState(null);
                }
            }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { color: '#9ca3af', font: { size: 10 } },
            grid: { color: 'rgba(255, 255, 255, 0.1)' }
          },
          y: {
             ticks: { color: '#e5e7eb', font: { size: 10, weight: 'bold' } },
             grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
             callbacks: {
                title: (tooltipItems) => {
                    const index = tooltipItems[0].dataIndex;
                    return topData[index]?.stateName || '';
                }
             }
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data, numberOfBars, topData, hoveredState, setHoveredState, selectedStateCode, setSelectedStateCode]);

  return <canvas ref={chartRef} onMouseLeave={() => setHoveredState(null)} />;
};

export default BarChart;