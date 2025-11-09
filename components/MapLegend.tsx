import React from 'react';

const MapLegend: React.FC = () => {
  return (
    <div className="absolute bottom-4 left-4 bg-brand-surface bg-opacity-80 p-3 rounded-lg shadow-lg text-xs text-brand-light pointer-events-none">
      <h4 className="font-bold mb-2 text-center">Disparity Level</h4>
      <div className="flex items-center space-x-2">
        <span>Low</span>
        <div className="w-24 h-4 rounded-full bg-gradient-to-r from-map-low via-map-neutral to-map-high"></div>
        <span>High</span>
      </div>
    </div>
  );
};

export default MapLegend;
