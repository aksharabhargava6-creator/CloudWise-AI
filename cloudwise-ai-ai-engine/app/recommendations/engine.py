import pandas as pd


def generate_recommendations(df: pd.DataFrame) -> list:
    """
    Generate cloud cost optimization recommendations
    based on resource utilization and cost.

    Expected columns:
        resource_id
        resource_type
        cpu_utilization
        total_cost
    """

    required_columns = {
        "resource_id",
        "resource_type",
        "cpu_utilization",
        "total_cost"
    }

    if not required_columns.issubset(df.columns):
        missing = required_columns - set(df.columns)
        raise ValueError(
            f"DataFrame is missing required columns: {missing}"
        )

    if df.empty:
        raise ValueError("DataFrame cannot be empty.")

    recommendations = []

    for _, row in df.iterrows():

        resource_id = row["resource_id"]
        resource_type = row["resource_type"]
        cpu = row["cpu_utilization"]
        cost = row["total_cost"]

        # High utilization
        if cpu >= 80:
            recommendations.append({
                "resource_id": resource_id,
                "resource_type": resource_type,
                "recommendation": "Consider scaling up or resizing the resource.",
                "reason": f"CPU utilization is high at {cpu}%.",
                "priority": "HIGH"
            })

        # Low utilization + cost
        elif cpu <= 20 and cost > 0:
            recommendations.append({
                "resource_id": resource_id,
                "resource_type": resource_type,
                "recommendation": "Consider rightsizing or reducing resource capacity.",
                "reason": f"CPU utilization is low at {cpu}% while the resource has a cost of {cost}.",
                "priority": "MEDIUM"
            })

        # Moderate utilization
        else:
            recommendations.append({
                "resource_id": resource_id,
                "resource_type": resource_type,
                "recommendation": "Resource utilization appears normal.",
                "reason": f"CPU utilization is {cpu}%.",
                "priority": "LOW"
            })

    return recommendations
