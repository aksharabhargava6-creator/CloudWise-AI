import {
  STSClient,
  GetCallerIdentityCommand
} from "@aws-sdk/client-sts";

import {
  EC2Client,
  DescribeInstancesCommand
} from "@aws-sdk/client-ec2";


const AWS_REGION = "ap-south-1";


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

        const nameTag = instance.Tags?.find(
          tag => tag.Key === "Name"
        );

        resources.push({
          provider: "AWS",

          resource_id:
            instance.InstanceId ?? "unknown",

          resource_name:
            nameTag?.Value ??
            instance.InstanceId ??
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
            instance.PublicIpAddress ?? null
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