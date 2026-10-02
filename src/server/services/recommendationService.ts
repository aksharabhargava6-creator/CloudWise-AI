import { ResourceData, Recommendation } from '../../types/cloudwise.js';

export function generateRecommendations(resources: ResourceData[]): Recommendation[] {
  if (!resources || resources.length === 0) {
    return [];
  }

  const recommendations: Recommendation[] = [];

  for (const row of resources) {
    const resourceId = row.resource_id;
    const resourceType = row.resource_type;
    const cpu = row.cpu_utilization;
    const cost = row.total_cost;
    const storage = row.storage_utilization ?? 50;
    const status = row.status ?? 'running';

    // 1. Stopped with cost -> IDLE_RECLAIM with 100% reclaim
    if (status === 'stopped' && cost > 0) {
      recommendations.push({
        resource_id: resourceId,
        resource_type: resourceType,
        recommendation: 'Decommission or terminate idle stopped asset to eliminate orphan billing.',
        reason: `Resource is in a stopped state but continues to accrue $${cost.toFixed(2)}/mo in attached storage and reserved allocation fees.`,
        priority: 'HIGH',
        optimization_type: 'IDLE_RECLAIM',
        optimization_action: 'Terminate resource and release associated storage',
        estimated_saving_usd: Math.round(cost * 100) / 100,
      });
    }
    // 2. Storage cleanup (storage >= 90%) -> up to 10% saving
    else if (storage >= 90) {
      const saving = Math.round(cost * 0.10 * 100) / 100;
      recommendations.push({
        resource_id: resourceId,
        resource_type: resourceType,
        recommendation: 'Prune orphaned volume snapshots and expand disk capacity.',
        reason: `Disk volume utilization is critically elevated at ${storage}%, risking service degradation.`,
        priority: 'HIGH',
        optimization_type: 'STORAGE_CLEANUP',
        optimization_action: 'Purge stale backups and optimize filesystem tiers',
        estimated_saving_usd: saving > 0 ? saving : 12.50,
      });
    }
    // 3. CPU > 85 -> SCALE_UP_REQUIRED with $0 saving
    else if (cpu > 85) {
      recommendations.push({
        resource_id: resourceId,
        resource_type: resourceType,
        recommendation: 'Scale up or resize instance to avert performance throttling.',
        reason: `CPU utilization is elevated at ${cpu}%, approaching saturated compute bounds.`,
        priority: 'HIGH',
        optimization_type: 'SCALE_UP_REQUIRED',
        optimization_action: 'Upgrade instance family or configure auto-scaling group',
        estimated_saving_usd: 0,
      });
    }
    // 4. CPU < 15 -> RIGHT_SIZING with 30% saving
    else if (cpu < 15 && cost > 0) {
      const saving = Math.round(cost * 0.30 * 100) / 100;
      recommendations.push({
        resource_id: resourceId,
        resource_type: resourceType,
        recommendation: 'Rightsize overprovisioned compute capacity to a smaller instance tier.',
        reason: `Average CPU load is only ${cpu}%, indicating capacity is over-allocated for actual workloads.`,
        priority: 'MEDIUM',
        optimization_type: 'RIGHT_SIZING',
        optimization_action: 'Downsize to next-lower instance generation (saves ~30%)',
        estimated_saving_usd: saving,
      });
    }
    // 5. Normal utilization
    else {
      recommendations.push({
        resource_id: resourceId,
        resource_type: resourceType,
        recommendation: 'Resource capacity is well-matched to current traffic loads.',
        reason: `Resource utilization is balanced at ${cpu}% CPU and nominal storage headroom.`,
        priority: 'LOW',
        optimization_type: 'MONITOR',
        optimization_action: 'Continue continuous metric monitoring',
        estimated_saving_usd: 0,
      });
    }
  }

  // Sort by priority (HIGH, then MEDIUM, then LOW) and then by estimated savings descending
  const priorityWeight: Record<string, number> = { HIGH: 3, MEDIUM: 2, LOW: 1 };
  return recommendations.sort((a, b) => {
    const pwDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (pwDiff !== 0) return pwDiff;
    return (b.estimated_saving_usd || 0) - (a.estimated_saving_usd || 0);
  });
}
