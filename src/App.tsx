import React, {
  useState,
  useEffect
} from 'react';

import {
  Cloud,
  LayoutDashboard,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Server,
  Terminal,
  Sun,
  Moon,
  Plus,
  ChevronLeft,
  ChevronRight,
  Activity,
  MoreHorizontal,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import {
  CloudResource,
  DashboardOverview,
  Forecast,
  Anomaly,
  Recommendation,
  CostData,
  ToastItem,
} from './types/cloudwise.js';

import {
  OverviewTab
} from './components/OverviewTab.js';

import {
  AnomaliesTab
} from './components/AnomaliesTab.js';

import {
  ForecastTab
} from './components/ForecastTab.js';

import {
  RecommendationsTab
} from './components/RecommendationsTab.js';

import {
  ResourcesTab
} from './components/ResourcesTab.js';

import {
  ApiConsoleTab
} from './components/ApiConsoleTab.js';

import {
  AddResourceModal
} from './components/AddResourceModal.js';

import {
  Button,
  Skeleton,
  Card
} from './components/ui/Primitives.js';


export function App() {


  /*
   * =========================================================
   * THEME
   * =========================================================
   */

  const [
    theme,
    setTheme
  ] =
    useState<
      'dark' |
      'light'
    >(
      () => {

        if (
          typeof window !==
            'undefined' &&

          window.matchMedia(
            '(prefers-color-scheme: light)'
          ).matches
        ) {

          return 'light';
        }


        return 'dark';
      }
    );


  /*
   * =========================================================
   * NAVIGATION / UI STATE
   * =========================================================
   */

  const [
    activeTab,
    setActiveTab
  ] =
    useState<string>(
      'overview'
    );


  const [
    sidebarCollapsed,
    setSidebarCollapsed
  ] =
    useState<boolean>(
      false
    );


  const [
    mobileMoreOpen,
    setMobileMoreOpen
  ] =
    useState<boolean>(
      false
    );


  const [
    isAddModalOpen,
    setIsAddModalOpen
  ] =
    useState<boolean>(
      false
    );


  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const [
    overview,
    setOverview
  ] =
    useState<
      DashboardOverview |
      null
    >(
      null
    );


  const [
    resources,
    setResources
  ] =
    useState<
      CloudResource[]
    >(
      []
    );


  const [
    anomalies,
    setAnomalies
  ] =
    useState<
      Anomaly[]
    >(
      []
    );


  const [
    forecast,
    setForecast
  ] =
    useState<
      Forecast[]
    >(
      []
    );


  const [
    recommendations,
    setRecommendations
  ] =
    useState<
      Recommendation[]
    >(
      []
    );


  const [
    historicalCosts,
    setHistoricalCosts
  ] =
    useState<
      CostData[]
    >(
      []
    );


  /*
   * =========================================================
   * LOADING / STATUS
   * =========================================================
   */

  const [
    loading,
    setLoading
  ] =
    useState<boolean>(
      true
    );


  const [
    analyzing,
    setAnalyzing
  ] =
    useState<boolean>(
      false
    );


  const [
    refreshingResources,
    setRefreshingResources
  ] =
    useState<boolean>(
      false
    );


  const [
    error,
    setError
  ] =
    useState<
      string |
      null
    >(
      null
    );


  const [
    toasts,
    setToasts
  ] =
    useState<
      ToastItem[]
    >(
      []
    );


  /*
   * =========================================================
   * THEME APPLICATION
   * =========================================================
   */

  useEffect(
    () => {

      const root =
        document.documentElement;


      if (
        theme ===
        'light'
      ) {

        root.classList.add(
          'light'
        );

      } else {

        root.classList.remove(
          'light'
        );
      }

    },
    [
      theme
    ]
  );


  /*
   * =========================================================
   * TOAST HELPER
   * =========================================================
   */

  const addToast =
    (
      type:
        | 'success'
        | 'error'
        | 'info'
        | 'warning',

      title:
        string,

      message?:
        string
    ) => {


      const id =
        Math.random()
          .toString(36)
          .substring(
            2,
            9
          );


      setToasts(
        previous => [

          ...previous,

          {
            id,
            type,
            title,
            message
          }
        ]
      );


      setTimeout(
        () => {

          setToasts(
            previous =>
              previous.filter(
                toast =>
                  toast.id !==
                  id
              )
          );

        },
        4000
      );
    };


  /*
   * =========================================================
   * LIVE CLOUD RESOURCE REFRESH
   * =========================================================
   */

  const loadLiveResources =
    async (
      showNotification:
        boolean = false
    ) => {


      setRefreshingResources(
        true
      );


      try {

        const response =
          await fetch(
            '/api/cloud/resources',
            {
              cache:
                'no-store'
            }
          );


        if (
          !response.ok
        ) {

          throw new Error(
            `Cloud resource API returned HTTP ${response.status}`
          );
        }


        const data =
          await response.json();


        if (
          !Array.isArray(
            data
          )
        ) {

          throw new Error(
            'Invalid cloud resource response.'
          );
        }


        setResources(
          data
        );


        if (
          showNotification
        ) {

          addToast(
            'success',
            'Cloud Resources Refreshed',
            `Loaded ${data.length} resources from the multi-cloud feed.`
          );
        }

      } catch (
        err:
          any
      ) {

        console.error(
          'Failed to refresh cloud resources:',
          err
        );


        if (
          showNotification
        ) {

          addToast(
            'error',
            'Refresh Failed',
            err?.message ||
              'Unable to retrieve cloud resources.'
          );
        }

      } finally {

        setRefreshingResources(
          false
        );
      }
    };


  /*
   * =========================================================
   * INITIAL APPLICATION LOAD
   * =========================================================
   */

  const loadInitialData =
    async () => {


      setLoading(
        true
      );


      setError(
        null
      );


      try {

        const [
          resOverview,
          resResources,
          resCosts
        ] =
          await Promise.all([

            fetch(
              '/api/ai/overview'
            ).then(
              response =>
                response.json()
            ),

            fetch(
              '/api/cloud/resources',
              {
                cache:
                  'no-store'
              }
            ).then(
              response =>
                response.json()
            ),

            fetch(
              '/api/ai/dataset/costs'
            ).then(
              response =>
                response.json()
            )

          ]);


        setOverview(
          resOverview
        );


        setResources(
          resResources
        );


        setHistoricalCosts(
          resCosts
        );


        /*
         * Existing AI analysis.
         *
         * At the moment the AI backend still uses
         * the existing sample dataset.
         */

        const analysisResponse =
          await fetch(
            '/ai/analyze',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({})
            }
          ).then(
            response =>
              response.json()
          );


        if (
          analysisResponse
        ) {

          setAnomalies(
            analysisResponse
              .anomalies ||
            []
          );


          setForecast(
            analysisResponse
              .forecast ||
            []
          );


          setRecommendations(
            analysisResponse
              .recommendations ||
            []
          );
        }

      } catch (
        err:
          any
      ) {

        console.error(
          'Failed to load CloudWise-AI data:',
          err
        );


        setError(
          err?.message ||
          'Failed to initialize CloudWise-AI.'
        );


        addToast(
          'error',
          'Initialization Error',
          'Unable to fetch cloud telemetry metrics.'
        );

      } finally {

        setLoading(
          false
        );
      }
    };


  /*
   * =========================================================
   * INITIAL LOAD + 30 SECOND LIVE POLLING
   * =========================================================
   */

  useEffect(
    () => {


      void loadInitialData();


      /*
       * Every 30 seconds CloudWise requests
       * /api/cloud/resources again.
       *
       * AWS therefore gets refreshed without
       * reloading the browser.
       */

      const refreshInterval =
        window.setInterval(
          () => {

            void loadLiveResources(
              false
            );

          },
          30000
        );


      /*
       * Clean interval when React unmounts.
       */

      return () => {

        window.clearInterval(
          refreshInterval
        );
      };

    },
    []
  );


  /*
   * Manual refresh button.
   */

  const handleRefreshResources =
    async () => {

      await loadLiveResources(
        true
      );
    };


  /*
   * =========================================================
   * AI ANALYSIS
   * =========================================================
   */

  const handleRunAnalysis =
    async (
      contamination:
        number = 0.05
    ) => {


      setAnalyzing(
        true
      );


      try {

        const analysisResponse =
          await fetch(
            '/ai/analyze',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({
                  contamination
                })
            }
          ).then(
            response =>
              response.json()
          );


        if (
          analysisResponse
        ) {

          setAnomalies(
            analysisResponse
              .anomalies ||
            []
          );


          setForecast(
            analysisResponse
              .forecast ||
            []
          );


          setRecommendations(
            analysisResponse
              .recommendations ||
            []
          );
        }


        const updatedOverview =
          await fetch(
            '/api/ai/overview'
          ).then(
            response =>
              response.json()
          );


        setOverview(
          updatedOverview
        );


        addToast(
          'success',
          'Analysis Completed',
          'Evaluated multi-cloud resources and recomputed savings.'
        );

      } catch (
        err:
          any
      ) {

        addToast(
          'error',
          'Analysis Failed',
          err?.message ||
            'Analysis failed.'
        );

      } finally {

        setAnalyzing(
          false
        );
      }
    };


  /*
   * =========================================================
   * RESOURCE START / STOP
   * =========================================================
   */

  const handleToggleResourceStatus =
    async (
      resource:
        CloudResource
    ) => {


      /*
       * IMPORTANT:
       *
       * Real AWS control/remediation has not been
       * implemented yet.
       *
       * Prevent the demo CRUD API from pretending
       * to start/stop a real EC2 instance.
       */

      if (
        resource.source ===
        'live'
      ) {

        addToast(
          'info',
          'Read-Only Live Resource',
          'Real cloud start/stop automation has not been enabled yet.'
        );


        return;
      }


      const nextStatus =
        resource.status ===
          'running'

          ? 'stopped'

          : 'running';


      try {

        const updated =
          await fetch(
            `/api/cloud/resources/${resource.id}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  status:
                    nextStatus,

                  cpu_utilization:
                    nextStatus ===
                      'stopped'
                      ? 0
                      : 45,

                  cost_usd:
                    nextStatus ===
                      'stopped'
                      ? 0.05
                      : resource.cost_usd,

                })
            }
          ).then(
            response =>
              response.json()
          );


        setResources(
          previous =>
            previous.map(
              item =>
                item.id ===
                  resource.id

                  ? updated

                  : item
            )
        );


        addToast(
          'success',
          'Resource Updated',
          `Switched ${resource.name} to ${nextStatus}.`
        );


        await handleRunAnalysis();

      } catch (
        err:
          any
      ) {

        addToast(
          'error',
          'Update Failed',
          err?.message ||
            'Unable to update resource.'
        );
      }
    };


  /*
   * =========================================================
   * DELETE RESOURCE
   * =========================================================
   */

  const handleDeleteResource =
    async (
      id:
        string
    ) => {


      const resource =
        resources.find(
          item =>
            item.id ===
            id
        );


      if (
        resource?.source ===
        'live'
      ) {

        addToast(
          'info',
          'Read-Only Live Resource',
          'Real cloud deletion has not been enabled yet.'
        );


        return;
      }


      try {

        await fetch(
          `/api/cloud/resources/${id}`,
          {
            method:
              'DELETE'
          }
        );


        setResources(
          previous =>
            previous.filter(
              resource =>
                resource.id !==
                id
            )
        );


        addToast(
          'info',
          'Resource Terminated',
          `Asset ${id} removed from multi-cloud catalog.`
        );


        await handleRunAnalysis();

      } catch (
        err:
          any
      ) {

        addToast(
          'error',
          'Delete Failed',
          err?.message ||
            'Unable to delete resource.'
        );
      }
    };


  /*
   * =========================================================
   * ADD DEMO RESOURCE
   * =========================================================
   */

  const handleAddResource =
    async (
      newResource:
        any
    ) => {


      try {

        const created =
          await fetch(
            '/api/cloud/resources',
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify(
                  newResource
                )
            }
          ).then(
            response =>
              response.json()
          );


        setResources(
          previous => [

            {
              ...created,
              source:
                'mock'
            },

            ...previous

          ]
        );


        addToast(
          'success',
          'Asset Registered',
          `Successfully added ${created.name} (${created.provider}).`
        );


        await handleRunAnalysis();

      } catch (
        err:
          any
      ) {

        addToast(
          'error',
          'Registration Failed',
          err?.message ||
            'Unable to add resource.'
        );
      }
    };


  /*
   * =========================================================
   * APPLY OPTIMIZATION
   * =========================================================
   */

  const handleApplyOptimization =
    async (
      resourceId:
        string,

      optimizationType:
        string
    ) => {


      const targetResource =
        resources.find(
          resource =>
            resource.id ===
            resourceId
        );


      /*
       * Never run existing mock remediation
       * against a live provider resource.
       */

      if (
        targetResource?.source ===
        'live'
      ) {

        addToast(
          'info',
          'Approval Required',
          'Automated remediation for live cloud resources will be implemented separately.'
        );


        return;
      }


      try {

        if (
          optimizationType ===
          'IDLE_RECLAIM'
        ) {

          await fetch(
            `/api/cloud/resources/${resourceId}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  cost_usd:
                    0,

                  monthly_cost:
                    0,

                  status:
                    'stopped'
                })
            }
          );


          addToast(
            'success',
            'Idle Reclaim Executed',
            `Eliminated idle charges on ${resourceId}.`
          );

        }


        else if (
          optimizationType ===
          'RIGHT_SIZING'
        ) {

          const currentCost =
            (
              typeof targetResource
                ?.cost_usd ===
                'number'

              ? targetResource
                  .cost_usd

              : 0.25
            );


          await fetch(
            `/api/cloud/resources/${resourceId}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  cost_usd:
                    Math.round(
                      currentCost *
                      0.7 *
                      100
                    ) /
                    100,

                  cpu_utilization:
                    45,

                })
            }
          );


          addToast(
            'success',
            'Downsizing Applied',
            `Downsized ${resourceId} (-30% run-rate).`
          );

        }


        else if (
          optimizationType ===
          'STORAGE_CLEANUP'
        ) {

          await fetch(
            `/api/cloud/resources/${resourceId}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  storage_utilization:
                    55

                })
            }
          );


          addToast(
            'success',
            'Disk Hygiene Completed',
            `Purged snapshots on ${resourceId}.`
          );

        }


        else if (
          optimizationType ===
          'SCALE_UP_REQUIRED'
        ) {

          await fetch(
            `/api/cloud/resources/${resourceId}`,
            {
              method:
                'PATCH',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  cpu_utilization:
                    50,

                  memory_utilization:
                    55,

                })
            }
          );


          addToast(
            'info',
            'Instance Resized',
            `Scaled compute capacity for ${resourceId}.`
          );
        }


        await handleRunAnalysis();

      } catch (
        err:
          any
      ) {

        addToast(
          'error',
          'Execution Error',
          err?.message ||
            'Optimization execution failed.'
        );
      }
    };


  /*
   * =========================================================
   * DISMISS RECOMMENDATION
   * =========================================================
   */

  const handleDismissRecommendation =
    (
      resourceId:
        string
    ) => {


      setRecommendations(
        previous =>
          previous.filter(
            recommendation =>
              recommendation
                .resource_id !==
              resourceId
          )
      );


      addToast(
        'info',
        'Recommendation Dismissed',
        `Muted action on ${resourceId}.`
      );
    };


  /*
   * =========================================================
   * FORECAST
   * =========================================================
   */

  const handleUpdateForecastPeriods =
    async (
      periods:
        number,

      provider?:
        string
    ) => {


      try {

        const url =
          provider &&
          provider !==
            'All'

            ? `/ai/forecast?provider=${provider}`

            : '/ai/forecast';


        const result =
          await fetch(
            url,
            {
              method:
                'POST',

              headers: {
                'Content-Type':
                  'application/json'
              },

              body:
                JSON.stringify({

                  periods,
                  provider

                })
            }
          ).then(
            response =>
              response.json()
          );


        if (
          result.forecast
        ) {

          setForecast(
            result.forecast
          );
        }

      } catch (
        err:
          any
      ) {

        addToast(
          'error',
          'Forecast Update Error',
          err?.message ||
            'Unable to update forecast.'
        );
      }
    };


  /*
   * =========================================================
   * NAVIGATION
   * =========================================================
   */

  const navItems = [

    {
      id:
        'overview',

      label:
        'Overview',

      icon:
        LayoutDashboard
    },

    {
      id:
        'anomalies',

      label:
        'Anomalies',

      icon:
        AlertTriangle,

      badge:
        anomalies.filter(
          anomaly =>
            anomaly.anomaly
        ).length
    },

    {
      id:
        'forecast',

      label:
        'Cost Forecast',

      icon:
        TrendingUp
    },

    {
      id:
        'recommendations',

      label:
        'Rightsizing',

      icon:
        TrendingDown,

      badge:
        recommendations.filter(
          recommendation =>
            recommendation.priority ===
            'HIGH'
        ).length
    },

    {
      id:
        'resources',

      label:
        'Resources',

      icon:
        Server,

      badge:
        resources.length
    },

    {
      id:
        'api',

      label:
        'API Console',

      icon:
        Terminal
    }

  ];


  /*
   * =========================================================
   * JSX
   * =========================================================
   */

  return (

    <div className="min-h-screen bg-bg text-text flex flex-col font-sans transition-colors duration-200">


      {/* TOASTS */}

      <div className="fixed top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">


        {toasts.map(
          toast => (

            <div

              key={
                toast.id
              }

              role="status"

              aria-live="polite"

              className="pointer-events-auto bg-surface border border-border rounded-btn p-3 shadow-2xl flex items-start gap-2.5 text-xs"
            >


              {toast.type ===
                'success' && (

                <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />

              )}


              {toast.type ===
                'error' && (

                <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />

              )}


              {toast.type ===
                'warning' && (

                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />

              )}


              {toast.type ===
                'info' && (

                <Activity className="w-4 h-4 text-info shrink-0 mt-0.5" />

              )}


              <div className="flex-1 min-w-0">

                <div className="font-bold text-text">

                  {toast.title}

                </div>


                {toast.message && (

                  <div className="text-muted text-[11px] mt-0.5">

                    {toast.message}

                  </div>

                )}

              </div>


              <button

                onClick={
                  () =>
                    setToasts(
                      previous =>
                        previous.filter(
                          item =>
                            item.id !==
                            toast.id
                        )
                    )
                }

                className="text-muted hover:text-text p-1"
              >

                <X className="w-3.5 h-3.5" />

              </button>

            </div>

          )
        )}

      </div>


      <div className="flex flex-1 min-h-screen">


        {/* SIDEBAR */}

        <aside
          className={`hidden lg:flex flex-col justify-between bg-surface border-r border-border transition-all duration-200 sticky top-0 h-screen z-30 shrink-0 ${
            sidebarCollapsed
              ? 'w-[72px]'
              : 'w-60'
          }`}
        >


          <div>


            <div className="h-16 flex items-center justify-between px-4 border-b border-border">


              <div className="flex items-center gap-2.5 min-w-0">

                <div className="w-9 h-9 rounded-btn bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md shadow-brand-indigo/20">

                  <Cloud className="w-5 h-5 text-slate-950" />

                </div>


                {!sidebarCollapsed && (

                  <div className="min-w-0">

                    <span className="font-extrabold text-sm tracking-tight text-text block truncate">

                      CloudWise

                      <span className="text-brand-cyan">

                        -AI

                      </span>

                    </span>


                    <span className="text-[10px] text-muted block truncate font-mono">

                      FinOps Platform

                    </span>

                  </div>

                )}

              </div>


              <button

                type="button"

                onClick={
                  () =>
                    setSidebarCollapsed(
                      !sidebarCollapsed
                    )
                }

                className="p-1 rounded-btn hover:bg-elevated text-muted hover:text-text transition hidden lg:block"

                title={
                  sidebarCollapsed
                    ? 'Expand Sidebar'
                    : 'Collapse Sidebar'
                }
              >

                {sidebarCollapsed

                  ? (
                    <ChevronRight className="w-4 h-4" />
                  )

                  : (
                    <ChevronLeft className="w-4 h-4" />
                  )
                }

              </button>

            </div>


            <nav
              className="p-3 space-y-1"
              role="tablist"
            >


              {navItems.map(
                item => {


                  const Icon =
                    item.icon;


                  const isActive =
                    activeTab ===
                    item.id;


                  return (

                    <button

                      key={
                        item.id
                      }

                      role="tab"

                      aria-selected={
                        isActive
                      }

                      onClick={
                        () =>
                          setActiveTab(
                            item.id
                          )
                      }

                      className={`w-full flex items-center rounded-btn transition-all duration-150 select-none ${
                        sidebarCollapsed
                          ? 'justify-center py-2.5 px-0'
                          : 'justify-between px-3 py-2 text-xs font-semibold'
                      } ${
                        isActive
                          ? 'bg-elevated text-text shadow-sm border border-border'
                          : 'text-muted hover:text-text hover:bg-elevated/50'
                      }`}

                      title={
                        sidebarCollapsed
                          ? item.label
                          : undefined
                      }
                    >


                      <div className="flex items-center gap-2.5">

                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? 'text-brand-cyan'
                              : 'text-muted'
                          }`}
                        />


                        {!sidebarCollapsed && (

                          <span>

                            {item.label}

                          </span>

                        )}

                      </div>


                      {!sidebarCollapsed &&
                        item.badge !==
                          undefined &&
                        item.badge >
                          0 && (

                        <span className="text-[10px] font-mono px-1.5 rounded-full font-bold bg-elevated text-muted border border-border">

                          {item.badge}

                        </span>

                      )}

                    </button>

                  );
                }
              )}

            </nav>

          </div>


          {/* API STATUS */}

          <div className="p-3 border-t border-border">


            {!sidebarCollapsed ? (

              <div className="p-3 rounded-card bg-elevated/70 border border-border text-xs space-y-2">

                <div className="flex items-center justify-between text-[11px] font-semibold text-text">

                  <span className="flex items-center gap-1.5">

                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />

                    Cloud API Active

                  </span>


                  <span className="font-mono text-muted text-[10px]">

                    v1.0

                  </span>

                </div>


                <div className="text-[10px] text-muted leading-tight">

                  AWS live telemetry with normalized multi-cloud resources.

                </div>

              </div>

            ) : (

              <div className="flex justify-center">

                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />

              </div>

            )}

          </div>

        </aside>


        {/* MAIN AREA */}

        <div className="flex-1 flex flex-col min-w-0">


          {/* HEADER */}

          <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">


            <div className="flex items-center gap-3 min-w-0">

              <div className="w-8 h-8 rounded-btn bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">

                <Cloud className="w-4 h-4 text-slate-950" />

              </div>


              <div className="min-w-0">


                <div className="flex items-center gap-2 flex-wrap">

                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-text">

                    CloudWise

                    <span className="text-brand-cyan">

                      -AI

                    </span>

                  </span>


                  <span className="text-border">

                    |

                  </span>


                  <h1 className="text-sm sm:text-base font-semibold text-text/90 truncate">

                    {activeTab ===
                      'overview' &&
                      'Multi-Cloud FinOps Intelligence'
                    }

                    {activeTab ===
                      'anomalies' &&
                      'Isolation Forest Anomaly Detection'
                    }

                    {activeTab ===
                      'forecast' &&
                      'Prophet Cost Forecasting'
                    }

                    {activeTab ===
                      'recommendations' &&
                      'Autonomous Rightsizing & Savings'
                    }

                    {activeTab ===
                      'resources' &&
                      'Multi-Cloud Asset Inventory'
                    }

                    {activeTab ===
                      'api' &&
                      'REST API & Engine Console'
                    }

                  </h1>

                </div>


                <p className="text-[11px] text-muted hidden sm:block">

                  AWS • Azure • GCP Normalized Observability

                </p>

              </div>

            </div>


            <div className="flex items-center gap-2.5 shrink-0">


              <button

                type="button"

                onClick={
                  () =>
                    setTheme(
                      theme ===
                        'dark'
                        ? 'light'
                        : 'dark'
                    )
                }

                className="p-2 rounded-btn bg-elevated border border-border text-muted hover:text-text transition"
              >

                {theme ===
                  'dark'

                  ? (
                    <Sun className="w-4 h-4 text-warning" />
                  )

                  : (
                    <Moon className="w-4 h-4 text-brand-indigo" />
                  )
                }

              </button>


              <Button

                variant="primary"

                size="sm"

                icon={
                  <Plus className="w-3.5 h-3.5" />
                }

                onClick={
                  () =>
                    setIsAddModalOpen(
                      true
                    )
                }
              >

                <span className="hidden sm:inline">

                  Add Resource

                </span>


                <span className="sm:hidden">

                  Add

                </span>

              </Button>


              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-indigo to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm border border-border">

                FO

              </div>

            </div>

          </header>


          {/* CONTENT */}

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">


            {loading ? (

              <div className="space-y-6">


                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  {[
                    1,
                    2,
                    3,
                    4
                  ].map(
                    number => (

                      <Skeleton
                        key={
                          number
                        }
                        className="h-32"
                      />

                    )
                  )}

                </div>


                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  <Skeleton className="lg:col-span-5 h-72" />

                  <Skeleton className="lg:col-span-7 h-72" />

                </div>

              </div>

            ) : error ? (

              <Card className="p-8 text-center space-y-4 max-w-md mx-auto my-12">

                <AlertCircle className="w-10 h-10 text-danger mx-auto" />

                <h3 className="text-base font-bold text-text">

                  Telemetry Ingestion Error

                </h3>

                <p className="text-xs text-muted leading-relaxed">

                  {error}

                </p>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={
                    loadInitialData
                  }
                >

                  Retry Initialization

                </Button>

              </Card>

            ) : (

              <>


                {activeTab ===
                  'overview' && (

                  <OverviewTab

                    overview={
                      overview
                    }

                    forecast={
                      forecast
                    }

                    anomalies={
                      anomalies
                    }

                    recommendations={
                      recommendations
                    }

                    resources={
                      resources
                    }

                    onNavigateTab={
                      tab =>
                        setActiveTab(
                          tab
                        )
                    }

                    onRunAnalysis={
                      () =>
                        handleRunAnalysis(
                          0.05
                        )
                    }

                    isAnalyzing={
                      analyzing
                    }

                  />

                )}


                {activeTab ===
                  'anomalies' && (

                  <AnomaliesTab

                    anomalies={
                      anomalies
                    }

                    onRefresh={
                      handleRunAnalysis
                    }

                    isLoading={
                      analyzing
                    }

                  />

                )}


                {activeTab ===
                  'forecast' && (

                  <ForecastTab

                    forecast={
                      forecast
                    }

                    historicalCosts={
                      historicalCosts
                    }

                    onUpdatePeriods={
                      handleUpdateForecastPeriods
                    }

                    isLoading={
                      analyzing
                    }

                  />

                )}


                {activeTab ===
                  'recommendations' && (

                  <RecommendationsTab

                    recommendations={
                      recommendations
                    }

                    onApplyOptimization={
                      handleApplyOptimization
                    }

                    onDismissRecommendation={
                      handleDismissRecommendation
                    }

                    onRefresh={
                      () =>
                        handleRunAnalysis(
                          0.05
                        )
                    }

                    isLoading={
                      analyzing
                    }

                  />

                )}


                {activeTab ===
                  'resources' && (

                  <ResourcesTab

                    resources={
                      resources
                    }

                    onOpenAddModal={
                      () =>
                        setIsAddModalOpen(
                          true
                        )
                    }

                    onToggleStatus={
                      handleToggleResourceStatus
                    }

                    onDeleteResource={
                      handleDeleteResource
                    }

                    onRefresh={
                      handleRefreshResources
                    }

                    isRefreshing={
                      refreshingResources
                    }

                  />

                )}


                {activeTab ===
                  'api' && (

                  <ApiConsoleTab />

                )}

              </>

            )}

          </main>

        </div>

      </div>


      {/* MOBILE NAV */}

      <nav

        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-2"

        style={{
          paddingBottom:
            'env(safe-area-inset-bottom, 0px)'
        }}

        role="tablist"
      >


        {navItems
          .slice(
            0,
            5
          )
          .map(
            item => {


              const Icon =
                item.icon;


              const isActive =
                activeTab ===
                item.id;


              return (

                <button

                  key={
                    item.id
                  }

                  role="tab"

                  aria-selected={
                    isActive
                  }

                  onClick={
                    () =>
                      setActiveTab(
                        item.id
                      )
                  }

                  className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-btn text-[10px] font-medium transition min-h-[44px] min-w-[44px] ${
                    isActive
                      ? 'text-brand-cyan font-bold'
                      : 'text-muted'
                  }`}
                >

                  <div className="relative">

                    <Icon className="w-5 h-5 mb-0.5" />


                    {item.badge !==
                      undefined &&
                      item.badge >
                        0 && (

                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-danger" />

                    )}

                  </div>


                  <span className="truncate">

                    {item.label}

                  </span>

                </button>

              );
            }
          )}


        <button

          type="button"

          onClick={
            () =>
              setMobileMoreOpen(
                !mobileMoreOpen
              )
          }

          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-btn text-[10px] font-medium transition min-h-[44px] min-w-[44px] ${
            activeTab ===
              'api'
              ? 'text-brand-cyan font-bold'
              : 'text-muted'
          }`}
        >

          <MoreHorizontal className="w-5 h-5 mb-0.5" />

          <span>

            More

          </span>

        </button>

      </nav>


      {/* MOBILE MORE */}

      {mobileMoreOpen && (

        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm">


          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 shadow-2xl">


            <div className="flex items-center justify-between pb-3 border-b border-border">

              <span className="text-xs font-bold uppercase tracking-wider text-muted">

                Additional Tools

              </span>


              <button

                onClick={
                  () =>
                    setMobileMoreOpen(
                      false
                    )
                }

                className="p-1 rounded-btn hover:bg-elevated text-muted"
              >

                <X className="w-4 h-4" />

              </button>

            </div>


            <button

              type="button"

              onClick={
                () => {

                  setActiveTab(
                    'api'
                  );

                  setMobileMoreOpen(
                    false
                  );
                }
              }

              className="w-full p-3 rounded-btn border bg-elevated/40 border-border text-text flex items-center justify-between text-xs font-semibold"
            >

              <div className="flex items-center gap-2.5">

                <Terminal className="w-4 h-4 text-brand-cyan" />

                <span>

                  REST API &amp; Engine Console

                </span>

              </div>


              <ChevronRight className="w-4 h-4 text-muted" />

            </button>

          </div>

        </div>

      )}


      {/* ADD RESOURCE MODAL */}

      <AddResourceModal

        isOpen={
          isAddModalOpen
        }

        onClose={
          () =>
            setIsAddModalOpen(
              false
            )
        }

        onAdd={
          handleAddResource
        }

      />

    </div>
  );
}


export default App;