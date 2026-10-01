import pandas as pd
import os


INPUT_PATH = "data/output/risk_analysis.csv"
OUTPUT_PATH = "data/output/cost_optimization.csv"


# ---------------------------------------
# Load risk analysis
# ---------------------------------------

df = pd.read_csv(INPUT_PATH)

print("Loaded risk analysis:", df.shape)


# ---------------------------------------
# Cost optimization logic
# ---------------------------------------

def calculate_optimization(row):

    cpu = row["cpu_utilization"]
    memory = row["memory_utilization"]
    status = row["status"]
    cost = row["cost_usd"]
    anomaly_type = row["anomaly_type"]

    # Stopped resource still generating cost
    if status == "stopped" and cost > 0:

        estimated_saving = cost

        return pd.Series([
            "STOPPED_RESOURCE",
            "Investigate termination or cleanup",
            estimated_saving
        ])

    # Very low utilization
    elif cpu < 10 and memory < 20:

        estimated_saving = cost * 0.30

        return pd.Series([
            "RIGHT_SIZING",
            "Consider reducing resource capacity",
            estimated_saving
        ])

    # High utilization
    elif cpu >= 90 and memory >= 90:

        return pd.Series([
            "SCALE_UP_REQUIRED",
            "Resource is heavily utilized; scaling may be required",
            0.0
        ])

    # Storage pressure
    elif row["storage_utilization"] >= 90:

        return pd.Series([
            "STORAGE_OPTIMIZATION",
            "Review storage usage and remove unnecessary data",
            cost * 0.10
        ])

    # No optimization opportunity
    else:

        return pd.Series([
            "MONITOR",
            "No immediate cost optimization action",
            0.0
        ])


# ---------------------------------------
# Apply optimization analysis
# ---------------------------------------

df[
    [
        "optimization_type",
        "optimization_action",
        "estimated_saving_usd"
    ]
] = df.apply(calculate_optimization, axis=1)


# ---------------------------------------
# Focus on detected anomalies
# ---------------------------------------

optimization_records = df[df["is_anomaly"] == 1].copy()


# ---------------------------------------
# Display results
# ---------------------------------------

print("\nCost Optimization Opportunities:")

print(
    optimization_records[
        [
            "resource_id",
            "cloud",
            "anomaly_type",
            "cost_usd",
            "optimization_type",
            "optimization_action",
            "estimated_saving_usd"
        ]
    ].to_string(index=False)
)


# ---------------------------------------
# Calculate total potential savings
# ---------------------------------------

total_savings = optimization_records[
    "estimated_saving_usd"
].sum()

print("\nEstimated potential savings:")
print(f"${total_savings:.4f}")


# ---------------------------------------
# Optimization summary
# ---------------------------------------

print("\nOptimization summary:")

print(
    optimization_records[
        "optimization_type"
    ].value_counts()
)


# ---------------------------------------
# Save results
# ---------------------------------------

os.makedirs("data/output", exist_ok=True)

df.to_csv(
    OUTPUT_PATH,
    index=False
)

print("\nCost optimization results saved to:")
print(OUTPUT_PATH)