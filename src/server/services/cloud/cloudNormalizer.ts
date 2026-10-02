export type CloudProvider = "AWS" | "Azure" | "GCP";

export type NormalizedStatus =
  | "running"
  | "stopped"
  | "unknown";


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
 * Common format that CloudWise AI will use
 * for AWS, Azure and GCP.
 */
export interface NormalizedCloudResource {
  id: string;
  name: string;

  provider: CloudProvider;

  resource_type: string;

  region: string;

  status: NormalizedStatus;

  instance_type: string | null;

  cpu_utilization: number | null;

  memory_utilization: number | null;

  storage_utilization: number | null;

  network_in_mb: number | null;

  network_out_mb: number | null;

  cost_usd: number | null;

  monthly_cost: number | null;

  metadata: {
    private_ip?: string | null;
    public_ip?: string | null;
    native_resource_type?: string;
  };
}


function normalizeAwsStatus(
  awsStatus: string
): NormalizedStatus {

  switch (awsStatus.toLowerCase()) {

    case "running":
    case "pending":
      return "running";

    case "stopped":
    case "stopping":
    case "shutting-down":
    case "terminated":
      return "stopped";

    default:
      return "unknown";
  }
}


export function normalizeAwsEc2Resource(
  resource: AwsEc2RawResource
): NormalizedCloudResource {

  return {

    id: resource.resource_id,

    name: resource.resource_name,

    provider: "AWS",

    resource_type: "EC2",

    region: resource.region,

    status:
      normalizeAwsStatus(resource.status),

    instance_type:
      resource.instance_type,

    cpu_utilization:
      resource.cpu_utilization,

    /*
     * Standard EC2 CloudWatch does not provide
     * memory or filesystem utilization without
     * additional monitoring/CloudWatch Agent.
     *
     * Therefore we use null instead of fake values.
     */
    memory_utilization: null,

    storage_utilization: null,

    network_in_mb: null,

    network_out_mb: null,

    /*
     * Cost collection will be implemented
     * separately through AWS billing/cost APIs.
     */
    cost_usd: null,

    monthly_cost: null,

    metadata: {

      private_ip:
        resource.private_ip,

      public_ip:
        resource.public_ip,

      native_resource_type:
        "AWS EC2"
    }
  };
}