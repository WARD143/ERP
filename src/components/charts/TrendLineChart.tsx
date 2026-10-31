import React, { useState } from 'react';
import { ForecastDataPoint } from '../../types';

interface TrendLineChartProps {
  dataPoints: ForecastDataPoint[];
  height?: number;
  benchmarkPercentage?: number;
}

export const TrendLineChart: React.FC<TrendLineChartProps> = ({
  dataPoints,
  height = 240,
  benchmarkPercentage = 75
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<ForecastDataPoint | null>(null);

  if (!dataPoints || dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-slate-400">
        No chronological assessment data points available.
      </div>
    );
  }

  const padding = { top: 24, right: 32, bottom: 40, left: 44 };
  const width = 640;
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const getX = (index: number) => {
    if (dataPoints.length <= 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (dataPoints.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    return padding.top + chartHeight - (clamped / 100) * chartHeight;
  };

  // Build SVG path for actual points
  const actualPoints = dataPoints
    .map((p, idx) => ({ ...p, idx, val: p.actualPercentage }))
    .filter(p => p.val !== undefined);

  let actualPath = '';
  let areaPath = '';
  if (actualPoints.length > 0) {
    actualPoints.forEach((p, i) => {
      const x = getX(p.idx);
      const y = getY(p.val!);
      if (i === 0) {
        actualPath += `M ${x} ${y}`;
        areaPath += `M ${x} ${padding.top + chartHeight} L ${x} ${y}`;
      } else {
        const prev = actualPoints[i - 1];
        const prevX = getX(prev.idx);
        const prevY = getY(prev.val!);
        const cX1 = prevX + (x - prevX) / 2;
        const cX2 = prevX + (x - prevX) / 2;
        actualPath += ` C ${cX1} ${prevY}, ${cX2} ${y}, ${x} ${y}`;
        areaPath += ` C ${cX1} ${prevY}, ${cX2} ${y}, ${x} ${y}`;
      }
    });
    const lastX = getX(actualPoints[actualPoints.length - 1].idx);
    areaPath += ` L ${lastX} ${padding.top + chartHeight} Z`;
  }

  // Build projected forecast line
  const forecastPoints = dataPoints
    .map((p, idx) => ({ ...p, idx, val: p.projectedPercentage }))
    .filter(p => p.val !== undefined);

  let forecastPath = '';
  if (forecastPoints.length > 0) {
    forecastPoints.forEach((p, i) => {
      const x = getX(p.idx);
      const y = getY(p.val!);
      if (i === 0) {
        forecastPath += `M ${x} ${y}`;
      } else {
        const prev = forecastPoints[i - 1];
        const prevX = getX(prev.idx);
        const prevY = getY(prev.val!);
        const cX1 = prevX + (x - prevX) / 2;
        const cX2 = prevX + (x - prevX) / 2;
        forecastPath += ` C ${cX1} ${prevY}, ${cX2} ${y}, ${x} ${y}`;
      }
    });
  }

  const yTicks = [0, 25, 50, 75, 100];
  const benchmarkY = getY(benchmarkPercentage);

  return (
    <div className="w-full relative select-none">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
      >
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
          </linearGradient>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#818cf8" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {yTicks.map((tick) => {
          const y = getY(tick);
          return (
            <g key={tick}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800"
                strokeDasharray={tick === 0 ? 'none' : '3 3'}
                strokeWidth={tick === 0 ? '1.5' : '1'}
              />
              <text
                x={padding.left - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Institutional 75% benchmark guideline */}
        <line
          x1={padding.left}
          y1={benchmarkY}
          x2={width - padding.right}
          y2={benchmarkY}
          stroke="#f59e0b"
          strokeDasharray="4 4"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <text
          x={width - padding.right + 6}
          y={benchmarkY + 3}
          fill="#f59e0b"
          className="text-[9px] font-mono font-semibold"
        >
          75% Pass
        </text>

        {/* Gradient fill area */}
        {areaPath && <path d={areaPath} fill="url(#areaGradient)" />}

        {/* Actual marks smooth line */}
        {actualPath && (
          <path
            d={actualPath}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}

        {/* Forecast projected line */}
        {forecastPath && (
          <path
            d={forecastPath}
            fill="none"
            stroke="#a855f7"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinecap="round"
          />
        )}

        {/* Data points (Dots) */}
        {dataPoints.map((p, idx) => {
          const x = getX(idx);
          const isActual = p.actualPercentage !== undefined;
          const val = isActual ? p.actualPercentage! : p.projectedPercentage!;
          const y = getY(val);

          return (
            <g
              key={idx}
              className="cursor-pointer group"
              onMouseEnter={() => setHoveredPoint(p)}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <circle
                cx={x}
                cy={y}
                r="7"
                fill="transparent"
              />
              <circle
                cx={x}
                cy={y}
                r={isActual ? "4.5" : "3.5"}
                fill={isActual ? '#ffffff' : '#a855f7'}
                stroke={isActual ? '#6366f1' : '#c084fc'}
                strokeWidth={isActual ? '2.5' : '2'}
                className="transition-all duration-150 group-hover:scale-125"
              />
              {/* X Axis Label */}
              <text
                x={x}
                y={height - padding.bottom + 18}
                textAnchor="middle"
                className="text-[10px] fill-slate-500 dark:fill-slate-400 font-medium"
              >
                {p.periodLabel || `T${idx + 1}`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Floating Tooltip */}
      {hoveredPoint && (
        <div className="absolute top-2 right-4 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl text-xs pointer-events-none z-10 transition-all">
          <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
            {hoveredPoint.periodLabel}
          </div>
          {hoveredPoint.actualPercentage !== undefined && (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              <span>Score: <strong className="font-mono">{hoveredPoint.actualPercentage.toFixed(1)}%</strong></span>
            </div>
          )}
          {hoveredPoint.projectedPercentage !== undefined && (
            <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span>ML Projection: <strong className="font-mono">{hoveredPoint.projectedPercentage.toFixed(1)}%</strong></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
