import React, { useState, useEffect } from 'react';

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

  Search,

  Plus,

  ChevronLeft,

  ChevronRight,

  Activity,

  User,

  MoreHorizontal,

  X,

  CheckCircle2,

  AlertCircle,

  RefreshCw,

  Zap,

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

import { OverviewTab } from './components/OverviewTab.js';

import { AnomaliesTab } from './components/AnomaliesTab.js';

import { ForecastTab } from './components/ForecastTab.js';

import { RecommendationsTab } from './components/RecommendationsTab.js';

import { ResourcesTab } from './components/ResourcesTab.js';

import { ApiConsoleTab } from './components/ApiConsoleTab.js';

import { AddResourceModal } from './components/AddResourceModal.js';

import { AwsConnectionModal } from './components/AwsConnectionModal.js';

import { Button, Skeleton, Card } from './components/ui/Primitives.js';



export function App() {

  // Theme state: dark by default, respecting prefers-color-scheme on mount

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches) {

      return 'light';

    }

    return 'dark';

  });



  // Global State

  const [activeTab, setActiveTab] = useState<string>('resources');

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  const [mobileMoreOpen, setMobileMoreOpen] = useState<boolean>(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [isAwsModalOpen, setIsAwsModalOpen] = useState<boolean>(false);



  // Data State

  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  const [resources, setResources] = useState<CloudResource[]>([]);

  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const [forecast, setForecast] = useState<Forecast[]>([]);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  const [historicalCosts, setHistoricalCosts] = useState<CostData[]>([]);



  // UI state

  const [loading, setLoading] = useState<boolean>(true);

  const [analyzing, setAnalyzing] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);

  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const [globalSearch, setGlobalSearch] = useState<string>('');

  const [cloudStatus, setCloudStatus] = useState<{

    awsConfigured: boolean;

    region: string;

    isLiveActive: boolean;

    account?: string;

    arn?: string;

    maskedKey?: string | null;

    totalResources?: number;

  }>({
    awsConfigured: false,
    region: 'ap-south-1',
    isLiveActive: false
  });

  const [syncingAws, setSyncingAws] = useState<boolean>(false);



  // Apply theme class to document root

  useEffect(() => {

    const root = document.documentElement;

    if (theme === 'light') {

      root.classList.add('light');

    } else {

      root.classList.remove('light');

    }

  }, [theme]);



  // Toast dispatch helper

  const addToast = (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {

    const id = Math.random().toString(36).substring(2, 9);

    setToasts((prev) => [...prev, { id, type, title, message }]);

    setTimeout(() => {

      setToasts((prev) => prev.filter((t) => t.id !== id));

    }, 4000);

  };



  // Initial Data Load

  const loadInitialData = async () => {

    setLoading(true);

    setError(null);

    try {

      const [resOverview, resResources, resCosts, resStatus] = await Promise.all([

        fetch('/api/ai/overview').then((r) => r.json()),

        fetch('/api/cloud/resources').then((r) => r.json()),

        fetch('/api/ai/dataset/costs').then((r) => r.json()),

        fetch('/api/cloud/status').then((r) => r.json()).catch(() => null),

      ]);



      setOverview(resOverview);

      setResources(resResources);

      setHistoricalCosts(resCosts);

      if (resStatus) {

        setCloudStatus(resStatus);

      }



      // Trigger /ai/analyze once on load

      const analysisRes = await fetch('/ai/analyze', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({}),

      }).then((r) => r.json());



      if (analysisRes) {

        setAnomalies(analysisRes.anomalies || []);

        setForecast(analysisRes.forecast || []);

        setRecommendations(analysisRes.recommendations || []);

      }

    } catch (err: any) {

      console.error('Failed to load CloudWise-AI data:', err);

      setError(err?.message || 'Failed to initialize CloudWise-AI.');

      addToast('error', 'Initialization Error', 'Unable to fetch cloud telemetry metrics.');

    } finally {

      setLoading(false);

    }

  };



  // Trigger Live AWS Sync

  const triggerAwsSync = async (isManual: boolean = true, targetRegion?: string) => {

    setSyncingAws(true);

    try {

      const regionToUse = targetRegion || cloudStatus.region || 'ap-south-1';

      const response = await fetch('/api/cloud/aws/sync', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ region: regionToUse }),

      });



      let res: any;

      try {

        res = await response.json();

      } catch (_jsonErr) {

        const text = await response.text().catch(() => '');

        throw new Error(text || `Server responded with HTTP ${response.status}`);

      }



      if (!response.ok || !res.success) {

        throw new Error(res?.details || res?.error || `HTTP ${response.status} failed`);

      }



      if (res.resources) {

        setResources(res.resources);

      }



      // Refresh overview metrics with new live resources

      const updatedOverview = await fetch('/api/ai/overview').then((r) => r.json()).catch(() => null);

      if (updatedOverview) setOverview(updatedOverview);



      // Re-run AI analysis on the updated inventory

      const analysisRes = await fetch('/ai/analyze', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({}),

      }).then((r) => r.json()).catch(() => null);



      if (analysisRes) {

        setAnomalies(analysisRes.anomalies || []);

        setForecast(analysisRes.forecast || []);

        setRecommendations(analysisRes.recommendations || []);

      }



      setCloudStatus((prev) => ({

        ...prev,

        isLiveActive: true,

        region: res.region || regionToUse,

        account: res.account,

        arn: res.arn

      }));



      if (res.count > 0) {

        addToast(

          'success',

          'Live AWS Connected',

          `Synced ${res.count} live AWS resource(s) (${res.region || regionToUse}).`

        );

      } else {

        addToast(

          'info',

          `AWS Connected (0 supported resources in ${res.region || regionToUse})`,

          'AWS IAM authenticated successfully. If regional resources are in another region, open AWS Settings to switch.'

        );

      }

    } catch (err: any) {

      if (isManual) {

        addToast(

          'error',

          'AWS Sync Error',

          err?.message || 'Check your AWS credentials in .env and restart dev server.'

        );

      }

    } finally {

      setSyncingAws(false);

    }

  };



  // Restore simulated dataset

  const handleResetMock = async () => {

    try {

      const res = await fetch('/api/cloud/reset-mock', { method: 'POST' }).then((r) => r.json());

      if (res.resources) {

        setResources(res.resources);

      }

      const updatedOverview = await fetch('/api/ai/overview').then((r) => r.json());

      setOverview(updatedOverview);



      const analysisRes = await fetch('/ai/analyze', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({}),

      }).then((r) => r.json());



      if (analysisRes) {

        setAnomalies(analysisRes.anomalies || []);

        setForecast(analysisRes.forecast || []);

        setRecommendations(analysisRes.recommendations || []);

      }



      setCloudStatus((prev) => ({ ...prev, isLiveActive: false }));

      addToast('info', 'Demo Dataset Active', 'Switched back to simulated multi-cloud dataset.');

    } catch (err: any) {

      addToast('error', 'Reset Error', err?.message || 'Failed to reset dataset.');

    }

  };



  useEffect(() => {

    loadInitialData();

  }, []);



  // Auto-refresh live AWS inventory while the dashboard remains open.
  // This polls the same backend sync used by the manual "Sync AWS" button,
  // so every AWS collector currently registered in awsCollector.ts
  // (EC2, S3, Lambda, and future services) is refreshed together.
  useEffect(() => {

    if (
      !cloudStatus.awsConfigured &&
      !cloudStatus.isLiveActive
    ) {
      return;
    }


    let cancelled = false;


    const refreshAwsInventory =
      async () => {

        try {

          const regionToUse =
            cloudStatus.region ||
            'ap-south-1';


          const response =
            await fetch(
              '/api/cloud/aws/sync',
              {
                method: 'POST',

                headers: {
                  'Content-Type':
                    'application/json'
                },

                body:
                  JSON.stringify({
                    region:
                      regionToUse
                  })
              }
            );


          const result =
            await response
              .json()
              .catch(
                () => null
              );


          if (
            cancelled ||
            !response.ok ||
            !result?.success
          ) {
            return;
          }


          if (
            Array.isArray(
              result.resources
            )
          ) {

            setResources(
              result.resources
            );
          }


          setCloudStatus(
            (prev) => ({
              ...prev,

              awsConfigured:
                true,

              isLiveActive:
                true,

              region:
                result.region ||
                regionToUse,

              account:
                result.account ??
                prev.account,

              arn:
                result.arn ??
                prev.arn
            })
          );


          /*
           * Keep the overview reasonably fresh without
           * re-running the heavier AI/anomaly pipeline
           * every 30 seconds.
           */
          const updatedOverview =
            await fetch(
              '/api/ai/overview'
            )
              .then(
                (r) =>
                  r.ok
                    ? r.json()
                    : null
              )
              .catch(
                () => null
              );


          if (
            !cancelled &&
            updatedOverview
          ) {

            setOverview(
              updatedOverview
            );
          }


          console.log(
            `[CloudWise-AI] Auto AWS refresh: ${result.count ?? 0} live resource(s).`
          );

        } catch (err) {

          /*
           * Background polling should never interrupt
           * the dashboard or spam the user with toasts.
           */
          console.warn(
            '[CloudWise-AI] Background AWS refresh failed:',
            err
          );
        }
      };


    /*
     * The backend already performs one AWS sync on startup.
     * Therefore we wait 30 seconds before the first browser poll.
     */
    const intervalId =
      window.setInterval(
        refreshAwsInventory,
        30000
      );


    return () => {

      cancelled =
        true;

      window.clearInterval(
        intervalId
      );
    };

  }, [
    cloudStatus.awsConfigured,
    cloudStatus.isLiveActive,
    cloudStatus.region
  ]);



  // Re-run AI Analysis

  const handleRunAnalysis = async (contamination: number = 0.05) => {

    setAnalyzing(true);

    try {

      const analysisRes = await fetch('/ai/analyze', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ contamination }),

      }).then((r) => r.json());



      if (analysisRes) {

        setAnomalies(analysisRes.anomalies || []);

        setForecast(analysisRes.forecast || []);

        setRecommendations(analysisRes.recommendations || []);

      }



      const updatedOverview = await fetch('/api/ai/overview').then((r) => r.json());

      setOverview(updatedOverview);

      addToast('success', 'Analysis Completed', 'Evaluated multi-cloud resources and recomputed savings.');

    } catch (err: any) {

      addToast('error', 'Analysis Failed', err.message);

    } finally {

      setAnalyzing(false);

    }

  };



  // Toggle Resource Status (Start / Stop)

  const handleToggleResourceStatus = async (resource: CloudResource) => {

    const nextStatus = resource.status === 'running' ? 'stopped' : 'running';

    const isLiveAws = resource.provider === 'AWS' && resource.id.startsWith('i-');



    if (isLiveAws) {

      addToast(

        'info',

        `${nextStatus === 'stopped' ? 'Stopping' : 'Starting'} AWS Instance`,

        `Sending ${nextStatus === 'stopped' ? 'ec2:StopInstances' : 'ec2:StartInstances'} to AWS for ${resource.id}...`

      );

    }



    try {

      const response = await fetch(`/api/cloud/resources/${resource.id}`, {

        method: 'PATCH',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({

          status: nextStatus,

          cpu_utilization: nextStatus === 'stopped' ? 0 : 45,

          cost_usd: nextStatus === 'stopped' ? 0.05 : resource.cost_usd,

        }),

      });



      const updated = await response.json().catch(() => null);



      if (!response.ok || !updated || updated.error) {

        throw new Error(updated?.error || updated?.details || `Failed to ${nextStatus} resource (HTTP ${response.status})`);

      }



      setResources((prev) => prev.map((r) => (r.id === resource.id ? updated : r)));



      if (isLiveAws) {

        addToast(

          'success',

          `AWS EC2 Command Executed`,

          `AWS confirmed instance ${resource.id} is now ${updated.awsState?.currentState || nextStatus}.`

        );

      } else {

        addToast('success', 'Resource Updated', `Switched ${resource.name} to ${nextStatus}.`);

      }



      await handleRunAnalysis();

    } catch (err: any) {

      addToast('error', isLiveAws ? 'AWS Command Failed' : 'Update Failed', err.message);

    }

  };



  // Delete Resource

  const handleDeleteResource = async (id: string) => {

    try {

      const response = await fetch(`/api/cloud/resources/${id}`, { method: 'DELETE' });

      const res = await response.json().catch(() => null);

      if (!response.ok || (res && res.error)) {

        throw new Error(res?.error || `Failed to delete resource`);

      }

      setResources((prev) => prev.filter((r) => r.id !== id));

      addToast('info', 'Resource Removed', `Asset ${id} removed from FinOps catalog.`);

      await handleRunAnalysis();

    } catch (err: any) {

      addToast('error', 'Delete Failed', err.message);

    }

  };



  // Add Resource

  const handleAddResource = async (newRes: any) => {

    try {

      const created = await fetch('/api/cloud/resources', {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify(newRes),

      }).then((r) => r.json());



      setResources((prev) => [created, ...prev]);

      addToast('success', 'Asset Registered', `Successfully added ${created.name} (${created.provider}).`);

      await handleRunAnalysis();

    } catch (err: any) {

      addToast('error', 'Registration Failed', err.message);

    }

  };



  // Apply Optimization Recommendation

  const handleApplyOptimization = async (resourceId: string, optType: string) => {

    try {

      if (optType === 'IDLE_RECLAIM') {

        // Terminate resource completely

        await fetch(`/api/cloud/resources/${resourceId}`, {

          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({ cost_usd: 0, monthly_cost: 0, status: 'stopped' }),

        });

        addToast('success', 'Idle Reclaim Executed', `Eliminated idle charges on ${resourceId}.`);

      } else if (optType === 'RIGHT_SIZING') {

        const targetRes = resources.find((r) => r.id === resourceId);

        const currentCost = targetRes ? targetRes.cost_usd : 0.25;

        await fetch(`/api/cloud/resources/${resourceId}`, {

          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({

            cost_usd: Math.round(currentCost * 0.7 * 100) / 100,

            cpu_utilization: 45,

          }),

        });

        addToast('success', 'Downsizing Applied', `Downsized ${resourceId} (-30% run-rate).`);

      } else if (optType === 'STORAGE_CLEANUP') {

        await fetch(`/api/cloud/resources/${resourceId}`, {

          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({ storage_utilization: 55 }),

        });

        addToast('success', 'Disk Hygiene Completed', `Purged snapshots on ${resourceId}.`);

      } else if (optType === 'SCALE_UP_REQUIRED') {

        await fetch(`/api/cloud/resources/${resourceId}`, {

          method: 'PATCH',

          headers: { 'Content-Type': 'application/json' },

          body: JSON.stringify({ cpu_utilization: 50, memory_utilization: 55 }),

        });

        addToast('info', 'Instance Resized', `Scaled compute capacity for ${resourceId}.`);

      }



      await handleRunAnalysis();

    } catch (err: any) {

      addToast('error', 'Execution Error', err.message);

    }

  };



  // Dismiss Recommendation

  const handleDismissRecommendation = (resourceId: string) => {

    setRecommendations((prev) => prev.filter((r) => r.resource_id !== resourceId));

    addToast('info', 'Recommendation Dismissed', `Muted action on ${resourceId}.`);

  };



  // Update Forecast Periods & Provider

  const handleUpdateForecastPeriods = async (periods: number, provider?: string) => {

    try {

      const url = provider && provider !== 'All' ? `/ai/forecast?provider=${provider}` : '/ai/forecast';

      const res = await fetch(url, {

        method: 'POST',

        headers: { 'Content-Type': 'application/json' },

        body: JSON.stringify({ periods, provider }),

      }).then((r) => r.json());



      if (res.forecast) {

        setForecast(res.forecast);

      }

    } catch (err: any) {

      addToast('error', 'Forecast Update Error', err.message);

    }

  };



  const navItems = [

    { id: 'overview', label: 'Overview', icon: LayoutDashboard },

    {

      id: 'anomalies',

      label: 'Anomalies',

      icon: AlertTriangle,

      badge: anomalies.filter((a) => a.anomaly).length,

    },

    { id: 'forecast', label: 'Cost Forecast', icon: TrendingUp },

    {

      id: 'recommendations',

      label: 'Rightsizing',

      icon: TrendingDown,

      badge: recommendations.filter((r) => r.priority === 'HIGH').length,

    },

    { id: 'resources', label: 'Resources', icon: Server, badge: resources.length },

    { id: 'api', label: 'API Console', icon: Terminal },

  ];



  return (

    <div className="min-h-screen bg-bg text-text flex flex-col font-sans transition-colors duration-200">

      {/* Toast Notification Container */}

      <div className="fixed top-4 right-4 sm:top-auto sm:bottom-6 sm:right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4 sm:px-0">

        {toasts.map((toast) => (

          <div

            key={toast.id}

            role="status"

            aria-live="polite"

            className="pointer-events-auto bg-surface border border-border rounded-btn p-3 shadow-2xl flex items-start gap-2.5 text-xs animate-in slide-in-from-top-2 sm:slide-in-from-bottom-2 duration-150"

          >

            {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />}

            {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />}

            {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />}

            {toast.type === 'info' && <Activity className="w-4 h-4 text-info shrink-0 mt-0.5" />}

            <div className="flex-1 min-w-0">

              <div className="font-bold text-text">{toast.title}</div>

              {toast.message && <div className="text-muted text-[11px] mt-0.5">{toast.message}</div>}

            </div>

            <button

              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}

              className="text-muted hover:text-text p-1"

            >

              <X className="w-3.5 h-3.5" />

            </button>

          </div>

        ))}

      </div>



      <div className="flex flex-1 min-h-screen">

        {/* Desktop Fixed Left Sidebar (>=1024px) / Collapsible Rail */}

        <aside

          className={`hidden lg:flex flex-col justify-between bg-surface border-r border-border transition-all duration-200 sticky top-0 h-screen z-30 shrink-0 ${

            sidebarCollapsed ? 'w-[72px]' : 'w-60'

          }`}

        >

          {/* Top Brand Section */}

          <div>

            <div className="h-16 flex items-center justify-between px-4 border-b border-border">

              <div className="flex items-center gap-2.5 min-w-0">

                <div className="w-9 h-9 rounded-btn bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-md shadow-brand-indigo/20">

                  <Cloud className="w-5 h-5 text-slate-950" />

                </div>

                {!sidebarCollapsed && (

                  <div className="min-w-0">

                    <span className="font-extrabold text-sm tracking-tight text-text block truncate">

                      CloudWise<span className="text-brand-cyan">-AI</span>

                    </span>

                    <span className="text-[10px] text-muted block truncate font-mono">

                      FinOps Platform

                    </span>

                  </div>

                )}

              </div>



              {/* Collapse button */}

              <button

                type="button"

                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}

                className="p-1 rounded-btn hover:bg-elevated text-muted hover:text-text transition hidden lg:block"

                title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}

              >

                {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}

              </button>

            </div>



            {/* Navigation links */}

            <nav className="p-3 space-y-1" role="tablist">

              {navItems.map((item) => {

                const Icon = item.icon;

                const isActive = activeTab === item.id;

                return (

                  <button

                    key={item.id}

                    role="tab"

                    aria-selected={isActive}

                    onClick={() => setActiveTab(item.id)}

                    className={`w-full flex items-center rounded-btn transition-all duration-150 select-none ${

                      sidebarCollapsed

                        ? 'justify-center py-2.5 px-0'

                        : 'justify-between px-3 py-2 text-xs font-semibold'

                    } ${

                      isActive

                        ? 'bg-elevated text-text shadow-sm border border-border'

                        : 'text-muted hover:text-text hover:bg-elevated/50'

                    }`}

                    title={sidebarCollapsed ? item.label : undefined}

                  >

                    <div className="flex items-center gap-2.5">

                      <Icon

                        className={`w-4 h-4 shrink-0 ${

                          isActive ? 'text-brand-cyan' : 'text-muted'

                        }`}

                      />

                      {!sidebarCollapsed && <span>{item.label}</span>}

                    </div>



                    {!sidebarCollapsed && item.badge !== undefined && item.badge > 0 && (

                      <span

                        className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${

                          item.id === 'anomalies'

                            ? 'bg-warning/20 text-warning border border-warning/30'

                            : item.id === 'recommendations'

                            ? 'bg-danger/20 text-danger border border-danger/30'

                            : 'bg-elevated text-muted border border-border'

                        }`}

                      >

                        {item.badge}

                      </span>

                    )}

                  </button>

                );

              })}

            </nav>

          </div>



          {/* Footer Card: API Status indicator */}

          <div className="p-3 border-t border-border">

            {!sidebarCollapsed ? (

              <div className="p-3 rounded-card bg-elevated/70 border border-border text-xs space-y-2">

                <div className="flex items-center justify-between text-[11px] font-semibold text-text">

                  <span className="flex items-center gap-1.5">

                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />

                    FastAPI Engine Active

                  </span>

                  <span className="font-mono text-muted text-[10px]">v1.0</span>

                </div>

                <div className="text-[10px] text-muted leading-tight">

                  Normalized telemetry across AWS, Azure, and Google Cloud.

                </div>

              </div>

            ) : (

              <div className="flex justify-center" title="API Status: Healthy">

                <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />

              </div>

            )}

          </div>

        </aside>



        {/* Main Content Area */}

        <div className="flex-1 flex flex-col min-w-0">

          {/* Sticky Top Header */}

          <header className="sticky top-0 z-20 bg-surface/85 backdrop-blur-md border-b border-border h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">

            {/* Left: Brand & Page Title */}

            <div className="flex items-center gap-3 min-w-0">

              <div className="w-8 h-8 rounded-btn bg-gradient-to-tr from-brand-indigo to-brand-cyan flex items-center justify-center text-slate-950 font-bold shrink-0 shadow-sm">

                <Cloud className="w-4 h-4 text-slate-950" />

              </div>



              <div className="min-w-0">

                <div className="flex items-center gap-2 flex-wrap">

                  <span className="font-extrabold text-base sm:text-lg tracking-tight text-text">

                    CloudWise<span className="text-brand-cyan">-AI</span>

                  </span>

                  <span className="text-border">|</span>

                  <h1 className="text-sm sm:text-base font-semibold text-text/90 truncate">

                    {activeTab === 'overview' && 'Multi-Cloud FinOps Intelligence'}

                    {activeTab === 'anomalies' && 'Isolation Forest Anomaly Detection'}

                    {activeTab === 'forecast' && 'Prophet Cost Forecasting'}

                    {activeTab === 'recommendations' && 'Autonomous Rightsizing & Savings'}

                    {activeTab === 'resources' && 'Multi-Cloud Asset Inventory'}

                    {activeTab === 'api' && 'REST API & Engine Console'}

                  </h1>

                </div>

                <p className="text-[11px] text-muted hidden sm:block">

                  AWS • Azure • GCP Normalized Observability

                </p>

              </div>

            </div>



            {/* Right: Actions, Theme Toggle, Primary Add Resource */}

            <div className="flex items-center gap-2 shrink-0">

              {/* Live AWS Connector Button & Status */}

              {cloudStatus.isLiveActive ? (

                <div className="flex items-center gap-1.5">

                  <button

                    type="button"

                    onClick={() => setIsAwsModalOpen(true)}

                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-btn bg-success/15 hover:bg-success/25 border border-success/30 text-success text-[11px] font-semibold transition cursor-pointer"

                    title="AWS Connected. Click to configure regions or view IAM account details."

                  >

                    <span className="w-2 h-2 rounded-full bg-success animate-pulse" />

                    <span>AWS: {cloudStatus.region}</span>

                  </button>

                  <button

                    type="button"

                    onClick={() => triggerAwsSync(true)}

                    disabled={syncingAws}

                    className="px-2.5 py-1.5 rounded-btn bg-elevated hover:bg-surface border border-border text-xs font-medium text-text flex items-center gap-1.5 transition disabled:opacity-50"

                    title="Refresh live AWS inventory"

                  >

                    <RefreshCw className={`w-3.5 h-3.5 text-brand-cyan ${syncingAws ? 'animate-spin' : ''}`} />

                    <span className="hidden sm:inline">{syncingAws ? 'Syncing...' : 'Sync AWS'}</span>

                  </button>

                  <button

                    type="button"

                    onClick={handleResetMock}

                    className="px-2 py-1 rounded-btn hover:bg-elevated text-[11px] text-muted hover:text-text transition hidden lg:inline-block border border-transparent hover:border-border"

                    title="Switch back to simulated multi-cloud dataset"

                  >

                    Demo Data

                  </button>

                </div>

              ) : (

                <div className="flex items-center gap-1.5">

                  <button

                    type="button"

                    onClick={() => setIsAwsModalOpen(true)}

                    className="px-2.5 py-1.5 rounded-btn bg-[#FF9900]/15 hover:bg-[#FF9900]/25 border border-[#FF9900]/40 text-xs font-semibold text-[#FF9900] flex items-center gap-1.5 transition shadow-sm cursor-pointer"

                    title="Configure AWS Region, test IAM access, or sync live AWS resources"

                  >

                    <Zap className="w-3.5 h-3.5 text-[#FF9900]" />

                    <span>AWS Live Sync</span>

                  </button>

                </div>

              )}



              {/* Theme Toggle (Light / Dark) */}

              <button

                type="button"

                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}

                className="p-2 rounded-btn bg-elevated border border-border text-muted hover:text-text transition"

                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}

                aria-label="Toggle color theme"

              >

                {theme === 'dark' ? <Sun className="w-4 h-4 text-warning" /> : <Moon className="w-4 h-4 text-brand-indigo" />}

              </button>



              {/* Add Resource Primary Button */}

              <Button

                variant="primary"

                size="sm"

                icon={<Plus className="w-3.5 h-3.5" />}

                onClick={() => setIsAddModalOpen(true)}

              >

                <span className="hidden sm:inline">Add Resource</span>

                <span className="sm:hidden">Add</span>

              </Button>



              {/* User Avatar Menu placeholder */}

              <div

                className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-indigo to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm border border-border"

                title="FinOps Admin"

              >

                FO

              </div>

            </div>

          </header>



          {/* Body Content */}

          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12">

            {loading ? (

              <div className="space-y-6">

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

                  {[1, 2, 3, 4].map((i) => (

                    <Skeleton key={i} className="h-32" />

                  ))}

                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  <Skeleton className="lg:col-span-5 h-72" />

                  <Skeleton className="lg:col-span-7 h-72" />

                </div>

              </div>

            ) : error ? (

              <Card className="p-8 text-center space-y-4 max-w-md mx-auto my-12">

                <AlertCircle className="w-10 h-10 text-danger mx-auto" />

                <h3 className="text-base font-bold text-text">Telemetry Ingestion Error</h3>

                <p className="text-xs text-muted leading-relaxed">{error}</p>

                <Button variant="primary" size="sm" onClick={loadInitialData}>

                  Retry Initialization

                </Button>

              </Card>

            ) : (

              <>

                {activeTab === 'overview' && (

                  <OverviewTab

                    overview={overview}

                    forecast={forecast}

                    anomalies={anomalies}

                    recommendations={recommendations}

                    resources={resources}

                    onNavigateTab={(t) => setActiveTab(t)}

                    onRunAnalysis={() => handleRunAnalysis(0.05)}

                    isAnalyzing={analyzing}

                  />

                )}



                {activeTab === 'anomalies' && (

                  <AnomaliesTab

                    anomalies={anomalies}

                    onRefresh={handleRunAnalysis}

                    isLoading={analyzing}

                  />

                )}



                {activeTab === 'forecast' && (

                  <ForecastTab

                    forecast={forecast}

                    historicalCosts={historicalCosts}

                    onUpdatePeriods={handleUpdateForecastPeriods}

                    isLoading={analyzing}

                  />

                )}



                {activeTab === 'recommendations' && (

                  <RecommendationsTab

                    recommendations={recommendations}

                    onApplyOptimization={handleApplyOptimization}

                    onDismissRecommendation={handleDismissRecommendation}

                    onRefresh={() => handleRunAnalysis(0.05)}

                    isLoading={analyzing}

                  />

                )}



                {activeTab === 'resources' && (

                  <ResourcesTab

                    resources={resources}

                    onOpenAddModal={() => setIsAddModalOpen(true)}

                    onToggleStatus={handleToggleResourceStatus}

                    onDeleteResource={handleDeleteResource}

                  />

                )}



                {activeTab === 'api' && <ApiConsoleTab />}

              </>

            )}

          </main>

        </div>

      </div>



      {/* Mobile Bottom Navigation Bar (<1024px) */}

      <nav

        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around h-16 px-2"

        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}

        role="tablist"

      >

        {navItems.slice(0, 5).map((item) => {

          const Icon = item.icon;

          const isActive = activeTab === item.id;

          return (

            <button

              key={item.id}

              role="tab"

              aria-selected={isActive}

              onClick={() => setActiveTab(item.id)}

              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-btn text-[10px] font-medium transition min-h-[44px] min-w-[44px] ${

                isActive ? 'text-brand-cyan font-bold' : 'text-muted'

              }`}

            >

              <div className="relative">

                <Icon className="w-5 h-5 mb-0.5" />

                {item.badge !== undefined && item.badge > 0 && (

                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-danger" />

                )}

              </div>

              <span className="truncate">{item.label}</span>

            </button>

          );

        })}



        {/* Mobile "More" Sheet trigger (e.g. for API console) */}

        <button

          type="button"

          onClick={() => setMobileMoreOpen(!mobileMoreOpen)}

          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-btn text-[10px] font-medium transition min-h-[44px] min-w-[44px] ${

            activeTab === 'api' ? 'text-brand-cyan font-bold' : 'text-muted'

          }`}

        >

          <MoreHorizontal className="w-5 h-5 mb-0.5" />

          <span>More</span>

        </button>

      </nav>



      {/* Mobile "More" Bottom Sheet */}

      {mobileMoreOpen && (

        <div className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">

          <div className="w-full bg-surface border-t border-border rounded-t-2xl p-5 space-y-4 shadow-2xl">

            <div className="flex items-center justify-between pb-3 border-b border-border">

              <span className="text-xs font-bold uppercase tracking-wider text-muted">

                Additional Tools

              </span>

              <button

                onClick={() => setMobileMoreOpen(false)}

                className="p-1 rounded-btn hover:bg-elevated text-muted"

              >

                <X className="w-4 h-4" />

              </button>

            </div>



            <div className="space-y-2">

              <button

                type="button"

                onClick={() => {

                  setActiveTab('api');

                  setMobileMoreOpen(false);

                }}

                className={`w-full p-3 rounded-btn border flex items-center justify-between text-xs font-semibold ${

                  activeTab === 'api'

                    ? 'bg-elevated border-brand-cyan text-brand-cyan'

                    : 'bg-elevated/40 border-border text-text'

                }`}

              >

                <div className="flex items-center gap-2.5">

                  <Terminal className="w-4 h-4 text-brand-cyan" />

                  <span>REST API &amp; Engine Console</span>

                </div>

                <ChevronRight className="w-4 h-4 text-muted" />

              </button>

            </div>

          </div>

        </div>

      )}



      {/* Add Resource Modal / Sheet */}

      <AddResourceModal

        isOpen={isAddModalOpen}

        onClose={() => setIsAddModalOpen(false)}

        onAdd={handleAddResource}

      />



      {/* AWS Connection & Diagnostics Modal */}

      <AwsConnectionModal

        isOpen={isAwsModalOpen}

        onClose={() => setIsAwsModalOpen(false)}

        cloudStatus={cloudStatus}

        onSync={async (reg) => {

          await triggerAwsSync(true, reg);

          setIsAwsModalOpen(false);

        }}

        onResetMock={async () => {

          await handleResetMock();

          setIsAwsModalOpen(false);

        }}

        syncing={syncingAws}

      />

    </div>

  );

}



export default App;
