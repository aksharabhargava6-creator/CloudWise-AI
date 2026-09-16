import pandas as pd
from sklearn.ensemble import IsolationForest


def detect_cpu_anomalies(
    df: pd.DataFrame,
    contamination: float = 0.05
) -> pd.DataFrame:
    """
    Detect unusual CPU utilization values using Isolation Forest.

    Parameters:
        df: DataFrame containing a 'cpu_utilization' column.
        contamination: Expected proportion of anomalies.

    Returns:
        DataFrame containing anomaly predictions and scores.
    """

    if "cpu_utilization" not in df.columns:
        raise ValueError(
            "DataFrame must contain 'cpu_utilization' column."
        )

    if df.empty:
        raise ValueError(
            "DataFrame cannot be empty."
        )

    if not 0 < contamination <= 0.5:
        raise ValueError(
            "Contamination must be between 0 and 0.5."
        )

    model = IsolationForest(
        contamination=contamination,
        random_state=42
    )

    values = df[["cpu_utilization"]]

    predictions = model.fit_predict(values)
    scores = model.decision_function(values)

    result = df.copy()

    result["anomaly"] = predictions == -1
    result["anomaly_score"] = scores

    return result