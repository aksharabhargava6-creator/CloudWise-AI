import {
  LambdaClient,
  ListFunctionsCommand,
  type ListFunctionsCommandOutput
} from '@aws-sdk/client-lambda';

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


function getAwsLambdaConfig(
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


  /*
   * No credentials in .env:
   * fall back to the normal AWS SDK
   * credential chain, including the
   * credentials created by `aws configure`.
   */
  return {
    region
  };
}


export interface AwsLambdaFunctionInfo {

  functionName: string;

  functionArn: string;

  region: string;

  runtime: string | null;

  handler: string | null;

  memorySizeMb: number | null;

  timeoutSeconds: number | null;

  codeSizeBytes: number | null;

  lastModified: string | null;

  state: string | null;

  lastUpdateStatus: string | null;

  packageType: string | null;

  architecture: string | null;

  description: string | null;
}


export async function getLambdaFunctions(
  regionOverride?: string
): Promise<AwsLambdaFunctionInfo[]> {

  const config =
    getAwsLambdaConfig(
      regionOverride
    );

  const client =
    new LambdaClient(
      config
    );

  const functions:
    AwsLambdaFunctionInfo[] = [];

  let marker:
    string | undefined =
      undefined;


  do {

    const response: ListFunctionsCommandOutput =
      await client.send(
        new ListFunctionsCommand({
          Marker: marker,
          MaxItems: 50
        })
      );


    for (
      const fn
      of response.Functions ?? []
    ) {

      if (
        !fn.FunctionName ||
        !fn.FunctionArn
      ) {
        continue;
      }


      functions.push({

        functionName:
          fn.FunctionName,

        functionArn:
          fn.FunctionArn,

        region:
          config.region,

        runtime:
          fn.Runtime ?? null,

        handler:
          fn.Handler ?? null,

        memorySizeMb:
          fn.MemorySize ?? null,

        timeoutSeconds:
          fn.Timeout ?? null,

        codeSizeBytes:
          fn.CodeSize ?? null,

        lastModified:
          fn.LastModified ?? null,

        state:
          fn.State ?? null,

        lastUpdateStatus:
          fn.LastUpdateStatus ?? null,

        packageType:
          fn.PackageType ?? null,

        architecture:
          fn.Architectures?.[0] ??
          null,

        description:
          fn.Description ?? null
      });
    }


    marker =
      response.NextMarker;

  } while (marker);


  return functions;
}


function normalizeLambdaStatus(
  state: string | null
):
  'running' |
  'stopped' {

  const normalized =
    state?.toLowerCase();


  if (
    normalized === 'failed' ||
    normalized === 'inactive'
  ) {
    return 'stopped';
  }


  /*
   * Active and Pending are represented
   * as available/running in the current
   * common CloudWise schema.
   */
  return 'running';
}


export async function getNormalizedLambdaResources(
  regionOverride?: string
): Promise<NormalizedCloudResource[]> {

  const functions =
    await getLambdaFunctions(
      regionOverride
    );


  return functions.map(
    fn => ({

      id:
        fn.functionArn,

      name:
        fn.functionName,

      provider:
        'AWS',

      resource_type:
        'Lambda',

      region:
        fn.region,

      status:
        normalizeLambdaStatus(
          fn.state
        ),

      instance_type:
        fn.runtime ??
        fn.packageType ??
        'Serverless',

      /*
       * Lambda is not a VM.
       * These numeric fields are kept at 0
       * only because the current common
       * CloudWise schema still requires them.
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
       * Real billing is not guessed here.
       * AWS Cost Explorer / billing data
       * can be integrated later.
       */
      cost_usd:
        0,

      monthly_cost:
        0,

      metadata: {

        native_resource_type:
          'AWS Lambda Function',

        runtime:
          fn.runtime,

        handler:
          fn.handler,

        memory_size_mb:
          fn.memorySizeMb,

        timeout_seconds:
          fn.timeoutSeconds,

        code_size_bytes:
          fn.codeSizeBytes,

        last_modified:
          fn.lastModified,

        lambda_state:
          fn.state,

        last_update_status:
          fn.lastUpdateStatus,

        package_type:
          fn.packageType,

        architecture:
          fn.architecture,

        description:
          fn.description
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
    '\n[CloudWise-AI] Discovering AWS Lambda functions...\n'
  );


  try {

    const functions =
      await getLambdaFunctions();


    if (
      functions.length === 0
    ) {

      console.log(
        'No Lambda functions found.'
      );

      return;
    }


    console.dir(
      functions,
      {
        depth: null
      }
    );

  } catch (error) {

    console.error(
      '[CloudWise-AI] Lambda discovery failed:',
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
      '/lambdaCollector.ts'
    )
) {

  runTest();
}
