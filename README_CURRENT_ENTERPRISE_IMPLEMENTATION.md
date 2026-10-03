# CloudWise AI — Current Enterprise-Ready Foundation

## 1. Project Overview

CloudWise AI is a multi-cloud FinOps, observability, and optimization platform designed to provide a unified view of cloud infrastructure across AWS, Microsoft Azure, and Google Cloud Platform (GCP).

The long-term goal is to help organizations discover cloud resources across multiple providers, monitor infrastructure health and utilization, normalize provider-specific data into one common model, identify anomalies, forecast cost, generate optimization recommendations, and eventually support approval-based remediation.

This document describes **what has been implemented so far** and how the current work fits into an enterprise architecture.

## 2. Current Project Status

| Area | Current Status |
|---|---|
| AWS authentication | Implemented for local development |
| AWS connection verification | Implemented using STS |
| AWS EC2 resource discovery | Implemented |
| AWS CloudWatch CPU metrics | Implemented |
| AWS resource normalization | Implemented |
| Unified cloud resource API | Implemented |
| AWS live frontend feed | Implemented |
| Automatic frontend refresh | Implemented |
| Azure integration | Demo/mock data only |
| GCP integration | Demo/mock data only |
| AI anomaly detection | Existing module available |
| Cost forecasting | Existing module available |
| Recommendations | Existing module available |
| Enterprise persistence layer | Not yet implemented |
| Multi-account AWS Organizations support | Not yet implemented |
| Cross-account enterprise onboarding | Not yet implemented |

## 3. Current High-Level Architecture

```mermaid
flowchart TD
    AWS[AWS Account] --> IAM[IAM Read-Only Access]
    IAM --> SDK[AWS SDK for JavaScript / TypeScript]
    SDK --> STS[AWS STS]
    SDK --> EC2[AWS EC2 API]
    SDK --> CW[AWS CloudWatch]
    STS --> COLLECTOR[awsCollector.ts]
    EC2 --> COLLECTOR
    CW --> COLLECTOR
    COLLECTOR --> NORMALIZER[cloudNormalizer.ts]
    NORMALIZER --> AGGREGATOR[cloudAggregator.ts]
    AZ[Azure Demo Resources] --> AGGREGATOR
    GCP[GCP Demo Resources] --> AGGREGATOR
    AGGREGATOR --> API[/api/cloud/resources]
    API --> FRONTEND[React Frontend]
    FRONTEND --> POLLING[30-second polling]
```

A key enterprise-oriented design decision is already in place: **the frontend does not directly depend on AWS-specific APIs**. React consumes one normalized resource feed.

## 4. AWS Integration Implemented

### 4.1 AWS Authentication

For the current local development environment, CloudWise AI connects to AWS using an IAM user with read-only permissions.

Typical policies used during development include:

- `AmazonEC2ReadOnlyAccess`
- `CloudWatchReadOnlyAccess`

AWS credentials are configured locally and are **not committed into the repository**.

Authentication is verified using AWS Security Token Service (STS):

```text
CloudWise AI
    ↓
AWS SDK
    ↓
STS GetCallerIdentity
    ↓
AWS Account Verified
```

> **Enterprise note:** long-lived IAM user access keys are suitable for development/demo only. Production onboarding should move to cross-account IAM roles, STS `AssumeRole`, temporary credentials, and External IDs.

## 5. AWS Resource Retrieval

The current AWS collector retrieves EC2 instances from the configured AWS account and region.

### Current resource information collected

- EC2 instance ID
- Name tag
- instance type
- region
- running/stopped state
- private IP
- public IP
- provider
- native resource type

Example normalized resource:

```json
{
  "id": "i-xxxxxxxx",
  "name": "cloudwise-live-test",
  "provider": "AWS",
  "resource_type": "EC2",
  "region": "ap-south-1",
  "status": "running",
  "instance_type": "t3.micro",
  "cpu_utilization": 0.2,
  "memory_utilization": null,
  "storage_utilization": null,
  "network_in_mb": null,
  "network_out_mb": null,
  "cost_usd": null,
  "monthly_cost": null,
  "source": "live",
  "metadata": {
    "private_ip": "172.x.x.x",
    "public_ip": "x.x.x.x",
    "native_resource_type": "AWS EC2"
  }
}
```

## 6. AWS Metrics Integration

CloudWise AI currently uses AWS CloudWatch to retrieve EC2 CPU utilization.

### Current metric

- Namespace: `AWS/EC2`
- Metric: `CPUUtilization`
- Statistic: Average
- Period: 5 minutes

Current flow:

```text
EC2 Instance
    ↓
CloudWatch
    ↓
CPUUtilization
    ↓
awsCollector.ts
    ↓
Normalized CloudWise resource
```

If a metric is unavailable, CloudWise does not generate fake values. The UI displays `N/A` instead of pretending a missing metric is zero.

## 7. Cloud Resource Normalization

AWS, Azure, and GCP all return different data models. CloudWise AI uses a normalization layer to convert provider-specific responses into a common internal representation.

Current normalization file:

```text
src/server/services/cloud/cloudNormalizer.ts
```

Example mapping:

```text
AWS InstanceId    → CloudWise id
AWS Name tag      → CloudWise name
AWS State.Name    → CloudWise status
CloudWatch CPU    → CloudWise cpu_utilization
```

This abstraction is the foundation for future enterprise multi-cloud support.

## 8. Cloud Aggregator

CloudWise AI now uses a unified aggregation layer.

Current file:

```text
src/server/services/cloud/cloudAggregator.ts
```

