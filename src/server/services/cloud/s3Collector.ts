import {
  GetBucketEncryptionCommand,
  GetBucketLocationCommand,
  GetBucketTaggingCommand,
  GetBucketVersioningCommand,
  GetPublicAccessBlockCommand,
  ListBucketsCommand,
  S3Client
} from '@aws-sdk/client-s3';

import type {
  NormalizedCloudResource
} from './cloudNormalizer.js';


function cleanEnvVal(value?: string): string | undefined {
  if (!value) return undefined;

  const cleaned = value
    .trim()
    .replace(/^[\"']|[\"']$/g, '');

  return cleaned.length > 0 ? cleaned : undefined;
}


function getAwsS3Config() {
  const region =
    cleanEnvVal(process.env.AWS_REGION) ||
    'ap-south-1';

  const accessKeyId =
    cleanEnvVal(process.env.AWS_ACCESS_KEY_ID);

  const secretAccessKey =
    cleanEnvVal(process.env.AWS_SECRET_ACCESS_KEY);

  const sessionToken =
    cleanEnvVal(process.env.AWS_SESSION_TOKEN);

  if (accessKeyId && secretAccessKey) {
    return {
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken ? { sessionToken } : {})
      }
    };
  }

  // Falls back to the normal AWS SDK credential provider chain,
  // including ~/.aws/credentials configured by `aws configure`.
  return { region };
}


export interface AwsS3BucketInfo {
  name: string;
  arn: string;
  region: string;
  creationDate: string | null;
  versioning: 'Enabled' | 'Suspended' | 'Disabled';
  encryption: boolean;
  encryptionAlgorithm: string | null;
  publicAccessBlocked: boolean;
  tags: Record<string, string>;
}


function normalizeBucketRegion(location?: string): string {
  if (!location) {
    return 'us-east-1';
  }

  if (location === 'EU') {
    return 'eu-west-1';
  }

  return location;
}


async function getBucketVersioning(
  client: S3Client,
  bucketName: string
): Promise<'Enabled' | 'Suspended' | 'Disabled'> {
  try {
    const result = await client.send(
      new GetBucketVersioningCommand({
        Bucket: bucketName
      })
    );

    if (result.Status === 'Enabled') {
      return 'Enabled';
    }

    if (result.Status === 'Suspended') {
      return 'Suspended';
    }

    return 'Disabled';
  } catch (error) {
    console.warn(
      `[CloudWise-AI] Unable to read versioning for S3 bucket ${bucketName}`
    );
    return 'Disabled';
  }
}


async function getBucketEncryption(
  client: S3Client,
  bucketName: string
): Promise<{
  encrypted: boolean;
  algorithm: string | null;
}> {
  try {
    const result = await client.send(
      new GetBucketEncryptionCommand({
        Bucket: bucketName
      })
    );

    const algorithm =
      result.ServerSideEncryptionConfiguration
        ?.Rules?.[0]
        ?.ApplyServerSideEncryptionByDefault
        ?.SSEAlgorithm;

    return {
      encrypted: Boolean(algorithm),
      algorithm: algorithm ?? null
    };
  } catch (error) {
    return {
      encrypted: false,
      algorithm: null
    };
  }
}


async function getBucketPublicAccess(
  client: S3Client,
  bucketName: string
): Promise<boolean> {
  try {
    const result = await client.send(
      new GetPublicAccessBlockCommand({
        Bucket: bucketName
      })
    );

    const config =
      result.PublicAccessBlockConfiguration;

    return Boolean(
      config?.BlockPublicAcls &&
      config?.IgnorePublicAcls &&
      config?.BlockPublicPolicy &&
      config?.RestrictPublicBuckets
    );
  } catch (error) {
    return false;
  }
}


async function getBucketTags(
  client: S3Client,
  bucketName: string
): Promise<Record<string, string>> {
  try {
    const result = await client.send(
      new GetBucketTaggingCommand({
        Bucket: bucketName
      })
    );

    const tags: Record<string, string> = {};

    for (const tag of result.TagSet ?? []) {
      if (tag.Key && tag.Value) {
        tags[tag.Key] = tag.Value;
      }
    }

    return tags;
  } catch (error) {
    return {};
  }
}


