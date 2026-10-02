import React, { useState } from 'react';
import {
  TrendingDown,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Zap,
  HardDrive,
  Cpu,
  Power,
  Layers,
  X,
  Check,
} from 'lucide-react';
import { Recommendation } from '../types/cloudwise.js';
import { formatCurrency } from '../utils/formatters.js';
import { Card, PriorityBadge, Button } from './ui/Primitives.js';
import { AnimatedNumber } from './ui/AnimatedNumber.js';

interface RecommendationsTabProps {
  recommendations: Recommendation[];
  onApplyOptimization: (resourceId: string, optType: string) => Promise<void>;
  onDismissRecommendation: (resourceId: string) => void;
  onRefresh: () => void;
  isLoading: boolean;
}

export const RecommendationsTab: React.FC<RecommendationsTabProps> = ({
  recommendations,
  onApplyOptimization,
  onDismissRecommendation,
  onRefresh,
  isLoading,
}) => {
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [confirmTarget, setConfirmTarget] = useState<Recommendation | null>(null);
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const filtered = recommendations.filter((r) => {
    if (priorityFilter !== 'ALL' && r.priority !== priorityFilter) return false;
    if (typeFilter !== 'ALL' && r.optimization_type !== typeFilter) return false;
    return true;
  });

  const totalMonthlySavings = recommendations.reduce(
    (acc, r) => acc + (r.estimated_saving_usd || 0),
    0
  );
  const annualizedSavings = totalMonthlySavings * 12;

  const handleConfirmApply = async () => {
    if (!confirmTarget || !confirmTarget.optimization_type) return;
    setIsApplying(true);
    try {
      await onApplyOptimization(confirmTarget.resource_id, confirmTarget.optimization_type);
      setConfirmTarget(null);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Savings Card with Animated Gradient Accent */}
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-success/15 via-elevated to-brand-indigo/10 border border-success/30 p-6 sm:p-7 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-success/20 text-success border border-success/35">
                <Sparkles className="w-3.5 h-3.5" />
                Autonomous FinOps Rightsizing
              </span>
              <span className="text-xs text-muted">
                {recommendations.length} optimization opportunities
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Identified Annual Savings:{' '}
              <span className="text-success font-mono">
                <AnimatedNumber value={annualizedSavings} formatter={formatCurrency} />
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-muted max-w-2xl">
              Savings model: Idle stopped resources yield 100% reclamation; overprovisioned compute yields up to 30% via tier downsizing; disk hygiene saves up to 10%.
            </p>
          </div>

          <div className="bg-surface/80 border border-border rounded-card p-4 shrink-0 text-right min-w-[180px] shadow-md backdrop-blur-sm">
            <span className="text-xs uppercase font-semibold text-muted tracking-wider block">
              Monthly Impact
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-success mt-0.5">
              +<AnimatedNumber value={totalMonthlySavings} formatter={formatCurrency} />
            </div>
            <div className="text-[11px] text-muted mt-1">Direct OPEX reduction</div>
          </div>
        </div>
      </div>

      {/* Filter Strip */}
      <Card className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Priority Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted mr-1">Priority:</span>
          {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((p) => (
            <button
              key={p}
              onClick={() => setPriorityFilter(p)}
              className={`px-3 py-1 rounded-btn text-xs font-semibold border transition ${
                priorityFilter === p
                  ? 'bg-elevated text-brand-cyan border-brand-cyan'
                  : 'bg-surface text-muted border-border hover:text-text'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Optimization Type Filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted mr-1">Type:</span>
          {[
            { id: 'ALL', label: 'All Actions' },
            { id: 'RIGHT_SIZING', label: 'Right-sizing (-30%)' },
            { id: 'IDLE_RECLAIM', label: 'Idle Reclaim (-100%)' },
            { id: 'STORAGE_CLEANUP', label: 'Disk Hygiene (-10%)' },
            { id: 'SCALE_UP_REQUIRED', label: 'Scale Up' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium border transition ${
                typeFilter === t.id
                  ? 'bg-success/15 text-success border-success/40'
                  : 'bg-elevated/40 text-muted border-border hover:text-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Recommendation Cards Grid (1 col mobile, 2 col tablet, 3 col wide) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-muted text-xs">
            No recommendations match your selected filters.
          </div>
        ) : (
          filtered.map((item, idx) => (
            <Card
              key={`${item.resource_id}-${idx}`}
              className="p-5 flex flex-col justify-between hover:border-text/25 transition shadow-sm space-y-4"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <PriorityBadge priority={item.priority} />
                    <span className="text-xs font-mono font-bold text-text truncate">
                      {item.resource_id}
                    </span>
                  </div>

                  {item.estimated_saving_usd ? (
                    <div className="text-right">
                      <span className="text-sm font-bold text-success font-mono">
                        +{formatCurrency(item.estimated_saving_usd)}
                      </span>
                      <div className="text-[10px] text-muted">/mo saving</div>
                    </div>
                  ) : (
                    <span className="text-[10px] font-mono text-muted">Performance Fix</span>
                  )}
                </div>

                {/* Body Text */}
                <div>
                  <h4 className="text-sm font-semibold text-text leading-snug">
                    {item.recommendation}
                  </h4>
                  <p className="text-xs text-muted mt-1.5 leading-relaxed">{item.reason}</p>
                </div>

                {/* Optimization Action Strip */}
                {item.optimization_action && (
                  <div className="p-2.5 rounded-btn bg-elevated/80 border border-border text-[11px] text-text/90 flex items-center gap-2">
                    {item.optimization_type === 'IDLE_RECLAIM' ? (
                      <Power className="w-3.5 h-3.5 text-danger shrink-0" />
                    ) : item.optimization_type === 'STORAGE_CLEANUP' ? (
                      <HardDrive className="w-3.5 h-3.5 text-warning shrink-0" />
                    ) : item.optimization_type === 'SCALE_UP_REQUIRED' ? (
                      <Cpu className="w-3.5 h-3.5 text-warning shrink-0" />
                    ) : (
                      <Zap className="w-3.5 h-3.5 text-brand-cyan shrink-0" />
                    )}
                    <span className="line-clamp-1">{item.optimization_action}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-border flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onDismissRecommendation(item.resource_id)}
                  className="px-3 py-1.5 rounded-btn text-xs font-medium text-muted hover:text-text hover:bg-elevated transition"
                >
                  Dismiss
                </button>

                {item.optimization_type && item.optimization_type !== 'MONITOR' ? (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => setConfirmTarget(item)}
                  >
                    Apply Optimization
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <span className="text-[11px] text-success flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Nominal State
                  </span>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-card max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-success font-bold text-sm">
                <CheckCircle2 className="w-5 h-5" />
                Confirm Cloud Optimization
              </div>
              <button
                onClick={() => setConfirmTarget(null)}
                className="text-muted hover:text-text p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-muted">
                You are about to execute the following optimization on{' '}
                <strong className="text-text font-mono">{confirmTarget.resource_id}</strong>:
              </p>

              <div className="bg-elevated p-3 rounded-card border border-border text-xs text-text space-y-1.5">
                <div className="font-semibold text-text">{confirmTarget.recommendation}</div>
                <div className="text-muted text-[11px]">{confirmTarget.optimization_action}</div>
              </div>

              {confirmTarget.estimated_saving_usd ? (
                <div className="p-3 rounded-card bg-success/10 border border-success/25 flex items-center justify-between">
                  <span className="text-xs text-text font-semibold">Immediate Monthly Impact:</span>
                  <span className="text-sm font-bold font-mono text-success">
                    +{formatCurrency(confirmTarget.estimated_saving_usd)}/mo
                  </span>
                </div>
              ) : null}
            </div>

            <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmTarget(null)}
                disabled={isApplying}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmApply}
                loading={isApplying}
              >
                Confirm & Apply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