Current behavior:

```text
Real AWS Resources
        +
Azure Demo Resources
        +
GCP Demo Resources
        ↓
Unified Resource Array
```

The design allows Azure and GCP demo data to be replaced later by real collectors without changing the frontend contract.

## 9. REST API Integration

### AWS-only live endpoint

```http
GET /api/cloud/aws/live
```

Purpose:

- isolate AWS testing,
- debug AWS connectivity,
- verify real resource retrieval.

### Unified cloud resource endpoint

```http
GET /api/cloud/resources
```

Current flow:

```text
/api/cloud/resources
        ↓
cloudAggregator.ts
        ↓
AWS LIVE + Azure DEMO + GCP DEMO
```

This is the resource endpoint consumed by the frontend.

## 10. Frontend Live Resource Feed

The React frontend now consumes the unified resource endpoint.

### Implemented behavior

- real AWS resources are marked `LIVE`,
- Azure/GCP sample resources are marked `DEMO`,
- live AWS status is displayed,
- real CloudWatch CPU utilization is shown,
- unavailable metrics display `N/A`,
- real cloud rows are read-only in the UI until real remediation is implemented.

### Automatic refresh

The frontend refreshes the cloud inventory approximately every 30 seconds.

```text
React Frontend
    ↓
GET /api/cloud/resources
    ↓
Render Resources
    ↓
Wait 30 seconds
    ↓
Fetch again
```

A manual refresh action is also available.

## 11. Live AWS Demonstration Verified

The integration has been tested with a real EC2 instance.

Verified sequence:

1. EC2 instance created in AWS.
2. CloudWise discovered the instance.
3. EC2 appeared in the Resources page.
4. AWS resource was marked `LIVE`.
5. CloudWatch CPU utilization was displayed.
6. EC2 was stopped from the AWS Console.
7. CloudWise automatically detected the stopped state.
8. EC2 was started again.
9. CloudWise automatically returned to the running state.

This proves the frontend is consuming live provider state rather than static AWS JSON.

## 12. Current Technology Stack

### Frontend

- React
- TypeScript
- Vite
- project utility styling
- Lucide React icons

### Backend

- Node.js
- TypeScript
- Express.js

### AWS Integration

- AWS CLI
- AWS IAM
- AWS STS
- AWS EC2
- AWS CloudWatch
- AWS SDK for JavaScript v3

Current AWS SDK packages include:

```text
@aws-sdk/client-sts
@aws-sdk/client-ec2
@aws-sdk/client-cloudwatch
```

### AI / Analytics

Existing project modules include:

- anomaly detection,
- forecasting,
- recommendations,
- AI overview APIs.

The AI layer has **not yet been fully migrated to live normalized cloud inventory** and still relies heavily on existing sample/historical data.

### Source Control

- Git
- GitHub
- feature branches
- pull requests
- squash merging

## 13. Relevant Repository Structure

```text
src/
├── components/
│   ├── ResourcesTab.tsx
│   ├── OverviewTab.tsx
│   ├── AnomaliesTab.tsx
│   ├── ForecastTab.tsx
│   └── RecommendationsTab.tsx
│
├── server/
│   └── services/
│       ├── cloud/
│       │   ├── awsCollector.ts
│       │   ├── cloudNormalizer.ts
│       │   └── cloudAggregator.ts
│       │
│       ├── cloudService.ts
│       ├── anomalyService.ts
│       ├── forecastService.ts
│       └── recommendationService.ts
│
├── types/
│   └── cloudwise.ts
│
└── utils/
    └── formatters.ts

server.ts
```

## 14. Current Strengths

### Separation of concerns

AWS collection, normalization, aggregation, API delivery, and frontend rendering are separated.

### Provider abstraction

The frontend is not tied to AWS-specific response formats.

### Real telemetry

CloudWise has successfully consumed real AWS telemetry rather than relying only on mock resources.

### Safe missing-data handling

Unavailable data is shown as `N/A` instead of fabricated values.

### Read-only live mode

Real AWS resources are prevented from accidentally using mock local start/stop/delete logic.

### Extensible resource pipeline

The normalization + aggregation model can be extended for additional AWS services, Azure, and GCP.

## 15. Current Limitations

The current system should be described as an **enterprise-oriented architectural prototype**, not a production enterprise platform yet.

Current limitations include:

- AWS deep integration currently focuses on EC2,
- only one configured AWS development account is currently used,
- AWS auth currently relies on local IAM-user credentials,
- Azure resources are currently demo data,
- GCP resources are currently demo data,
- resource inventory is fetched synchronously,
- inventory is not yet persisted in an enterprise database,
- historical metric storage is not yet implemented,
- AWS Organizations is not integrated,
- cross-account IAM-role onboarding is not implemented,
- Cost Explorer/billing integration is not implemented,
- unified security-posture aggregation is not implemented,
- AI services are not yet fully driven by the live inventory pipeline.

## 16. Enterprise Direction

Current foundation:

```text
Provider Integration
      ↓
Normalization
      ↓
Aggregation
      ↓
Unified API
      ↓
Frontend
```

Target enterprise direction:

```text
Organizations / Accounts
          ↓
Enterprise Cloud Discovery
          ↓
Service-Specific Collectors
          ↓
Background Sync Workers
          ↓
Normalized Inventory Database
          ↓
Metrics + Cost + Security
          ↓
AI Analytics
          ↓
Unified Enterprise Dashboard
```

See `README_ENTERPRISE_SCALABILITY_ROADMAP.md` for the proposed production-scale architecture and implementation roadmap.
