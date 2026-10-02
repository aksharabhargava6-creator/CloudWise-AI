import React, { useState } from 'react';
import { X, Server, AlertCircle } from 'lucide-react';
import { CloudResource } from '../types/cloudwise.js';
import { Button } from './ui/Primitives.js';

interface AddResourceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (resource: any) => Promise<void>;
}

export const AddResourceModal: React.FC<AddResourceModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [provider, setProvider] = useState<'AWS' | 'Azure' | 'GCP'>('AWS');
  const [name, setName] = useState<string>('');
  const [resourceType, setResourceType] = useState<string>('EC2');
  const [region, setRegion] = useState<string>('us-east-1');
  const [status, setStatus] = useState<'running' | 'stopped' | 'attached'>('running');
  const [instanceType, setInstanceType] = useState<string>('t3.xlarge');
  const [cpu, setCpu] = useState<number>(45);
  const [memory, setMemory] = useState<number>(50);
  const [storage, setStorage] = useState<number>(40);
  const [costUsd, setCostUsd] = useState<number>(0.24);

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleProviderChange = (p: 'AWS' | 'Azure' | 'GCP') => {
    setProvider(p);
    if (p === 'AWS') {
      setResourceType('EC2');
      setRegion('us-east-1');
      setInstanceType('t3.xlarge');
    } else if (p === 'Azure') {
      setResourceType('Virtual Machine');
      setRegion('westeurope');
      setInstanceType('Standard D4s v4');
    } else {
      setResourceType('Compute Engine');
      setRegion('us-central1');
      setInstanceType('e2-standard-4');
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Resource name is required';
    else if (name.length < 3) errs.name = 'Name must be at least 3 characters';
    if (!region.trim()) errs.region = 'Region is required';
    if (costUsd < 0) errs.costUsd = 'Cost must be non-negative';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      await onAdd({
        name: name.trim(),
        provider,
        resource_type: resourceType,
        region: region.trim(),
        status,
        instance_type: instanceType.trim() || 'standard',
        cpu_utilization: Number(cpu),
        memory_utilization: Number(memory),
        storage_utilization: Number(storage),
        cost_usd: Number(costUsd),
        monthly_cost: Math.round(Number(costUsd) * 720 * 100) / 100,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface border border-border rounded-t-2xl sm:rounded-card w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Mobile Drag Handle */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-btn bg-brand-cyan/10 text-brand-cyan flex items-center justify-center">
              <Server className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-text">Register Cloud Resource</h3>
              <p className="text-[11px] text-muted">Provision an asset into CloudWise-AI inventory</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-btn hover:bg-elevated text-muted hover:text-text transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Provider Segmented Selector */}
          <div>
            <label className="block text-xs font-semibold text-text mb-1.5">
              Cloud Provider
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['AWS', 'Azure', 'GCP'] as const).map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => handleProviderChange(p)}
                  className={`py-2 px-3 rounded-btn text-xs font-bold border transition text-center ${
                    provider === p
                      ? 'bg-elevated border-brand-cyan text-brand-cyan shadow-sm'
                      : 'bg-surface border-border text-muted hover:text-text'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Name & Region */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Resource Name <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. prod-api-ingress"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({ ...errors, name: '' });
                }}
                className={`w-full bg-elevated border rounded-btn px-3 py-1.5 text-xs text-text focus:outline-none ${
                  errors.name ? 'border-danger' : 'border-border focus:border-brand-cyan'
                }`}
              />
              {errors.name && <p className="text-[10px] text-danger mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">
                Region <span className="text-danger">*</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full bg-elevated border border-border rounded-btn px-3 py-1.5 text-xs text-text focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Resource Type & Instance Size */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">Resource Type</label>
              <select
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                className="w-full bg-elevated border border-border rounded-btn px-3 py-1.5 text-xs text-text focus:outline-none focus:border-brand-cyan"
              >
                {provider === 'AWS' && (
                  <>
                    <option value="EC2">EC2 (Compute)</option>
                    <option value="RDS">RDS (Relational DB)</option>
                    <option value="EBS">EBS (Elastic Block Store)</option>
                    <option value="Lambda">Lambda (Serverless)</option>
                  </>
                )}
                {provider === 'Azure' && (
                  <>
                    <option value="Virtual Machine">Virtual Machine</option>
                    <option value="SQL Database">SQL Database</option>
                    <option value="Managed Disk">Managed Disk</option>
                  </>
                )}
                {provider === 'GCP' && (
                  <>
                    <option value="Compute Engine">Compute Engine</option>
                    <option value="Cloud SQL">Cloud SQL</option>
                    <option value="Persistent Disk">Persistent Disk</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Instance SKU</label>
              <input
                type="text"
                value={instanceType}
                onChange={(e) => setInstanceType(e.target.value)}
                placeholder="e.g. t3.xlarge"
                className="w-full bg-elevated border border-border rounded-btn px-3 py-1.5 text-xs text-text focus:outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          {/* Status & Hourly Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text mb-1">State</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-elevated border border-border rounded-btn px-3 py-1.5 text-xs text-text focus:outline-none focus:border-brand-cyan"
              >
                <option value="running">running</option>
                <option value="stopped">stopped (billing still applies)</option>
                <option value="attached">attached</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text mb-1">Hourly Cost ($/hr)</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={costUsd}
                  onChange={(e) => setCostUsd(parseFloat(e.target.value) || 0)}
                  className="w-full bg-elevated border border-border rounded-btn px-3 py-1.5 text-xs text-text font-mono focus:outline-none focus:border-brand-cyan"
                />
                <span className="text-[11px] text-muted whitespace-nowrap font-mono">
                  ~${(costUsd * 720).toFixed(2)}/mo
                </span>
              </div>
            </div>
          </div>

          {/* Sliders: CPU, Mem, Disk */}
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="text-xs font-semibold text-text">Baseline Telemetry</div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                  <span>CPU</span>
                  <span className="font-mono text-text">{cpu}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={cpu}
                  onChange={(e) => setCpu(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan h-1 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                  <span>Mem</span>
                  <span className="font-mono text-text">{memory}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={memory}
                  onChange={(e) => setMemory(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan h-1 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-muted mb-1">
                  <span>Storage</span>
                  <span className="font-mono text-text">{storage}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={storage}
                  onChange={(e) => setStorage(parseInt(e.target.value))}
                  className="w-full accent-brand-cyan h-1 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              loading={loading}
              disabled={!name.trim()}
            >
              Provision Resource
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
