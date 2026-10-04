import {
  STSClient,
  GetCallerIdentityCommand
} from "@aws-sdk/client-sts";

import {
  EC2Client,
  DescribeInstancesCommand,
  StopInstancesCommand,
  StartInstancesCommand,
  TerminateInstancesCommand
} from "@aws-sdk/client-ec2";

import {
  CloudWatchClient,
  GetMetricStatisticsCommand
} from "@aws-sdk/client-cloudwatch";

import {
  normalizeAwsEc2Resource,
  AwsEc2RawResource,
  NormalizedCloudResource
} from "./cloudNormalizer.js";


function cleanEnvVal(val?: string): string | undefined {
  if (!val) return undefined;
  const trimmed = val.trim().replace(/^["']|["']$/g, '');
  return trimmed.length > 0 ? trimmed : undefined;
}

function getAwsClientConfig(regionOverride?: string) {
  const region = cleanEnvVal(regionOverride) || cleanEnvVal(process.env.AWS_REGION) || "ap-south-1";
  const accessKeyId = cleanEnvVal(process.env.AWS_ACCESS_KEY_ID);
  const secretAccessKey = cleanEnvVal(process.env.AWS_SECRET_ACCESS_KEY);
  let sessionToken = cleanEnvVal(process.env.AWS_SESSION_TOKEN);

  if (accessKeyId && secretAccessKey) {
    const credentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string } = {
      accessKeyId,
      secretAccessKey
    };

    // Temporary session keys starting with ASIA require sessionToken
    // Permanent IAM keys starting with AKIA must NOT include sessionToken
    if (sessionToken && !accessKeyId.startsWith('AKIA')) {
      credentials.sessionToken = sessionToken;
    }

    return {
      region,
      credentials
    };
  }
  return { region };
}

export interface AwsConnectionResult {
  connected: boolean;
  arn?: string;
  account?: string;
  userId?: string;
  region: string;
  error?: string;
}

/*
 * ---------------------------------------------------------
 * 1. CLOUD CONNECTION TEST & STS IDENTITY
 * ---------------------------------------------------------
 */

export async function testAwsConnection(regionOverride?: string): Promise<AwsConnectionResult> {
  const config = getAwsClientConfig(regionOverride);
  try {
    // Use STS client with credentials
    const stsClient = new STSClient(config);
    const callerId = await stsClient.send(new GetCallerIdentityCommand({}));
    console.log(`[CloudWise-AI] AWS STS connected: Account ${callerId.Account}, ARN: ${callerId.Arn}`);
    return {
      connected: true,
      arn: callerId.Arn,
      account: callerId.Account,
      userId: callerId.UserId,
      region: config.region
    };
  } catch (error: any) {
    console.error("[CloudWise-AI] AWS connection failed:", error);

    // Provide friendly diagnostic guidance for common AWS errors
    let errorMsg = error?.message || 'Failed to authenticate AWS IAM credentials';
    if (errorMsg.includes('security token included in the request is invalid') || errorMsg.includes('InvalidClientTokenId')) {
      errorMsg = 'Invalid AWS Access Key or Secret Key. Please verify that this Access Key ID exists and is Active in your AWS IAM Console, and that the Secret Access Key matches.';
    } else if (errorMsg.includes('SignatureDoesNotMatch')) {
      errorMsg = 'SignatureDoesNotMatch: Your Secret Access Key is incorrect or was mistyped in .env.';
    } else if (errorMsg.includes('AuthFailure') || errorMsg.includes('validate the provided access credentials')) {
      errorMsg = 'AuthFailure: AWS was not able to validate your credentials. Please double check that the Secret Access Key matches your Access Key, and that your AWS account is verified.';
    }

    return {
      connected: false,
      region: config.region,
      error: errorMsg
    };
  }
}

/*
 * ---------------------------------------------------------
 * 2. CLOUDWATCH CPU METRIC RETRIEVAL
 * ---------------------------------------------------------
 */

export async function getEc2CpuUtilization(
  instanceId: string,
  regionOverride?: string
): Promise<number | null> {
  const cloudWatchClient = new CloudWatchClient(getAwsClientConfig(regionOverride));

  const endTime =
    new Date();

  const startTime =
    new Date(
      endTime.getTime() -
      60 * 60 * 1000
    );

  try {

    const response =
      await cloudWatchClient.send(

        new GetMetricStatisticsCommand({

          Namespace:
            "AWS/EC2",

          MetricName:
            "CPUUtilization",

          Dimensions: [
            {
              Name: "InstanceId",
              Value: instanceId
            }
          ],

          StartTime:
            startTime,

          EndTime:
            endTime,

          Period:
            300,

          Statistics:
            ["Average"],

          Unit:
            "Percent"
        })
      );

    const datapoints =
      response.Datapoints ?? [];

    if (
      datapoints.length === 0
    ) {
      return null;
    }

    datapoints.sort(
      (a, b) =>
        (b.Timestamp?.getTime() ?? 0) -
        (a.Timestamp?.getTime() ?? 0)
    );

    return (
      datapoints[0].Average ??
      null
    );

  } catch (error) {

    console.error(
      `Failed to retrieve CPU metric for ${instanceId}:`,
      error
    );

    return null;
  }
}


/*
 * ---------------------------------------------------------
 * 3. AWS EC2 RESOURCE RETRIEVAL
 * ---------------------------------------------------------
 */

export async function getEc2Instances(regionOverride?: string): Promise<AwsEc2RawResource[]> {
  const clientConfig = getAwsClientConfig(regionOverride);
  const ec2Client = new EC2Client(clientConfig);
  const currentRegion = clientConfig.region;

  const resources: AwsEc2RawResource[] = [];

  try {
    const response = await ec2Client.send(new DescribeInstancesCommand({}));

    for (
      const reservation
      of response.Reservations ?? []
    ) {

      for (
        const instance
        of reservation.Instances ?? []
      ) {

        const instanceId =
          instance.InstanceId ??
          "unknown";

        const nameTag =
          instance.Tags?.find(
            tag =>
              tag.Key === "Name"
          );

        const cpuUtilization =
          instanceId !== "unknown"
            ? await getEc2CpuUtilization(
                instanceId,
                currentRegion
              )
            : null;

        const resource:
          AwsEc2RawResource = {

          provider:
            "AWS",

          resource_id:
            instanceId,

          resource_name:
            nameTag?.Value ??
            instanceId,

          resource_type:
            "EC2",

          region:
            currentRegion,

          status:
            instance.State?.Name ??
            "unknown",

          instance_type:
            instance.InstanceType ??
            "unknown",

          private_ip:
            instance.PrivateIpAddress ??
            null,

          public_ip:
            instance.PublicIpAddress ??
            null,

          cpu_utilization:
            cpuUtilization !== null
              ? Number(
                  cpuUtilization.toFixed(2)
                )
              : null
        };

        resources.push(
          resource
        );
      }
    }

    return resources;

  } catch (error) {

    console.error(
      "Failed to retrieve EC2 instances:",
      error
    );

    return [];
  }
}

/*
 * ---------------------------------------------------------
 * 4. DATA NORMALIZATION
 * ---------------------------------------------------------
 */

export async function getNormalizedAwsResources(
  regionOverride?: string
): Promise<NormalizedCloudResource[]> {
  const awsResources = await getEc2Instances(regionOverride);
  return awsResources.map(resource => normalizeAwsEc2Resource(resource));
}


/*
 * ---------------------------------------------------------
 * LOCAL TEST
 * ---------------------------------------------------------
 */

async function runTest() {

  const connected =
    await testAwsConnection();

  if (!connected) {
    return;
  }

  console.log(
    "\nRetrieving and normalizing AWS resources...\n"
  );

  const resources =
    await getNormalizedAwsResources();


  if (
    resources.length === 0
  ) {

    console.log(
      "No EC2 instances found in ap-south-1."
    );

    return;
  }


  console.dir(
    resources,
    {
      depth: null
    }
  );
}


/*
 * ---------------------------------------------------------
 * 5. EC2 POWER & LIFECYCLE MANAGEMENT (STOP / START / TERMINATE)
 * ---------------------------------------------------------
 */

export async function stopAwsEc2Instance(instanceId: string, regionOverride?: string) {
  const config = getAwsClientConfig(regionOverride);
  const ec2Client = new EC2Client(config);
  console.log(`[CloudWise-AI] Sending StopInstances command for ${instanceId} in ${config.region}...`);
  const response = await ec2Client.send(new StopInstancesCommand({
    InstanceIds: [instanceId]
  }));
  const stateChange = response.StoppingInstances?.[0];
  console.log(`[CloudWise-AI] AWS EC2 ${instanceId} state: ${stateChange?.PreviousState?.Name} -> ${stateChange?.CurrentState?.Name}`);
  return {
    success: true,
    instanceId,
    previousState: stateChange?.PreviousState?.Name,
    currentState: stateChange?.CurrentState?.Name || 'stopping'
  };
}

export async function startAwsEc2Instance(instanceId: string, regionOverride?: string) {
  const config = getAwsClientConfig(regionOverride);
  const ec2Client = new EC2Client(config);
  console.log(`[CloudWise-AI] Sending StartInstances command for ${instanceId} in ${config.region}...`);
  const response = await ec2Client.send(new StartInstancesCommand({
    InstanceIds: [instanceId]
  }));
  const stateChange = response.StartingInstances?.[0];
  console.log(`[CloudWise-AI] AWS EC2 ${instanceId} state: ${stateChange?.PreviousState?.Name} -> ${stateChange?.CurrentState?.Name}`);
  return {
    success: true,
    instanceId,
    previousState: stateChange?.PreviousState?.Name,
    currentState: stateChange?.CurrentState?.Name || 'pending'
  };
}

export async function terminateAwsEc2Instance(instanceId: string, regionOverride?: string) {
  const config = getAwsClientConfig(regionOverride);
  const ec2Client = new EC2Client(config);
  console.log(`[CloudWise-AI] Sending TerminateInstances command for ${instanceId} in ${config.region}...`);
  const response = await ec2Client.send(new TerminateInstancesCommand({
    InstanceIds: [instanceId]
  }));
  const stateChange = response.TerminatingInstances?.[0];
  return {
    success: true,
    instanceId,
    previousState: stateChange?.PreviousState?.Name,
    currentState: stateChange?.CurrentState?.Name || 'shutting-down'
  };
}

/*
 * Run test only when this file
 * is directly executed.

 * Importing awsCollector.ts from
 * server.ts will NOT automatically
 * execute the test.
 */

const executedFile =
  process.argv[1]
    ?.replace(/\\/g, "/");

if (
  executedFile?.endsWith(
    "/awsCollector.ts"
  )
) {
  runTest();
}