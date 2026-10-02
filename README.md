# CloudWise-AI

> **Multi-Cloud Resource Intelligence, Anomaly Detection & Automated Cost Optimization Platform**

[![Runtime](https://img.shields.io/badge/Runtime-Node.js%2022-brightgreen.svg)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind%20CSS-blue.svg)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Express%205%20%2B%20TypeScript-blueviolet.svg)](https://expressjs.com/)
[![Clouds](https://img.shields.io/badge/Clouds-AWS%20|%20Azure%20|%20GCP-orange.svg)](#multi-cloud-support)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](#license)

---

## Table of Contents

- [Executive Summary](#executive-summary)
- [Key Features](#key-features)
  - [1. Isolation Forest Anomaly Detection](#1-isolation-forest-anomaly-detection)
  - [2. Prophet Cost Forecasting Engine](#2-prophet-cost-forecasting-engine)
  - [3. Rightsizing & Automated Cost Optimization](#3-rightsizing--automated-cost-optimization)
  - [4. Multi-Cloud Inventory Explorer](#4-multi-cloud-inventory-explorer)
  - [5. Interactive API Playground & Console](#5-interactive-api-playground--console)
- [Architecture & Tech Stack](#architecture--tech-stack)
- [API Reference](#api-reference)
  - [System & Auth Endpoints](#system--auth-endpoints)
  - [Cloud Resources Endpoints](#cloud-resources-endpoints)
  - [AI Analytics & Machine Learning Endpoints](#ai-analytics--machine-learning-endpoints)
- [Data Models & Schemas](#data-models--schemas)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the Development Server](#running-the-development-server)
  - [Building for Production](#building-for-production)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Project Directory Structure](#project-directory-structure)
- [License](#license)

---

## Executive Summary

Cloud spending across modern enterprises is often fragmented across multiple hyperscalers (Amazon Web Services, Microsoft Azure, Google Cloud Platform), resulting in:

- **Unidentified Idle Resources**: Staged or orphaned VMs and storage volumes continuing to accrue baseline charges.
- **Unexpected Budget Surges**: Sudden traffic bursts or misconfigured batch jobs driving unanticipated monthly cloud overages.
- **Suboptimal Capacity Allocation**: Compute instances provisioned with low average CPU (<15%) or critically high disk utilization (>90%).

**CloudWise AI** solves these challenges by combining continuous metric ingestion, unsupervised anomaly detection (Isolation Forest), time-series expenditure forecasting (Prophet), and automated rightsizing recommendations into an intuitive dashboard and developer-friendly REST API.

---

## Key Features

### 1. Isolation Forest Anomaly Detection

- Evaluates multi-dimensional resource vectors: `cpu_utilization`, `memory_utilization`, `storage_utilization`, `network_in_mb`, `network_out_mb`, and `cost_usd`.
- Implements an unsupervised statistical isolation scoring algorithm with a configurable contamination factor (default $c = 0.05$).
- Categorizes anomalous workloads into actionable operational states:
  - `stopped_with_cost`: A stopped resource actively incurring billing charges.
  - `high_cpu_and_traffic`: Extreme CPU utilization (>85%) combined with high inbound network traffic (>800 MB).
  - `storage_pressure`: Critical disk saturation (>=90%) risking service outages.
  - `high_utilization`: Sustained double-high CPU and memory saturation (>=90% CPU, >=85% Memory).
  - `underutilized`: Severely idle capacity (<10% CPU, <20% Memory) incurring continuous charges.

### 2. Prophet Cost Forecasting Engine

- Time-series linear regression and seasonal decomposition based on monthly historical cloud invoices.
- Projects expected monthly run-rates up to 12 months into the future.
- Generates 95% confidence intervals (`lower_bound`, `predicted_cost` / `yhat`, and `upper_bound`) reflecting workload volatility.
- Interactive visualization canvas with dynamic horizon adjustments (+3, +6, +9, +12 months).

### 3. Rightsizing & Automated Cost Optimization

- Evaluates instances against a triaged priority matrix (**HIGH**, **MEDIUM**, **LOW**).
- Computes estimated monthly and annualized dollar savings:
  - **Stopped Idle Instances**: 100% reclamation of accumulated monthly cost.
  - **Overprovisioned Compute**: Up to 30% reduction via instance downgrade / capacity reduction.
  - **Storage Cleanup**: Up to 10% reduction through orphaned snapshot and volume pruning.
- Interactive action triggers allow immediate rightsizing or termination directly from the dashboard.

### 4. Multi-Cloud Inventory Explorer

- Normalized catalog across AWS (EC2, RDS, EBS, Lambda), Azure (Virtual Machines, SQL Databases, Managed Disks), and GCP (Compute Engine, Cloud SQL, Persistent Disks).
- Real-time status toggling (Start / Stop) and capacity lifecycle management.
- Quick-filter toolbar by Cloud Provider, Resource State, and Resource Type.

### 5. Interactive API Playground & Console

- In-browser API client for developers to test all REST endpoints directly.
- Pre-loaded payloads from unit test suites for `/ai/analyze`, `/ai/anomalies`, `/ai/forecast`, and `/ai/recommendations`.
- Live response time tracking, HTTP status badges, and one-click cURL snippet export.

---

## Architecture & Tech Stack

CloudWise AI operates as a unified full-stack Node.js application:

```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React 19 SPA • Tailwind CSS v4 • Lucide React • Vite HMR   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│                    API Gateway (server.ts)                  │
│       Express 5 • CORS • JSON Parser • Vite Middleware      │
├──────────────────────────────┬──────────────────────────────┤
│                     Service Layer                           │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │     anomalyService      │  │     forecastService      │  │
│  │ (Isolation Forest Model)│  │ (Prophet Decomposition)  │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  recommendationService  │  │       cloudService       │  │
│  │ (Rightsizing Heuristics)│  │ (Multi-Cloud In-Memory)  │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **Runtime**: Node.js 22 (LTS)
- **Language**: TypeScript 5.8
- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons
- **Backend**: Express 5 on port 3000
- **Dev Server**: `tsx server.ts` with Vite SPA middlewares

---

## API Reference

All requests and responses use `application/json`.

### System & Auth Endpoints

#### `GET /health` or `GET /api/health`
Returns the operational health of the CloudWise AI platform.

```bash
curl http://localhost:3000/health
```
```json
{
  "status": "healthy"
}
```

#### `GET /api/auth/test`
Verifies authentication subsystem connectivity.

```bash
curl http://localhost:3000/api/auth/test
```
```json
{
  "message": "Authentication API is working"
}
```

---

### Cloud Resources Endpoints

#### `GET /api/cloud/resources`
Retrieves all registered multi-cloud resources.

```bash
curl http://localhost:3000/api/cloud/resources
```

#### `GET /api/cloud/resources/:name`
Retrieves a single resource by name or unique ID.

```bash
curl http://localhost:3000/api/cloud/resources/web-server-01
```

#### `POST /api/cloud/resources`
Registers a new multi-cloud asset.

**Payload:**
```json
{
  "name": "prod-api-proxy",
  "provider": "AWS",
  "resource_type": "EC2",
  "region": "us-east-1",
  "status": "running",
  "instance_type": "t3.medium",
  "cpu_utilization": 42.5,
  "cost_usd": 0.18
}
```

#### `PATCH /api/cloud/resources/:id`
Updates status, sizing, or utilization for an existing resource.

#### `DELETE /api/cloud/resources/:id`
Removes or terminates a cloud resource.

---

### AI Analytics & Machine Learning Endpoints

#### `POST /ai/anomalies`
Runs Isolation Forest anomaly detection on resource time-series metrics.

**Request:**
```bash
curl -X POST http://localhost:3000/ai/anomalies \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": [
      {
        "timestamp": "2026-08-01 00:00:00",
        "cloud": "AWS",
        "resource_id": "aws-ec2-001",
        "resource_type": "EC2",
        "cpu_utilization": 46.52
      },
      {
        "timestamp": "2026-08-01 02:00:00",
        "cloud": "GCP",
        "resource_id": "gcp-ce-anomaly",
        "resource_type": "Compute Engine",
        "cpu_utilization": 94.8,
        "network_in_mb": 950
      }
    ]
  }'
```

**Response:**
```json
{
  "anomalies": [
    {
      "timestamp": "2026-08-01 02:00:00",
      "cloud": "GCP",
      "resource_id": "gcp-ce-anomaly",
      "resource_type": "Compute Engine",
      "cpu_utilization": 94.8,
      "anomaly": true,
      "anomaly_score": -0.22,
      "anomaly_type": "high_cpu_and_traffic"
    }
  ]
}
```

---

#### `POST /ai/forecast`
Generates time-series cost projections with 95% confidence bands using Prophet regression logic.

**Request:**
```bash
curl -X POST http://localhost:3000/ai/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "costs": [
      { "date": "2026-01-01", "cloud": "AWS", "total_cost": 820 },
      { "date": "2026-02-01", "cloud": "AWS", "total_cost": 845 },
      { "date": "2026-03-01", "cloud": "AWS", "total_cost": 870 },
      { "date": "2026-04-01", "cloud": "AWS", "total_cost": 910 }
    ],
    "periods": 3
  }'
```

**Response:**
```json
{
  "forecast": [
    {
      "date": "2026-05-01",
      "predicted_cost": 940.00,
      "lower_bound": 915.20,
      "upper_bound": 964.80
    },
    {
      "date": "2026-06-01",
      "predicted_cost": 970.00,
      "lower_bound": 938.50,
      "upper_bound": 1001.50
    },
    {
      "date": "2026-07-01",
      "predicted_cost": 1000.00,
      "lower_bound": 961.00,
      "upper_bound": 1039.00
    }
  ]
}
```

---

#### `POST /ai/recommendations`
Evaluates resource efficiency to produce prioritized cost optimization actions.

**Request:**
```bash
curl -X POST http://localhost:3000/ai/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "resources": [
      {
        "resource_id": "aws-vm-underutilized",
        "resource_type": "EC2",
        "cpu_utilization": 12,
        "total_cost": 450
      },
      {
        "resource_id": "aws-vm-heavy",
        "resource_type": "EC2",
        "cpu_utilization": 91,
        "total_cost": 1100
      }
    ]
  }'
```

**Response:**
```json
{
  "recommendations": [
    {
      "resource_id": "aws-vm-underutilized",
      "resource_type": "EC2",
      "recommendation": "Consider rightsizing or reducing resource capacity.",
      "reason": "CPU utilization is low at 12% while the resource has a cost of 450.",
      "priority": "MEDIUM",
      "optimization_type": "RIGHT_SIZING",
      "optimization_action": "Consider reducing resource capacity",
      "estimated_saving_usd": 135.00
    },
    {
      "resource_id": "aws-vm-heavy",
      "resource_type": "EC2",
      "recommendation": "Consider scaling up or resizing the resource.",
      "reason": "CPU utilization is high at 91%.",
      "priority": "HIGH",
      "optimization_type": "SCALE_UP_REQUIRED",
      "optimization_action": "Resource is heavily utilized; scaling may be required",
      "estimated_saving_usd": 0.00
    }
  ]
}
```

---

#### `POST /ai/analyze`
Executes the comprehensive pipeline combining anomalies, cost forecasting, and rightsizing in a single round-trip.

---

## Data Models & Schemas

Key TypeScript interfaces (`src/types/cloudwise.ts`):

```typescript
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
```

---

## Getting Started

### Prerequisites

- **Node.js**: Version 22.x or higher
- **npm**: Version 10.x or higher

### Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/sarthakjalan05/CloudWise-AI.git
cd CloudWise-AI
npm install
```

### Running the Development Server

Start the full-stack server (Express backend + Vite React dev middleware):

```bash
npm run dev
```

Open your browser at `http://localhost:3000`.

### Building for Production

Compile TypeScript and build the static frontend bundle:

```bash
npm run build
npm start
```

---

## Configuration & Environment Variables

Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `3000` | HTTP port on which the Express server and Vite application listen |
| `NODE_ENV` | `development` | Runtime mode (`development` or `production`) |

---

## Project Directory Structure

```text
├── index.html                   # HTML entry point with metadata
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler & Tailwind v4 plugin
├── server.ts                    # Express server entry point (port 3000)
├── .env.example                 # Environment configuration template
├── README.md                    # Project documentation
└── src/
    ├── main.tsx                 # React application entry point
    ├── App.tsx                  # Main layout, tab navigation & state
    ├── index.css                # Tailwind CSS v4 directives
    ├── vite-env.d.ts            # Vite client ambient types
    ├── types/
    │   └── cloudwise.ts         # Shared interfaces & data types
    ├── components/
    │   ├── OverviewTab.tsx      # Spend KPIs, cloud breakdown & summaries
    │   ├── AnomaliesTab.tsx     # Isolation Forest anomaly scanner
    │   ├── ForecastTab.tsx      # Prophet cost forecast & SVG chart
    │   ├── RecommendationsTab.tsx # Rightsizing savings hub & actions
    │   ├── ResourcesTab.tsx     # Multi-cloud inventory explorer
    │   ├── ApiConsoleTab.tsx    # Live REST API playground & cURL export
    │   └── AddResourceModal.tsx # New resource registration dialog
    └── server/
        └── services/
            ├── cloudService.ts          # In-memory resource storage & seeds
            ├── anomalyService.ts        # Isolation Forest scoring model
            ├── forecastService.ts       # Prophet time-series regression
            └── recommendationService.ts # Rightsizing heuristic rules
```

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.
