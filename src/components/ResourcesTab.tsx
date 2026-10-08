import React, { useState } from 'react';
import {
  Plus,
  Power,
  Trash2,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowUpDown,
  Database,
  ShieldCheck,
  HardDrive,
  Server,
} from 'lucide-react';

import { CloudResource } from '../types/cloudwise.js';
import { formatCurrency } from '../utils/formatters.js';
import {
  Card,
  ProviderBadge,
  StatusBadge,
  Button
} from './ui/Primitives.js';


interface ResourcesTabProps {
  resources: CloudResource[];
  onOpenAddModal: () => void;
  onToggleStatus: (resource: CloudResource) => Promise<void>;
  onDeleteResource: (id: string) => Promise<void>;
  onUpdateResource?: (
    id: string,
    updates: Partial<CloudResource>
  ) => Promise<void>;
}


function isS3(resource: CloudResource): boolean {
  return (
    resource.provider === 'AWS' &&
    resource.resource_type.toUpperCase() === 'S3'
  );
}


function isLambda(resource: CloudResource): boolean {
  return (
    resource.provider === 'AWS' &&
    resource.resource_type.toUpperCase() === 'LAMBDA'
  );
}


function isDynamoDb(resource: CloudResource): boolean {
  return (
    resource.provider === 'AWS' &&
    resource.resource_type.toUpperCase() === 'DYNAMODB'
  );
}


function isEc2(resource: CloudResource): boolean {
  return (
    resource.provider === 'AWS' &&
    resource.resource_type.toUpperCase() === 'EC2'
  );
}


function isComputeResource(resource: CloudResource): boolean {
  const type = resource.resource_type.toLowerCase();

  return (
    isEc2(resource) ||
    type.includes('virtual machine') ||
    type.includes('compute engine')
  );
}


function ServiceDetails({
  resource
}: {
  resource: CloudResource;
}) {
  if (isS3(resource)) {
    const metadata = resource.metadata;

    const encryption =
      metadata?.encrypted
        ? metadata.encryption_algorithm ?? 'Enabled'
        : 'Not detected';

    const versioning =
      metadata?.versioning ?? 'Unknown';

    const publicAccess =
      metadata?.public_access_blocked
        ? 'Blocked'
        : 'Review';

    return (
      <div className="space-y-1 text-[10px] font-sans min-w-40">
        <div className="flex items-center gap-1.5 text-text font-semibold">
          <Database className="w-3 h-3 text-brand-cyan" />
          Object Storage
        </div>

        <div className="text-muted">
          Encryption: <span className="text-text">{encryption}</span>
        </div>

        <div className="text-muted">
          Versioning: <span className="text-text">{versioning}</span>
        </div>

        <div className="text-muted">
          Public access: <span className={metadata?.public_access_blocked ? 'text-success' : 'text-warning'}>{publicAccess}</span>
        </div>
      </div>
    );
  }

  if (isLambda(resource)) {
    const metadata = resource.metadata;

    const runtime =
      typeof metadata?.runtime === 'string'
        ? metadata.runtime
        : resource.instance_type || 'Serverless';

    const memory =
      typeof metadata?.memory_size_mb === 'number'
        ? `${metadata.memory_size_mb} MB`
        : 'Unknown';

    const timeout =
      typeof metadata?.timeout_seconds === 'number'
        ? `${metadata.timeout_seconds}s`
        : 'Unknown';

    return (
      <div className="space-y-1 text-[10px] font-sans min-w-40">
        <div className="flex items-center gap-1.5 text-text font-semibold">
          <Server className="w-3 h-3 text-brand-cyan" />
          Serverless Function
        </div>

        <div className="text-muted">
          Runtime: <span className="text-text">{runtime}</span>
        </div>

        <div className="text-muted">
          Memory: <span className="text-text">{memory}</span>
        </div>

        <div className="text-muted">
          Timeout: <span className="text-text">{timeout}</span>
        </div>
      </div>
    );
  }

  if (isDynamoDb(resource)) {
    const metadata = resource.metadata;

    const billingMode =
      typeof metadata?.billing_mode === 'string'
        ? metadata.billing_mode
        : resource.instance_type || 'Unknown';

    const items =
      typeof metadata?.item_count === 'number'
        ? metadata.item_count.toLocaleString()
        : 'Unknown';

    const sizeBytes =
      typeof metadata?.table_size_bytes === 'number'
        ? metadata.table_size_bytes
        : null;

    const size =
      sizeBytes === null
        ? 'Unknown'
        : sizeBytes < 1024
        ? `${sizeBytes} B`
        : sizeBytes < 1024 * 1024
        ? `${(sizeBytes / 1024).toFixed(1)} KB`
        : `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;

    return (
      <div className="space-y-1 text-[10px] font-sans min-w-40">
        <div className="flex items-center gap-1.5 text-text font-semibold">
          <Database className="w-3 h-3 text-brand-cyan" />
          NoSQL Database
        </div>

        <div className="text-muted">
          Billing: <span className="text-text">{billingMode}</span>
        </div>

        <div className="text-muted">
          Items: <span className="text-text">{items}</span>
        </div>

        <div className="text-muted">
          Size: <span className="text-text">{size}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1 w-32 font-mono">
      <MetricBar
        label="CPU"
        value={resource.cpu_utilization}
      />

      <MetricBar
        label="Mem"
        value={resource.memory_utilization}
      />

      <MetricBar
        label="Disk"
        value={resource.storage_utilization}
      />
    </div>
  );
}


function MetricBar({
  label,
  value
}: {
  label: string;
  value: number;
}) {
  const safeValue =
    Number.isFinite(value)
      ? Math.min(100, Math.max(0, value))
      : 0;

  const color =
    safeValue >= 90
      ? '#EF4444'
      : safeValue >= 85
      ? '#F59E0B'
      : '#22C55E';

  return (
    <div className="flex items-center justify-between gap-2 text-[10px] text-muted">
      <span>
        {label}: {safeValue}%
      </span>

      <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${safeValue}%`,
            backgroundColor: color
          }}
        />
      </div>
    </div>
  );
}


