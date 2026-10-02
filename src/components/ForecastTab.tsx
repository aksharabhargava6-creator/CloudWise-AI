import React, { useState, useRef, useEffect } from 'react';
import {
  TrendingUp,
  Calendar,
  Info,
  Layers,
  ArrowUpRight,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import { Forecast, CostData } from '../types/cloudwise.js';
import { formatCurrency, formatPercent, formatDate } from '../utils/formatters.js';
import { Card, SegmentedControl, ProviderBadge } from './ui/Primitives.js';

interface ForecastTabProps {
  forecast: Forecast[];
  historicalCosts: CostData[];
  onUpdatePeriods: (periods: number, provider?: string) => Promise<void>;
  isLoading: boolean;
}

export const ForecastTab: React.FC<ForecastTabProps> = ({
  forecast,
  historicalCosts,
  onUpdatePeriods,
  isLoading,
}) => {
  const [selectedPeriods, setSelectedPeriods] = useState<number>(3);
  const [selectedProvider, setSelectedProvider] = useState<string>('All');
  const [showInfoPopover, setShowInfoPopover] = useState<boolean>(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState<number>(800);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setChartWidth(entry.contentRect.width || 800);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePeriodChange = async (p: number) => {
    setSelectedPeriods(p);
    await onUpdatePeriods(p, selectedProvider === 'All' ? undefined : selectedProvider);
  };

  const handleProviderChange = async (prov: string) => {
    setSelectedProvider(prov);
    await onUpdatePeriods(selectedPeriods, prov === 'All' ? undefined : prov);
  };

  // Filter historical costs by provider if specified
  const filteredHistory = selectedProvider === 'All'
    ? (() => {
        // Aggregate totals by date
        const map = new Map<string, number>();
        historicalCosts.forEach((c) => {
          map.set(c.date, (map.get(c.date) || 0) + c.total_cost);
        });
        return Array.from(map.entries()).map(([date, total_cost]) => ({
          date,
          cloud: 'Multi-Cloud',
          total_cost,
        }));
      })()
    : historicalCosts.filter((c) => c.cloud.toLowerCase() === selectedProvider.toLowerCase());

  const currentSpend = filteredHistory[filteredHistory.length - 1]?.total_cost || 3000;
  const nextMonthCost = forecast[0]?.predicted_cost || currentSpend;
  const endPeriodCost = forecast[forecast.length - 1]?.predicted_cost || currentSpend;
  const growthRate = currentSpend > 0 ? ((endPeriodCost - currentSpend) / currentSpend) * 100 : 0;
  const total12MonthEstimate = forecast.reduce((acc, f) => acc + f.predicted_cost, 0);

  // SVG Chart Computations
  const allCosts = [
    ...filteredHistory.map((h) => h.total_cost),
    ...forecast.map((f) => f.upper_bound),
  ];
  const maxVal = Math.max(...allCosts, 2000) * 1.15;
  const minVal = Math.max(0, Math.min(...allCosts, 500) * 0.85);

  const histCount = filteredHistory.length;
  const totalPoints = histCount + forecast.length;
  const stepX = (chartWidth - 60) / Math.max(1, totalPoints - 1);

  // Historical coordinates
  const histPoints = filteredHistory.map((item, idx) => {
    const x = 40 + idx * stepX;
    const y = 220 - ((item.total_cost - minVal) / (maxVal - minVal || 1)) * 190;
    return { x, y, ...item };
  });

  // Forecast coordinates
  const lastHist = histPoints[histPoints.length - 1] || { x: 40, y: 120, total_cost: currentSpend };
  const forecastPoints = forecast.map((item, idx) => {
    const x = 40 + (histCount - 1 + idx + 1) * stepX;
    const y = 220 - ((item.predicted_cost - minVal) / (maxVal - minVal || 1)) * 190;
    const yLower = 220 - ((item.lower_bound - minVal) / (maxVal - minVal || 1)) * 190;
    const yUpper = 220 - ((item.upper_bound - minVal) / (maxVal - minVal || 1)) * 190;
    return { x, y, yLower, yUpper, ...item };
  });

  // Confidence band polygon
  const upperBandCoords = [
    `${lastHist.x},${lastHist.y}`,
    ...forecastPoints.map((p) => `${p.x},${p.yUpper}`),
  ];
  const lowerBandCoords = [
    ...forecastPoints.slice().reverse().map((p) => `${p.x},${p.yLower}`),
    `${lastHist.x},${lastHist.y}`,
  ];
  const bandPolygonString = [...upperBandCoords, ...lowerBandCoords].join(' ');

  const histPolylineString = histPoints.map((p) => `${p.x},${p.y}`).join(' ');
  const forecastPolylineString = [
    `${lastHist.x},${lastHist.y}`,
    ...forecastPoints.map((p) => `${p.x},${p.y}`),
  ].join(' ');

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-btn bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/25 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-text">
                  Prophet Cloud Cost Forecasting
                </h2>
                <button
                  onClick={() => setShowInfoPopover(!showInfoPopover)}
                  className="text-muted hover:text-brand-cyan transition"
                  title="What is this?"
                >
                  <Info className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-muted">
                Time-series linear regression and seasonal decomposition with widening 95% confidence intervals.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-start lg:justify-end">
            {/* Provider Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted mr-1">Scope:</span>
              {['All', 'AWS', 'Azure', 'GCP'].map((p) => (
                <button
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`px-2.5 py-1 rounded-btn text-xs font-semibold border transition ${
                    selectedProvider === p
                      ? 'bg-elevated text-brand-cyan border-brand-cyan'
                      : 'bg-surface text-muted border-border hover:text-text'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Horizon Selector */}
            <SegmentedControl
              options={[
                { value: 3, label: '+3 Mos' },
                { value: 6, label: '+6 Mos' },
                { value: 9, label: '+9 Mos' },
                { value: 12, label: '+12 Mos' },
              ]}
              value={selectedPeriods}
              onChange={handlePeriodChange}
            />
          </div>
        </div>

        {/* Confidence Interval Info Popover */}
        {showInfoPopover && (
          <div className="mt-4 p-3.5 rounded-card bg-elevated border border-border text-xs text-text space-y-1.5 animate-in fade-in duration-150">
            <div className="font-semibold text-brand-cyan flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Understanding 95% Confidence Intervals
            </div>
            <p className="text-muted leading-relaxed">
              The shaded band demonstrates the statistical range where monthly expenditure is expected to land with 95% certainty. The band expands over farther forecast horizons to reflect accumulating multi-cloud uncertainty and variable usage spikes.
            </p>
          </div>
        )}
      </Card>

      {/* Side / Below Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Latest Actual Spend
          </span>
          <div className="text-2xl font-bold font-mono text-text mt-1">
            {formatCurrency(currentSpend)}
          </div>
          <div className="text-[11px] text-muted mt-2">
            Baseline: {filteredHistory[filteredHistory.length - 1]?.date}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Next Month Projection
          </span>
          <div className="text-2xl font-bold font-mono text-brand-cyan mt-1">
            {formatCurrency(nextMonthCost)}
          </div>
          <div className="text-[11px] text-brand-cyan/80 mt-2">
            Range: {formatCurrency(forecast[0]?.lower_bound || nextMonthCost * 0.95)} -{' '}
            {formatCurrency(forecast[0]?.upper_bound || nextMonthCost * 1.05)}
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Horizon Growth Rate
          </span>
          <div className="text-2xl font-bold font-mono text-warning mt-1">
            {growthRate >= 0 ? `+${growthRate.toFixed(1)}%` : `${growthRate.toFixed(1)}%`}
          </div>
          <div className="text-[11px] text-muted mt-2">
            Across selected +{selectedPeriods} months horizon
          </div>
        </Card>

        <Card className="p-4 sm:p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted">
            Confidence Spread
          </span>
          <div className="text-2xl font-bold font-mono text-text mt-1">
            ±
            {formatCurrency(
              ((forecast[forecast.length - 1]?.upper_bound || endPeriodCost) - endPeriodCost)
            )}
          </div>
          <div className="text-[11px] text-muted mt-2">At horizon endpoint</div>
        </Card>
      </div>

      {/* Main Fluid SVG Chart */}
      <Card className="p-5 sm:p-6" ref={containerRef}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-text font-medium">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block"></span>
              Historical Actuals
            </span>
            <span className="flex items-center gap-1.5 text-brand-cyan font-medium">
              <span className="w-3 h-3 rounded-sm bg-brand-cyan inline-block"></span>
              Prophet Predicted Line
            </span>
            <span className="flex items-center gap-1.5 text-muted font-medium">
              <span className="w-3 h-3 rounded-sm bg-brand-cyan/20 border border-brand-cyan/40 inline-block"></span>
              95% Confidence Interval
            </span>
          </div>

          <div className="text-xs font-mono text-muted">
            Today: {filteredHistory[filteredHistory.length - 1]?.date}
          </div>
        </div>

        {/* Fluid SVG Canvas */}
        <div className="relative h-64 sm:h-72 w-full">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${chartWidth} 240`}>
            <defs>
              <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#22D3EE" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines */}
            {[0, 60, 120, 180, 240].map((y) => (
              <line
                key={y}
                x1="40"
                y1={y}
                x2={chartWidth - 20}
                y2={y}
                stroke="currentColor"
                className="text-border"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
            ))}

            {/* "Today" Divider line */}
            <line
              x1={lastHist.x}
              y1="10"
              x2={lastHist.x}
              y2="230"
              stroke="#6366F1"
              strokeDasharray="3 3"
              strokeWidth="2"
            />
            <text
              x={lastHist.x - 6}
              y="25"
              textAnchor="end"
              className="fill-brand-indigo font-mono text-[10px] font-bold"
            >
              Today
            </text>

            {/* 95% Confidence Band Polygon */}
            {bandPolygonString && (
              <polygon points={bandPolygonString} fill="url(#bandGradient)" />
            )}

            {/* Historical Actuals Polyline */}
            {histPolylineString && (
              <polyline
                points={histPolylineString}
                fill="none"
                stroke="#3B82F6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            )}

            {/* Forecast Polyline (Dashed) */}
            {forecastPolylineString && (
              <polyline
                points={forecastPolylineString}
                fill="none"
                stroke="#22D3EE"
                strokeWidth="2.5"
                strokeDasharray="5 3"
                strokeLinecap="round"
              />
            )}

            {/* Historical Dots */}
            {histPoints.map((p, i) => (
              <circle
                key={`h-${i}`}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="#3B82F6"
                className="hover:r-5 transition-all cursor-pointer"
                onMouseEnter={() => setHoverIndex(i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}

            {/* Forecast Dots */}
            {forecastPoints.map((p, i) => (
              <circle
                key={`f-${i}`}
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#22D3EE"
                stroke="#0B0F17"
                strokeWidth="2"
                className="hover:r-6 transition-all cursor-pointer"
                onMouseEnter={() => setHoverIndex(histCount + i)}
                onMouseLeave={() => setHoverIndex(null)}
              />
            ))}
          </svg>

          {/* Interactive Tooltip Card */}
          {hoverIndex !== null && (
            <div className="absolute top-2 right-4 bg-surface border border-border rounded-btn p-3 shadow-xl pointer-events-none text-xs z-10 font-mono animate-in fade-in duration-150">
              {hoverIndex < histCount ? (
                <div>
                  <div className="text-muted font-sans text-[10px]">Historical Actual</div>
                  <div className="font-bold text-text">{filteredHistory[hoverIndex]?.date}</div>
                  <div className="text-sm font-bold text-blue-400 mt-1">
                    {formatCurrency(filteredHistory[hoverIndex]?.total_cost || 0)}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-muted font-sans text-[10px]">Prophet Projection</div>
                  <div className="font-bold text-text">
                    {forecast[hoverIndex - histCount]?.date}
                  </div>
                  <div className="text-sm font-bold text-brand-cyan mt-1">
                    {formatCurrency(forecast[hoverIndex - histCount]?.predicted_cost || 0)}
                  </div>
                  <div className="text-[10px] text-muted mt-1">
                    95% CI: {formatCurrency(forecast[hoverIndex - histCount]?.lower_bound || 0)} -{' '}
                    {formatCurrency(forecast[hoverIndex - histCount]?.upper_bound || 0)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Compact Table of Forecast Rows */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
            Detailed Forecast Horizons (Prophet Decomposition)
          </h3>
          <span className="text-xs text-muted font-mono">{forecast.length} periods</span>
        </div>

        {/* Desktop Table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-elevated/70 text-muted uppercase font-sans tracking-wider border-b border-border">
              <tr>
                <th className="px-5 py-3">Forecast Date</th>
                <th className="px-5 py-3">Predicted Spend</th>
                <th className="px-5 py-3">Lower 95% Bound</th>
                <th className="px-5 py-3">Upper 95% Bound</th>
                <th className="px-5 py-3 text-right">Horizon Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {forecast.map((f) => {
                const diff = f.predicted_cost - currentSpend;
                const diffPct = currentSpend > 0 ? (diff / currentSpend) * 100 : 0;
                return (
                  <tr key={f.date} className="hover:bg-elevated/50 transition">
                    <td className="px-5 py-3 text-text font-bold flex items-center gap-2 font-sans">
                      <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
                      {f.date}
                    </td>
                    <td className="px-5 py-3 text-brand-cyan font-bold">
                      {formatCurrency(f.predicted_cost)}
                    </td>
                    <td className="px-5 py-3 text-muted">{formatCurrency(f.lower_bound)}</td>
                    <td className="px-5 py-3 text-muted">{formatCurrency(f.upper_bound)}</td>
                    <td className="px-5 py-3 text-right font-sans">
                      <span className={`text-[11px] font-semibold ${diff >= 0 ? 'text-warning' : 'text-success'}`}>
                        {diff >= 0 ? `+${diffPct.toFixed(1)}%` : `${diffPct.toFixed(1)}%`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards */}
        <div className="sm:hidden divide-y divide-border">
          {forecast.map((f) => (
            <div key={f.date} className="p-4 space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-text">
                <span className="flex items-center gap-1.5 font-sans">
                  <Calendar className="w-3.5 h-3.5 text-brand-cyan" />
                  {f.date}
                </span>
                <span className="font-mono text-brand-cyan">{formatCurrency(f.predicted_cost)}</span>
              </div>
              <div className="flex items-center justify-between text-muted text-[11px] font-mono">
                <span>95% Bounds:</span>
                <span>{formatCurrency(f.lower_bound)} - {formatCurrency(f.upper_bound)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
