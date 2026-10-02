import { MetricData, Anomaly } from '../../types/cloudwise.js';

export function detectCpuAnomalies(
  metrics: MetricData[],
  contamination: number = 0.05
): Anomaly[] {
  if (!metrics || metrics.length === 0) {
    return [];
  }

  // Multi-variate feature extraction:
  // [cpu_utilization, memory_utilization, storage_utilization, network_in_mb, network_out_mb, cost_usd]
  const n = metrics.length;

  const features = metrics.map(m => [
    m.cpu_utilization,
    m.memory_utilization ?? 50,
    m.storage_utilization ?? 50,
    m.network_in_mb ?? 300,
    m.network_out_mb ?? 250,
    m.cost_usd ?? 0.20
  ]);

  // Compute feature means and standard deviations for z-score normalization
  const numFeatures = 6;
  const means: number[] = new Array(numFeatures).fill(0);
  const stds: number[] = new Array(numFeatures).fill(0);

  for (let f = 0; f < numFeatures; f++) {
    const sum = features.reduce((acc, row) => acc + row[f], 0);
    means[f] = sum / n;
    const variance = features.reduce((acc, row) => acc + Math.pow(row[f] - means[f], 2), 0) / (n > 1 ? n - 1 : 1);
    stds[f] = Math.sqrt(variance) || 1;
  }

  // Compute isolation distance for each item
  const rawScores: number[] = features.map(row => {
    let distSq = 0;
    for (let f = 0; f < numFeatures; f++) {
      const z = (row[f] - means[f]) / stds[f];
      // Weight CPU, memory, storage and cost slightly higher
      const weight = f === 0 ? 1.5 : f === 1 ? 1.2 : f === 2 ? 1.3 : f === 5 ? 1.4 : 0.8;
      distSq += Math.pow(z * weight, 2);
    }
    return Math.sqrt(distSq);
  });

  // Cutoff threshold determined by contamination
  const sortedDistances = [...rawScores].sort((a, b) => b - a);
  const cutoffIndex = Math.max(0, Math.floor(n * Math.min(Math.max(contamination, 0.01), 0.5)));
  const distanceThreshold = sortedDistances[cutoffIndex] || 2.5;

  return metrics.map((item, idx) => {
    const cpu = item.cpu_utilization;
    const mem = item.memory_utilization ?? 50;
    const storage = item.storage_utilization ?? 50;
    const netIn = item.network_in_mb ?? 300;
    const cost = item.cost_usd ?? 0.2;
    const status = item.status ?? 'running';

    let isAnomaly = false;
    let anomalyType = 'normal';

    // 1. Explicit rule classification per specification:
    // stopped but cost > 0 = stopped_with_cost
    if (status === 'stopped' && cost > 0) {
      isAnomaly = true;
      anomalyType = 'stopped_with_cost';
    }
    // CPU > 85 and network_in > 800 = high_cpu_and_traffic
    else if (cpu > 85 && netIn > 800) {
      isAnomaly = true;
      anomalyType = 'high_cpu_and_traffic';
    }
    // storage >= 90 = storage_pressure
    else if (storage >= 90) {
      isAnomaly = true;
      anomalyType = 'storage_pressure';
    }
    // CPU >= 90 and memory >= 85 = high_utilization
    else if (cpu >= 90 && mem >= 85) {
      isAnomaly = true;
      anomalyType = 'high_utilization';
    }
    // CPU < 10 and memory < 20 = underutilized
    else if (cpu < 10 && mem < 20) {
      isAnomaly = true;
      anomalyType = 'underutilized';
    }
    // Statistical multivariate anomaly by contamination threshold
    else if (rawScores[idx] >= distanceThreshold) {
      isAnomaly = true;
      anomalyType = cpu > 70 ? 'high_utilization' : cpu < 15 ? 'underutilized' : 'irregular_traffic';
    }

    // Compute anomaly_score: negative = more anomalous, positive = normal
    // Range typically -0.5 to +0.3
    let anomalyScore: number;
    if (isAnomaly) {
      const severity = Math.max(0.05, (rawScores[idx] - distanceThreshold + 0.1) * 0.12);
      anomalyScore = -Math.round(severity * 1000) / 1000;
      // Cap at most severe -0.45
      if (anomalyScore < -0.45) anomalyScore = -0.45;
    } else {
      const normality = Math.max(0.02, (distanceThreshold - rawScores[idx]) * 0.08);
      anomalyScore = Math.round(normality * 1000) / 1000;
      if (anomalyScore > 0.35) anomalyScore = 0.35;
    }

    return {
      timestamp: item.timestamp,
      cloud: item.cloud,
      resource_id: item.resource_id,
      resource_type: item.resource_type,
      cpu_utilization: item.cpu_utilization,
      memory_utilization: item.memory_utilization,
      storage_utilization: item.storage_utilization,
      network_in_mb: item.network_in_mb,
      network_out_mb: item.network_out_mb,
      cost_usd: item.cost_usd,
      anomaly: isAnomaly,
      anomaly_score: anomalyScore,
      anomaly_type: anomalyType,
      status: item.status
    };
  });
}
