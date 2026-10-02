import React, { useState } from 'react';
import {
  AlertTriangle,
  RefreshCw,
  Filter,
  Activity,
  Sliders,
  X,
  ArrowRight,
  HardDrive,
  Cpu,
  Power,
  TrendingDown,
  Info,
  Server,
  Zap,
} from 'lucide-react';
import { Anomaly } from '../types/cloudwise.js';
import { Card, ProviderBadge, Button } from './ui/Primitives.js';
import { formatCurrency, formatPercent } from '../utils/formatters.js';

interface AnomaliesTabProps {
  anomalies: Anomaly[];
  onRefresh: (contamination: number) => Promise<void>;
  isLoading: boolean;
}

export const AnomaliesTab: React.FC<AnomaliesTabProps> = ({
  anomalies,
  onRefresh,
  isLoading,
}) => {
  const [contamination, setContamination] = useState<number>(0.05);
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<Anomaly | null>(null);

  // Filter anomalies
  const filtered = anomalies.filter((a) => {
    if (providerFilter !== 'ALL' && a.cloud.toUpperCase() !== providerFilter) return false;
    if (typeFilter !== 'ALL' && a.anomaly_type !== typeFilter) return false;
    return true;
  });

  // Counts by anomaly category
  const countByType: Record<string, number> = {
    stopped_with_cost: anomalies.filter((a) => a.anomaly && a.anomaly_type === 'stopped_with_cost').length,
    high_cpu_and_traffic: anomalies.filter((a) => a.anomaly && a.anomaly_type === 'high_cpu_and_traffic').length,
    storage_pressure: anomalies.filter((a) => a.anomaly && a.anomaly_type === 'storage_pressure').length,
    high_utilization: anomalies.filter((a) => a.anomaly && a.anomaly_type === 'high_utilization').length,
    underutilized: anomalies.filter((a) => a.anomaly && a.anomaly_type === 'underutilized').length,
  };

  const handleScan = () => {
    onRefresh(contamination);
  };

  return (
    <div className="space-y-6">
      {/* Control Bar */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-btn bg-warning/10 text-warning border border-warning/25 flex items-center justify-center shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                Isolation Forest Anomaly Detection
              </h2>
              <p className="text-xs text-muted">
                Unsupervised outlier isolation over CPU, memory, storage, traffic and cost metrics.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-start lg:justify-end">
            {/* Contamination Slider */}
            <div className="flex items-center gap-2.5 bg-elevated px-3 py-1.5 rounded-btn border border-border">
              <Sliders className="w-3.5 h-3.5 text-muted shrink-0" />
              <div className="text-xs">
                <span className="text-muted mr-1.5">Contamination (c):</span>
                <span className="font-mono font-bold text-text">{contamination.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.20"
                step="0.01"
                value={contamination}
                onChange={(e) => setContamination(parseFloat(e.target.value))}
                className="w-24 accent-brand-cyan h-1 cursor-pointer"
              />
            </div>

            <Button
              onClick={handleScan}
              loading={isLoading}
              variant="primary"
              size="sm"
              icon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Scan Now
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-4 pt-4 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Provider:
            </span>
            {['ALL', 'AWS', 'AZURE', 'GCP'].map((p) => (
              <button
                key={p}
                onClick={() => setProviderFilter(p)}
                className={`px-2.5 py-1 rounded-btn text-xs font-semibold border transition ${
                  providerFilter === p
                    ? 'bg-elevated text-brand-cyan border-brand-cyan'
                    : 'bg-surface text-muted border-border hover:text-text'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs text-muted mr-1">Condition:</span>
            {[
              { id: 'ALL', label: 'All Anomalies' },
              { id: 'stopped_with_cost', label: 'Stopped w/ Cost' },
              { id: 'high_cpu_and_traffic', label: 'High CPU + Traffic' },
              { id: 'storage_pressure', label: 'Disk Pressure' },
              { id: 'high_utilization', label: 'High Utilization' },
              { id: 'underutilized', label: 'Underutilized' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTypeFilter(t.id)}
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium border transition ${
                  typeFilter === t.id
                    ? 'bg-brand-indigo/15 text-brand-cyan border-brand-cyan/40'
                    : 'bg-elevated/40 text-muted border-border hover:text-text'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Summary Strip (5 Anomaly Types with counts & icons) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card
          hoverLift
          className={`p-3 cursor-pointer ${typeFilter === 'stopped_with_cost' ? 'border-danger' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'stopped_with_cost' ? 'ALL' : 'stopped_with_cost')}
        >
          <div className="flex items-center justify-between text-danger mb-1">
            <Power className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">{countByType.stopped_with_cost}</span>
          </div>
          <div className="text-xs font-semibold text-text truncate">Stopped w/ Cost</div>
          <div className="text-[10px] text-muted truncate">Billing accrued while idle</div>
        </Card>

        <Card
          hoverLift
          className={`p-3 cursor-pointer ${typeFilter === 'high_cpu_and_traffic' ? 'border-warning' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'high_cpu_and_traffic' ? 'ALL' : 'high_cpu_and_traffic')}
        >
          <div className="flex items-center justify-between text-warning mb-1">
            <Zap className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">{countByType.high_cpu_and_traffic}</span>
          </div>
          <div className="text-xs font-semibold text-text truncate">High CPU + Net</div>
          <div className="text-[10px] text-muted truncate">CPU &gt;85% &amp; traffic burst</div>
        </Card>

        <Card
          hoverLift
          className={`p-3 cursor-pointer ${typeFilter === 'storage_pressure' ? 'border-danger' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'storage_pressure' ? 'ALL' : 'storage_pressure')}
        >
          <div className="flex items-center justify-between text-danger mb-1">
            <HardDrive className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">{countByType.storage_pressure}</span>
          </div>
          <div className="text-xs font-semibold text-text truncate">Storage Pressure</div>
          <div className="text-[10px] text-muted truncate">Disk space &gt;= 90%</div>
        </Card>

        <Card
          hoverLift
          className={`p-3 cursor-pointer ${typeFilter === 'high_utilization' ? 'border-warning' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'high_utilization' ? 'ALL' : 'high_utilization')}
        >
          <div className="flex items-center justify-between text-warning mb-1">
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">{countByType.high_utilization}</span>
          </div>
          <div className="text-xs font-semibold text-text truncate">High Utilization</div>
          <div className="text-[10px] text-muted truncate">CPU &gt;= 90% &amp; Mem &gt;= 85%</div>
        </Card>

        <Card
          hoverLift
          className={`p-3 cursor-pointer ${typeFilter === 'underutilized' ? 'border-info' : ''}`}
          onClick={() => setTypeFilter(typeFilter === 'underutilized' ? 'ALL' : 'underutilized')}
        >
          <div className="flex items-center justify-between text-info mb-1">
            <TrendingDown className="w-4 h-4" />
            <span className="text-xs font-mono font-bold">{countByType.underutilized}</span>
          </div>
          <div className="text-xs font-semibold text-text truncate">Underutilized</div>
          <div className="text-[10px] text-muted truncate">CPU &lt; 10% &amp; Mem &lt; 20%</div>
        </Card>
      </div>

      {/* Scatter Plot (SVG): x = CPU %, y = Memory % (or cost) */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Multivariate Isolation Scatter Plot
            </h3>
            <p className="text-xs text-muted">
              X = CPU Utilization (%) • Y = Memory Utilization (%) • Anomalous nodes glow red
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-aws"></span> AWS
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-azure"></span> Azure
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="w-2.5 h-2.5 rounded-full bg-gcp"></span> GCP
            </span>
            <span className="flex items-center gap-1.5 text-danger font-semibold">
              <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse"></span> Anomaly
            </span>
          </div>
        </div>

        {/* Scatter Canvas */}
        <div className="relative h-64 sm:h-72 w-full bg-elevated/40 rounded-card border border-border p-3">
          <svg className="w-full h-full" viewBox="0 0 500 240" preserveAspectRatio="none">
            {/* Gridlines */}
            {[0, 25, 50, 75, 100].map((pct) => {
              const y = 220 - (pct / 100) * 200;
              const x = 30 + (pct / 100) * 450;
              return (
                <React.Fragment key={pct}>
                  <line x1="30" y1={y} x2="480" y2={y} stroke="currentColor" className="text-border" strokeDasharray="3 3" />
                  <line x1={x} y1="20" x2={x} y2="220" stroke="currentColor" className="text-border" strokeDasharray="3 3" />
                  <text x="24" y={y + 3} textAnchor="end" className="fill-muted text-[9px] font-mono">
                    {pct}%
                  </text>
                  <text x={x} y="235" textAnchor="middle" className="fill-muted text-[9px] font-mono">
                    {pct}%
                  </text>
                </React.Fragment>
              );
            })}

            {/* Scatter points */}
            {anomalies.map((item) => {
              const cpu = item.cpu_utilization;
              const mem = item.memory_utilization ?? 50;
              const cx = 30 + (cpu / 100) * 450;
              const cy = 220 - (mem / 100) * 200;

              const isAWS = item.cloud.toUpperCase() === 'AWS';
              const isAZ = item.cloud.toUpperCase() === 'AZURE';
              const color = isAWS ? '#FF9900' : isAZ ? '#0078D4' : '#34A853';

              return (
                <g key={item.resource_id} className="cursor-pointer" onClick={() => setSelectedAnomaly(item)}>
                  {item.anomaly && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r="10"
                      fill="#EF4444"
                      opacity="0.35"
                      className="pulse-glow"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={item.anomaly ? 6 : 4}
                    fill={item.anomaly ? '#EF4444' : color}
                    stroke={item.anomaly ? '#FFF' : '#111827'}
                    strokeWidth="1.5"
                    onMouseEnter={() => setHoveredPoint(item)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                </g>
              );
            })}
          </svg>

          {/* Scatter Hover Tooltip */}
          {hoveredPoint && (
            <div className="absolute top-4 right-4 bg-surface border border-border rounded-btn p-3 shadow-xl pointer-events-none text-xs z-10 animate-in fade-in duration-150">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono font-bold text-text">{hoveredPoint.resource_id}</span>
                <ProviderBadge provider={hoveredPoint.cloud} />
              </div>
              <div className="space-y-0.5 font-mono text-[11px] text-muted">
                <div>CPU: <span className="text-text">{hoveredPoint.cpu_utilization}%</span></div>
                <div>Memory: <span className="text-text">{hoveredPoint.memory_utilization ?? 50}%</span></div>
                <div>
                  Score:{' '}
                  <span className={hoveredPoint.anomaly ? 'text-danger font-bold' : 'text-success'}>
                    {hoveredPoint.anomaly_score.toFixed(3)}
                  </span>
                </div>
                {hoveredPoint.anomaly && (
                  <div className="text-warning capitalize">{hoveredPoint.anomaly_type?.replace(/_/g, ' ')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Anomalies List / Table */}
      <Card className="overflow-hidden">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Detected Outlier Resources ({filtered.length})
            </h3>
            <p className="text-xs text-muted">Click any row to open the resource diagnostic drawer</p>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-elevated/70 text-muted uppercase tracking-wider font-semibold border-b border-border">
              <tr>
                <th className="px-5 py-3">Resource ID</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Classification</th>
                <th className="px-5 py-3">CPU Load</th>
                <th className="px-5 py-3">Isolation Score</th>
                <th className="px-5 py-3">Anomaly Type</th>
                <th className="px-5 py-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-muted font-sans">
                    No anomalies matching the current filter criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const severityPct = Math.min(100, Math.max(10, Math.abs(item.anomaly_score) * 220));
                  return (
                    <tr
                      key={item.resource_id}
                      onClick={() => setSelectedAnomaly(item)}
                      className={`hover:bg-elevated/80 transition cursor-pointer ${
                        item.anomaly ? 'bg-danger/5' : ''
                      }`}
                    >
                      <td className="px-5 py-3 font-semibold text-text font-sans">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                          <span className="font-mono text-xs">{item.resource_id}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-sans">
                        <ProviderBadge provider={item.cloud} />
                      </td>
                      <td className="px-5 py-3 text-muted font-sans">{item.resource_type}</td>
                      <td className="px-5 py-3 text-text">
                        <div className="flex items-center gap-2">
                          <span className="w-10">{item.cpu_utilization}%</span>
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${item.cpu_utilization}%`,
                                backgroundColor: item.cpu_utilization >= 85 ? '#EF4444' : item.cpu_utilization <= 15 ? '#38BDF8' : '#22C55E',
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-danger font-mono w-14">
                            {item.anomaly_score.toFixed(3)}
                          </span>
                          {/* Severity Gauge */}
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-danger rounded-full"
                              style={{ width: `${severityPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 font-sans">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-medium capitalize bg-danger/10 text-danger border border-danger/25">
                          {item.anomaly_type?.replace(/_/g, ' ') || 'Outlier'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-sans">
                        <span className="text-xs text-brand-cyan hover:underline flex items-center justify-end gap-1">
                          Inspect <ArrowRight className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Stacked Cards (no horizontal scroll) */}
        <div className="md:hidden divide-y divide-border">
          {filtered.map((item) => (
            <div
              key={item.resource_id}
              onClick={() => setSelectedAnomaly(item)}
              className="p-4 hover:bg-elevated/60 transition cursor-pointer space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-mono font-bold text-xs text-text">{item.resource_id}</span>
                </div>
                <ProviderBadge provider={item.cloud} />
              </div>

              <div className="flex items-center justify-between text-xs text-muted">
                <span>{item.resource_type}</span>
                <span className="capitalize text-danger font-medium">
                  {item.anomaly_type?.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                <span>CPU: <strong className="font-mono text-text">{item.cpu_utilization}%</strong></span>
                <span>
                  Score: <strong className="font-mono text-danger">{item.anomaly_score.toFixed(3)}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Drawer (Right side on desktop, bottom sheet on mobile) */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-surface border-l border-border h-full p-6 overflow-y-auto flex flex-col justify-between shadow-2xl">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-btn bg-danger/10 text-danger flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text font-mono">
                      {selectedAnomaly.resource_id}
                    </h3>
                    <p className="text-[11px] text-muted">Diagnostic Anomaly Report</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="p-1.5 rounded-btn hover:bg-elevated text-muted hover:text-text transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Badges */}
              <div className="flex items-center gap-2">
                <ProviderBadge provider={selectedAnomaly.cloud} />
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-danger/15 text-danger border border-danger/30 capitalize">
                  {selectedAnomaly.anomaly_type?.replace(/_/g, ' ')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-elevated text-muted border border-border">
                  Score: {selectedAnomaly.anomaly_score.toFixed(3)}
                </span>
              </div>

              {/* Metrics Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Resource Telemetry
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-elevated p-3 rounded-card border border-border">
                    <span className="text-[10px] text-muted uppercase">CPU Utilization</span>
                    <div className="text-xl font-bold font-mono text-text mt-1">
                      {selectedAnomaly.cpu_utilization}%
                    </div>
                  </div>

                  <div className="bg-elevated p-3 rounded-card border border-border">
                    <span className="text-[10px] text-muted uppercase">Memory Load</span>
                    <div className="text-xl font-bold font-mono text-text mt-1">
                      {selectedAnomaly.memory_utilization ?? 50}%
                    </div>
                  </div>

                  <div className="bg-elevated p-3 rounded-card border border-border">
                    <span className="text-[10px] text-muted uppercase">Storage Fill</span>
                    <div className="text-xl font-bold font-mono text-text mt-1">
                      {selectedAnomaly.storage_utilization ?? 50}%
                    </div>
                  </div>

                  <div className="bg-elevated p-3 rounded-card border border-border">
                    <span className="text-[10px] text-muted uppercase">Hourly Incurred</span>
                    <div className="text-xl font-bold font-mono text-text mt-1">
                      {formatCurrency(selectedAnomaly.cost_usd ?? 0.25)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Suggested Remediation Steps */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Recommended FinOps Action
                </h4>
                <div className="p-4 rounded-card bg-brand-indigo/10 border border-brand-indigo/25 text-xs text-text space-y-2">
                  <div className="font-semibold text-brand-cyan flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    Automated Workload Assessment
                  </div>
                  <p className="text-muted leading-relaxed">
                    {selectedAnomaly.anomaly_type === 'stopped_with_cost' &&
                      'This instance is in a stopped state but storage and static IP reservations continue to accrue hourly charges. Terminating or archiving will eliminate this waste.'}
                    {selectedAnomaly.anomaly_type === 'high_cpu_and_traffic' &&
                      'Heavy network traffic burst combined with high CPU load indicates this node may be a bottleneck. Consider adding an auto-scaling horizontal replica.'}
                    {selectedAnomaly.anomaly_type === 'storage_pressure' &&
                      'Storage volume exceeds 90% capacity. Extend the disk allocation or prune stale log volumes to prevent sudden service outages.'}
                    {selectedAnomaly.anomaly_type === 'underutilized' &&
                      'Instance is heavily overprovisioned for its average load (<15% CPU). Downsizing by one instance tier will yield an estimated 30% monthly reduction.'}
                    {selectedAnomaly.anomaly_type === 'high_utilization' &&
                      'CPU and Memory are both in the 90th percentile. Resize instance to a higher tier.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => setSelectedAnomaly(null)}
              >
                Close Diagnostic Drawer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
