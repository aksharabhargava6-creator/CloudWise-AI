from pydantic import BaseModel
from typing import List


class MetricData(BaseModel):
    timestamp: str
    cloud: str
    resource_id: str
    resource_type: str
    cpu_utilization: float


class CostData(BaseModel):
    date: str
    cloud: str
    total_cost: float


class ResourceData(BaseModel):
    resource_id: str
    resource_type: str
    cpu_utilization: float
    total_cost: float


class MetricsRequest(BaseModel):
    metrics: List[MetricData]


class CostsRequest(BaseModel):
    costs: List[CostData]


class ResourcesRequest(BaseModel):
    resources: List[ResourceData]


class AnalysisRequest(BaseModel):
    metrics: List[MetricData]
    costs: List[CostData]
    resources: List[ResourceData]


class Anomaly(BaseModel):
    timestamp: str
    cloud: str
    resource_id: str
    resource_type: str
    cpu_utilization: float
    anomaly: bool
    anomaly_score: float


class Forecast(BaseModel):
    date: str
    predicted_cost: float
    lower_bound: float
    upper_bound: float


class Recommendation(BaseModel):
    resource_id: str
    resource_type: str
    recommendation: str
    reason: str
    priority: str


class AnalysisResponse(BaseModel):
    anomalies: List[Anomaly]
    forecast: List[Forecast]
    recommendations: List[Recommendation]


class AnomalyResponse(BaseModel):
    anomalies: List[Anomaly]


class ForecastResponse(BaseModel):
    forecast: List[Forecast]


class RecommendationResponse(BaseModel):
    recommendations: List[Recommendation]