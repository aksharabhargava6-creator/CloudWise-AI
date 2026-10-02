import React, { useState } from 'react';
import {
  Server,
  Plus,
  Power,
  Trash2,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowUpDown,
  Filter,
  Check,
  ChevronDown,
  Layers,
  Edit2,
  X,
} from 'lucide-react';
import { CloudResource } from '../types/cloudwise.js';
import { formatCurrency } from '../utils/formatters.js';
import { Card, ProviderBadge, StatusBadge, Button } from './ui/Primitives.js';

interface ResourcesTabProps {
  resources: CloudResource[];
  onOpenAddModal: () => void;
  onToggleStatus: (resource: CloudResource) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
  onUpdateResource?: (id: string, updates: Partial<CloudResource>) => Promise<void>;
}

export const ResourcesTab: React.FC<ResourcesTabProps> = ({
  resources,
  onOpenAddModal,
  onToggleStatus,
  onDeleteResource,
  onUpdateResource,
}) => {
  const [providerFilter, setProviderFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortField, setSortField] = useState<'name' | 'monthly_cost' | 'cpu_utilization'>('monthly_cost');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Extract unique resource types for filter dropdown
  const uniqueTypes = Array.from(new Set(resources.map((r) => r.resource_type)));

  // Filter & sort resources
  const filtered = resources
    .filter((r) => {
      if (providerFilter !== 'ALL' && r.provider.toUpperCase() !== providerFilter) return false;
      if (statusFilter !== 'ALL' && r.status !== statusFilter) return false;
      if (typeFilter !== 'ALL' && r.resource_type !== typeFilter) return false;
      if (
        search &&
        !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !r.id.toLowerCase().includes(search.toLowerCase()) &&
        !r.region.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortField === 'name') comparison = a.name.localeCompare(b.name);
      else if (sortField === 'monthly_cost') comparison = a.monthly_cost - b.monthly_cost;
      else if (sortField === 'cpu_utilization') comparison = a.cpu_utilization - b.cpu_utilization;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const handleToggle = async (r: CloudResource) => {
    setActionLoadingId(r.id);
    try {
      await onToggleStatus(r);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSort = (field: 'name' | 'monthly_cost' | 'cpu_utilization') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleDelete = async (id: string) => {
    setActionLoadingId(id);
    try {
      await onDeleteResource(id);
      setDeleteConfirmId(null);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search resource name, ID, or region..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-elevated border border-border rounded-btn pl-9 pr-3 py-1.5 text-xs text-text placeholder-muted focus:outline-none focus:border-brand-cyan"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 justify-end shrink-0">
            {/* View Mode Toggle */}
            <div className="inline-flex rounded-btn bg-elevated border border-border p-0.5">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-btn transition ${
                  viewMode === 'table' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-btn transition ${
                  viewMode === 'grid' ? 'bg-surface text-text shadow-sm' : 'text-muted hover:text-text'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenAddModal}
            >
              Add Resource
            </Button>
          </div>
        </div>

        {/* Filters strip */}
        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Provider Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-muted mr-1">Cloud:</span>
            {['ALL', 'AWS', 'AZURE', 'GCP'].map((p) => (
              <button
                key={p}
                onClick={() => setProviderFilter(p)}
                className={`px-2.5 py-0.5 rounded-btn font-semibold border transition ${
                  providerFilter === p
                    ? 'bg-elevated text-brand-cyan border-brand-cyan'
                    : 'bg-surface text-muted border-border hover:text-text'
                }`}
              >
                {p}
              </button>
            ))}

            <span className="text-border mx-1">|</span>

            {/* Status Filter */}
            {['ALL', 'running', 'stopped', 'attached'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2 py-0.5 rounded-full capitalize border transition ${
                  statusFilter === s
                    ? 'bg-elevated text-text border-text/40 font-semibold'
                    : 'bg-surface text-muted border-border hover:text-text'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Resource Type Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-muted">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-elevated border border-border rounded-btn px-2.5 py-1 text-xs text-text focus:outline-none focus:border-brand-cyan"
            >
              <option value="ALL">All Types ({uniqueTypes.length})</option>
              {uniqueTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {/* Content: Table or Grid */}
      {viewMode === 'table' ? (
        <Card className="overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-elevated/70 text-muted uppercase font-sans tracking-wider font-semibold border-b border-border sticky top-0 z-10 backdrop-blur-sm">
                <tr>
                  <th className="px-5 py-3 cursor-pointer" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-1.5">
                      Resource Name <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-5 py-3">Provider</th>
                  <th className="px-5 py-3">Type &amp; Region</th>
                  <th className="px-5 py-3">Status</th>
                  <th
                    className="px-5 py-3 cursor-pointer"
                    onClick={() => handleSort('cpu_utilization')}
                  >
                    <div className="flex items-center gap-1.5">
                      CPU / Mem / Disk <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th
                    className="px-5 py-3 cursor-pointer"
                    onClick={() => handleSort('monthly_cost')}
                  >
                    <div className="flex items-center gap-1.5">
                      Monthly Spend <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-mono">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-muted font-sans">
                      No cloud resources matched your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((res) => {
                    const isLoading = actionLoadingId === res.id;
                    const cpuColor =
                      res.cpu_utilization >= 90
                        ? '#EF4444'
                        : res.cpu_utilization >= 85
                        ? '#F59E0B'
                        : '#22C55E';
                    const memColor =
                      res.memory_utilization >= 90
                        ? '#EF4444'
                        : res.memory_utilization >= 85
                        ? '#F59E0B'
                        : '#22C55E';
                    const storageColor =
                      res.storage_utilization >= 90
                        ? '#EF4444'
                        : res.storage_utilization >= 85
                        ? '#F59E0B'
                        : '#22C55E';

                    return (
                      <tr key={res.id} className="hover:bg-elevated/50 transition">
                        {/* Name and ID */}
                        <td className="px-5 py-3 font-sans">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${
                                res.status === 'running'
                                  ? 'bg-success'
                                  : res.status === 'stopped'
                                  ? 'bg-muted'
                                  : 'bg-info'
                              }`}
                            />
                            <div>
                              <div className="font-semibold text-text flex items-center gap-1.5">
                                {res.name}
                                {res.anomaly_type && (
                                  <span title="Anomaly Detected">
                                    <AlertTriangle className="w-3 h-3 text-warning" />
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-muted font-mono">{res.id}</div>
                            </div>
                          </div>
                        </td>

                        {/* Provider */}
                        <td className="px-5 py-3 font-sans">
                          <ProviderBadge provider={res.provider} />
                        </td>

                        {/* Type & Region */}
                        <td className="px-5 py-3 font-sans">
                          <div className="text-text font-medium">{res.resource_type}</div>
                          <div className="text-[10px] text-muted font-mono">{res.region}</div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3 font-sans">
                          <StatusBadge status={res.status} />
                        </td>

                        {/* Mini Bars */}
                        <td className="px-5 py-3 font-mono text-[11px]">
                          <div className="space-y-1 w-32">
                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>CPU: {res.cpu_utilization}%</span>
                              <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${res.cpu_utilization}%`,
                                    backgroundColor: cpuColor,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>Mem: {res.memory_utilization}%</span>
                              <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${res.memory_utilization}%`,
                                    backgroundColor: memColor,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-muted">
                              <span>Disk: {res.storage_utilization}%</span>
                              <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${res.storage_utilization}%`,
                                    backgroundColor: storageColor,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Spend */}
                        <td className="px-5 py-3">
                          <div className="font-bold text-text font-mono text-sm">
                            {formatCurrency(res.monthly_cost)}
                          </div>
                          <div className="text-[10px] text-muted font-mono">
                            {formatCurrency(res.cost_usd)}/hr
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-3 text-right font-sans">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Power */}
                            <button
                              type="button"
                              onClick={() => handleToggle(res)}
                              disabled={isLoading}
                              title={res.status === 'running' ? 'Stop instance' : 'Start instance'}
                              className={`p-1.5 rounded-btn border transition ${
                                res.status === 'running'
                                  ? 'bg-elevated border-border text-muted hover:text-warning'
                                  : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => setDeleteConfirmId(res.id)}
                              disabled={isLoading}
                              title="Delete Resource"
                              className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger hover:border-danger/30 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card List */}
          <div className="lg:hidden divide-y divide-border">
            {filtered.map((res) => (
              <div key={res.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        res.status === 'running'
                          ? 'bg-success'
                          : res.status === 'stopped'
                          ? 'bg-muted'
                          : 'bg-info'
                      }`}
                    />
                    <div>
                      <div className="font-bold text-xs text-text">{res.name}</div>
                      <div className="text-[10px] text-muted font-mono">{res.id}</div>
                    </div>
                  </div>
                  <ProviderBadge provider={res.provider} />
                </div>

                <div className="flex items-center justify-between text-xs text-muted">
                  <span>{res.resource_type} • {res.region}</span>
                  <StatusBadge status={res.status} />
                </div>

                {/* Utilization strip */}
                <div className="grid grid-cols-3 gap-2 bg-elevated p-2 rounded-btn text-[11px] font-mono text-center">
                  <div>CPU: <strong className="text-text">{res.cpu_utilization}%</strong></div>
                  <div>Mem: <strong className="text-text">{res.memory_utilization}%</strong></div>
                  <div>Disk: <strong className="text-text">{res.storage_utilization}%</strong></div>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <div className="font-bold font-mono text-sm text-text">
                    {formatCurrency(res.monthly_cost)}
                    <span className="text-[10px] text-muted font-normal ml-1">/mo</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggle(res)}
                      className="px-2.5 py-1 rounded-btn text-xs font-semibold bg-elevated border border-border text-text hover:bg-border/60 transition flex items-center gap-1"
                    >
                      <Power className="w-3 h-3" />
                      {res.status === 'running' ? 'Stop' : 'Start'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(res.id)}
                      className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        /* Grid View Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((res) => (
            <Card key={res.id} className="p-4 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h4 className="font-bold text-xs text-text truncate">{res.name}</h4>
                    <p className="text-[10px] text-muted font-mono">{res.id}</p>
                  </div>
                  <ProviderBadge provider={res.provider} />
                </div>

                <div className="flex items-center justify-between text-xs text-muted mb-3">
                  <span>{res.resource_type} • {res.region}</span>
                  <StatusBadge status={res.status} />
                </div>

                <div className="space-y-1.5 bg-elevated p-2.5 rounded-btn text-[11px] font-mono">
                  <div className="flex items-center justify-between text-muted">
                    <span>CPU: {res.cpu_utilization}%</span>
                    <span>Mem: {res.memory_utilization}%</span>
                    <span>Disk: {res.storage_utilization}%</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold font-mono text-text">
                    {formatCurrency(res.monthly_cost)}
                  </span>
                  <span className="text-[10px] text-muted font-sans ml-1">/mo</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleToggle(res)}
                    className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-text transition"
                    title={res.status === 'running' ? 'Stop' : 'Start'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(res.id)}
                    className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger transition"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-surface border border-border rounded-card max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-danger font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              Terminate Cloud Resource
            </div>
            <p className="text-xs text-muted">
              Are you sure you want to delete <strong className="text-text font-mono">{deleteConfirmId}</strong>? This will detach volumes and terminate instance lifecycle immediately.
            </p>
            <div className="pt-2 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteConfirmId(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(deleteConfirmId)}
                loading={actionLoadingId === deleteConfirmId}
              >
                Terminate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
