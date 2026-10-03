import React, {
  useState
} from 'react';

import {
  Plus,
  Power,
  Trash2,
  Search,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';

import {
  CloudResource
} from '../types/cloudwise.js';

import {
  formatOptionalCurrency,
  formatOptionalPercent,
  isMetricAvailable
} from '../utils/formatters.js';

import {
  Card,
  ProviderBadge,
  StatusBadge,
  Button
} from './ui/Primitives.js';


interface ResourcesTabProps {

  resources:
    CloudResource[];

  onOpenAddModal:
    () => void;

  onToggleStatus:
    (
      resource:
        CloudResource
    ) => Promise<void>;

  onDeleteResource:
    (
      id:
        string
    ) => Promise<void>;

  onUpdateResource?:
    (
      id:
        string,

      updates:
        Partial<CloudResource>

    ) => Promise<void>;

  onRefresh:
    () => Promise<void>;

  isRefreshing:
    boolean;
}


/*
 * Returns an appropriate utilization bar color.
 */
function getMetricColor(
  value:
    | number
    | null
    | undefined
): string {

  if (
    !isMetricAvailable(value)
  ) {

    return '#94A3B8';
  }


  if (
    value >= 90
  ) {

    return '#EF4444';
  }


  if (
    value >= 85
  ) {

    return '#F59E0B';
  }


  return '#22C55E';
}


/*
 * Ensures utilization bar width
 * remains between 0% and 100%.
 */
function getMetricWidth(
  value:
    | number
    | null
    | undefined
): number {

  if (
    !isMetricAvailable(value)
  ) {

    return 0;
  }


  return Math.min(
    Math.max(
      value,
      0
    ),

    100
  );
}


/*
 * Used when sorting values that may be unavailable.
 */
function sortableMetric(
  value:
    | number
    | null
    | undefined
): number {

  if (
    !isMetricAvailable(value)
  ) {

    return -1;
  }


  return value;
}


export const ResourcesTab:
React.FC<ResourcesTabProps> = ({

  resources,

  onOpenAddModal,

  onToggleStatus,

  onDeleteResource,

  onRefresh,

  isRefreshing,

}) => {


  const [
    providerFilter,
    setProviderFilter
  ] =
    useState<string>(
      'ALL'
    );


  const [
    statusFilter,
    setStatusFilter
  ] =
    useState<string>(
      'ALL'
    );


  const [
    typeFilter,
    setTypeFilter
  ] =
    useState<string>(
      'ALL'
    );


  const [
    search,
    setSearch
  ] =
    useState<string>(
      ''
    );


  const [
    viewMode,
    setViewMode
  ] =
    useState<
      'table' |
      'grid'
    >(
      'table'
    );


  const [
    sortField,
    setSortField
  ] =
    useState<
      'name' |
      'monthly_cost' |
      'cpu_utilization'
    >(
      'monthly_cost'
    );


  const [
    sortOrder,
    setSortOrder
  ] =
    useState<
      'asc' |
      'desc'
    >(
      'desc'
    );


  const [
    actionLoadingId,
    setActionLoadingId
  ] =
    useState<
      string |
      null
    >(
      null
    );


  const [
    deleteConfirmId,
    setDeleteConfirmId
  ] =
    useState<
      string |
      null
    >(
      null
    );


  /*
   * Resource type dropdown values.
   */
  const uniqueTypes =
    Array.from(
      new Set(
        resources.map(
          resource =>
            resource.resource_type
        )
      )
    );


  /*
   * Filtering and sorting.
   */
  const filtered =
    resources

      .filter(
        resource => {

          if (
            providerFilter !==
              'ALL' &&

            resource.provider
              .toUpperCase() !==
              providerFilter
          ) {

            return false;
          }


          if (
            statusFilter !==
              'ALL' &&

            resource.status !==
              statusFilter
          ) {

            return false;
          }


          if (
            typeFilter !==
              'ALL' &&

            resource.resource_type !==
              typeFilter
          ) {

            return false;
          }


          if (
            search &&

            !resource.name
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) &&

            !resource.id
              .toLowerCase()
              .includes(
                search.toLowerCase()
              ) &&

            !resource.region
              .toLowerCase()
              .includes(
                search.toLowerCase()
              )
          ) {

            return false;
          }


          return true;
        }
      )

      .sort(
        (
          a,
          b
        ) => {

          let comparison =
            0;


          if (
            sortField ===
            'name'
          ) {

            comparison =
              a.name.localeCompare(
                b.name
              );
          }


          else if (
            sortField ===
            'monthly_cost'
          ) {

            comparison =
              sortableMetric(
                a.monthly_cost
              ) -
              sortableMetric(
                b.monthly_cost
              );
          }


          else if (
            sortField ===
            'cpu_utilization'
          ) {

            comparison =
              sortableMetric(
                a.cpu_utilization
              ) -
              sortableMetric(
                b.cpu_utilization
              );
          }


          return (
            sortOrder ===
              'asc'

              ? comparison

              : -comparison
          );
        }
      );


  const handleToggle =
    async (
      resource:
        CloudResource
    ) => {

      /*
       * Real cloud automation has not been
       * enabled yet.
       */
      if (
        resource.source ===
        'live'
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
        | 'name'
        | 'monthly_cost'
        | 'cpu_utilization'
    ) => {

      if (
        sortField ===
        field
      ) {

        setSortOrder(
          sortOrder ===
            'asc'
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
      id:
        string
    ) => {

      const resource =
        resources.find(
          item =>
            item.id === id
        );


      if (
        resource?.source ===
        'live'
      ) {

        return;
      }


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


      {/* TOP TOOLBAR */}

      <Card className="p-4 space-y-3">


        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">


          {/* SEARCH */}

          <div className="relative flex-1 max-w-md">

            <Search
              className="w-4 h-4 text-muted absolute left-3 top-2.5"
            />

            <input

              type="text"

              placeholder="Search resource name, ID, or region..."

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


          {/* ACTIONS */}

          <div className="flex items-center gap-2 justify-end shrink-0">


            <Button

              variant="secondary"

              size="sm"

              icon={
                <RefreshCw
                  className={`w-3.5 h-3.5 ${
                    isRefreshing
                      ? 'animate-spin'
                      : ''
                  }`}
                />
              }

              onClick={
                onRefresh
              }

              disabled={
                isRefreshing
              }

            >

              Refresh

            </Button>


            {/* VIEW TOGGLE */}

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
                  viewMode ===
                    'table'

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
                  viewMode ===
                    'grid'

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


        {/* FILTERS */}

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
            ].map(
              provider => (

                <button

                  key={
                    provider
                  }

                  onClick={
                    () =>
                      setProviderFilter(
                        provider
                      )
                  }

                  className={`px-2.5 py-0.5 rounded-btn font-semibold border transition ${
                    providerFilter ===
                      provider

                      ? 'bg-elevated text-brand-cyan border-brand-cyan'

                      : 'bg-surface text-muted border-border hover:text-text'
                  }`}
                >

                  {provider}

                </button>

              )
            )}


            <span className="text-border mx-1">
              |
            </span>


            {[
              'ALL',
              'running',
              'stopped',
              'attached'
            ].map(
              status => (

                <button

                  key={
                    status
                  }

                  onClick={
                    () =>
                      setStatusFilter(
                        status
                      )
                  }

                  className={`px-2 py-0.5 rounded-full capitalize border transition ${
                    statusFilter ===
                      status

                      ? 'bg-elevated text-text border-text/40 font-semibold'

                      : 'bg-surface text-muted border-border hover:text-text'
                  }`}
                >

                  {status}

                </button>

              )
            )}

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


      {/* TABLE VIEW */}

      {viewMode ===
        'table' ? (

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
                    Type &amp; Region
                  </th>


                  <th className="px-5 py-3">
                    Status
                  </th>


                  <th
                    className="px-5 py-3 cursor-pointer"
                    onClick={
                      () =>
                        handleSort(
                          'cpu_utilization'
                        )
                    }
                  >

                    <div className="flex items-center gap-1.5">

                      CPU / Mem / Disk

                      <ArrowUpDown className="w-3 h-3" />

                    </div>

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


                {filtered.length ===
                  0 ? (

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


                      const isLoading =
                        actionLoadingId ===
                        resource.id;


                      const isLive =
                        resource.source ===
                        'live';


                      const cpuColor =
                        getMetricColor(
                          resource.cpu_utilization
                        );


                      const memColor =
                        getMetricColor(
                          resource.memory_utilization
                        );


                      const storageColor =
                        getMetricColor(
                          resource.storage_utilization
                        );


                      return (

                        <tr
                          key={
                            resource.id
                          }
                          className="hover:bg-elevated/50 transition"
                        >


                          {/* NAME */}

                          <td className="px-5 py-3 font-sans">

                            <div className="flex items-center gap-2">

                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${
                                  resource.status ===
                                    'running'

                                    ? 'bg-success'

                                    : resource.status ===
                                      'stopped'

                                    ? 'bg-muted'

                                    : 'bg-info'
                                }`}
                              />


                              <div>

                                <div className="font-semibold text-text flex items-center gap-1.5">


                                  {resource.name}


                                  {resource.source ===
                                    'live' && (

                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-success/10 border border-success/30 text-success">

                                      LIVE

                                    </span>

                                  )}


                                  {resource.source ===
                                    'mock' && (

                                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-elevated border border-border text-muted">

                                      DEMO

                                    </span>

                                  )}


                                  {resource.anomaly_type && (

                                    <span title="Anomaly Detected">

                                      <AlertTriangle className="w-3 h-3 text-warning" />

                                    </span>

                                  )}

                                </div>


                                <div className="text-[10px] text-muted font-mono">

                                  {resource.id}

                                </div>

                              </div>

                            </div>

                          </td>


                          {/* PROVIDER */}

                          <td className="px-5 py-3 font-sans">

                            <ProviderBadge
                              provider={
                                resource.provider
                              }
                            />

                          </td>


                          {/* TYPE + REGION */}

                          <td className="px-5 py-3 font-sans">

                            <div className="text-text font-medium">

                              {resource.resource_type}

                            </div>

                            <div className="text-[10px] text-muted font-mono">

                              {resource.region}

                            </div>

                          </td>


                          {/* STATUS */}

                          <td className="px-5 py-3 font-sans">

                            <StatusBadge
                              status={
                                resource.status
                              }
                            />

                          </td>


                          {/* METRICS */}

                          <td className="px-5 py-3 font-mono text-[11px]">

                            <div className="space-y-1 w-32">


                              <div className="flex items-center justify-between text-[10px] text-muted">

                                <span>

                                  CPU: {
                                    formatOptionalPercent(
                                      resource.cpu_utilization
                                    )
                                  }

                                </span>


                                <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">

                                  <div

                                    className="h-full rounded-full transition-all"

                                    style={{

                                      width:
                                        `${getMetricWidth(
                                          resource.cpu_utilization
                                        )}%`,

                                      backgroundColor:
                                        cpuColor,

                                    }}

                                  />

                                </div>

                              </div>


                              <div className="flex items-center justify-between text-[10px] text-muted">

                                <span>

                                  Mem: {
                                    formatOptionalPercent(
                                      resource.memory_utilization
                                    )
                                  }

                                </span>


                                <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">

                                  <div

                                    className="h-full rounded-full transition-all"

                                    style={{

                                      width:
                                        `${getMetricWidth(
                                          resource.memory_utilization
                                        )}%`,

                                      backgroundColor:
                                        memColor,

                                    }}

                                  />

                                </div>

                              </div>


                              <div className="flex items-center justify-between text-[10px] text-muted">

                                <span>

                                  Disk: {
                                    formatOptionalPercent(
                                      resource.storage_utilization
                                    )
                                  }

                                </span>


                                <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">

                                  <div

                                    className="h-full rounded-full transition-all"

                                    style={{

                                      width:
                                        `${getMetricWidth(
                                          resource.storage_utilization
                                        )}%`,

                                      backgroundColor:
                                        storageColor,

                                    }}

                                  />

                                </div>

                              </div>

                            </div>

                          </td>


                          {/* COST */}

                          <td className="px-5 py-3">

                            <div className="font-bold text-text font-mono text-sm">

                              {
                                formatOptionalCurrency(
                                  resource.monthly_cost
                                )
                              }

                            </div>


                            <div className="text-[10px] text-muted font-mono">

                              {
                                formatOptionalCurrency(
                                  resource.cost_usd
                                )
                              }

                              {
                                isMetricAvailable(
                                  resource.cost_usd
                                )
                                  ? '/hr'
                                  : ''
                              }

                            </div>

                          </td>


                          {/* ACTIONS */}

                          <td className="px-5 py-3 text-right font-sans">

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
                                  isLoading ||
                                  isLive
                                }

                                title={
                                  isLive

                                    ? 'Live cloud resources are read-only for now'

                                    : resource.status ===
                                      'running'

                                    ? 'Stop instance'

                                    : 'Start instance'
                                }

                                className={`p-1.5 rounded-btn border transition disabled:opacity-40 disabled:cursor-not-allowed ${
                                  resource.status ===
                                    'running'

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
                                  isLoading ||
                                  isLive
                                }

                                title={
                                  isLive

                                    ? 'Live cloud resources cannot be deleted from CloudWise yet'

                                    : 'Delete Resource'
                                }

                                className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger hover:border-danger/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                              >

                                <Trash2 className="w-3.5 h-3.5" />

                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    }
                  )
                )}

              </tbody>

            </table>

          </div>


          {/* MOBILE */}

          <div className="lg:hidden divide-y divide-border">

            {filtered.map(
              resource => {

                const isLive =
                  resource.source ===
                  'live';


                return (

                  <div
                    key={
                      resource.id
                    }
                    className="p-4 space-y-3"
                  >


                    <div className="flex items-center justify-between">

                      <div className="flex items-center gap-2">

                        <span
                          className={`w-2 h-2 rounded-full ${
                            resource.status ===
                              'running'

                              ? 'bg-success'

                              : resource.status ===
                                'stopped'

                              ? 'bg-muted'

                              : 'bg-info'
                          }`}
                        />


                        <div>

                          <div className="font-bold text-xs text-text flex gap-1.5">

                            {resource.name}

                            {isLive && (

                              <span className="text-[9px] text-success">
                                LIVE
                              </span>

                            )}

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

                        {resource.resource_type}
                        {' • '}
                        {resource.region}

                      </span>


                      <StatusBadge
                        status={
                          resource.status
                        }
                      />

                    </div>


                    <div className="grid grid-cols-3 gap-2 bg-elevated p-2 rounded-btn text-[11px] font-mono text-center">

                      <div>

                        CPU:

                        <strong className="text-text ml-1">

                          {
                            formatOptionalPercent(
                              resource.cpu_utilization
                            )
                          }

                        </strong>

                      </div>


                      <div>

                        Mem:

                        <strong className="text-text ml-1">

                          {
                            formatOptionalPercent(
                              resource.memory_utilization
                            )
                          }

                        </strong>

                      </div>


                      <div>

                        Disk:

                        <strong className="text-text ml-1">

                          {
                            formatOptionalPercent(
                              resource.storage_utilization
                            )
                          }

                        </strong>

                      </div>

                    </div>


                    <div className="flex items-center justify-between pt-1 text-xs">

                      <div className="font-bold font-mono text-sm text-text">

                        {
                          formatOptionalCurrency(
                            resource.monthly_cost
                          )
                        }

                        <span className="text-[10px] text-muted font-normal ml-1">

                          /mo

                        </span>

                      </div>


                      <div className="flex items-center gap-2">

                        <button

                          type="button"

                          disabled={
                            isLive
                          }

                          onClick={
                            () =>
                              handleToggle(
                                resource
                              )
                          }

                          className="px-2.5 py-1 rounded-btn text-xs font-semibold bg-elevated border border-border text-text hover:bg-border/60 transition flex items-center gap-1 disabled:opacity-40"
                        >

                          <Power className="w-3 h-3" />

                          {
                            isLive
                              ? 'Read Only'
                              : resource.status ===
                                'running'
                              ? 'Stop'
                              : 'Start'
                          }

                        </button>


                        <button

                          type="button"

                          disabled={
                            isLive
                          }

                          onClick={
                            () =>
                              setDeleteConfirmId(
                                resource.id
                              )
                          }

                          className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger transition disabled:opacity-40"
                        >

                          <Trash2 className="w-3.5 h-3.5" />

                        </button>

                      </div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </Card>

      ) : (

        /* GRID VIEW */

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

          {filtered.map(
            resource => {

              const isLive =
                resource.source ===
                'live';


              return (

                <Card
                  key={
                    resource.id
                  }
                  className="p-4 space-y-3 flex flex-col justify-between"
                >


                  <div>


                    <div className="flex items-start justify-between gap-2 mb-2">

                      <div>

                        <h4 className="font-bold text-xs text-text truncate flex gap-1.5">

                          {resource.name}

                          {isLive && (

                            <span className="text-success text-[9px]">

                              LIVE

                            </span>

                          )}

                        </h4>


                        <p className="text-[10px] text-muted font-mono">

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

                      <span>

                        {resource.resource_type}
                        {' • '}
                        {resource.region}

                      </span>


                      <StatusBadge
                        status={
                          resource.status
                        }
                      />

                    </div>


                    <div className="space-y-1.5 bg-elevated p-2.5 rounded-btn text-[11px] font-mono">

                      <div className="flex items-center justify-between text-muted">

                        <span>

                          CPU: {
                            formatOptionalPercent(
                              resource.cpu_utilization
                            )
                          }

                        </span>


                        <span>

                          Mem: {
                            formatOptionalPercent(
                              resource.memory_utilization
                            )
                          }

                        </span>


                        <span>

                          Disk: {
                            formatOptionalPercent(
                              resource.storage_utilization
                            )
                          }

                        </span>

                      </div>

                    </div>

                  </div>


                  <div className="pt-3 border-t border-border flex items-center justify-between">

                    <div>

                      <span className="text-xs font-bold font-mono text-text">

                        {
                          formatOptionalCurrency(
                            resource.monthly_cost
                          )
                        }

                      </span>


                      <span className="text-[10px] text-muted font-sans ml-1">

                        /mo

                      </span>

                    </div>


                    <div className="flex items-center gap-1.5">

                      <button

                        type="button"

                        disabled={
                          isLive
                        }

                        onClick={
                          () =>
                            handleToggle(
                              resource
                            )
                        }

                        className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-text transition disabled:opacity-40"

                        title={
                          isLive
                            ? 'Live resource is read-only'
                            : 'Start / Stop'
                        }
                      >

                        <Power className="w-3.5 h-3.5" />

                      </button>


                      <button

                        type="button"

                        disabled={
                          isLive
                        }

                        onClick={
                          () =>
                            setDeleteConfirmId(
                              resource.id
                            )
                        }

                        className="p-1.5 rounded-btn bg-elevated border border-border text-muted hover:text-danger transition disabled:opacity-40"

                        title={
                          isLive
                            ? 'Live resource is read-only'
                            : 'Delete'
                        }
                      >

                        <Trash2 className="w-3.5 h-3.5" />

                      </button>

                    </div>

                  </div>

                </Card>

              );
            }
          )}

        </div>

      )}


      {/* DELETE CONFIRMATION */}

      {deleteConfirmId && (

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">


          <div className="bg-surface border border-border rounded-card max-w-sm w-full p-6 shadow-2xl space-y-4">


            <div className="flex items-center gap-2.5 text-danger font-bold text-sm">

              <Trash2 className="w-5 h-5" />

              Terminate Cloud Resource

            </div>


            <p className="text-xs text-muted">

              Are you sure you want to delete

              {' '}

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

                Terminate

              </Button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
};