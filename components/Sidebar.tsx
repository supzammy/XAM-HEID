import React from 'react';
import { Disease, Demographic } from '../types';
import { DISEASES, DEMOGRAPHICS } from '../constants';
import { demographicCategories, availableYears } from '../data/mockData';

interface SidebarProps {
  selectedDisease: Disease;
  setSelectedDisease: (disease: Disease) => void;
  selectedDemographic: Demographic;
  setSelectedDemographic: (demographic: Demographic) => void;
  selectedDemographicDetail: string | null;
  setSelectedDemographicDetail: (detail: string | null) => void;
  selectedYear: number;
  setSelectedYear: (year: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  selectedDisease,
  setSelectedDisease,
  selectedDemographic,
  setSelectedDemographic,
  selectedDemographicDetail,
  setSelectedDemographicDetail,
  selectedYear,
  setSelectedYear,
}) => {
  const subCategories = demographicCategories[selectedDemographic] || [];
  const isAgeDemographic = selectedDemographic === Demographic.AgeGroup;

  return (
    <aside className="w-full xl:w-80 bg-brand-surface p-4 md:p-6 flex-shrink-0 flex flex-col space-y-6 md:space-y-8 border-r border-gray-800 xl:border-r-0 max-h-96 xl:max-h-none overflow-y-auto">
      <div>
        <h2 className="text-base md:text-lg font-semibold text-brand-light mb-3 md:mb-4">Filters</h2>
        
        <div className="space-y-4 md:space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2 md:mb-3">
                <h3 className="text-xs md:text-sm font-medium text-gray-400">Year</h3>
                <span className="text-base md:text-lg font-bold text-brand-teal">{selectedYear}</span>
            </div>
            <input
                type="range"
                min={availableYears[0]}
                max={availableYears[availableYears.length - 1]}
                step="1"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-teal touch-manipulation"
            />
          </div>

          <div>
            <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3">Health Conditions</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {DISEASES.map((disease) => (
                <button
                  key={disease}
                  onClick={() => setSelectedDisease(disease)}
                  className={`w-full text-left px-3 md:px-4 py-2.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-colors duration-200 touch-manipulation active:scale-95 ${
                    selectedDisease === disease
                      ? 'bg-brand-light text-brand-bg shadow-lg'
                      : 'bg-gray-700 bg-opacity-40 text-brand-light hover:bg-gray-600'
                  }`}
                >
                  {disease}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3">Demographics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
              {DEMOGRAPHICS.map((demographic) => (
                <div
                  key={demographic}
                  onClick={() => setSelectedDemographic(demographic)}
                  className={`flex items-center p-2.5 md:p-3 rounded-md cursor-pointer transition-colors duration-200 bg-gray-700 bg-opacity-40 hover:bg-gray-600 touch-manipulation active:scale-95 ${selectedDemographic === demographic ? 'ring-2 ring-brand-teal' : ''}`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedDemographic === demographic ? 'border-brand-teal' : 'border-gray-400'}`}>
                    {selectedDemographic === demographic && <div className="w-2 h-2 rounded-full bg-brand-teal"></div>}
                  </div>
                  <span className="ml-3 text-xs md:text-sm font-medium text-brand-light">{demographic}</span>
                </div>
              ))}
            </div>
          </div>

          {subCategories.length > 0 && selectedDemographic && (
            <div className="border-t border-gray-700 pt-3 md:pt-4">
              <h3 className="text-xs md:text-sm font-medium text-gray-400 mb-2 md:mb-3">Sub-Category for {selectedDemographic}</h3>
              
              {isAgeDemographic ? (
                <div>
                    <div className="flex justify-end items-center mb-2 md:mb-3">
                        <span className="text-base md:text-lg font-bold text-brand-teal">{selectedDemographicDetail}</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max={subCategories.length - 1}
                        step="1"
                        value={subCategories.indexOf(selectedDemographicDetail || subCategories[0])}
                        onChange={(e) => {
                            const newIndex = parseInt(e.target.value, 10);
                            setSelectedDemographicDetail(subCategories[newIndex]);
                        }}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-teal touch-manipulation"
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
                        <span>{subCategories[0]}</span>
                        <span>{subCategories[subCategories.length - 1]}</span>
                    </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-2">
                  {subCategories.map((detail) => (
                    <div
                      key={detail}
                      onClick={() => setSelectedDemographicDetail(detail)}
                      className="flex items-center p-2.5 md:p-3 rounded-md cursor-pointer transition-colors duration-200 bg-gray-800 bg-opacity-60 hover:bg-gray-700 touch-manipulation active:scale-95"
                    >
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${selectedDemographicDetail === detail ? 'border-brand-teal' : 'border-gray-500'}`}>
                        {selectedDemographicDetail === detail && <div className="w-2 h-2 rounded-full bg-brand-teal"></div>}
                      </div>
                      <span className="ml-3 text-xs font-medium text-gray-300">{detail}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
       <div className="mt-auto pt-4 md:pt-6 border-t border-gray-700">
        <h3 className="font-semibold text-brand-teal mb-2 text-xs md:text-sm">Data & Privacy Notice</h3>
        <div className="text-xs text-gray-400 space-y-2 p-2.5 md:p-3 bg-black bg-opacity-20 rounded-md">
          <p>
            This dashboard uses synthesized data for demonstration and does not represent real patient information.
          </p>
          <p>
            To protect privacy, data points for groups with fewer than 11 individuals are suppressed ('Rule of 11').
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;