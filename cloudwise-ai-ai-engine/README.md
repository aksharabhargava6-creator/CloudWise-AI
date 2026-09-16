# CloudWise AI Engine

AI-based analytics and cost optimization module for the CloudWise AI platform.

## Overview

The CloudWise AI Engine processes normalized cloud metrics and cost data provided by the cloud data collection layer.

It provides three main capabilities:

- Anomaly detection for unusual resource utilization
- Cloud cost forecasting
- Cost optimization recommendations

The module is implemented as a Python FastAPI service so that the main CloudWise backend can consume its results through REST APIs.

## Features

### 1. Anomaly Detection

Uses Isolation Forest to identify unusual CPU utilization patterns in cloud resources.

The anomaly detection service returns:

- Resource information
- CPU utilization
- Anomaly status
- Anomaly score

### 2. Cost Forecasting

Uses Prophet to forecast future cloud costs based on historical cost data.

The forecast provides:

- Future date
- Predicted cost
- Lower prediction bound
- Upper prediction bound

### 3. Cost Optimization Recommendations

Generates recommendations based on resource utilization and cost.

Examples include:

- Rightsizing resources with low utilization
- Considering scaling for highly utilized resources
- Identifying normally utilized resources

Recommendations are assigned a priority:

- HIGH
- MEDIUM
- LOW

## Technology Stack

- Python
- FastAPI
- Pandas
- NumPy
- Scikit-learn
- Prophet
- Pytest

## Project Structure

```text
cloudwise-ai-ai-engine/
│
├── app/
│   ├── anomaly/
│   │   └── detector.py
│   │
│   ├── forecasting/
│   │   └── forecaster.py
│   │
│   ├── recommendations/
│   │   └── engine.py
│   │
│   ├── services/
│   │   └── analysis_service.py
│   │
│   ├── models/
│   │   └── schemas.py
│   │
│   └── main.py
│
├── data/
│   ├── sample_metrics.csv
│   ├── sample_costs.csv
│   └── sample_recommendations.csv
│
├── tests/
│   ├── test_anomaly.py
│   ├── test_forecasting.py
│   ├── test_recommendations.py
│   └── test_analysis_service.py
│
├── requirements.txt
├── pytest.ini
└── README.md