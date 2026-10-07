
/












Readme · MD
# CloudWise-AI
 
> **Multi-Cloud Resource Intelligence, Anomaly Detection & Automated Cost Optimization Platform**
 
[![Runtime](https://img.shields.io/badge/Runtime-Node.js%2022-brightgreen.svg)](https://nodejs.org/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%20%2B%20Tailwind%20CSS-blue.svg)](https://vitejs.dev/)
[![Backend](https://img.shields.io/badge/Backend-Express%205%20%2B%20FastAPI-blueviolet.svg)](https://expressjs.com/)
[![Database](https://img.shields.io/badge/Database-SQL%20Server-red.svg)](https://www.microsoft.com/sql-server)
[![Clouds](https://img.shields.io/badge/Clouds-AWS%20|%20Azure%20|%20GCP-orange.svg)](#multi-cloud-inventory-explorer)
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
  - [1. Database (SQL Server)](#1-database-sql-server)
  - [2. Backend (FastAPI)](#2-backend-fastapi)
  - [3. Frontend + Express](#3-frontend--express)
  - [Building for Production](#building-for-production)
  - [Troubleshooting](#troubleshooting)
- [Configuration & Environment Variables](#configuration--environment-variables)
- [Project Directory Structure](#project-directory-structure)
- [License](#license)
---
 
## Executive Summary
 
Cloud spending across modern enterprises is often fragmented across multiple hyperscalers (Amazon Web Services, Microsoft Azure, Google Cloud Platform), resulting in:
 
- **Unidentified Idle Resources**: Staged or orphaned VMs and storage volumes continuing to accrue baseline charges.
- **Unexpected Budget Surges**: Sudden traffic bursts or misconfigured batch jobs driving unanticipated monthly cloud overages.
- **Suboptimal Capacity Allocation**: Compute instances provisioned with low average CPU (<15%) or critically high disk utilization (>90%).
**CloudWise AI** solves these challenges by combining continuous metric ingestion, unsupervised anomaly detection (Isolation Forest), time-series expenditure forecasting (Prophet), and automated rightsizing recommendations into an intuitive dashboard and developer-friendly REST API. Cloud resources are persisted in a **Microsoft SQL Server** database through a **FastAPI** data layer.
 
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
- **Persistent storage**: added, edited, started/stopped and deleted resources are saved to SQL Server and survive restarts.
- Real-time status toggling (Start / Stop) and capacity lifecycle management.
- Quick-filter toolbar by Cloud Provider, Resource State, and Resource Type.
### 5. Interactive API Playground & Console
 
- In-browser API client for developers to test all REST endpoints directly.
- Pre-loaded payloads from unit test suites for `/ai/analyze`, `/ai/anomalies`, `/ai/forecast`, and `/ai/recommendations`.
- Live response time tracking, HTTP status badges, and one-click cURL snippet export.
---
 
## Architecture & Tech Stack
 
CloudWise AI is split into three layers: a React frontend, an Express API that runs the AI engine, and a FastAPI service that stores data in SQL Server.
 
```text
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  React 19 SPA • Tailwind CSS v4 • Lucide React • Vite HMR   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
┌──────────────────────────────▼──────────────────────────────┐
│               Express 5 API  (server.ts, :3000)             │
│   CORS • JSON Parser • Vite Middleware • Live AWS sync      │
├──────────────────────────────┬──────────────────────────────┤
│                     Service Layer                            │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │     anomalyService      │  │     forecastService      │  │
│  │ (Isolation Forest Model)│  │ (Prophet Decomposition)  │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
│  ┌─────────────────────────┐  ┌──────────────────────────┐  │
│  │  recommendationService  │  │  cloudService + dbClient │  │
│  │ (Rightsizing Heuristics)│  │ (In-memory cache + DB)   │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON (save & load resources)
┌──────────────────────────────▼──────────────────────────────┐
│               FastAPI Data Layer  (backend/, :8000)         │
│            SQLAlchemy 2 • pyodbc • Pydantic                 │
└──────────────────────────────┬──────────────────────────────┘
                               │ ODBC
┌──────────────────────────────▼──────────────────────────────┐
│          Microsoft SQL Server  (database: cloudwise)        │
│                  table: cloud_resources                     │
└─────────────────────────────────────────────────────────────┘
```
 
**How data flows**
 
- On startup, Express loads all resources from SQL Server (through FastAPI) into an in-memory cache, so the AI engine and dashboards stay fast.
- Every add, edit, start/stop and delete is applied to the cache and written to SQL Server.
- Live AWS instances (IDs starting with `i-`) are re-fetched from AWS and are kept in memory only.
- If FastAPI is unreachable, Express falls back to built-in sample data and logs a warning; changes are not saved in that mode.
**Stack**
 
- **Runtime**: Node.js 22 (LTS) and Python 3.10+
- **Frontend**: React 19, Tailwind CSS v4, Lucide Icons
- **API / AI layer**: Express 5 + TypeScript 5.8 on port 3000
- **Data layer**: FastAPI + SQLAlchemy 2 + pyodbc on port 8000
- **Database**: Microsoft SQL Server (Express edition works)
- **Dev Server**: `tsx server.ts` with Vite SPA middleware
---
 
## API Reference
 
All requests and responses use `application/json`. Express (port 3000) is the main API the frontend uses. The FastAPI data layer (port 8000) exposes the same `/api/cloud/resources` routes plus interactive docs at `/docs`.
 
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
 
These endpoints are backed by SQL Server.
 
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
Registers a new multi-cloud asset and saves it to the database.
 
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
Updates status, sizing, or utilization for an existing resource and saves the change.
 
#### `DELETE /api/cloud/resources/:id`
Removes a cloud resource from the application and the database.
 
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
 
**Database table** (`cloud_resources`, created automatically by SQLAlchemy on first start):
 
| Column | Type | Notes |
|:---|:---|:---|
| `id` | `VARCHAR(64)` | Primary key (e.g. `res-aws-01`) |
| `name` | `VARCHAR(200)` | Unique, indexed |
| `provider` | `VARCHAR(20)` | `AWS`, `Azure` or `GCP` |
| `resource_type` | `VARCHAR(100)` | EC2, RDS, Virtual Machine, ... |
| `region` | `VARCHAR(50)` | |
| `status` | `VARCHAR(20)` | `running`, `stopped`, `attached` |
| `instance_type` | `VARCHAR(100)` | Nullable |
| `cpu_utilization`, `memory_utilization`, `storage_utilization` | `FLOAT` | Percent |
| `network_in_mb`, `network_out_mb` | `FLOAT` | |
| `cost_usd`, `monthly_cost` | `FLOAT` | Hourly and monthly (720 h) cost |
| `anomaly_type` | `VARCHAR(50)` | Nullable |
| `created_at`, `updated_at` | `DATETIME` | Server-generated |
 
---
 
## Getting Started
 
You need three things running: SQL Server, the FastAPI backend, and the Express + React app.
 
### Prerequisites
 
- **Node.js**: 22.x or higher, with **npm** 10.x or higher
- **Python**: 3.10 or higher
- **Microsoft SQL Server** (Express edition is fine) and SSMS
- **Microsoft ODBC Driver 18 for SQL Server** ([download](https://learn.microsoft.com/sql/connect/odbc/download-odbc-driver-for-sql-server))
Clone the repository:
 
```bash
git clone https://github.com/sarthakjalan05/CloudWise-AI.git
cd CloudWise-AI
```
 
### 1. Database (SQL Server)
 
1. In SSMS, create an **empty database** named `cloudwise`.
2. If you use a named instance such as `SQLEXPRESS`, make sure the **SQL Server Browser** service is running (Admin PowerShell):
```powershell
   Set-Service SQLBrowser -StartupType Automatic
   Start-Service SQLBrowser
```
 
The tables are created by the backend automatically; you do not write any SQL.
 
### 2. Backend (FastAPI)
 
```powershell
cd backend
copy .env.example .env        # then edit ODBC_CONNECTION for your server
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
 
Wait for `Application startup complete.` On first start the `cloud_resources` table is created and filled with 24 sample resources.
 
Verify it:
 
- http://localhost:8000/health returns `{"status":"healthy"}`
- http://localhost:8000/docs opens the interactive API docs
- http://localhost:8000/api/cloud/resources returns the resources from SQL Server
Leave this terminal running.
 
### 3. Frontend + Express
 
In a second terminal, from the project root:
 
```bash
npm install
npm run dev
```
 
Open http://localhost:3000. The log should say `Loaded 24 resources from database.`
 
Always start the FastAPI backend **before** `npm run dev`.
 
### Building for Production
 
Compile TypeScript and build the static frontend bundle:
 
```bash
npm run build
npm start
```
 
Run the FastAPI backend alongside it (for example `uvicorn app.main:app --port 8000`) and set `DB_API_URL` if it is not on `http://localhost:8000`.
 
### Troubleshooting
 
| Symptom | Likely cause and fix |
|:---|:---|
| `Named Pipes Provider ... error 53` | SQL Server Browser is stopped or the server name is wrong. Start the `SQLBrowser` service and check `Server=` in `backend/.env`. |
| `Login failed` | Wrong SQL login or password, or SQL Server is not in Mixed Mode. Use `Trusted_Connection=yes` for Windows Authentication. |
| `Cannot open database "cloudwise"` | The database does not exist. Create it in SSMS first. |
| `Could not parse SQLAlchemy URL` | `backend/.env` is missing `ODBC_CONNECTION` or has a malformed value. |
| Express logs `Database API unreachable` | FastAPI is not running. Start it, then restart `npm run dev`. |
| `ModuleNotFoundError` in uvicorn | The virtual environment is not active. Run `.venv\Scripts\Activate.ps1`. |
 
---
 
## Configuration & Environment Variables
 
**Root `.env`** (Express)
 
| Variable | Default | Description |
|:---|:---|:---|
| `PORT` | `3000` | HTTP port on which Express and the Vite app listen |
| `NODE_ENV` | `development` | Runtime mode (`development` or `production`) |
| `DB_API_URL` | `http://localhost:8000` | Base URL of the FastAPI data layer |
 
**`backend/.env`** (FastAPI; copy from `backend/.env.example`, never commit it)
 
| Variable | Default | Description |
|:---|:---|:---|
| `ODBC_CONNECTION` | required | SQL Server ODBC connection string |
| `CORS_ORIGINS` | `http://localhost:3000` | Allowed browser origins, comma separated |
| `SEED_DATA` | `true` | Insert the 24 sample resources when the table is empty |
 
Example `ODBC_CONNECTION` values:
 
```env
# Windows Authentication, named instance
ODBC_CONNECTION=Driver={ODBC Driver 18 for SQL Server};Server=localhost\SQLEXPRESS;Database=cloudwise;Trusted_Connection=yes;TrustServerCertificate=yes
 
# SQL login
ODBC_CONNECTION=Driver={ODBC Driver 18 for SQL Server};Server=localhost\SQLEXPRESS;Database=cloudwise;UID=your_user;PWD=your_password;TrustServerCertificate=yes
```
 
---
 
## Project Directory Structure
 
```text
├── index.html                   # HTML entry point with metadata
├── metadata.json                # AI Studio application metadata
├── package.json                 # Project dependencies & npm scripts
├── tsconfig.json                # TypeScript compiler configuration
├── vite.config.ts               # Vite bundler & Tailwind v4 plugin
├── server.ts                    # Express server entry point (port 3000)
├── .env.example                 # Express environment template
├── README.md                    # Project documentation
├── backend/                     # FastAPI + SQL Server data layer (port 8000)
│   ├── requirements.txt         # Python dependencies
│   ├── .env.example             # Backend environment template
│   └── app/
│       ├── main.py              # FastAPI app, CORS, startup
│       ├── config.py            # Settings loaded from backend/.env
│       ├── database.py          # SQLAlchemy engine & session
│       ├── models.py            # cloud_resources table model
│       ├── schemas.py           # Request/response models
│       ├── seed.py              # 24 sample resources
│       └── routers/
│           └── cloud.py         # /api/cloud/resources CRUD
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
            ├── cloudService.ts          # In-memory cache + database sync
            ├── dbClient.ts              # Express -> FastAPI database client
            ├── anomalyService.ts        # Isolation Forest scoring model
            ├── forecastService.ts       # Prophet time-series regression
            └── recommendationService.ts # Rightsizing heuristic rules
```
 
---
 
## License
 
This project is licensed under the MIT License - see the LICENSE file for details.
 

