import pandas as pd

from app.services.analysis_service import analyze_cloud_data


def test_analyze_cloud_data():

    metrics_df = pd.read_csv(
        "data/sample_metrics.csv"
    )

    cost_df = pd.read_csv(
        "data/sample_costs.csv"
    )

    recommendation_df = pd.read_csv(
        "data/sample_recommendations.csv"
    )

    result = analyze_cloud_data(
        metrics_df=metrics_df,
        cost_df=cost_df,
        recommendation_df=recommendation_df,
        forecast_periods=3
    )

    assert "anomalies" in result
    assert "forecast" in result
    assert "recommendations" in result

    assert len(result["anomalies"]) == 2
    assert len(result["forecast"]) == 3
    assert len(result["recommendations"]) == 4