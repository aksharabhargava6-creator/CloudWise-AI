import {
  DynamoDBClient,
  ListTablesCommand,
  DescribeTableCommand,
  type ListTablesCommandOutput
} from '@aws-sdk/client-dynamodb';

import type {
  NormalizedCloudResource
} from './cloudNormalizer.js';


function cleanEnvVal(
  value?: string
): string | undefined {

  if (!value) {
    return undefined;
  }

  const cleaned =
    value
      .trim()
      .replace(/^["']|["']$/g, '');

  return cleaned.length > 0
    ? cleaned
    : undefined;
}


function getAwsDynamoDbConfig(
  regionOverride?: string
) {

  const region =
    cleanEnvVal(regionOverride) ||
    cleanEnvVal(process.env.AWS_REGION) ||
    'ap-south-1';

  const accessKeyId =
    cleanEnvVal(
      process.env.AWS_ACCESS_KEY_ID
    );

  const secretAccessKey =
    cleanEnvVal(
      process.env.AWS_SECRET_ACCESS_KEY
    );

  const sessionToken =
    cleanEnvVal(
      process.env.AWS_SESSION_TOKEN
    );


  if (
    accessKeyId &&
    secretAccessKey
  ) {

    return {
      region,

      credentials: {
        accessKeyId,
        secretAccessKey,

        ...(sessionToken
          ? { sessionToken }
          : {})
      }
    };
  }


  // Falls back to the standard AWS SDK credential chain,
  // including ~/.aws/credentials created by `aws configure`.
  return {
    region
  };
}


export interface AwsDynamoDbTableInfo {

  tableName: string;

  tableArn: string;

  region: string;

  status: string;

  billingMode: string;

  itemCount: number;

  tableSizeBytes: number;

  creationDate: string | null;

  keySchema:
    Array<{
      attributeName: string;
      keyType: string;
    }>;

  tableClass: string | null;

  deletionProtectionEnabled:
    boolean;

  streamEnabled:
    boolean;

  encryptionStatus:
    string | null;

  encryptionType:
    string | null;
}


export async function getDynamoDbTables(
  regionOverride?: string
): Promise<AwsDynamoDbTableInfo[]> {

  const config =
    getAwsDynamoDbConfig(
      regionOverride
    );

  const client =
    new DynamoDBClient(
      config
    );

  const tableNames:
    string[] = [];

  let exclusiveStartTableName:
    string | undefined =
      undefined;


  do {

    const response:
      ListTablesCommandOutput =
      await client.send(
        new ListTablesCommand({
          ExclusiveStartTableName:
            exclusiveStartTableName,
          Limit: 100
        })
      );


    tableNames.push(
      ...(response.TableNames ?? [])
    );


    exclusiveStartTableName =
      response.LastEvaluatedTableName;

  } while (
    exclusiveStartTableName
  );


  const tables:
    AwsDynamoDbTableInfo[] = [];


  for (
    const tableName
    of tableNames
  ) {

    const response =
      await client.send(
        new DescribeTableCommand({
          TableName:
            tableName
        })
      );


    const table =
      response.Table;


    if (
      !table?.TableName ||
      !table.TableArn
    ) {
      continue;
    }


    const billingMode =
      table.BillingModeSummary
        ?.BillingMode ||
      'PROVISIONED';


    tables.push({

      tableName:
        table.TableName,

      tableArn:
        table.TableArn,

      region:
        config.region,

      status:
        table.TableStatus ||
        'UNKNOWN',

      billingMode,

      itemCount:
        table.ItemCount ??
        0,

      tableSizeBytes:
        table.TableSizeBytes ??
        0,

      creationDate:
        table.CreationDateTime
          ?.toISOString() ??
        null,

      keySchema:
        (table.KeySchema ?? [])
          .map(
            key => ({
              attributeName:
                key.AttributeName ||
                'unknown',

              keyType:
                key.KeyType ||
                'unknown'
            })
          ),

      tableClass:
        table.TableClassSummary
          ?.TableClass ??
        null,

      deletionProtectionEnabled:
        Boolean(
          table.DeletionProtectionEnabled
        ),

      streamEnabled:
        Boolean(
          table.LatestStreamArn
        ),

      encryptionStatus:
        table.SSEDescription
          ?.Status ??
        null,

      encryptionType:
        table.SSEDescription
          ?.SSEType ??
        null
    });
  }


  return tables;
}


function normalizeDynamoDbStatus(
  status: string
):
  'running' |
  'stopped' {

  return status === 'ACTIVE'
    ? 'running'
    : 'stopped';
}


export async function getNormalizedDynamoDbResources(
  regionOverride?: string
): Promise<NormalizedCloudResource[]> {

  const tables =
    await getDynamoDbTables(
      regionOverride
    );


  return tables.map(
    table => ({

      id:
        table.tableArn,

      name:
        table.tableName,

      provider:
        'AWS',

      resource_type:
        'DynamoDB',

      region:
        table.region,

      status:
        normalizeDynamoDbStatus(
          table.status
        ),

      instance_type:
        table.billingMode,

      /*
       * DynamoDB is a managed database service,
       * not a VM. The common CloudWise schema
       * currently requires numeric utilization
       * fields, so they remain 0 until
       * service-specific CloudWatch metrics
       * are added.
       */
      cpu_utilization:
        0,

      memory_utilization:
        0,

      storage_utilization:
        0,

      network_in_mb:
        0,

      network_out_mb:
        0,

      /*
       * Do not invent a cost estimate.
       * Real spend can later come from
       * AWS Cost Explorer / CUR.
       */
      cost_usd:
        0,

      monthly_cost:
        0,

      metadata: {

        native_resource_type:
          'AWS DynamoDB Table',

        table_status:
          table.status,

        billing_mode:
          table.billingMode,

        item_count:
          table.itemCount,

        table_size_bytes:
          table.tableSizeBytes,

        creation_date:
          table.creationDate,

        key_schema:
          table.keySchema,

        table_class:
          table.tableClass,

        deletion_protection_enabled:
          table.deletionProtectionEnabled,

        stream_enabled:
          table.streamEnabled,

        encryption_status:
          table.encryptionStatus,

        encryption_type:
          table.encryptionType
      }

    } as NormalizedCloudResource)
  );
}


/*
 * ---------------------------------------------------------
 * LOCAL TEST
 * ---------------------------------------------------------
 */

async function runTest() {

  console.log(
    '\n[CloudWise-AI] Discovering AWS DynamoDB tables...\n'
  );


  try {

    const tables =
      await getDynamoDbTables();


    if (
      tables.length === 0
    ) {

      console.log(
        'No DynamoDB tables found.'
      );

      return;
    }


    console.dir(
      tables,
      {
        depth: null
      }
    );

  } catch (error) {

    console.error(
      '[CloudWise-AI] DynamoDB discovery failed:',
      error
    );
  }
}


const executedFile =
  process.argv[1]
    ?.replace(/\\/g, '/');


if (
  executedFile
    ?.endsWith(
      '/dynamodbCollector.ts'
    )
) {

  runTest();
}
