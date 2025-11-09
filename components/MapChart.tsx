import React, { useState, memo, useMemo } from 'react';
import { ComposableMap, Geographies, Geography } from 'react-simple-maps';
import { scaleQuantile } from 'd3-scale';
import { StateData } from '../types';
import MapLegend from './MapLegend';

const US_TOPO_JSON = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface MapChartProps {
  data: StateData[];
  hoveredState: string | null;
  setHoveredState: (stateName: string | null) => void;
  selectedStateCode: string | null;
  setSelectedStateCode: (stateCode: string | null) => void;
}

const MapChart: React.FC<MapChartProps> = ({ data, hoveredState, setHoveredState, selectedStateCode, setSelectedStateCode }) => {
  const [tooltipContent, setTooltipContent] = useState('');
  
  const stateDataMap = useMemo(() => new Map(data.map(d => [d.stateName, { value: d.value, code: d.stateCode }])), [data]);

  const colorScale = scaleQuantile<string>()
    .domain(data.map(d => d.value).filter(d => d !== null) as number[])
    .range([
      '#3b82f6', // map-low
      '#93c5fd', // map-mid-low
      '#f1f5f9', // map-neutral
      '#fca5a5',
      '#f87171', // map-mid-high
      '#ef4444',
      '#b91c1c'  // map-high
    ]);

  const onMouseEnter = (geo: any, currentValue: number | null | undefined) => {
    return () => {
      setHoveredState(geo.properties.name);
      setTooltipContent(
        `${geo.properties.name}: ${
          currentValue === null || currentValue === undefined ? 'Suppressed' : `${currentValue.toLocaleString()}`
        }`
      );
    };
  };

  const onMouseLeave = () => {
    setHoveredState(null);
    setTooltipContent('');
  };

  return (
    <div className="relative w-full h-full">
      {tooltipContent && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-4 py-2 text-base rounded-lg shadow-lg z-10 pointer-events-none animate-pop-in">
          {tooltipContent}
        </div>
      )}
      <MapLegend />
      <ComposableMap projection="geoAlbersUsa" data-tip="">
        <Geographies geography={US_TOPO_JSON}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stateInfo = stateDataMap.get(geo.properties.name);
              const curValue = stateInfo?.value;
              const curCode = stateInfo?.code;

              const fillColor = curValue === null || curValue === undefined ? '#4b5563' : colorScale(curValue);
              const isHovered = hoveredState === geo.properties.name;
              const isSelected = !!curCode && curCode === selectedStateCode;

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  onMouseEnter={onMouseEnter(geo, curValue)}
                  onMouseLeave={onMouseLeave}
                  onClick={() => {
                    if (curCode) {
                      setSelectedStateCode(isSelected ? null : curCode);
                    }
                  }}
                  style={{
                    default: {
                      outline: 'none',
                      transformOrigin: 'center',
                      transformBox: 'fill-box',
                      transition: 'all 0.2s ease-out',
                      transform: isHovered ? 'translateY(-3px)' : 'translateY(0)',
                      filter: isHovered || isSelected ? 'brightness(1.25)' : 'brightness(1)',
                    },
                    hover: { outline: 'none' },
                    pressed: { outline: 'none' },
                  }}
                  fill={fillColor}
                  stroke={isSelected ? '#00F5D4' : isHovered ? '#00F5D4' : '#040D11'}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 0.5}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>
    </div>
  );
};

export default memo(MapChart);