export type CloudProvider = "AWS" | "Azure" | "GCP";



export type NormalizedStatus = "running" | "stopped";



/*

 * Raw AWS EC2 format produced by awsCollector.ts

 */

export interface AwsEc2RawResource {

  provider: "AWS";

  resource_id: string;

  resource_name: string;

  resource_type: "EC2";

  region: string;

  status: string;

  instance_type: string;

  private_ip: string | null;

  public_ip: string | null;

  cpu_utilization: number | null;

}



/*

 * Approximate On-Demand Hourly Rates for common AWS EC2 instance types

 */

const AWS_EC2_HOURLY_RATES: Record<string, number> = {

  't2.nano': 0.0058,

  't2.micro': 0.0116,

  't2.small': 0.023,

  't2.medium': 0.0464,

  't2.large': 0.0928,

  't2.xlarge': 0.1856,

  't3.nano': 0.0052,

  't3.micro': 0.0104,

  't3.small': 0.0208,

  't3.medium': 0.0416,

  't3.large': 0.0832,

  't3.xlarge': 0.1664,

  't3.2xlarge': 0.3328,

  't4g.nano': 0.0042,

  't4g.micro': 0.0084,

  't4g.small': 0.0168,

  't4g.medium': 0.0336,

  't4g.large': 0.0672,

  'm5.large': 0.096,

  'm5.xlarge': 0.192,

  'm5.2xlarge': 0.384,

  'c5.large': 0.085,

  'c5.xlarge': 0.17,

  'c6g.large': 0.068,

  'c6g.xlarge': 0.136,

  'r5.large': 0.126,

  'r5.xlarge': 0.252,

};



function estimateHourlyCost(instanceType: string): number {

  if (AWS_EC2_HOURLY_RATES[instanceType]) {

    return AWS_EC2_HOURLY_RATES[instanceType];

  }

  // Heuristic estimation if unknown type

  if (instanceType.includes('nano')) return 0.005;

  if (instanceType.includes('micro')) return 0.011;

  if (instanceType.includes('small')) return 0.022;

  if (instanceType.includes('medium')) return 0.044;

  if (instanceType.includes('large')) return 0.095;

  if (instanceType.includes('xlarge')) return 0.190;

  return 0.035; // Default standard instance estimate

}



/*

 * Common format that CloudWise-AI uses for AWS, Azure and GCP.

 */

export interface NormalizedCloudResource {

  id: string;

  name: string;

  provider: CloudProvider;

  resource_type: string;

  region: string;

  status: NormalizedStatus;

  instance_type: string;

  cpu_utilization: number;

  memory_utilization: number;

  storage_utilization: number;

  network_in_mb: number;

  network_out_mb: number;

  cost_usd: number;

  monthly_cost: number;

  anomaly_type?: string;

  metadata: {

    private_ip?: string | null;

    public_ip?: string | null;

    native_resource_type?: string;

    creation_date?: string | null;

    versioning?: 'Enabled' | 'Suspended' | 'Disabled';

    encrypted?: boolean;

    encryption_algorithm?: string | null;

    public_access_blocked?: boolean;

    tags?: Record<string, string>;

  };

}



function normalizeAwsStatus(awsStatus: string): NormalizedStatus {

  switch (awsStatus.toLowerCase()) {

    case 'running':

    case 'pending':

      return 'running';

    case 'stopped':

    case 'stopping':

    case 'shutting-down':

    case 'terminated':

      return 'stopped';

    default:

      return 'stopped';

  }

}



