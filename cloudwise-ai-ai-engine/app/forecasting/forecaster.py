import pandas as pd
from prophet import Prophet


def forecast_cost(
    df: pd.DataFrame,
    periods: int = 3
) -> pd.DataFrame:
    """
    Forecast future cloud costs using Prophet.

    Parameters:
        df: DataFrame containing 'date' and 'total_cost'.
        periods: Number of future periods to forecast.

    Returns:
        DataFrame containing future dates and predicted costs.
    """

    required_columns = {"date", "total_cost"}

    if not required_columns.issubset(df.columns):
        raise ValueError(
            "DataFrame must contain 'date' and 'total_cost' columns."
        )

    if df.empty:
        raise ValueError("DataFrame cannot be empty.")

    data = df[["date", "total_cost"]].copy()

    data["date"] = pd.to_datetime(data["date"])

    data = data.rename(
        columns={
            "date": "ds",
            "total_cost": "y"
        }
    )

    model = Prophet()

    model.fit(data)

    future = model.make_future_dataframe(
        periods=periods,
        freq="MS"
    )

    forecast = model.predict(future)

    result = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(periods)

    result = result.rename(
        columns={
            "ds": "date",
            "yhat": "predicted_cost",
            "yhat_lower": "lower_bound",
            "yhat_upper": "upper_bound"
        }
    )

    result["predicted_cost"] = result["predicted_cost"].round(2)
    result["lower_bound"] = result["lower_bound"].round(2)
    result["upper_bound"] = result["upper_bound"].round(2)

    return result.reset_index(drop=True)
