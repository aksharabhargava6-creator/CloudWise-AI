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


const AWS_REGION = "ap-south-1";


export async function getEc2CpuUtilization(
  instanceId: string
): Promise<number | null> {

  const cloudWatchClient = new CloudWatchClient({
    region: AWS_REGION,
  });

  const endTime = new Date();

  const startTime = new Date(
    endTime.getTime() - 60 * 60 * 1000
  );

  try {

    const response = await cloudWatchClient.send(
      new GetMetricStatisticsCommand({
        Namespace: "AWS/EC2",
        MetricName: "CPUUtilization",

        Dimensions: [
          {
            Name: "InstanceId",
            Value: instanceId,
          },
        ],

        StartTime: startTime,
        EndTime: endTime,

        Period: 300,

        Statistics: ["Average"],

        Unit: "Percent",
      })
    );

    const datapoints = response.Datapoints ?? [];

    if (datapoints.length === 0) {
      return null;
    }

    datapoints.sort(
      (a, b) =>
        (b.Timestamp?.getTime() ?? 0) -
        (a.Timestamp?.getTime() ?? 0)
    );

    return datapoints[0].Average ?? null;

  } catch (error) {

    console.error(
      `Failed to retrieve CPU metric for ${instanceId}:`,
      error
    );

    return null;
  }
}


export async function testAwsConnection(): Promise<boolean> {

  try {

    const stsClient = new STSClient({
      region: AWS_REGION,
    });

    await stsClient.send(
      new GetCallerIdentityCommand({})
    );

    console.log("AWS connection successful.");
    console.log("Authenticated AWS IAM user successfully.");

    return true;

  } catch (error) {

    console.error(
      "AWS connection failed:",
      error
    );

    return false;
  }
}


export async function getEc2Instances() {

  const ec2Client = new EC2Client({
    region: AWS_REGION,
  });

  try {

    const response = await ec2Client.send(
      new DescribeInstancesCommand({})
    );

    const resources = [];

    for (const reservation of response.Reservations ?? []) {

      for (const instance of reservation.Instances ?? []) {

        const instanceId =
          instance.InstanceId ?? "unknown";

        const nameTag = instance.Tags?.find(
          tag => tag.Key === "Name"
        );

        const cpuUtilization =
          instanceId !== "unknown"
            ? await getEc2CpuUtilization(instanceId)
            : null;

        resources.push({

          provider: "AWS",

          resource_id: instanceId,

          resource_name:
            nameTag?.Value ??
            instanceId ??
            "Unnamed EC2",

          resource_type: "EC2",

          region: AWS_REGION,

          status:
            instance.State?.Name ?? "unknown",

          instance_type:
            instance.InstanceType ?? "unknown",

          private_ip:
            instance.PrivateIpAddress ?? null,

          public_ip:
            instance.PublicIpAddress ?? null,

          cpu_utilization:
            cpuUtilization !== null
              ? Number(cpuUtilization.toFixed(2))
              : null
        });
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


async function runTest() {

  const connected =
    await testAwsConnection();

  if (!connected) {
    return;
  }

  console.log(
    "\nRetrieving EC2 resources...\n"
  );

  const resources =
    await getEc2Instances();

  if (resources.length === 0) {

    console.log(
      "No EC2 instances found in ap-south-1."
    );

    return;
  }

  console.log(resources);
}


runTest();