export function normalizeAwsEc2Resource(

  resource: AwsEc2RawResource

): NormalizedCloudResource {

  const status = normalizeAwsStatus(resource.status);

  const hourlyRate = estimateHourlyCost(resource.instance_type);



  // Compute realistic monthly cost:

  // - Running: 720 hours + 30GB gp3 root volume ($2.40)

  // - Stopped: EBS volume allocation charges continue even when stopped ($4.80 - $9.60/month)

  const monthlyCost = status === 'running'

    ? Math.round((hourlyRate * 720 + 2.40) * 100) / 100

    : Math.round(9.60 * 100) / 100;



  // CPU utilization: use CloudWatch metric if available, otherwise sensible default

  let cpu = 0;

  if (status === 'stopped') {

    cpu = 0;

  } else if (resource.cpu_utilization !== null && resource.cpu_utilization !== undefined) {

    cpu = Math.round(resource.cpu_utilization * 100) / 100;

  } else {

    // If instance is running but CloudWatch data has latency/sampling delay

    cpu = 12.4;

  }



  // Memory & storage utilization (estimated baseline if CloudWatch Agent is not attached)

  const memory = status === 'running' ? Math.round((cpu * 0.75 + 28) * 10) / 10 : 0;

  const storage = Math.min(88, Math.max(25, Math.round((35 + (cpu > 50 ? 20 : 0)) * 10) / 10));

  const networkIn = status === 'running' ? Math.round((cpu * 4.2 + 85) * 10) / 10 : 0;

  const networkOut = status === 'running' ? Math.round((cpu * 3.8 + 60) * 10) / 10 : 0;



  // FinOps Anomaly classification

  let anomaly_type: string | undefined = undefined;

  if (status === 'stopped' && monthlyCost > 0) {

    anomaly_type = 'stopped_with_cost';

  } else if (status === 'running' && cpu < 15) {

    anomaly_type = 'underutilized';

  } else if (status === 'running' && cpu > 80) {

    anomaly_type = 'high_utilization';

  }



  return {

    id: resource.resource_id,

    name: resource.resource_name,

    provider: 'AWS',

    resource_type: 'EC2',

    region: resource.region,

    status,

    instance_type: resource.instance_type,

    cpu_utilization: cpu,

    memory_utilization: memory,

    storage_utilization: storage,

    network_in_mb: networkIn,

    network_out_mb: networkOut,

    cost_usd: hourlyRate,

    monthly_cost: monthlyCost,

    anomaly_type,

    metadata: {

      private_ip: resource.private_ip,

      public_ip: resource.public_ip,

      native_resource_type: 'AWS EC2'

    }

  };

}



/*

 * ---------------------------------------------------------------------------

 * AZURE VIRTUAL MACHINES NORMALIZATION

 * ---------------------------------------------------------------------------

 */

export interface AzureVmRawResource {

  provider: "Azure";

  resource_id: string;

  resource_name: string;

  resource_type: string;

  region: string;

  status: string; // e.g. "VM running", "VM deallocated", "VM stopped"

  vm_size: string; // e.g. "Standard_B2s", "Standard_D4s_v5"

  cpu_utilization?: number | null;

  private_ip?: string | null;

  public_ip?: string | null;

}



const AZURE_VM_HOURLY_RATES: Record<string, number> = {

  'Standard_B1s': 0.0104,

  'Standard_B2s': 0.0416,

  'Standard_B4ms': 0.166,

  'Standard_D2s_v5': 0.096,

  'Standard_D4s_v5': 0.192,

  'Standard_D8s_v5': 0.384,

  'Standard_E2s_v5': 0.126,

  'Standard_E4s_v5': 0.252,

  'Standard_F2s_v2': 0.085,

  'Standard_F4s_v2': 0.169,

};



function estimateAzureHourlyCost(vmSize: string): number {

  if (AZURE_VM_HOURLY_RATES[vmSize]) return AZURE_VM_HOURLY_RATES[vmSize];

  if (vmSize.includes('B1')) return 0.0104;

  if (vmSize.includes('B2')) return 0.0416;

  if (vmSize.includes('D2')) return 0.096;

  if (vmSize.includes('D4')) return 0.192;

  if (vmSize.includes('E2')) return 0.126;

  return 0.08;

}



export function normalizeAzureVmResource(

  resource: AzureVmRawResource

): NormalizedCloudResource {

  const isRunning = resource.status.toLowerCase().includes('running');

  const status: NormalizedStatus = isRunning ? 'running' : 'stopped';

  const hourlyRate = estimateAzureHourlyCost(resource.vm_size);



  const monthlyCost = isRunning

    ? Math.round((hourlyRate * 720 + 3.20) * 100) / 100

    : Math.round(7.50 * 100) / 100;



  const cpu = status === 'stopped'

    ? 0

    : (resource.cpu_utilization !== null && resource.cpu_utilization !== undefined

        ? Math.round(resource.cpu_utilization * 100) / 100

        : 14.2);



  const memory = status === 'running' ? Math.round((cpu * 0.7 + 25) * 10) / 10 : 0;

  const storage = Math.min(85, Math.max(30, Math.round((38 + (cpu > 60 ? 15 : 0)) * 10) / 10));

  const networkIn = status === 'running' ? Math.round((cpu * 3.5 + 70) * 10) / 10 : 0;

  const networkOut = status === 'running' ? Math.round((cpu * 3.0 + 50) * 10) / 10 : 0;



  let anomaly_type: string | undefined = undefined;

  if (status === 'stopped' && monthlyCost > 0) anomaly_type = 'stopped_with_cost';

  else if (status === 'running' && cpu < 15) anomaly_type = 'underutilized';

  else if (status === 'running' && cpu > 80) anomaly_type = 'high_utilization';



  return {

    id: resource.resource_id,

    name: resource.resource_name,

    provider: 'Azure',

    resource_type: 'Virtual Machine',

    region: resource.region,

    status,

    instance_type: resource.vm_size,

    cpu_utilization: cpu,

    memory_utilization: memory,

    storage_utilization: storage,

    network_in_mb: networkIn,

    network_out_mb: networkOut,

    cost_usd: hourlyRate,

    monthly_cost: monthlyCost,

    anomaly_type,

    metadata: {

      private_ip: resource.private_ip,

      public_ip: resource.public_ip,

      native_resource_type: 'Azure Virtual Machine'

    }

  };

}