function S3Badge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-success/30 bg-success/10 text-success text-[10px] font-semibold">
      <ShieldCheck className="w-3 h-3" />
      READ ONLY
    </span>
  );
}


export const ResourcesTab:
React.FC<ResourcesTabProps> = ({
  resources,
  onOpenAddModal,
  onToggleStatus,
  onDeleteResource,
}) => {

  const [
    providerFilter,
    setProviderFilter
  ] = useState<string>('ALL');

  const [
    statusFilter,
    setStatusFilter
  ] = useState<string>('ALL');

  const [
    typeFilter,
    setTypeFilter
  ] = useState<string>('ALL');

  const [
    search,
    setSearch
  ] = useState<string>('');

  const [
    viewMode,
    setViewMode
  ] =
    useState<
      'table' |
      'grid'
    >('table');

  const [
    sortField,
    setSortField
  ] =
    useState<
      'name' |
      'monthly_cost' |
      'cpu_utilization'
    >('monthly_cost');

  const [
    sortOrder,
    setSortOrder
  ] =
    useState<
      'asc' |
      'desc'
    >('desc');

  const [
    actionLoadingId,
    setActionLoadingId
  ] =
    useState<
      string |
      null
    >(null);

  const [
    deleteConfirmId,
    setDeleteConfirmId
  ] =
    useState<
      string |
      null
    >(null);


  const uniqueTypes =
    Array.from(
      new Set(
        resources.map(
          resource =>
            resource.resource_type
        )
      )
    );


  const filtered =
    resources
      .filter(resource => {

        if (
          providerFilter !== 'ALL' &&
          resource.provider.toUpperCase() !== providerFilter
        ) {
          return false;
        }

        if (
          statusFilter !== 'ALL' &&
          resource.status !== statusFilter
        ) {
          return false;
        }

        if (
          typeFilter !== 'ALL' &&
          resource.resource_type !== typeFilter
        ) {
          return false;
        }

        if (search) {
          const query =
            search.toLowerCase();

          const matches =
            resource.name
              .toLowerCase()
              .includes(query) ||
            resource.id
              .toLowerCase()
              .includes(query) ||
            resource.region
              .toLowerCase()
              .includes(query) ||
            resource.resource_type
              .toLowerCase()
              .includes(query);

          if (!matches) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {

        let comparison = 0;

        if (
          sortField === 'name'
        ) {
          comparison =
            a.name.localeCompare(
              b.name
            );
        }

        if (
          sortField ===
          'monthly_cost'
        ) {
          comparison =
            a.monthly_cost -
            b.monthly_cost;
        }

        if (
          sortField ===
          'cpu_utilization'
        ) {
          comparison =
            a.cpu_utilization -
            b.cpu_utilization;
        }

        return sortOrder === 'asc'
          ? comparison
          : -comparison;
      });


  const handleToggle =
    async (
      resource:
        CloudResource
    ) => {

      if (
        !isComputeResource(
          resource
        )
      ) {
        return;
      }

      setActionLoadingId(
        resource.id
      );

      try {
        await onToggleStatus(
          resource
        );
      } finally {
        setActionLoadingId(
          null
        );
      }
    };


  const handleSort =
    (
      field:
        'name' |
        'monthly_cost' |
        'cpu_utilization'
    ) => {

      if (
        sortField === field
      ) {

        setSortOrder(
          sortOrder === 'asc'
            ? 'desc'
            : 'asc'
        );

      } else {

        setSortField(
          field
        );

        setSortOrder(
          'desc'
        );
      }
    };


  const handleDelete =
    async (
      id: string
    ) => {

      setActionLoadingId(
        id
      );

      try {

        await onDeleteResource(
          id
        );

        setDeleteConfirmId(
          null
        );

      } finally {

        setActionLoadingId(
          null
        );
      }
    };


  return (
    <div className="space-y-6">

      <Card className="p-4 space-y-3">

        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">

          <div className="relative flex-1 max-w-md">

            <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />

            <input
              type="text"
              placeholder="Search resource name, ID, type, or region..."
              value={search}
              onChange={
                event =>
                  setSearch(
                    event.target.value
                  )
              }
              className="w-full bg-elevated border border-border rounded-btn pl-9 pr-3 py-1.5 text-xs text-text placeholder-muted focus:outline-none focus:border-brand-cyan"
            />

          </div>


          <div className="flex items-center gap-2 justify-end shrink-0">

            <div className="inline-flex rounded-btn bg-elevated border border-border p-0.5">

              <button
                type="button"
                onClick={
                  () =>
                    setViewMode(
                      'table'
                    )
                }
                className={`p-1.5 rounded-btn transition ${
                  viewMode === 'table'
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
                title="Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={
                  () =>
                    setViewMode(
                      'grid'
                    )
                }
                className={`p-1.5 rounded-btn transition ${
                  viewMode === 'grid'
                    ? 'bg-surface text-text shadow-sm'
                    : 'text-muted hover:text-text'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>

            </div>


            <Button
              variant="primary"
              size="sm"
              icon={
                <Plus className="w-3.5 h-3.5" />
              }
              onClick={
                onOpenAddModal
              }
            >
              Add Resource
            </Button>

          </div>

        </div>


        <div className="pt-3 border-t border-border flex flex-wrap items-center justify-between gap-3 text-xs">

          <div className="flex items-center gap-1.5 flex-wrap">

            <span className="text-muted mr-1">
              Cloud:
            </span>

            {[
              'ALL',
              'AWS',
              'AZURE',
              'GCP'
            ].map(provider => (

              <button
                key={provider}
                onClick={
                  () =>
                    setProviderFilter(
                      provider
                    )
                }
                className={`px-2.5 py-0.5 rounded-btn font-semibold border transition ${
                  providerFilter === provider
                    ? 'bg-elevated text-brand-cyan border-brand-cyan'
                    : 'bg-surface text-muted border-border hover:text-text'
                }`}
              >
                {provider}
              </button>

            ))}


            <span className="text-border mx-1">
              |
            </span>


            {[
              'ALL',
              'running',
              'stopped',
              'attached'
            ].map(status => (

              <button
                key={status}
                onClick={
                  () =>
                    setStatusFilter(
                      status
                    )
                }
                className={`px-2 py-0.5 rounded-full capitalize border transition ${
                  statusFilter === status
                    ? 'bg-elevated text-text border-text/40 font-semibold'
                    : 'bg-surface text-muted border-border hover:text-text'
                }`}
              >
                {status}
              </button>

            ))}

          </div>


          <div className="flex items-center gap-2">

            <span className="text-muted">
              Type:
            </span>

            <select
              value={
                typeFilter
              }
              onChange={
                event =>
                  setTypeFilter(
                    event.target.value
                  )
              }
              className="bg-elevated border border-border rounded-btn px-2.5 py-1 text-xs text-text focus:outline-none focus:border-brand-cyan"
            >

              <option value="ALL">
                All Types ({uniqueTypes.length})
              </option>

              {uniqueTypes.map(
                type => (
                  <option
                    key={type}
                    value={type}
                  >
                    {type}
                  </option>
                )
              )}

            </select>

          </div>

        </div>

      </Card>


      {viewMode === 'table' ? (

        <Card className="overflow-hidden">

          <div className="hidden lg:block overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead className="bg-elevated/70 text-muted uppercase font-sans tracking-wider font-semibold border-b border-border sticky top-0 z-10 backdrop-blur-sm">

                <tr>

                  <th
                    className="px-5 py-3 cursor-pointer"
                    onClick={
                      () =>
                        handleSort(
                          'name'
                        )
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      Resource Name
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th className="px-5 py-3">
                    Provider
                  </th>

                  <th className="px-5 py-3">
                    Type & Region
                  </th>

                  <th className="px-5 py-3">
                    Status
                  </th>

                  <th className="px-5 py-3">
                    Service Details
                  </th>

                  <th
                    className="px-5 py-3 cursor-pointer"
                    onClick={
                      () =>
                        handleSort(
                          'monthly_cost'
                        )
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      Monthly Spend
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>

                  <th className="px-5 py-3 text-right">
                    Actions
                  </th>

                </tr>

              </thead>


              <tbody className="divide-y divide-border font-mono">

                {filtered.length === 0 ? (

                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-12 text-center text-muted font-sans"
                    >
                      No cloud resources matched your filter criteria.
                    </td>
                  </tr>

                ) : (

                  filtered.map(
                    resource => {

                      const loading =
                        actionLoadingId ===
                        resource.id;

                      const s3 =
                        isS3(
                          resource
                        );

                      const compute =
                        isComputeResource(
                          resource
                        );

                      return (

                        <tr
                          key={resource.id}
                          className="hover:bg-elevated/50 transition"
                        >

                          <td className="px-5 py-3 font-sans">

                            <div className="flex items-center gap-2">

                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  resource.status === 'running'
                                    ? 'bg-success'
                                    : resource.status === 'stopped'
                                    ? 'bg-muted'
                                    : 'bg-info'
                                }`}
                              />

                              <div>

                                <div className="font-semibold text-text flex items-center gap-1.5">

                                  {resource.name}

                                  {(s3 || isLambda(resource) || isDynamoDb(resource)) && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-brand-cyan/10 text-brand-cyan text-[9px] font-bold">
                                      LIVE
                                    </span>
                                  )}

                                  {resource.anomaly_type && !s3 && (
                                    <AlertTriangle className="w-3 h-3 text-warning" />
                                  )}

                                </div>

                                <div className="text-[10px] text-muted font-mono max-w-xs truncate">
                                  {resource.id}
                                </div>

                              </div>

                            </div>

                          </td>


                          <td className="px-5 py-3 font-sans">
                            <ProviderBadge
                              provider={
                                resource.provider
                              }
                            />
                          </td>


                          <td className="px-5 py-3 font-sans">

                            <div className="text-text font-medium flex items-center gap-1.5">

                              {(s3 || isLambda(resource) || isDynamoDb(resource)) ? (
                                <Database className="w-3.5 h-3.5 text-brand-cyan" />
                              ) : (
                                <Server className="w-3.5 h-3.5 text-muted" />
                              )}

                              {resource.resource_type}

                            </div>

                            <div className="text-[10px] text-muted font-mono">
                              {resource.region}
                            </div>

                          </td>


                          <td className="px-5 py-3 font-sans">

                            <div className="flex flex-col items-start gap-1">

                              <StatusBadge
                                status={
                                  resource.status
                                }
                              />

                              {s3 && (
                                <S3Badge />
                              )}

                            </div>

                          </td>


                          <td className="px-5 py-3">

                            <ServiceDetails
                              resource={
                                resource
                              }
                            />

                          </td>


                          <td className="px-5 py-3">

                            {s3 ? (

                              <div className="font-sans">
                                <div className="font-semibold text-text text-xs">
                                  Cost: N/A
                                </div>
                                <div className="text-[10px] text-muted">
                                  Cost Explorer not integrated
                                </div>
                              </div>

                            ) : (

                              <>
                                <div className="font-bold text-text font-mono text-sm">
                                  {formatCurrency(
                                    resource.monthly_cost
                                  )}
                                </div>

                                <div className="text-[10px] text-muted font-mono">
                                  {formatCurrency(
                                    resource.cost_usd
                                  )}
                                  /hr
                                </div>
                              </>

                            )}

                          </td>


                          <td className="px-5 py-3 text-right font-sans">

                            {compute ? (

                              <div className="flex items-center justify-end gap-1.5">

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      handleToggle(
                                        resource
                                      )
                                  }
                                  disabled={
                                    loading
                                  }
                                  title={
                                    resource.status === 'running'
                                      ? 'Stop compute resource'
                                      : 'Start compute resource'
                                  }
                                  className={`p-1.5 rounded-btn border transition ${
                                    resource.status === 'running'
                                      ? 'bg-elevated border-border text-muted hover:text-warning'
                                      : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
                                  }`}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={
                                    () =>
                                      setDeleteConfirmId(
                                        resource.id
                                      )
                                  }
                                  disabled={
                                    loading
                                  }
                                  title="Remove Resource"
                                  className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger hover:border-danger/30 transition"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>

                            ) : (

                              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-btn border border-border bg-elevated text-muted text-[10px]">
                                <ShieldCheck className="w-3 h-3 text-success" />
                                Inventory only
                              </div>

                            )}

                          </td>

                        </tr>
                      );
                    }
                  )

                )}

              </tbody>

            </table>

          </div>


          <div className="lg:hidden divide-y divide-border">

            {filtered.map(
              resource => {

                const s3 =
                  isS3(
                    resource
                  );

                const compute =
                  isComputeResource(
                    resource
                  );

                return (

                  <div
                    key={resource.id}
                    className="p-4 space-y-3"
                  >

                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        {s3 ? (
                          <Database className="w-4 h-4 text-brand-cyan" />
                        ) : (
                          <Server className="w-4 h-4 text-muted" />
                        )}

                        <div>

                          <div className="font-bold text-xs text-text">
                            {resource.name}
                          </div>

                          <div className="text-[10px] text-muted font-mono">
                            {resource.id}
                          </div>

                        </div>

                      </div>

                      <ProviderBadge
                        provider={
                          resource.provider
                        }
                      />

                    </div>


                    <div className="flex items-center justify-between text-xs text-muted">

                      <span>
                        {resource.resource_type} • {resource.region}
                      </span>

                      <StatusBadge
                        status={
                          resource.status
                        }
                      />

                    </div>


                    {s3 ? (

                      <div className="bg-elevated p-3 rounded-btn space-y-1">
                        <div className="text-xs font-semibold text-text">
                          Object Storage
                        </div>
                        <div className="text-[10px] text-success flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Live S3 inventory • Read-only
                        </div>
                      </div>

                    ) : isLambda(resource) ? (

                      <div className="bg-elevated p-3 rounded-btn space-y-1">
                        <div className="text-xs font-semibold text-text">
                          Serverless Function
                        </div>
                        <div className="text-[10px] text-success flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Live Lambda inventory • Read-only
                        </div>
                      </div>

                    ) : isDynamoDb(resource) ? (

                      <div className="bg-elevated p-3 rounded-btn space-y-1">
                        <div className="text-xs font-semibold text-text">
                          NoSQL Database
                        </div>
                        <div className="text-[10px] text-success flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Live DynamoDB inventory • Read-only
                        </div>
                      </div>

                    ) : (

                      <div className="grid grid-cols-3 gap-2 bg-elevated p-2 rounded-btn text-[11px] font-mono text-center">

                        <div>
                          CPU:
                          <strong className="text-text ml-1">
                            {resource.cpu_utilization}%
                          </strong>
                        </div>

                        <div>
                          Mem:
                          <strong className="text-text ml-1">
                            {resource.memory_utilization}%
                          </strong>
                        </div>

                        <div>
                          Disk:
                          <strong className="text-text ml-1">
                            {resource.storage_utilization}%
                          </strong>
                        </div>

                      </div>

                    )}


                    <div className="flex items-center justify-between pt-1">

                      {(s3 || isLambda(resource) || isDynamoDb(resource)) ? (

                        <span className="text-[10px] text-muted">
                          Cost Explorer not integrated
                        </span>

                      ) : (

                        <div className="font-bold font-mono text-sm text-text">
                          {formatCurrency(
                            resource.monthly_cost
                          )}
                          <span className="text-[10px] text-muted font-normal ml-1">
                            /mo
                          </span>
                        </div>

                      )}


                      {compute && (

                        <div className="flex items-center gap-2">

                          <button
                            type="button"
                            onClick={
                              () =>
                                handleToggle(
                                  resource
                                )
                            }
                            className="px-2.5 py-1 rounded-btn text-xs font-semibold bg-elevated border border-border text-text hover:bg-border/60 transition flex items-center gap-1"
                          >
                            <Power className="w-3 h-3" />
                            {resource.status === 'running'
                              ? 'Stop'
                              : 'Start'}
                          </button>

                          <button
                            type="button"
                            onClick={
                              () =>
                                setDeleteConfirmId(
                                  resource.id
                                )
                            }
                            className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </div>

                      )}

                    </div>

                  </div>
                );
              }
            )}

          </div>

        </Card>

      ) : (

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {filtered.map(
            resource => {

              const s3 =
                isS3(
                  resource
                );

              const compute =
                isComputeResource(
                  resource
                );

              return (

                <Card
                  key={resource.id}
                  className="p-4 space-y-3 flex flex-col justify-between"
                >

                  <div>

                    <div className="flex items-start justify-between gap-2 mb-2">

                      <div>

                        <h4 className="font-bold text-xs text-text truncate">
                          {resource.name}
                        </h4>

                        <p className="text-[10px] text-muted font-mono truncate">
                          {resource.id}
                        </p>

                      </div>

                      <ProviderBadge
                        provider={
                          resource.provider
                        }
                      />

                    </div>


                    <div className="flex items-center justify-between text-xs text-muted mb-3">

                      <span className="flex items-center gap-1">
                        {s3 && (
                          <Database className="w-3 h-3 text-brand-cyan" />
                        )}
                        {resource.resource_type} • {resource.region}
                      </span>

                      <StatusBadge
                        status={
                          resource.status
                        }
                      />

                    </div>


                    {s3 ? (

                      <div className="space-y-2 bg-elevated p-3 rounded-btn">

                        <div className="flex items-center gap-2 text-xs text-text font-semibold">
                          <HardDrive className="w-3.5 h-3.5 text-brand-cyan" />
                          Object Storage
                        </div>

                        <S3Badge />

                        <div className="text-[10px] text-muted">
                          Discovered through the live AWS S3 API
                        </div>

                      </div>

                    ) : isLambda(resource) ? (

                      <div className="space-y-2 bg-elevated p-3 rounded-btn">

                        <div className="flex items-center gap-2 text-xs text-text font-semibold">
                          <Server className="w-3.5 h-3.5 text-brand-cyan" />
                          Serverless Function
                        </div>

                        <div className="text-[10px] text-success flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Live Lambda inventory
                        </div>

                        <div className="text-[10px] text-muted">
                          {String(resource.metadata?.runtime ?? resource.instance_type ?? 'Runtime unknown')}
                        </div>

                      </div>

                    ) : isDynamoDb(resource) ? (

                      <div className="space-y-2 bg-elevated p-3 rounded-btn">

                        <div className="flex items-center gap-2 text-xs text-text font-semibold">
                          <Database className="w-3.5 h-3.5 text-brand-cyan" />
                          NoSQL Database
                        </div>

                        <div className="text-[10px] text-success flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          Live DynamoDB inventory
                        </div>

                        <div className="text-[10px] text-muted">
                          {String(resource.metadata?.billing_mode ?? resource.instance_type ?? 'Billing mode unknown')}
                        </div>

                      </div>

                    ) : (

                      <div className="space-y-1.5 bg-elevated p-2.5 rounded-btn text-[11px] font-mono">

                        <div className="flex items-center justify-between text-muted">
                          <span>
                            CPU: {resource.cpu_utilization}%
                          </span>
                          <span>
                            Mem: {resource.memory_utilization}%
                          </span>
                          <span>
                            Disk: {resource.storage_utilization}%
                          </span>
                        </div>

                      </div>

                    )}

                  </div>


                  <div className="pt-3 border-t border-border flex items-center justify-between">

                    <div>

                      {(s3 || isLambda(resource) || isDynamoDb(resource)) ? (

                        <span className="text-[10px] text-muted">
                          Cost: N/A
                        </span>

                      ) : (

                        <>
                          <span className="text-xs font-bold font-mono text-text">
                            {formatCurrency(
                              resource.monthly_cost
                            )}
                          </span>
                          <span className="text-[10px] text-muted font-sans ml-1">
                            /mo
                          </span>
                        </>

                      )}

                    </div>


                    {compute ? (

                      <div className="flex items-center gap-1.5">

                        <button
                          type="button"
                          onClick={
                            () =>
                              handleToggle(
                                resource
                              )
                          }
                          className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-text transition"
                          title={
                            resource.status === 'running'
                              ? 'Stop'
                              : 'Start'
                          }
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={
                            () =>
                              setDeleteConfirmId(
                                resource.id
                              )
                          }
                          className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger transition"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>

                    ) : (

                      <S3Badge />

                    )}

                  </div>

                </Card>
              );
            }
          )}

        </div>

      )}


      {deleteConfirmId && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">

          <div className="bg-surface border border-border rounded-card max-w-sm w-full p-6 shadow-2xl space-y-4">

            <div className="flex items-center gap-2.5 text-danger font-bold text-sm">
              <Trash2 className="w-5 h-5" />
              Remove Compute Resource
            </div>

            <p className="text-xs text-muted">
              Are you sure you want to remove{' '}
              <strong className="text-text font-mono">
                {deleteConfirmId}
              </strong>
              ?
            </p>

            <div className="pt-2 flex items-center justify-end gap-2">

              <Button
                variant="secondary"
                size="sm"
                onClick={
                  () =>
                    setDeleteConfirmId(
                      null
                    )
                }
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={
                  () =>
                    handleDelete(
                      deleteConfirmId
                    )
                }
                loading={
                  actionLoadingId ===
                  deleteConfirmId
                }
              >
                Remove
              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};