async function getBucketRegion(
  defaultClient: S3Client,
  bucketName: string
): Promise<string> {
  try {
    const result = await defaultClient.send(
      new GetBucketLocationCommand({
        Bucket: bucketName
      })
    );

    return normalizeBucketRegion(
      result.LocationConstraint
    );
  } catch (error) {
    console.warn(
      `[CloudWise-AI] Could not determine region for bucket ${bucketName}`
    );

    return (
      cleanEnvVal(process.env.AWS_REGION) ||
      'ap-south-1'
    );
  }
}


export async function getS3Buckets():
Promise<AwsS3BucketInfo[]> {
  const baseConfig = getAwsS3Config();
  const s3Client = new S3Client(baseConfig);

  const result = await s3Client.send(
    new ListBucketsCommand({})
  );

  const buckets: AwsS3BucketInfo[] = [];

  for (const bucket of result.Buckets ?? []) {
    if (!bucket.Name) {
      continue;
    }

    const bucketName = bucket.Name;

    const region = await getBucketRegion(
      s3Client,
      bucketName
    );

    const regionalClient = new S3Client({
      ...baseConfig,
      region
    });

    const [
      versioning,
      encryption,
      publicAccessBlocked,
      tags
    ] = await Promise.all([
      getBucketVersioning(
        regionalClient,
        bucketName
      ),
      getBucketEncryption(
        regionalClient,
        bucketName
      ),
      getBucketPublicAccess(
        regionalClient,
        bucketName
      ),
      getBucketTags(
        regionalClient,
        bucketName
      )
    ]);

    buckets.push({
      name: bucketName,
      arn: `arn:aws:s3:::${bucketName}`,
      region,
      creationDate:
        bucket.CreationDate?.toISOString() ??
        null,
      versioning,
      encryption: encryption.encrypted,
      encryptionAlgorithm: encryption.algorithm,
      publicAccessBlocked,
      tags
    });
  }

  return buckets;
}


export async function getNormalizedS3Resources():
Promise<NormalizedCloudResource[]> {
  const buckets = await getS3Buckets();

  return buckets.map((bucket) => ({
    id: bucket.arn,
    name: bucket.name,
    provider: 'AWS',
    resource_type: 'S3',
    region: bucket.region,
    status: 'running',
    instance_type: 'Object Storage',

    // These VM-style values are kept at 0 only because the current
    // shared CloudWise schema requires numeric fields. They are not
    // intended to represent real S3 CPU/memory utilization.
    cpu_utilization: 0,
    memory_utilization: 0,
    storage_utilization: 0,
    network_in_mb: 0,
    network_out_mb: 0,

    // Real S3 cost ingestion will be implemented through AWS billing
    // data rather than inventing a bucket cost here.
    cost_usd: 0,
    monthly_cost: 0,

    metadata: {
      native_resource_type: 'AWS S3 Bucket',
      creation_date: bucket.creationDate,
      versioning: bucket.versioning,
      encrypted: bucket.encryption,
      encryption_algorithm: bucket.encryptionAlgorithm,
      public_access_blocked: bucket.publicAccessBlocked,
      tags: bucket.tags
    }
  }));
}


async function runTest() {
  console.log(
    '\n[CloudWise-AI] Discovering AWS S3 buckets...\n'
  );

  try {
    const buckets = await getS3Buckets();

    if (buckets.length === 0) {
      console.log('No S3 buckets found.');
      return;
    }

    console.dir(buckets, {
      depth: null
    });
  } catch (error) {
    console.error(
      '[CloudWise-AI] S3 discovery failed:',
      error
    );
  }
}


const executedFile =
  process.argv[1]?.replace(/\\/g, '/');

if (executedFile?.endsWith('/s3Collector.ts')) {
  runTest();
}
