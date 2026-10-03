import {
  AzureVmRawResource,
  NormalizedCloudResource,
  normalizeAzureVmResource
} from './cloudNormalizer.js';

export function isAzureConfigured(): boolean {
  return Boolean(
    process.env.AZURE_SUBSCRIPTION_ID &&
    process.env.AZURE_TENANT_ID &&
    process.env.AZURE_CLIENT_ID &&
    process.env.AZURE_CLIENT_SECRET
  );
}

export async function testAzureConnection(): Promise<boolean> {
  if (!isAzureConfigured()) {
    return false;
  }
  try {
    // Attempt OAuth token retrieval from Microsoft Azure AD login endpoint
    const tenantId = process.env.AZURE_TENANT_ID!;
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://management.azure.com/.default'
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString()
    });

    if (response.ok) {
      console.log('[CloudWise-AI] Azure AD authentication successful.');
      return true;
    }
    const errText = await response.text();
    console.error('[CloudWise-AI] Azure AD authentication failed:', errText);
    return false;
  } catch (err) {
    console.error('[CloudWise-AI] Azure connection exception:', err);
    return false;
  }
}

export async function getAzureVirtualMachines(): Promise<AzureVmRawResource[]> {
  if (!isAzureConfigured()) {
    return [];
  }

  try {
    const tenantId = process.env.AZURE_TENANT_ID!;
    const clientId = process.env.AZURE_CLIENT_ID!;
    const clientSecret = process.env.AZURE_CLIENT_SECRET!;
    const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID!;

    // 1. Get bearer token
    const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://management.azure.com/.default'
      }).toString()
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('[CloudWise-AI] Failed to get Azure access token');
      return [];
    }

    // 2. Query Azure Resource Graph or ARM Compute API
    const armUrl = `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.Compute/virtualMachines?api-version=2024-03-01`;
    const vmRes = await fetch(armUrl, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!vmRes.ok) {
      console.error('[CloudWise-AI] Azure ARM Compute API error:', await vmRes.text());
      return [];
    }

    const vmData = await vmRes.json();
    const rawList: AzureVmRawResource[] = (vmData.value || []).map((vm: any) => ({
      provider: 'Azure',
      resource_id: vm.id || vm.name,
      resource_name: vm.name,
      resource_type: 'Virtual Machine',
      region: vm.location || 'centralus',
      status: vm.properties?.provisioningState === 'Succeeded' ? 'running' : 'stopped',
      vm_size: vm.properties?.hardwareProfile?.vmSize || 'Standard_D2s_v5',
      cpu_utilization: null
    }));

    return rawList;
  } catch (error) {
    console.error('[CloudWise-AI] Failed to retrieve Azure Virtual Machines:', error);
    return [];
  }
}

export async function getNormalizedAzureResources(): Promise<NormalizedCloudResource[]> {
  const vms = await getAzureVirtualMachines();
  return vms.map(vm => normalizeAzureVmResource(vm));
}
