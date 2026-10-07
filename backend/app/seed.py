from datetime import datetime
from sqlalchemy import select, func
from .database import SessionLocal
from .models import CloudResource

# (id, name, provider, resource_type, region, status, instance_type,
#  cpu, mem, storage, net_in, net_out, cost_usd, monthly_cost, anomaly_type, created_at)
ROWS = [
    ("res-aws-01", "prod-api-gateway-01", "AWS", "EC2", "us-east-1", "running", "c6g.2xlarge", 88.4, 74.2, 62.0, 940.5, 810.2, 0.342, 246.24, "high_cpu_and_traffic", "2026-04-12T08:00:00Z"),
    ("res-aws-02", "staging-qa-worker", "AWS", "EC2", "us-east-1", "stopped", "m5.2xlarge", 0.0, 0.0, 78.4, 0.0, 0.0, 0.384, 276.48, "stopped_with_cost", "2026-03-10T14:30:00Z"),
    ("res-aws-03", "batch-indexer-master", "AWS", "EC2", "us-west-2", "running", "r6g.xlarge", 7.8, 16.5, 34.0, 48.2, 32.1, 0.252, 181.44, "underutilized", "2026-05-18T09:15:00Z"),
    ("res-aws-04", "aurora-cluster-writer", "AWS", "RDS", "us-east-1", "running", "db.r6g.2xlarge", 52.4, 68.1, 64.8, 420.0, 395.0, 0.580, 417.60, None, "2026-01-15T00:00:00Z"),
    ("res-aws-05", "log-retention-vol-01", "AWS", "EBS", "us-east-1", "attached", "gp3 4TB", 14.2, 22.0, 94.8, 140.0, 95.0, 0.220, 158.40, "storage_pressure", "2026-06-01T12:00:00Z"),
    ("res-aws-06", "auth-jwt-verifier", "AWS", "Lambda", "us-east-1", "running", "1024MB ARM", 24.5, 35.0, 12.0, 210.0, 180.0, 0.085, 61.20, None, "2026-07-20T10:00:00Z"),
    ("res-aws-07", "web-server-01", "AWS", "EC2", "ap-south-1", "running", "t3.xlarge", 46.5, 52.3, 61.2, 812.4, 489.1, 0.214, 154.08, None, "2026-06-15T08:00:00Z"),
    ("res-aws-08", "aurora-cluster-replica-1", "AWS", "RDS", "us-west-2", "running", "db.r6g.xlarge", 38.0, 56.4, 63.5, 290.0, 310.0, 0.290, 208.80, None, "2026-02-10T16:00:00Z"),

    ("res-az-01", "eu-data-pipeline-node", "Azure", "Virtual Machine", "westeurope", "running", "Standard D8s v5", 93.6, 91.2, 76.5, 720.0, 680.0, 0.440, 316.80, "high_utilization", "2026-06-25T11:00:00Z"),
    ("res-az-02", "dev-environment-vm3", "Azure", "Virtual Machine", "eastus", "stopped", "Standard E4s v3", 0.0, 0.0, 45.0, 0.0, 0.0, 0.280, 201.60, "stopped_with_cost", "2026-05-02T13:45:00Z"),
    ("res-az-03", "internal-hr-portal", "Azure", "Virtual Machine", "eastus", "running", "Standard D4s v4", 9.2, 18.4, 32.0, 35.0, 22.0, 0.220, 158.40, "underutilized", "2026-07-04T10:15:00Z"),
    ("res-az-04", "database-01", "Azure", "SQL Database", "centralindia", "running", "General Purpose 8 vCore", 38.4, 64.0, 68.5, 460.2, 310.5, 0.274, 197.28, None, "2026-06-10T12:00:00Z"),
    ("res-az-05", "archive-blob-cache", "Azure", "Managed Disk", "westeurope", "attached", "Premium SSD P40", 8.5, 15.0, 92.4, 95.0, 80.0, 0.175, 126.00, "storage_pressure", "2026-05-15T09:00:00Z"),
    ("res-az-06", "frontend-nginx-edge", "Azure", "Virtual Machine", "northeurope", "running", "Standard B2ms", 42.1, 48.0, 39.0, 510.0, 620.0, 0.110, 79.20, None, "2026-08-01T15:20:00Z"),
    ("res-az-07", "billing-reports-sql", "Azure", "SQL Database", "eastus2", "running", "Standard S4", 49.5, 58.0, 54.0, 240.0, 280.0, 0.205, 147.60, None, "2026-07-12T14:00:00Z"),
    ("res-az-08", "data-lake-staging-disk", "Azure", "Managed Disk", "eastus", "attached", "Standard SSD 1TB", 12.0, 18.0, 58.0, 110.0, 85.0, 0.098, 70.56, None, "2026-04-18T10:00:00Z"),

    ("res-gcp-01", "analytics-worker-01", "GCP", "Compute Engine", "us-central1", "running", "c2-standard-8", 94.2, 82.5, 54.0, 1140.8, 980.2, 0.385, 277.20, "high_cpu_and_traffic", "2026-07-01T00:00:00Z"),
    ("res-gcp-02", "abandoned-ml-training-node", "GCP", "Compute Engine", "us-west1", "stopped", "n1-standard-16-v100", 0.0, 0.0, 68.0, 0.0, 0.0, 0.490, 352.80, "stopped_with_cost", "2026-03-22T17:00:00Z"),
    ("res-gcp-03", "bastion-host-primary", "GCP", "Compute Engine", "europe-west1", "running", "e2-standard-4", 6.4, 14.8, 22.0, 28.0, 19.0, 0.165, 118.80, "underutilized", "2026-06-18T08:30:00Z"),
    ("res-gcp-04", "customer-db-primary", "GCP", "Cloud SQL", "asia-east1", "running", "db-custom-4-16384", 52.8, 68.4, 62.0, 520.0, 480.0, 0.245, 176.40, None, "2026-05-10T11:00:00Z"),
    ("res-gcp-05", "analytics-scratch-disk", "GCP", "Persistent Disk", "us-central1", "attached", "pd-ssd 2TB", 11.5, 20.0, 93.7, 180.0, 150.0, 0.190, 136.80, "storage_pressure", "2026-06-20T16:00:00Z"),
    ("res-gcp-06", "webhook-event-sink", "GCP", "Compute Engine", "us-central1", "running", "e2-medium", 34.0, 45.0, 28.0, 340.0, 290.0, 0.075, 54.00, None, "2026-08-05T12:00:00Z"),
    ("res-gcp-07", "customer-db-read-replica", "GCP", "Cloud SQL", "europe-west4", "running", "db-custom-2-8192", 41.2, 54.0, 61.5, 310.0, 280.0, 0.180, 129.60, None, "2026-06-05T09:00:00Z"),
    ("res-gcp-08", "backup-snapshot-pool", "GCP", "Persistent Disk", "us-west1", "attached", "pd-standard 5TB", 5.0, 10.0, 64.0, 75.0, 45.0, 0.130, 93.60, None, "2026-04-01T10:00:00Z"),
]


def _to_resource(row) -> CloudResource:
    (id_, name, provider, rtype, region, status, itype,
     cpu, mem, sto, nin, nout, cost, monthly, anomaly, created) = row
    return CloudResource(
        id=id_, name=name, provider=provider, resource_type=rtype, region=region,
        status=status, instance_type=itype,
        cpu_utilization=cpu, memory_utilization=mem, storage_utilization=sto,
        network_in_mb=nin, network_out_mb=nout,
        cost_usd=cost, monthly_cost=monthly, anomaly_type=anomaly,
        created_at=datetime.fromisoformat(created.replace("Z", "+00:00")).replace(tzinfo=None),
    )


def seed():
    with SessionLocal() as db:
        if db.scalar(select(func.count()).select_from(CloudResource)):
            return  # table already has data, don't seed twice
        db.add_all(_to_resource(r) for r in ROWS)
        db.commit()