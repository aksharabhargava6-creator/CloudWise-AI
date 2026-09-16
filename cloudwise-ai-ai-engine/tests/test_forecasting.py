import pandas as pd

from app.forecasting.forecaster import forecast_cost


def test_forecast_cost():
    df = pd.read_csv("data/sample_costs.csv")

    result = forecast_cost(
        df,
        periods=3
    )

    assert len(result) == 3

    assert "date" in result.columns
    assert "predicted_cost" in result.columns
    assert "lower_bound" in result.columns
    assert "upper_bound" in result.columns

    assert (result["predicted_cost"] > 0).all()