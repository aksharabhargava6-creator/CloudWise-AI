import React, { useState } from 'react';
import {
  DollarSign,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Layers,
  Server,
  Zap,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  CloudResource,
  DashboardOverview,
  Forecast,
  Anomaly,
  Recommendation,
} from '../types/cloudwise.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';
import { AnimatedNumber } from './ui/AnimatedNumber.js';
import { Card, ProviderBadge, PriorityBadge } from './ui/Primitives.js';

interface OverviewTabProps {
  overview: DashboardOverview | null;
  forecast: Forecast[];
  anomalies: Anomaly[];
  recommendations: Recommendation[];
  resources: CloudResource[];
  onNavigateTab: (tab: string) => void;
  onRunAnalysis: () => void;
  isAnalyzing: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  overview,
  forecast,
  anomalies,
  recommendations,
  resources,
  onNavigateTab,
  onRunAnalysis,
  isAnalyzing,
}) => {
  const [hoveredDonutSegment, setHoveredDonutSegment] = useState<string | null>(null);

  const totalMonthlySpend = overview?.totalMonthlySpend || 0;
  const potentialSavings = overview?.totalPredictedSavings || 0;
  const activeAnomalies = anomalies.filter((a) => a.anomaly);
  const nextMonthForecast = overview?.forecastNextMonth || (totalMonthlySpend * 1.035);

  const awsSpend = overview?.cloudSpendBreakdown?.AWS || 0;
  const azureSpend = overview?.cloudSpendBreakdown?.Azure || 0;
  const gcpSpend = overview?.cloudSpendBreakdown?.GCP || 0;

  const totalCloudSpend = awsSpend + azureSpend + gcpSpend || totalMonthlySpend || 1;

  // Donut chart angles calculation
  const awsAngle = (awsSpend / totalCloudSpend) * 360;
  const azureAngle = (azureSpend / totalCloudSpend) * 360;
  const gcpAngle = (gcpSpend / totalCloudSpend) * 360;

  // Sorted costliest resources
  const topCostly = [...resources]
    .sort((a, b) => b.monthly_cost - a.monthly_cost)
    .slice(0, 5);

  // High priority "needs attention" items
  const highPriorityRecs = recommendations
    .filter((r) => r.priority === 'HIGH')
    .slice(0, 3);
  const topAnomalies = activeAnomalies.slice(0, 3);

  // Generate plain language dynamic insight banner
  const stoppedBillingCount = resources.filter((r) => r.status === 'stopped' && r.monthly_cost > 0).length;
  const stoppedBillingCost = resources
    .filter((r) => r.status === 'stopped' && r.monthly_cost > 0)
    .reduce((acc, r) => acc + r.monthly_cost, 0);

  const underutilizedCount = resources.filter((r) => r.cpu_utilization < 15 && r.status === 'running').length;

  return (
    <div className="space-y-6">
      {/* Dynamic AI Insight Banner */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-r from-brand-indigo/15 via-elevated to-brand-cyan/15 border border-brand-indigo/30 p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-btn bg-brand-indigo/20 text-brand-cyan border border-brand-cyan/30 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-5 h-5 text-brand-cyan" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-brand-cyan">
                  AI Optimization Insight
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-surface/60 text-muted border border-border">
                  Live Engine Analysis
                </span>
              </div>
              <p className="text-sm text-text font-medium mt-1">
                {stoppedBillingCount > 0 ? (
                  <>
                    <strong className="text-danger">{stoppedBillingCount} stopped resources</strong> are incurring{' '}
                    <strong className="text-text font-mono">{formatCurrency(stoppedBillingCost)}/mo</strong> in unattached fees.{' '}
                    {underutilizedCount > 0 && (
                      <span>
                        Plus {underutilizedCount} compute instances are running under 15% CPU load.
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    Infrastructure utilization is stable. Reclaiming overprovisioned compute can lower overall run-rate by{' '}
                    <strong className="text-success">{formatPercent(overview?.savingsDeltaPercent || 15)}</strong>.
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
            <button
              onClick={() => onNavigateTab('recommendations')}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-btn bg-surface hover:bg-elevated text-text border border-border transition flex items-center gap-1.5 shadow-sm"
            >
              View Actions
              <ArrowUpRight className="w-3.5 h-3.5 text-brand-cyan" />
            </button>
            <button
              onClick={onRunAnalysis}
              disabled={isAnalyzing}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-btn bg-gradient-to-r from-brand-indigo to-brand-cyan text-slate-950 hover:opacity-90 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              {isAnalyzing ? 'Analyzing...' : 'Re-run AI'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Row (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Monthly Spend */}
        <Card hoverLift className="p-4 sm:p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Monthly Spend</span>
            <div className="w-7 h-7 rounded-btn bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-text">
            <AnimatedNumber value={totalMonthlySpend} formatter={formatCurrency} />
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-warning">
              <ArrowUpRight className="w-3.5 h-3.5" /> +3.4% drift
            </span>
            {/* Sparkline */}
            <svg className="w-16 h-5" viewBox="0 0 64 20">
              <path
                d="M2 16 L14 14 L26 15 L38 11 L50 8 L62 4"
                fill="none"
                stroke="#6366F1"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Card>

        {/* Card 2: Active Anomalies */}
        <Card hoverLift className="p-4 sm:p-5 flex flex-col justify-between" onClick={() => onNavigateTab('anomalies')}>
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Anomalies</span>
            <div className="w-7 h-7 rounded-btn bg-warning/10 text-warning flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-warning">
            <AnimatedNumber value={activeAnomalies.length} />
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted">
              {activeAnomalies.filter((a) => a.anomaly_type === 'stopped_with_cost').length} idle billing alerts
            </span>
            <svg className="w-16 h-5" viewBox="0 0 64 20">
              <path
                d="M2 18 L16 17 L30 18 L44 8 L54 12 L62 5"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Card>

        {/* Card 3: Potential Monthly Savings */}
        <Card hoverLift className="p-4 sm:p-5 flex flex-col justify-between" onClick={() => onNavigateTab('recommendations')}>
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Potential Savings</span>
            <div className="w-7 h-7 rounded-btn bg-success/10 text-success flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-success">
            <AnimatedNumber value={potentialSavings} formatter={formatCurrency} />
            <span className="text-xs font-normal text-muted font-sans ml-1">/mo</span>
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-[11px] font-medium text-success inline-flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              {overview?.savingsDeltaPercent || 18.2}% reduction
            </span>
            <svg className="w-16 h-5" viewBox="0 0 64 20">
              <path
                d="M2 6 L14 8 L28 10 L42 14 L56 16 L62 18"
                fill="none"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </Card>

        {/* Card 4: Forecast (Next Month) */}
        <Card hoverLift className="p-4 sm:p-5 flex flex-col justify-between" onClick={() => onNavigateTab('forecast')}>
          <div className="flex items-center justify-between text-muted mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Next Month Forecast</span>
            <div className="w-7 h-7 rounded-btn bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-brand-cyan">
            <AnimatedNumber value={nextMonthForecast} formatter={formatCurrency} />
          </div>
          <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
            <span className="text-[11px] text-muted">Prophet (95% CI)</span>
            <svg className="w-16 h-5" viewBox="0 0 64 20">
              <path
                d="M2 16 L16 14 L30 13 L44 9 L58 6 L62 4"
                fill="none"
                stroke="#22D3EE"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="3 2"
              />
            </svg>
          </div>
        </Card>
      </div>

      {/* Middle Row: Multi-Cloud Donut Chart & Spend by Resource Type */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Donut Chart: Cloud Spend Breakdown */}
        <Card className="p-5 lg:col-span-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Cloud Spend Distribution
              </h2>
              <p className="text-xs text-muted">AWS, Azure & GCP allocation</p>
            </div>
            <span className="text-xs font-mono font-medium text-text">
              {resources.length} active assets
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 my-2">
            {/* SVG Donut */}
            <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Background Ring */}
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" className="text-border" strokeWidth="12" />

                {/* AWS Segment (Orange) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#FF9900"
                  strokeWidth={hoveredDonutSegment === 'AWS' ? '15' : '12'}
                  strokeDasharray={`${(awsAngle / 360) * 238.76} 238.76`}
                  strokeDashoffset="0"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredDonutSegment('AWS')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                />

                {/* Azure Segment (Blue) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#0078D4"
                  strokeWidth={hoveredDonutSegment === 'Azure' ? '15' : '12'}
                  strokeDasharray={`${(azureAngle / 360) * 238.76} 238.76`}
                  strokeDashoffset={`-${(awsAngle / 360) * 238.76}`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredDonutSegment('Azure')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                />

                {/* GCP Segment (Green) */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#34A853"
                  strokeWidth={hoveredDonutSegment === 'GCP' ? '15' : '12'}
                  strokeDasharray={`${(gcpAngle / 360) * 238.76} 238.76`}
                  strokeDashoffset={`-${((awsAngle + azureAngle) / 360) * 238.76}`}
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredDonutSegment('GCP')}
                  onMouseLeave={() => setHoveredDonutSegment(null)}
                />
              </svg>

              {/* Donut Center Display */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-semibold text-muted tracking-wider">
                  {hoveredDonutSegment || 'Total Spend'}
                </span>
                <span className="text-base font-bold font-mono text-text">
                  {hoveredDonutSegment === 'AWS'
                    ? formatCurrency(awsSpend)
                    : hoveredDonutSegment === 'Azure'
                    ? formatCurrency(azureSpend)
                    : hoveredDonutSegment === 'GCP'
                    ? formatCurrency(gcpSpend)
                    : formatCurrency(totalMonthlySpend)}
                </span>
              </div>
            </div>

            {/* Interactive Legend */}
            <div className="space-y-2.5 w-full sm:w-auto">
              <div
                onMouseEnter={() => setHoveredDonutSegment('AWS')}
                onMouseLeave={() => setHoveredDonutSegment(null)}
                className={`p-2 rounded-btn transition cursor-pointer flex items-center justify-between gap-4 ${
                  hoveredDonutSegment === 'AWS' ? 'bg-elevated' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-aws"></span>
                  <span className="text-xs font-medium text-text">Amazon Web Services</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-text">{formatCurrency(awsSpend)}</div>
                  <div className="text-[10px] text-muted">{formatPercent(awsSpend / totalCloudSpend, false)}</div>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredDonutSegment('Azure')}
                onMouseLeave={() => setHoveredDonutSegment(null)}
                className={`p-2 rounded-btn transition cursor-pointer flex items-center justify-between gap-4 ${
                  hoveredDonutSegment === 'Azure' ? 'bg-elevated' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-azure"></span>
                  <span className="text-xs font-medium text-text">Microsoft Azure</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-text">{formatCurrency(azureSpend)}</div>
                  <div className="text-[10px] text-muted">{formatPercent(azureSpend / totalCloudSpend, false)}</div>
                </div>
              </div>

              <div
                onMouseEnter={() => setHoveredDonutSegment('GCP')}
                onMouseLeave={() => setHoveredDonutSegment(null)}
                className={`p-2 rounded-btn transition cursor-pointer flex items-center justify-between gap-4 ${
                  hoveredDonutSegment === 'GCP' ? 'bg-elevated' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gcp"></span>
                  <span className="text-xs font-medium text-text">Google Cloud</span>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono font-bold text-text">{formatCurrency(gcpSpend)}</div>
                  <div className="text-[10px] text-muted">{formatPercent(gcpSpend / totalCloudSpend, false)}</div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Spend by Resource Type (Stacked Horizontal Bars) */}
        <Card className="p-5 lg:col-span-7 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Spend by Resource Classification
              </h2>
              <p className="text-xs text-muted">Compute vs Databases vs Storage & Serverless</p>
            </div>
            <button
              onClick={() => onNavigateTab('resources')}
              className="text-xs text-brand-cyan hover:underline flex items-center gap-1"
            >
              All Assets <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3.5 my-auto">
            {overview?.resourceTypeSpend && overview.resourceTypeSpend.length > 0 ? (
              overview.resourceTypeSpend.slice(0, 5).map((item) => (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-text">{item.type}</span>
                    <span className="font-mono text-muted">
                      {formatCurrency(item.amount)} ({item.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-elevated rounded-full overflow-hidden flex">
                    <div
                      className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-brand-indigo to-brand-cyan"
                      style={{ width: `${Math.max(item.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-muted">Loading classification spend...</div>
            )}
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-[11px] text-muted">
            <span>Primary cost drivers: Virtualized Compute & Relational Databases</span>
            <span className="text-brand-cyan font-medium">85% of total cloud invoice</span>
          </div>
        </Card>
      </div>

      {/* Bottom Row: Top Costliest Resources & Needs Attention Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 5 Costliest Resources */}
        <Card className="p-5 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-brand-cyan" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Top 5 Costliest Resources
              </h2>
            </div>
            <button
              onClick={() => onNavigateTab('resources')}
              className="text-xs text-brand-cyan hover:underline flex items-center gap-1"
            >
              Inventory <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {topCostly.map((res, idx) => (
              <div
                key={res.id}
                className="p-3 rounded-btn bg-elevated/60 border border-border flex items-center justify-between gap-3 hover:border-text/20 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xs font-mono text-muted font-semibold w-4">
                    #{idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-text truncate">
                        {res.name}
                      </span>
                      <ProviderBadge provider={res.provider} />
                    </div>
                    <div className="text-[11px] text-muted truncate mt-0.5">
                      {res.resource_type} • {res.region}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-mono font-bold text-text">
                    {formatCurrency(res.monthly_cost)}
                  </div>
                  <div className="text-[10px] text-muted font-mono">
                    CPU {res.cpu_utilization}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Needs Attention Feed */}
        <Card className="p-5 lg:col-span-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-danger" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                Needs Attention
              </h2>
            </div>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/25">
              {highPriorityRecs.length + topAnomalies.length} items
            </span>
          </div>

          <div className="space-y-2.5">
            {/* High priority recs */}
            {highPriorityRecs.map((rec, i) => (
              <div
                key={`rec-${i}`}
                onClick={() => onNavigateTab('recommendations')}
                className="p-3 rounded-btn bg-danger/5 border border-danger/20 flex items-start justify-between gap-3 hover:bg-danger/10 transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <PriorityBadge priority="HIGH" />
                    <span className="text-xs font-mono font-semibold text-text truncate">
                      {rec.resource_id}
                    </span>
                  </div>
                  <p className="text-xs text-text/90 line-clamp-1">{rec.recommendation}</p>
                </div>
                {rec.estimated_saving_usd ? (
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-success font-mono">
                      +{formatCurrency(rec.estimated_saving_usd)}
                    </span>
                    <div className="text-[10px] text-muted">saving</div>
                  </div>
                ) : null}
              </div>
            ))}

            {/* Top anomalies */}
            {topAnomalies.map((anom) => (
              <div
                key={anom.resource_id}
                onClick={() => onNavigateTab('anomalies')}
                className="p-3 rounded-btn bg-warning/5 border border-warning/20 flex items-start justify-between gap-3 hover:bg-warning/10 transition cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-warning/20 text-warning border border-warning/30 uppercase">
                      Anomaly
                    </span>
                    <span className="text-xs font-mono font-semibold text-text truncate">
                      {anom.resource_id}
                    </span>
                    <ProviderBadge provider={anom.cloud} />
                  </div>
                  <p className="text-xs text-muted capitalize line-clamp-1">
                    {anom.anomaly_type?.replace(/_/g, ' ') || 'Metric outlier'}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-xs font-bold text-warning font-mono">
                    Score: {anom.anomaly_score.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-muted font-mono">CPU {anom.cpu_utilization}%</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