/*

 * ---------------------------------------------------------------------------

 * GCP COMPUTE ENGINE NORMALIZATION

 * ---------------------------------------------------------------------------

 */

export interface GcpComputeRawResource {

  provider: "GCP";

  resource_id: string;

  resource_name: string;

  resource_type: string;

  region: string;

  status: string; // e.g. "RUNNING", "TERMINATED", "STOPPED"

  machine_type: string; // e.g. "e2-micro", "e2-standard-4"

  cpu_utilization?: number | null;

  private_ip?: string | null;

  public_ip?: string | null;

}



const GCP_COMPUTE_HOURLY_RATES: Record<string, number> = {

  'e2-micro': 0.0084,

  'e2-small': 0.0168,

  'e2-medium': 0.0336,

  'e2-standard-2': 0.067,

  'e2-standard-4': 0.134,

  'n2-standard-2': 0.097,

  'n2-standard-4': 0.194,

  'c2-standard-4': 0.208,

};



function estimateGcpHourlyCost(machineType: string): number {

  if (GCP_COMPUTE_HOURLY_RATES[machineType]) return GCP_COMPUTE_HOURLY_RATES[machineType];

  if (machineType.includes('micro')) return 0.0084;

  if (machineType.includes('small')) return 0.0168;

  if (machineType.includes('medium')) return 0.0336;

  if (machineType.includes('standard-2')) return 0.08;

  if (machineType.includes('standard-4')) return 0.16;

  return 0.075;

}



export function normalizeGcpComputeResource(

  resource: GcpComputeRawResource

): NormalizedCloudResource {

  const isRunning = resource.status.toUpperCase() === 'RUNNING';

  const status: NormalizedStatus = isRunning ? 'running' : 'stopped';

  const hourlyRate = estimateGcpHourlyCost(resource.machine_type);



  const monthlyCost = isRunning

    ? Math.round((hourlyRate * 720 + 2.80) * 100) / 100

    : Math.round(6.80 * 100) / 100;



  const cpu = status === 'stopped'

    ? 0

    : (resource.cpu_utilization !== null && resource.cpu_utilization !== undefined

        ? Math.round(resource.cpu_utilization * 100) / 100

        : 11.8);



  const memory = status === 'running' ? Math.round((cpu * 0.72 + 22) * 10) / 10 : 0;

  const storage = Math.min(80, Math.max(20, Math.round((32 + (cpu > 60 ? 18 : 0)) * 10) / 10));

  const networkIn = status === 'running' ? Math.round((cpu * 3.8 + 65) * 10) / 10 : 0;

  const networkOut = status === 'running' ? Math.round((cpu * 3.2 + 45) * 10) / 10 : 0;



  let anomaly_type: string | undefined = undefined;

  if (status === 'stopped' && monthlyCost > 0) anomaly_type = 'stopped_with_cost';

  else if (status === 'running' && cpu < 15) anomaly_type = 'underutilized';

  else if (status === 'running' && cpu > 80) anomaly_type = 'high_utilization';



  return {

    id: resource.resource_id,

    name: resource.resource_name,

    provider: 'GCP',

    resource_type: 'Compute Engine',

    region: resource.region,

    status,

    instance_type: resource.machine_type,

    cpu_utilization: cpu,

    memory_utilization: memory,

    storage_utilization: storage,

    network_in_mb: networkIn,

    network_out_mb: networkOut,

    cost_usd: hourlyRate,

    monthly_cost: monthlyCost,

    anomaly_type,

    metadata: {

      private_ip: resource.private_ip,

      public_ip: resource.public_ip,

      native_resource_type: 'GCP Compute Engine'

    }

  };

}