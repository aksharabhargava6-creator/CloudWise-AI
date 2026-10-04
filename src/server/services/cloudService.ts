import { CloudResource, MetricData, CostData, ResourceData, DashboardOverview } from '../../types/cloudwise.js';

const initialResourcesStore: CloudResource[] = [
  // 1. AWS EC2 - high_cpu_and_traffic anomaly
  {
    id: 'res-aws-01',
    name: 'prod-api-gateway-01',
    provider: 'AWS',
    resource_type: 'EC2',
    region: 'us-east-1',
    status: 'running',
    instance_type: 'c6g.2xlarge',
    cpu_utilization: 88.4,
    memory_utilization: 74.2,
    storage_utilization: 62.0,
    network_in_mb: 940.5,
    network_out_mb: 810.2,
    cost_usd: 0.342,
    monthly_cost: 246.24,
    anomaly_type: 'high_cpu_and_traffic',
    created_at: '2026-04-12T08:00:00Z',
  },
  // 2. AWS EC2 - stopped_with_cost anomaly (idle stopped compute instance)
  {
    id: 'res-aws-02',
    name: 'staging-qa-worker',
    provider: 'AWS',
    resource_type: 'EC2',
    region: 'us-east-1',
    status: 'stopped',
    instance_type: 'm5.2xlarge',
    cpu_utilization: 0.0,
    memory_utilization: 0.0,
    storage_utilization: 78.4,
    network_in_mb: 0.0,
    network_out_mb: 0.0,
    cost_usd: 0.384,
    monthly_cost: 276.48,
    anomaly_type: 'stopped_with_cost',
    created_at: '2026-03-10T14:30:00Z',
  },
  // 3. AWS EC2 - underutilized (overprovisioned compute <15% CPU)
  {
    id: 'res-aws-03',
    name: 'batch-indexer-master',
    provider: 'AWS',
    resource_type: 'EC2',
    region: 'us-west-2',
    status: 'running',
    instance_type: 'r6g.xlarge',
    cpu_utilization: 7.8,
    memory_utilization: 16.5,
    storage_utilization: 34.0,
    network_in_mb: 48.2,
    network_out_mb: 32.1,
    cost_usd: 0.252,
    monthly_cost: 181.44,
    anomaly_type: 'underutilized',
    created_at: '2026-05-18T09:15:00Z',
  },
  // 4. AWS RDS - normal nominal
  {
    id: 'res-aws-04',
    name: 'aurora-cluster-writer',
    provider: 'AWS',
    resource_type: 'RDS',
    region: 'us-east-1',
    status: 'running',
    instance_type: 'db.r6g.2xlarge',
    cpu_utilization: 52.4,
    memory_utilization: 68.1,
    storage_utilization: 64.8,
    network_in_mb: 420.0,
    network_out_mb: 395.0,
    cost_usd: 0.580,
    monthly_cost: 417.60,
    created_at: '2026-01-15T00:00:00Z',
  },
  // 5. AWS EBS - storage_pressure anomaly (>=90%)
  {
    id: 'res-aws-05',
    name: 'log-retention-vol-01',
    provider: 'AWS',
    resource_type: 'EBS',
    region: 'us-east-1',
    status: 'attached',
    instance_type: 'gp3 4TB',
    cpu_utilization: 14.2,
    memory_utilization: 22.0,
    storage_utilization: 94.8,
    network_in_mb: 140.0,
    network_out_mb: 95.0,
    cost_usd: 0.220,
    monthly_cost: 158.40,
    anomaly_type: 'storage_pressure',
    created_at: '2026-06-01T12:00:00Z',
  },
  // 6. AWS Lambda - serverless nominal
  {
    id: 'res-aws-06',
    name: 'auth-jwt-verifier',
    provider: 'AWS',
    resource_type: 'Lambda',
    region: 'us-east-1',
    status: 'running',
    instance_type: '1024MB ARM',
    cpu_utilization: 24.5,
    memory_utilization: 35.0,
    storage_utilization: 12.0,
    network_in_mb: 210.0,
    network_out_mb: 180.0,
    cost_usd: 0.085,
    monthly_cost: 61.20,
    created_at: '2026-07-20T10:00:00Z',
  },
  // 7. AWS EC2 - normal
  {
    id: 'res-aws-07',
    name: 'web-server-01',
    provider: 'AWS',
    resource_type: 'EC2',
    region: 'ap-south-1',
    status: 'running',
    instance_type: 't3.xlarge',
    cpu_utilization: 46.5,
    memory_utilization: 52.3,
    storage_utilization: 61.2,
    network_in_mb: 812.4,
    network_out_mb: 489.1,
    cost_usd: 0.214,
    monthly_cost: 154.08,
    created_at: '2026-06-15T08:00:00Z',
  },
  // 8. AWS RDS - replica
  {
    id: 'res-aws-08',
    name: 'aurora-cluster-replica-1',
    provider: 'AWS',
    resource_type: 'RDS',
    region: 'us-west-2',
    status: 'running',
    instance_type: 'db.r6g.xlarge',
    cpu_utilization: 38.0,
    memory_utilization: 56.4,
    storage_utilization: 63.5,
    network_in_mb: 290.0,
    network_out_mb: 310.0,
    cost_usd: 0.290,
    monthly_cost: 208.80,
    created_at: '2026-02-10T16:00:00Z',
  },

  // 9. Azure VM - high_utilization anomaly (>=90% CPU, >=85% Mem)
  {
    id: 'res-az-01',
    name: 'eu-data-pipeline-node',
    provider: 'Azure',
    resource_type: 'Virtual Machine',
    region: 'westeurope',
    status: 'running',
    instance_type: 'Standard D8s v5',
    cpu_utilization: 93.6,
    memory_utilization: 91.2,
    storage_utilization: 76.5,
    network_in_mb: 720.0,
    network_out_mb: 680.0,
    cost_usd: 0.440,
    monthly_cost: 316.80,
    anomaly_type: 'high_utilization',
    created_at: '2026-06-25T11:00:00Z',
  },
  // 10. Azure VM - stopped_with_cost anomaly
  {
    id: 'res-az-02',
    name: 'dev-environment-vm3',
    provider: 'Azure',
    resource_type: 'Virtual Machine',
    region: 'eastus',
    status: 'stopped',
    instance_type: 'Standard E4s v3',
    cpu_utilization: 0.0,
    memory_utilization: 0.0,
    storage_utilization: 45.0,
    network_in_mb: 0.0,
    network_out_mb: 0.0,
    cost_usd: 0.280,
    monthly_cost: 201.60,
    anomaly_type: 'stopped_with_cost',
    created_at: '2026-05-02T13:45:00Z',
  },
  // 11. Azure VM - underutilized (<15% CPU)
  {
    id: 'res-az-03',
    name: 'internal-hr-portal',
    provider: 'Azure',
    resource_type: 'Virtual Machine',
    region: 'eastus',
    status: 'running',
    instance_type: 'Standard D4s v4',
    cpu_utilization: 9.2,
    memory_utilization: 18.4,
    storage_utilization: 32.0,
    network_in_mb: 35.0,
    network_out_mb: 22.0,
    cost_usd: 0.220,
    monthly_cost: 158.40,
    anomaly_type: 'underutilized',
    created_at: '2026-07-04T10:15:00Z',
  },
  // 12. Azure SQL - normal
  {
    id: 'res-az-04',
    name: 'database-01',
    provider: 'Azure',
    resource_type: 'SQL Database',
    region: 'centralindia',
    status: 'running',
    instance_type: 'General Purpose 8 vCore',
    cpu_utilization: 38.4,
    memory_utilization: 64.0,
    storage_utilization: 68.5,
    network_in_mb: 460.2,
    network_out_mb: 310.5,
    cost_usd: 0.274,
    monthly_cost: 197.28,
    created_at: '2026-06-10T12:00:00Z',
  },
  // 13. Azure Managed Disk - storage_pressure (>=90%)
  {
    id: 'res-az-05',
    name: 'archive-blob-cache',
    provider: 'Azure',
    resource_type: 'Managed Disk',
    region: 'westeurope',
    status: 'attached',
    instance_type: 'Premium SSD P40',
    cpu_utilization: 8.5,
    memory_utilization: 15.0,
    storage_utilization: 92.4,
    network_in_mb: 95.0,
    network_out_mb: 80.0,
    cost_usd: 0.175,
    monthly_cost: 126.00,
    anomaly_type: 'storage_pressure',
    created_at: '2026-05-15T09:00:00Z',
  },
  // 14. Azure VM - normal web
  {
    id: 'res-az-06',
    name: 'frontend-nginx-edge',
    provider: 'Azure',
    resource_type: 'Virtual Machine',
    region: 'northeurope',
    status: 'running',
    instance_type: 'Standard B2ms',
    cpu_utilization: 42.1,
    memory_utilization: 48.0,
    storage_utilization: 39.0,
    network_in_mb: 510.0,
    network_out_mb: 620.0,
    cost_usd: 0.110,
    monthly_cost: 79.20,
    created_at: '2026-08-01T15:20:00Z',
  },
  // 15. Azure SQL - read replica
  {
    id: 'res-az-07',
    name: 'billing-reports-sql',
    provider: 'Azure',
    resource_type: 'SQL Database',
    region: 'eastus2',
    status: 'running',
    instance_type: 'Standard S4',
    cpu_utilization: 49.5,
    memory_utilization: 58.0,
    storage_utilization: 54.0,
    network_in_mb: 240.0,
    network_out_mb: 280.0,
    cost_usd: 0.205,
    monthly_cost: 147.60,
    created_at: '2026-07-12T14:00:00Z',
  },
  // 16. Azure Managed Disk - attached
  {
    id: 'res-az-08',
    name: 'data-lake-staging-disk',
    provider: 'Azure',
    resource_type: 'Managed Disk',
    region: 'eastus',
    status: 'attached',
    instance_type: 'Standard SSD 1TB',
    cpu_utilization: 12.0,
    memory_utilization: 18.0,
    storage_utilization: 58.0,
    network_in_mb: 110.0,
    network_out_mb: 85.0,
    cost_usd: 0.098,
    monthly_cost: 70.56,
    created_at: '2026-04-18T10:00:00Z',
  },

  // 17. GCP Compute Engine - high_cpu_and_traffic anomaly
  {
    id: 'res-gcp-01',
    name: 'analytics-worker-01',
    provider: 'GCP',
    resource_type: 'Compute Engine',
    region: 'us-central1',
    status: 'running',
    instance_type: 'c2-standard-8',
    cpu_utilization: 94.2,
    memory_utilization: 82.5,
    storage_utilization: 54.0,
    network_in_mb: 1140.8,
    network_out_mb: 980.2,
    cost_usd: 0.385,
    monthly_cost: 277.20,
    anomaly_type: 'high_cpu_and_traffic',
    created_at: '2026-07-01T00:00:00Z',
  },
  // 18. GCP Compute Engine - stopped_with_cost anomaly
  {
    id: 'res-gcp-02',
    name: 'abandoned-ml-training-node',
    provider: 'GCP',
    resource_type: 'Compute Engine',
    region: 'us-west1',
    status: 'stopped',
    instance_type: 'n1-standard-16-v100',
    cpu_utilization: 0.0,
    memory_utilization: 0.0,
    storage_utilization: 68.0,
    network_in_mb: 0.0,
    network_out_mb: 0.0,
    cost_usd: 0.490,
    monthly_cost: 352.80,
    anomaly_type: 'stopped_with_cost',
    created_at: '2026-03-22T17:00:00Z',
  },
  // 19. GCP Compute Engine - underutilized (<15% CPU)
  {
    id: 'res-gcp-03',
    name: 'bastion-host-primary',
    provider: 'GCP',
    resource_type: 'Compute Engine',
    region: 'europe-west1',
    status: 'running',
    instance_type: 'e2-standard-4',
    cpu_utilization: 6.4,
    memory_utilization: 14.8,
    storage_utilization: 22.0,
    network_in_mb: 28.0,
    network_out_mb: 19.0,
    cost_usd: 0.165,
    monthly_cost: 118.80,
    anomaly_type: 'underutilized',
    created_at: '2026-06-18T08:30:00Z',
  },
  // 20. GCP Cloud SQL - normal
  {
    id: 'res-gcp-04',
    name: 'customer-db-primary',
    provider: 'GCP',
    resource_type: 'Cloud SQL',
    region: 'asia-east1',
    status: 'running',
    instance_type: 'db-custom-4-16384',
    cpu_utilization: 52.8,
    memory_utilization: 68.4,
    storage_utilization: 62.0,
    network_in_mb: 520.0,
    network_out_mb: 480.0,
    cost_usd: 0.245,
    monthly_cost: 176.40,
    created_at: '2026-05-10T11:00:00Z',
  },
  // 21. GCP Persistent Disk - storage_pressure (>=90%)
  {
    id: 'res-gcp-05',
    name: 'analytics-scratch-disk',
    provider: 'GCP',
    resource_type: 'Persistent Disk',
    region: 'us-central1',
    status: 'attached',
    instance_type: 'pd-ssd 2TB',
    cpu_utilization: 11.5,
    memory_utilization: 20.0,
    storage_utilization: 93.7,
    network_in_mb: 180.0,
    network_out_mb: 150.0,
    cost_usd: 0.190,
    monthly_cost: 136.80,
    anomaly_type: 'storage_pressure',
    created_at: '2026-06-20T16:00:00Z',
  },
  // 22. GCP Cloud Functions - normal
  {
    id: 'res-gcp-06',
    name: 'webhook-event-sink',
    provider: 'GCP',
    resource_type: 'Compute Engine',
    region: 'us-central1',
    status: 'running',
    instance_type: 'e2-medium',
    cpu_utilization: 34.0,
    memory_utilization: 45.0,
    storage_utilization: 28.0,
    network_in_mb: 340.0,
    network_out_mb: 290.0,
    cost_usd: 0.075,
    monthly_cost: 54.00,
    created_at: '2026-08-05T12:00:00Z',
  },
  // 23. GCP Cloud SQL - replica
  {
    id: 'res-gcp-07',
    name: 'customer-db-read-replica',
    provider: 'GCP',
    resource_type: 'Cloud SQL',
    region: 'europe-west4',
    status: 'running',
    instance_type: 'db-custom-2-8192',
    cpu_utilization: 41.2,
    memory_utilization: 54.0,
    storage_utilization: 61.5,
    network_in_mb: 310.0,
    network_out_mb: 280.0,
    cost_usd: 0.180,
    monthly_cost: 129.60,
    created_at: '2026-06-05T09:00:00Z',
  },
  // 24. GCP Persistent Disk - standard
  {
    id: 'res-gcp-08',
    name: 'backup-snapshot-pool',
    provider: 'GCP',
    resource_type: 'Persistent Disk',
    region: 'us-west1',
    status: 'attached',
    instance_type: 'pd-standard 5TB',
    cpu_utilization: 5.0,
    memory_utilization: 10.0,
    storage_utilization: 64.0,
    network_in_mb: 75.0,
    network_out_mb: 45.0,
    cost_usd: 0.130,
    monthly_cost: 93.60,
    created_at: '2026-04-01T10:00:00Z',
  }
];

