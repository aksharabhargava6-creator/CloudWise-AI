import pandas as pd

from app.anomaly.detector import detect_cpu_anomalies
from app.forecasting.forecaster import forecast_cost
from app.recommendations.engine import generate_recommendations


def analyze_cloud_data(
    metrics_df: pd.DataFrame,
    cost_df: pd.DataFrame,
    recommendation_df: pd.DataFrame,
    forecast_periods: int = 3
) -> dict:
    """
    Run anomaly detection, cost forecasting,
    and cost optimization recommendations.
    """

    if metrics_df.empty:
        raise ValueError("Metrics data cannot be empty.")

    if cost_df.empty:
        raise ValueError("Cost data cannot be empty.")

    if recommendation_df.empty:
        raise ValueError("Recommendation data cannot be empty.")

    # 1. Detect anomalies
    anomaly_result = detect_cpu_anomalies(metrics_df)

    # 2. Forecast future costs
    forecast_result = forecast_cost(
        cost_df,
        periods=forecast_periods
    )

    # 3. Generate cost optimization recommendations
    recommendation_result = generate_recommendations(
        recommendation_df
    )

    anomalies = anomaly_result[
        anomaly_result["anomaly"] == True
    ].to_dict(orient="records")

    forecast = forecast_result.to_dict(
        orient="records"
    )

    return {
        "anomalies": anomalies,
        "forecast": forecast,
        "recommendations": recommendation_result
    }