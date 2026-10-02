import { CostData, Forecast } from '../../types/cloudwise.js';

export function forecastCost(
  costs: CostData[],
  periods: number = 3
): Forecast[] {
  if (!costs || costs.length === 0) {
    return [];
  }

  // Ensure periods is clamped between 1 and 12
  const targetPeriods = Math.min(Math.max(periods, 1), 12);

  // Sort input chronologically
  const sorted = [...costs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const n = sorted.length;

  // Linear regression fit on time series index: x = 0, 1, ..., n-1
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const y = sorted[i].total_cost;
    sumX += i;
    sumY += y;
    sumXY += i * y;
    sumXX += i * i;
  }

  const slope = n > 1 ? (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) : 0;
  const intercept = n > 1 ? (sumY - slope * sumX) / n : (sorted[0]?.total_cost || 1000);

  // Compute residuals for variance estimation
  let sumResidualSq = 0;
  for (let i = 0; i < n; i++) {
    const fitted = intercept + slope * i;
    sumResidualSq += Math.pow(sorted[i].total_cost - fitted, 2);
  }
  const residualStd = n > 2 ? Math.sqrt(sumResidualSq / (n - 2)) : (sorted[n - 1]?.total_cost || 1000) * 0.04;

  const lastEntry = sorted[n - 1];
  const lastDate = new Date(lastEntry.date);

  const forecast: Forecast[] = [];

  for (let step = 1; step <= targetPeriods; step++) {
    const futureDate = new Date(lastDate);
    futureDate.setMonth(futureDate.getMonth() + step);

    const year = futureDate.getFullYear();
    const month = String(futureDate.getMonth() + 1).padStart(2, '0');
    const day = String(futureDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Linear projection
    const xFuture = (n - 1) + step;
    let basePredicted = intercept + slope * xFuture;

    // Monthly seasonality wave: slight cycle peak in quarter ends (March, June, Sept, Dec)
    const monthIndex = futureDate.getMonth();
    const seasonalFactor = Math.sin((monthIndex / 12) * 2 * Math.PI) * (residualStd * 0.45);
    const predicted = Math.max(0, basePredicted + seasonalFactor);

    // 95% confidence band widens over time: delta expands with sqrt(1 + 1/n + (step^2)/sumXX)
    const expansionFactor = 1.96 * Math.sqrt(1 + (1 / n) + (Math.pow(step, 1.3) / (sumXX || 10)));
    const spread = Math.max(residualStd * expansionFactor, predicted * (0.035 * Math.sqrt(step)));

    const lowerBound = Math.max(0, Math.round((predicted - spread) * 100) / 100);
    const upperBound = Math.round((predicted + spread) * 100) / 100;
    const roundedPredicted = Math.round(predicted * 100) / 100;

    forecast.push({
      date: dateStr,
      predicted_cost: roundedPredicted,
      lower_bound: lowerBound,
      upper_bound: upperBound,
    });
  }

  return forecast;
}
