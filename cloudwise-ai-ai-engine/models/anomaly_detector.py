import os

import joblib
import numpy as np
import pandas as pd

from sklearn.ensemble import IsolationForest
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    confusion_matrix
)
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler


DATA_PATH = "data/sample_metrics.csv"

MODEL_PATH = "models/isolation_forest.pkl"
SCALER_PATH = "models/scaler.pkl"

OUTPUT_PATH = "data/output/anomaly_results.csv"


# ---------------------------------------------------------
# 1. Load dataset
# ---------------------------------------------------------

df = pd.read_csv(DATA_PATH)

print("Dataset loaded successfully")
print("Shape:", df.shape)


# ---------------------------------------------------------
# 2. Select numerical features
# ---------------------------------------------------------

features = [
    "cpu_utilization",
    "memory_utilization",
    "storage_utilization",
    "network_in_mb",
    "network_out_mb",
    "cost_usd"
]

X = df[features].copy()


# ---------------------------------------------------------
# 3. Create evaluation labels
# ---------------------------------------------------------
#
# Isolation Forest is UNSUPERVISED.
#
# These labels are NOT used as model input.
# They are only used after prediction to evaluate
# how well the anomaly detector performed.
#
# normal       -> 0
# anything else -> 1
# ---------------------------------------------------------

y = (df["anomaly_type"] != "normal").astype(int)


# ---------------------------------------------------------
# 4. Stratified 80/20 train-test split
# ---------------------------------------------------------
#
# 80% = training
# 20% = testing
#
# Stratification keeps the normal/anomaly proportion
# approximately consistent in both sets.
# ---------------------------------------------------------

X_train, X_test, y_train, y_test, index_train, index_test = train_test_split(
    X,
    y,
    df.index,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTrain/Test split:")
print("Training records:", len(X_train))
print("Testing records:", len(X_test))

print("\nTraining label distribution:")
print(y_train.value_counts())

print("\nTesting label distribution:")
print(y_test.value_counts())


# ---------------------------------------------------------
# 5. Scale features
# ---------------------------------------------------------
#
# IMPORTANT:
# The scaler is fitted ONLY on training data.
#
# Test data is transformed using the already-fitted scaler.
# ---------------------------------------------------------

scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)


# ---------------------------------------------------------
# 6. Train Isolation Forest
# ---------------------------------------------------------
#
# Isolation Forest is unsupervised.
#
# The model sees only X_train_scaled.
# It does NOT see y_train.
# ---------------------------------------------------------

model = IsolationForest(
    n_estimators=200,
    contamination=0.04,
    random_state=42
)

model.fit(X_train_scaled)


# ---------------------------------------------------------
# 7. Predict on unseen test data
# ---------------------------------------------------------

test_predictions = model.predict(X_test_scaled)

test_anomaly_prediction = np.where(
    test_predictions == -1,
    1,
    0
)


# ---------------------------------------------------------
# 8. Evaluate test-set performance
# ---------------------------------------------------------

test_accuracy = accuracy_score(
    y_test,
    test_anomaly_prediction
)

test_precision = precision_score(
    y_test,
    test_anomaly_prediction,
    zero_division=0
)

test_recall = recall_score(
    y_test,
    test_anomaly_prediction,
    zero_division=0
)

test_f1 = f1_score(
    y_test,
    test_anomaly_prediction,
    zero_division=0
)

cm = confusion_matrix(
    y_test,
    test_anomaly_prediction
)


print("\n==============================")
print("TEST-SET EVALUATION")
print("==============================")

print(f"Test Accuracy : {test_accuracy * 100:.2f}%")
print(f"Test Precision: {test_precision * 100:.2f}%")
print(f"Test Recall   : {test_recall * 100:.2f}%")
print(f"Test F1 Score : {test_f1 * 100:.2f}%")

print("\nConfusion Matrix:")
print(cm)


# ---------------------------------------------------------
# 9. Generate predictions for the complete dataset
# ---------------------------------------------------------
#
# This is useful for the downstream Part 4 pipeline.
#
# The MODEL was trained only on X_train.
# We are now using that trained model to score
# all 3,500 records.
# ---------------------------------------------------------

X_all_scaled = scaler.transform(X)

all_predictions = model.predict(X_all_scaled)

df["anomaly_prediction"] = all_predictions

df["is_anomaly"] = np.where(
    df["anomaly_prediction"] == -1,
    1,
    0
)

df["anomaly_score"] = model.decision_function(
    X_all_scaled
)


# ---------------------------------------------------------
# 10. Print detection summary
# ---------------------------------------------------------

print("\n==============================")
print("FULL DATASET DETECTION")
print("==============================")

print(df["is_anomaly"].value_counts())

print("\nDetected anomalies:")
print(
    df[df["is_anomaly"] == 1][
        [
            "resource_id",
            "cloud",
            "anomaly_type",
            "anomaly_score",
            "is_anomaly"
        ]
    ].to_string(index=False)
)


# ---------------------------------------------------------
# 11. Save trained model and scaler
# ---------------------------------------------------------

os.makedirs("models", exist_ok=True)

joblib.dump(
    model,
    MODEL_PATH
)

joblib.dump(
    scaler,
    SCALER_PATH
)

print("\nModel saved:")
print(MODEL_PATH)

print("Scaler saved:")
print(SCALER_PATH)


# ---------------------------------------------------------
# 12. Save anomaly results
# ---------------------------------------------------------

os.makedirs("data/output", exist_ok=True)

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nResults saved:")
print(OUTPUT_PATH)
