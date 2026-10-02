export interface CloudResource {
  id: string;
  name: string;
  provider: 'AWS' | 'Azure' | 'GCP';
  resource_type: string;
  region: string;
  status: 'running' | 'stopped' | 'attached';
  cpu_utilization: number;
  memory_utilization: number;
  storage_utilization: number;
  network_in_mb: number;
  network_out_mb: number;
  cost_usd: number;
  monthly_cost: number;
  anomaly_type?: string;
  instance_type?: string;
  created_at?: string;
}

export interface Anomaly {
  timestamp: string;
  cloud: string;
  resource_id: string;
  resource_type: string;
  cpu_utilization: number;
  anomaly: boolean;
  anomaly_score: number;
  anomaly_type?: string;
  memory_utilization?: number;
  storage_utilization?: number;
  network_in_mb?: number;
  network_out_mb?: number;
  cost_usd?: number;
  status?: string;
}

export interface Forecast {
  date: string;
  predicted_cost: number;
  lower_bound: number;
  upper_bound: number;
}

export interface Recommendation {
  resource_id: string;
  resource_type: string;
  recommendation: string;
  reason: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  optimization_type?: string;
  optimization_action?: string;
  estimated_saving_usd?: number;
}

export interface MetricData {
  timestamp: string;
  cloud: 'AWS' | 'Azure' | 'GCP' | string;
  resource_id: string;
  resource_type: string;
  cpu_utilization: number;
  memory_utilization?: number;
  storage_utilization?: number;
  network_in_mb?: number;
  network_out_mb?: number;
  cost_usd?: number;
  status?: string;
}

export interface CostData {
  date: string;
  cloud: 'AWS' | 'Azure' | 'GCP' | string;
  total_cost: number;
}

export interface ResourceData {
  resource_id: string;
  resource_type: string;
  cpu_utilization: number;
  total_cost: number;
  memory_utilization?: number;
  storage_utilization?: number;
  status?: string;
}

export interface AnalysisResponse {
  anomalies: Anomaly[];
  forecast: Forecast[];
  recommendations: Recommendation[];
}

export interface DashboardOverview {
  totalMonthlySpend: number;
  totalPredictedSavings: number;
  totalResourcesCount: number;
  runningResourcesCount: number;
  stoppedResourcesCount: number;
  activeAnomaliesCount: number;
  highPriorityRecommendationsCount: number;
  forecastNextMonth: number;
  spendDeltaPercent: number;
  savingsDeltaPercent: number;
  cloudSpendBreakdown: {
    AWS: number;
    Azure: number;
    GCP: number;
  };
  resourceTypeSpend: {
    type: string;
    amount: number;
    percentage: number;
  }[];
}

export interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
