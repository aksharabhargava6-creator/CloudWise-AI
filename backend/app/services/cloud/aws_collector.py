import boto3
from botocore.exceptions import BotoCoreError, ClientError, NoCredentialsError


AWS_REGION = "ap-south-1"


def test_aws_connection():
    """
    Tests whether boto3 can authenticate with AWS.
    """

    try:
        sts = boto3.client("sts")
        identity = sts.get_caller_identity()

        print("AWS connection successful.")
        print("Authenticated AWS IAM user successfully.")

        return True

    except NoCredentialsError:
        print("AWS credentials were not found.")
        return False

    except (BotoCoreError, ClientError) as error:
        print(f"AWS connection failed: {error}")
        return False


def get_ec2_instances():
    """
    Retrieves EC2 instances from AWS and converts them
    into a simple CloudWise-compatible format.
    """

    ec2 = boto3.client(
        "ec2",
        region_name=AWS_REGION
    )

    resources = []

    try:
        response = ec2.describe_instances()

        for reservation in response["Reservations"]:
            for instance in reservation["Instances"]:

                instance_name = None

                for tag in instance.get("Tags", []):
                    if tag["Key"] == "Name":
                        instance_name = tag["Value"]
                        break

                resource = {
                    "cloud": "AWS",
                    "resource_id": instance["InstanceId"],
                    "resource_name": instance_name or instance["InstanceId"],
                    "resource_type": "virtual_machine",
                    "native_resource_type": "EC2",
                    "region": AWS_REGION,
                    "status": instance["State"]["Name"],
                    "instance_type": instance["InstanceType"],
                    "private_ip": instance.get("PrivateIpAddress"),
                    "public_ip": instance.get("PublicIpAddress")
                }

                resources.append(resource)

        return resources

    except (BotoCoreError, ClientError) as error:
        print(f"Failed to retrieve EC2 instances: {error}")
        return []


if __name__ == "__main__":

    if test_aws_connection():

        print("\nRetrieving EC2 resources...\n")

        instances = get_ec2_instances()

        if not instances:
            print("No EC2 instances found in ap-south-1.")

        else:
            for instance in instances:
                print(instance)