let resourcesStore: CloudResource[] = [...initialResourcesStore];
let liveAwsSynced: boolean = false;

// 12 months of per-provider monthly cost history
export const historicalCosts: CostData[] = [
  { date: '2025-11-01', cloud: 'AWS', total_cost: 1420 },
  { date: '2025-11-01', cloud: 'Azure', total_cost: 1180 },
  { date: '2025-11-01', cloud: 'GCP', total_cost: 960 },

  { date: '2025-12-01', cloud: 'AWS', total_cost: 1480 },
  { date: '2025-12-01', cloud: 'Azure', total_cost: 1210 },
  { date: '2025-12-01', cloud: 'GCP', total_cost: 990 },

  { date: '2026-01-01', cloud: 'AWS', total_cost: 1510 },
  { date: '2026-01-01', cloud: 'Azure', total_cost: 1245 },
  { date: '2026-01-01', cloud: 'GCP', total_cost: 1020 },

  { date: '2026-02-01', cloud: 'AWS', total_cost: 1545 },
  { date: '2026-02-01', cloud: 'Azure', total_cost: 1270 },
  { date: '2026-02-01', cloud: 'GCP', total_cost: 1050 },

  { date: '2026-03-01', cloud: 'AWS', total_cost: 1590 },
  { date: '2026-03-01', cloud: 'Azure', total_cost: 1300 },
  { date: '2026-03-01', cloud: 'GCP', total_cost: 1080 },

  { date: '2026-04-01', cloud: 'AWS', total_cost: 1640 },
  { date: '2026-04-01', cloud: 'Azure', total_cost: 1335 },
  { date: '2026-04-01', cloud: 'GCP', total_cost: 1110 },

  { date: '2026-05-01', cloud: 'AWS', total_cost: 1690 },
  { date: '2026-05-01', cloud: 'Azure', total_cost: 1370 },
  { date: '2026-05-01', cloud: 'GCP', total_cost: 1145 },

  { date: '2026-06-01', cloud: 'AWS', total_cost: 1735 },
  { date: '2026-06-01', cloud: 'Azure', total_cost: 1405 },
  { date: '2026-06-01', cloud: 'GCP', total_cost: 1180 },

  { date: '2026-07-01', cloud: 'AWS', total_cost: 1780 },
  { date: '2026-07-01', cloud: 'Azure', total_cost: 1440 },
  { date: '2026-07-01', cloud: 'GCP', total_cost: 1220 },

  { date: '2026-08-01', cloud: 'AWS', total_cost: 1825 },
  { date: '2026-08-01', cloud: 'Azure', total_cost: 1480 },
  { date: '2026-08-01', cloud: 'GCP', total_cost: 1255 },

  { date: '2026-09-01', cloud: 'AWS', total_cost: 1870 },
  { date: '2026-09-01', cloud: 'Azure', total_cost: 1515 },
  { date: '2026-09-01', cloud: 'GCP', total_cost: 1290 },

  { date: '2026-10-01', cloud: 'AWS', total_cost: 1915 },
  { date: '2026-10-01', cloud: 'Azure', total_cost: 1550 },
  { date: '2026-10-01', cloud: 'GCP', total_cost: 1330 }
];

