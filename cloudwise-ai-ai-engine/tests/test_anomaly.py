import pandas as pd

from app.anomaly.detector import detect_cpu_anomalies


def test_detect_cpu_anomalies():
    df = pd.read_csv("data/sample_metrics.csv")

    result = detect_cpu_anomalies(df)

    anomalies = result[result["anomaly"]]

    assert len(anomalies) == 2
    assert 96 in anomalies["cpu_utilization"].values
    assert 98 in anomalies["cpu_utilization"].values