import {
  GcpComputeRawResource,
  NormalizedCloudResource,
  normalizeGcpComputeResource
} from './cloudNormalizer.js';

export function isGcpConfigured(): boolean {
  return Boolean(
    process.env.GCP_PROJECT_ID &&
    (process.env.GCP_ACCESS_TOKEN || process.env.GOOGLE_APPLICATION_CREDENTIALS)
  );
}

export async function testGcpConnection(): Promise<boolean> {
  if (!isGcpConfigured()) {
    return false;
  }
  try {
    const projectId = process.env.GCP_PROJECT_ID!;
    const token = process.env.GCP_ACCESS_TOKEN;
    if (!token) {
      console.log('[CloudWise-AI] GCP Project ID is set. Provide GCP_ACCESS_TOKEN or run with Google Cloud ADC.');
      return true;
    }

    const res = await fetch(`https://compute.googleapis.com/compute/v1/projects/${projectId}/zones`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.ok;
  } catch (err) {
    console.error('[CloudWise-AI] GCP connection exception:', err);
    return false;
  }
}

export async function getGcpComputeInstances(): Promise<GcpComputeRawResource[]> {
  if (!isGcpConfigured()) {
    return [];
  }

  try {
    const projectId = process.env.GCP_PROJECT_ID!;
    const token = process.env.GCP_ACCESS_TOKEN;
    if (!token) {
      return [];
    }

    const res = await fetch(`https://compute.googleapis.com/compute/v1/projects/${projectId}/aggregated/instances`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      console.error('[CloudWise-AI] GCP Compute aggregated API error:', await res.text());
      return [];
    }

    const data = await res.json();
    const items = data.items || {};
    const rawList: GcpComputeRawResource[] = [];

    for (const zoneKey of Object.keys(items)) {
      const zoneData = items[zoneKey];
      if (zoneData.instances && Array.isArray(zoneData.instances)) {
        for (const inst of zoneData.instances) {
          const zoneParts = (inst.zone || '').split('/');
          const zone = zoneParts[zoneParts.length - 1] || 'us-central1-a';
          const typeParts = (inst.machineType || '').split('/');
          const machineType = typeParts[typeParts.length - 1] || 'e2-medium';

          rawList.push({
            provider: 'GCP',
            resource_id: String(inst.id || inst.name),
            resource_name: inst.name,
            resource_type: 'Compute Engine',
            region: zone,
            status: inst.status || 'RUNNING',
            machine_type: machineType,
            cpu_utilization: null
          });
        }
      }
    }

    return rawList;
  } catch (err) {
    console.error('[CloudWise-AI] Failed to retrieve GCP Compute instances:', err);
    return [];
  }
}

export async function getNormalizedGcpResources(): Promise<NormalizedCloudResource[]> {
  const instances = await getGcpComputeInstances();
  return instances.map(inst => normalizeGcpComputeResource(inst));
}
