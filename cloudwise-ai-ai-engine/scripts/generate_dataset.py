import pandas as pd
import numpy as np
from pathlib import Path

INPUT_PATH = Path("data/sample_metrics.csv")
OUTPUT_PATH = Path("data/sample_metrics.csv")

RANDOM_STATE = 42
rng = np.random.default_rng(RANDOM_STATE)

# Load the existing 500 records
existing = pd.read_csv(INPUT_PATH)

print("Existing dataset:", existing.shape)

# We want 3,000 NEW records
NEW_RECORDS = 3000

clouds = ["AWS", "Azure", "GCP"]

resource_prefixes = {
    "AWS": ["ec2", "rds", "ebs", "lambda"],
    "Azure": ["vm", "sql", "disk", "function"],
    "GCP": ["ce", "sql", "disk", "function"]
}

resource_types = ["compute", "database", "storage", "serverless"]

new_rows = []

start_index = len(existing) + 1

for i in range(NEW_RECORDS):

    cloud = clouds[i % 3]

    resource_type = rng.choice(resource_types)
    prefix = rng.choice(resource_prefixes[cloud])

    resource_id = f"{cloud.lower()}-{prefix}-{start_index + i:04d}"

    # Spread timestamps across a realistic period
    timestamp = (
        pd.Timestamp("2026-01-01")
        + pd.Timedelta(hours=int(i * 3))
    )

    # Generate normal cloud-resource behaviour
    cpu = float(np.clip(rng.normal(45, 18), 2, 98))
    memory = float(np.clip(rng.normal(50, 18), 5, 98))
    storage = float(np.clip(rng.normal(48, 20), 5, 98))

    network_in = float(np.clip(rng.normal(450, 180), 20, 1200))
    network_out = float(np.clip(rng.normal(400, 160), 20, 1100))

    cost = float(
        np.clip(
            0.03
            + cpu * 0.0015
            + memory * 0.0008
            + network_in * 0.00002
            + network_out * 0.00002
            + rng.normal(0, 0.015),
            0.01,
            2.50
        )
    )

    status = "running"
    anomaly_type = "normal"

    # Approximately 4% labelled anomalies.
    # These labels are NOT used to train Isolation Forest.
    anomaly_probability = rng.random()

    if anomaly_probability < 0.012:
        # High CPU + traffic anomaly
        cpu = float(rng.uniform(93, 100))
        memory = float(rng.uniform(65, 95))
        network_in = float(rng.uniform(1100, 1800))
        network_out = float(rng.uniform(1000, 1700))
        anomaly_type = "high_cpu_and_traffic"

    elif anomaly_probability < 0.022:
        # Underutilized resource
        cpu = float(rng.uniform(1, 8))
        memory = float(rng.uniform(5, 18))
        anomaly_type = "underutilized"

    elif anomaly_probability < 0.032:
        # Stopped resource still costing money
        cpu = float(rng.uniform(0, 5))
        memory = float(rng.uniform(0, 10))
        status = "stopped"
        cost = float(rng.uniform(0.20, 1.20))
        anomaly_type = "stopped_with_cost"

    elif anomaly_probability < 0.039:
        # Storage pressure
        storage = float(rng.uniform(92, 100))
        anomaly_type = "storage_pressure"

    elif anomaly_probability < 0.040:
        # High overall utilization
        cpu = float(rng.uniform(91, 99))
        memory = float(rng.uniform(91, 99))
        anomaly_type = "high_utilization"

    new_rows.append([
        timestamp,
        cloud,
        resource_id,
        resource_type,
        round(cpu, 2),
        round(memory, 2),
        round(storage, 2),
        round(network_in, 2),
        round(network_out, 2),
        round(cost, 4),
        status,
        anomaly_type
    ])


columns = [
    "timestamp",
    "cloud",
    "resource_id",
    "resource_type",
    "cpu_utilization",
    "memory_utilization",
    "storage_utilization",
    "network_in_mb",
    "network_out_mb",
    "cost_usd",
    "status",
    "anomaly_type"
]

new_df = pd.DataFrame(new_rows, columns=columns)

# Combine old + new data
combined = pd.concat([existing, new_df], ignore_index=True)

# Remove accidental duplicate resource IDs if any
combined = combined.drop_duplicates(subset=["resource_id"], keep="first")

# Save
combined.to_csv(OUTPUT_PATH, index=False)

print("\nDataset generated successfully.")
print("New records:", len(new_df))
print("Final dataset shape:", combined.shape)

print("\nCloud distribution:")
print(combined["cloud"].value_counts())

print("\nAnomaly labels:")
print(combined["anomaly_type"].value_counts())

print("\nSaved to:")
print(OUTPUT_PATH)
