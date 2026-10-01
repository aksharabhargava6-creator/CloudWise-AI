import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
import joblib
import os


# -----------------------------
# 1. Load dataset
# -----------------------------

DATA_PATH = "data/sample_metrics.csv"

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully")
print("Shape:", df.shape)


# -----------------------------
# 2. Select ML features
# -----------------------------

features = [
    "cpu_utilization",
    "memory_utilization",
    "storage_utilization",
    "network_in_mb",
    "network_out_mb",
    "cost_usd"
]

X = df[features].copy()


# -----------------------------
# 3. Scale numerical features
# -----------------------------

scaler = StandardScaler()

X_scaled = scaler.fit_transform(X)


# -----------------------------
# 4. Train Isolation Forest
# -----------------------------

model = IsolationForest(
    n_estimators=200,
    contamination=0.038,
    random_state=42
)

model.fit(X_scaled)


# -----------------------------
# 5. Predict anomalies
# -----------------------------

df["anomaly_prediction"] = model.predict(X_scaled)

df["anomaly_score"] = model.decision_function(X_scaled)


# Isolation Forest:
# -1 = anomaly
#  1 = normal

df["is_anomaly"] = df["anomaly_prediction"].apply(
    lambda x: 1 if x == -1 else 0
)


# -----------------------------
# 6. Display results
# -----------------------------

print("\nDetection results:")
print(df["is_anomaly"].value_counts())

print("\nKnown anomaly records:")
print(
    df[df["anomaly_type"] != "normal"][
        [
            "resource_id",
            "anomaly_type",
            "anomaly_score",
            "is_anomaly"
        ]
    ].to_string(index=False)
)


# -----------------------------
# 7. Save trained model
# -----------------------------

os.makedirs("models", exist_ok=True)

joblib.dump(model, "models/isolation_forest.pkl")
joblib.dump(scaler, "models/scaler.pkl")

print("\nModel saved:")
print("models/isolation_forest.pkl")
print("models/scaler.pkl")


# -----------------------------
# 8. Save predictions
# -----------------------------

os.makedirs("data/output", exist_ok=True)

df.to_csv(
    "data/output/anomaly_results.csv",
    index=False
)

print("\nResults saved:")
print("data/output/anomaly_results.csv")