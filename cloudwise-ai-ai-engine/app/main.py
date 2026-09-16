import pandas as pd
from fastapi import FastAPI

from app.services.analysis_service import analyze_cloud_data
from app.anomaly.detector import detect_cpu_anomalies
from app.forecasting.forecaster import forecast_cost
from app.recommendations.engine import generate_recommendations

from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    MetricsRequest,
    CostsRequest,
    ResourcesRequest,
    AnomalyResponse,
    ForecastResponse,
    RecommendationResponse
)


app = FastAPI(
    title="CloudWise AI Engine",
    description="AI-based cloud analytics and cost optimization service",
    version="1.0.0"
)


@app.get("/")
def root():
    return {
        "message": "CloudWise AI Engine is running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/ai/analyze", response_model=AnalysisResponse)
def analyze(request: AnalysisRequest):

    metrics_df = pd.DataFrame(
        [item.model_dump() for item in request.metrics]
    )

    cost_df = pd.DataFrame(
        [item.model_dump() for item in request.costs]
    )

    recommendation_df = pd.DataFrame(
        [item.model_dump() for item in request.resources]
    )

    result = analyze_cloud_data(
        metrics_df=metrics_df,
        cost_df=cost_df,
        recommendation_df=recommendation_df,
        forecast_periods=3
    )

    for item in result["forecast"]:
        item["date"] = str(item["date"])

    return result


@app.post(
    "/ai/anomalies",
    response_model=AnomalyResponse
)
def anomalies(request: MetricsRequest):

    metrics_df = pd.DataFrame(
        [item.model_dump() for item in request.metrics]
    )

    anomaly_result = detect_cpu_anomalies(
        metrics_df
    )

    anomalies = anomaly_result[
        anomaly_result["anomaly"] == True
    ].to_dict(orient="records")

    return {
        "anomalies": anomalies
    }


@app.post(
    "/ai/forecast",
    response_model=ForecastResponse
)
def forecast(request: CostsRequest):

    cost_df = pd.DataFrame(
        [item.model_dump() for item in request.costs]
    )

    forecast_result = forecast_cost(
        cost_df,
        periods=3
    )

    forecast = forecast_result.to_dict(
        orient="records"
    )

    for item in forecast:
        item["date"] = str(item["date"])

    return {
        "forecast": forecast
    }


@app.post(
    "/ai/recommendations",
    response_model=RecommendationResponse
)
def recommendations(request: ResourcesRequest):

    recommendation_df = pd.DataFrame(
        [item.model_dump() for item in request.resources]
    )

    recommendation_result = generate_recommendations(
        recommendation_df
    )

    return {
        "recommendations": recommendation_result
    }