export const cloudService = {
  getAllResources(): CloudResource[] {
    return [...resourcesStore];
  },

  getResourceByName(nameOrId: string): CloudResource | undefined {
    return resourcesStore.find(
      r => r.name.toLowerCase() === nameOrId.toLowerCase() || r.id === nameOrId
    );
  },

  addResource(resource: Omit<CloudResource, 'id' | 'cost_usd' | 'monthly_cost'> & { cost_usd?: number; monthly_cost?: number }): CloudResource {
    const hourly = resource.cost_usd ?? 0.18;
    const monthly = resource.monthly_cost ?? Math.round(hourly * 720 * 100) / 100;
    const newRes: CloudResource = {
      ...resource,
      id: `res-${resource.provider.toLowerCase()}-${Date.now().toString(36)}`,
      cost_usd: hourly,
      monthly_cost: monthly,
      created_at: new Date().toISOString(),
    };
    resourcesStore.unshift(newRes);
    return newRes;
  },

  getResourceByIdOrName(nameOrId: string): CloudResource | undefined {
    return resourcesStore.find(
      r => r.name.toLowerCase() === nameOrId.toLowerCase() || r.id === nameOrId
    );
  },

  updateResource(nameOrId: string, updates: Partial<CloudResource>): CloudResource | null {
    const idx = resourcesStore.findIndex(
      r => r.name.toLowerCase() === nameOrId.toLowerCase() || r.id === nameOrId
    );
    if (idx === -1) return null;

    const current = resourcesStore[idx];
    const updatedCost = updates.cost_usd !== undefined ? updates.cost_usd : current.cost_usd;
    const updatedMonthly = updates.monthly_cost !== undefined
      ? updates.monthly_cost
      : Math.round(updatedCost * 720 * 100) / 100;

    resourcesStore[idx] = {
      ...current,
      ...updates,
      cost_usd: updatedCost,
      monthly_cost: updatedMonthly
    };
    return resourcesStore[idx];
  },

  deleteResource(nameOrId: string): boolean {
    const initialLen = resourcesStore.length;
    resourcesStore = resourcesStore.filter(
      r => r.name.toLowerCase() !== nameOrId.toLowerCase() && r.id !== nameOrId
    );
    return resourcesStore.length < initialLen;
  },

  getAsResourceDataList(): ResourceData[] {
    return resourcesStore.map(r => ({
      resource_id: r.id,
      resource_type: r.resource_type,
      cpu_utilization: r.cpu_utilization,
      total_cost: r.monthly_cost,
      memory_utilization: r.memory_utilization,
      storage_utilization: r.storage_utilization,
      status: r.status
    }));
  },

  getAsMetricDataList(): MetricData[] {
    const now = new Date().toISOString();
    return resourcesStore.map(r => ({
      timestamp: now,
      cloud: r.provider,
      resource_id: r.id,
      resource_type: r.resource_type,
      cpu_utilization: r.cpu_utilization,
      memory_utilization: r.memory_utilization,
      storage_utilization: r.storage_utilization,
      network_in_mb: r.network_in_mb,
      network_out_mb: r.network_out_mb,
      cost_usd: r.cost_usd,
      status: r.status
    }));
  },

  getHistoricalCosts(provider?: string): CostData[] {
    if (!provider || provider === 'All' || provider === 'ALL') {
      // Group by date and sum
      const dateMap = new Map<string, number>();
      for (const item of historicalCosts) {
        dateMap.set(item.date, (dateMap.get(item.date) || 0) + item.total_cost);
      }
      return Array.from(dateMap.entries()).map(([date, total_cost]) => ({
        date,
        cloud: 'Multi-Cloud',
        total_cost
      }));
    }
    return historicalCosts.filter(c => c.cloud.toLowerCase() === provider.toLowerCase());
  },

  isLiveAwsActive(): boolean {
    return liveAwsSynced;
  },

  replaceProviderResources(provider: 'AWS' | 'Azure' | 'GCP', newResources: CloudResource[]): void {
    resourcesStore = [
      ...newResources,
      ...resourcesStore.filter(r => r.provider !== provider)
    ];
    if (provider === 'AWS') {
      liveAwsSynced = true;
    }
  },

  resetToDefault(): void {
    resourcesStore = [...initialResourcesStore];
    liveAwsSynced = false;
  }
};
