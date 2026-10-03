import { getNormalizedAwsResources } from './awsCollector.js';
import { getNormalizedAzureResources, isAzureConfigured } from './azureCollector.js';
import { getNormalizedGcpResources, isGcpConfigured } from './gcpCollector.js';
import { cloudService } from '../cloudService.js';
import { CloudResource } from '../../../types/cloudwise.js';

export interface CloudPlatformStatus {
  aws: {
    configured: boolean;
    region: string;
    connected: boolean;
  };
  azure: {
    configured: boolean;
    subscriptionId: string | null;
    connected: boolean;
  };
  gcp: {
    configured: boolean;
    projectId: string | null;
    connected: boolean;
  };
  totalConfigured: number;
}

export function getMultiCloudStatus(): CloudPlatformStatus {
  const awsConfigured = Boolean(
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
  );
  const azureConfigured = isAzureConfigured();
  const gcpConfigured = isGcpConfigured();

  let count = 0;
  if (awsConfigured) count++;
  if (azureConfigured) count++;
  if (gcpConfigured) count++;

  return {
    aws: {
      configured: awsConfigured,
      region: process.env.AWS_REGION || 'ap-south-1',
      connected: cloudService.isLiveAwsActive()
    },
    azure: {
      configured: azureConfigured,
      subscriptionId: process.env.AZURE_SUBSCRIPTION_ID || null,
      connected: azureConfigured
    },
    gcp: {
      configured: gcpConfigured,
      projectId: process.env.GCP_PROJECT_ID || null,
      connected: gcpConfigured
    },
    totalConfigured: count
  };
}

export async function syncAllConfiguredClouds() {
  const results: {
    aws?: { count: number; error?: string };
    azure?: { count: number; error?: string };
    gcp?: { count: number; error?: string };
  } = {};

  // 1. AWS Sync
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    try {
      const awsResources = await getNormalizedAwsResources();
      const mapped: CloudResource[] = awsResources.map(r => ({
        ...r,
        created_at: new Date().toISOString()
      }));
      cloudService.replaceProviderResources('AWS', mapped);
      results.aws = { count: mapped.length };
    } catch (err: any) {
      results.aws = { count: 0, error: err?.message };
    }
  }

  // 2. Azure Sync
  if (isAzureConfigured()) {
    try {
      const azureResources = await getNormalizedAzureResources();
      const mapped: CloudResource[] = azureResources.map(r => ({
        ...r,
        created_at: new Date().toISOString()
      }));
      if (mapped.length > 0) {
        cloudService.replaceProviderResources('Azure', mapped);
      }
      results.azure = { count: mapped.length };
    } catch (err: any) {
      results.azure = { count: 0, error: err?.message };
    }
  }

  // 3. GCP Sync
  if (isGcpConfigured()) {
    try {
      const gcpResources = await getNormalizedGcpResources();
      const mapped: CloudResource[] = gcpResources.map(r => ({
        ...r,
        created_at: new Date().toISOString()
      }));
      if (mapped.length > 0) {
        cloudService.replaceProviderResources('GCP', mapped);
      }
      results.gcp = { count: mapped.length };
    } catch (err: any) {
      results.gcp = { count: 0, error: err?.message };
    }
  }

  return {
    results,
    allResources: cloudService.getAllResources()
  };
}
