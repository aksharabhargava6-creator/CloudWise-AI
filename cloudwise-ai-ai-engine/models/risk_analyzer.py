import pandas as pd
import os


INPUT_PATH = "data/output/anomaly_results.csv"
OUTPUT_PATH = "data/output/risk_analysis.csv"


# ---------------------------------------
# Load anomaly detection results
# ---------------------------------------

df = pd.read_csv(INPUT_PATH)

print("Loaded anomaly results:", df.shape)


# ---------------------------------------
# Risk and recommendation logic
# ---------------------------------------

def analyze_risk(row):

    anomaly_type = row["anomaly_type"]
    cpu = row["cpu_utilization"]
    memory = row["memory_utilization"]
    storage = row["storage_utilization"]
    status = row["status"]
    cost = row["cost_usd"]

    # -----------------------------------
    # Known anomaly categories
    # -----------------------------------

    if anomaly_type == "high_cpu_and_traffic":
        return pd.Series([
            "HIGH",
            "High CPU and network traffic",
            "Investigate workload and consider scaling resources"
        ])

    elif anomaly_type == "stopped_with_cost":
        return pd.Series([
            "HIGH",
            "Resource is stopped but still generating cost",
            "Investigate billing and remove or right-size unused resources"
        ])

    elif anomaly_type == "storage_pressure":
        return pd.Series([
            "HIGH",
            "Storage utilization is critically high",
            "Clean up unused storage or increase storage capacity"
        ])

    elif anomaly_type == "high_utilization":
        return pd.Series([
            "HIGH",
            "CPU and memory utilization are high",
            "Consider scaling or increasing resource capacity"
        ])

    elif anomaly_type == "underutilized":
        return pd.Series([
            "MEDIUM",
            "Resource has very low CPU and memory utilization",
            "Consider right-sizing or reducing allocated capacity"
        ])

    # -----------------------------------
    # Additional rule-based detection
    # -----------------------------------

    elif storage >= 90:
        return pd.Series([
            "HIGH",
            "Storage utilization exceeds 90%",
            "Review storage usage and increase capacity if required"
        ])

    elif cpu >= 90 and memory >= 90:
        return pd.Series([
            "HIGH",
            "CPU and memory utilization exceed 90%",
            "Consider scaling the resource"
        ])

    elif status == "stopped" and cost > 0:
        return pd.Series([
            "HIGH",
            "Stopped resource continues to incur cost",
            "Investigate whether the resource can be removed"
        ])

    elif cpu < 10 and memory < 20:
        return pd.Series([
            "MEDIUM",
            "Very low resource utilization",
            "Consider right-sizing the resource"
        ])

    else:
        return pd.Series([
            "LOW",
            "No critical resource condition identified",
            "Continue monitoring"
        ])


# ---------------------------------------
# Apply risk analysis
# ---------------------------------------

df[
    [
        "risk_level",
        "risk_reason",
        "recommendation"
    ]
] = df.apply(analyze_risk, axis=1)


# ---------------------------------------
# Keep anomaly records for analysis
# ---------------------------------------

anomalies = df[df["is_anomaly"] == 1].copy()


# ---------------------------------------
# Display results
# ---------------------------------------

print("\nRisk Analysis:")
print(
    anomalies[
        [
            "resource_id",
            "cloud",
            "anomaly_type",
            "anomaly_score",
            "risk_level",
            "risk_reason",
            "recommendation"
        ]
    ].to_string(index=False)
)


# ---------------------------------------
# Risk summary
# ---------------------------------------

print("\nRisk summary:")
print(anomalies["risk_level"].value_counts())


# ---------------------------------------
# Save results
# ---------------------------------------

os.makedirs("data/output", exist_ok=True)

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nRisk analysis saved to:")
print(OUTPUT_PATH)