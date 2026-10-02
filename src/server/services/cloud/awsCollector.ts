import {
  STSClient,
  GetCallerIdentityCommand
} from "@aws-sdk/client-sts";

import {
  EC2Client,
  DescribeInstancesCommand
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


const AWS_REGION = "ap-south-1";


/*
 * ---------------------------------------------------------
 * 1. CLOUD CONNECTION TEST
 * ---------------------------------------------------------
 */

export async function testAwsConnection():
Promise<boolean> {

  try {

    const stsClient =
      new STSClient({
        region: AWS_REGION
      });

    await stsClient.send(
      new GetCallerIdentityCommand({})
    );

    console.log(
      "AWS connection successful."
    );

    console.log(
      "Authenticated AWS IAM user successfully."
    );

    return true;

  } catch (error) {

    console.error(
      "AWS connection failed:",
      error
    );

    return false;
  }
}


/*
 * ---------------------------------------------------------
 * 2. CLOUDWATCH CPU METRIC RETRIEVAL
 * ---------------------------------------------------------
 */

export async function getEc2CpuUtilization(
  instanceId: string
): Promise<number | null> {

  const cloudWatchClient =
    new CloudWatchClient({
      region: AWS_REGION
    });

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

export async function getEc2Instances():
Promise<AwsEc2RawResource[]> {

  const ec2Client =
    new EC2Client({
      region: AWS_REGION
    });

  const resources:
    AwsEc2RawResource[] = [];

  try {

    const response =
      await ec2Client.send(
        new DescribeInstancesCommand({})
      );

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
                instanceId
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
            AWS_REGION,

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

export async function
getNormalizedAwsResources():
Promise<NormalizedCloudResource[]> {

  const awsResources =
    await getEc2Instances();

  return awsResources.map(
    resource =>
      normalizeAwsEc2Resource(
        resource
      )
  );
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