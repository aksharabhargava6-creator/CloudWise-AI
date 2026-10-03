import {
  getNormalizedAwsResources
} from "./awsCollector.js";

import {
  cloudService
} from "../cloudService.js";


/*
 * =========================================================
 * CLOUDWISE MULTI-CLOUD AGGREGATOR
 * =========================================================
 *
 * Current state:
 *
 * AWS   -> REAL CLOUD DATA
 * Azure -> MOCK DATA
 * GCP   -> MOCK DATA
 *
 * Later:
 *
 * AWS   -> REAL
 * Azure -> REAL
 * GCP   -> REAL
 *
 * This file gives the frontend ONE common resource feed.
 */


export async function getAllCloudResources() {

  let awsResources: any[] = [];


  /*
   * -------------------------------------------------------
   * REAL AWS RESOURCES
   * -------------------------------------------------------
   */

  try {

    const liveAwsResources =
      await getNormalizedAwsResources();


    awsResources =
      liveAwsResources.map(
        resource => ({
          ...resource,

          source: "live" as const
        })
      );

  } catch (error) {

    /*
     * If AWS temporarily fails,
     * don't crash the whole CloudWise dashboard.
     */

    console.error(
      "AWS collector failed:",
      error
    );


    awsResources = [];
  }


  /*
   * -------------------------------------------------------
   * CURRENT MOCK RESOURCES
   * -------------------------------------------------------
   */

  const existingResources =
    cloudService.getAllResources();


  /*
   * Remove mock AWS resources.
   *
   * AWS must now come ONLY from the
   * real AWS collector.
   *
   * Azure and GCP remain mock until their
   * collectors are implemented.
   */

  const nonAwsResources =
    existingResources
      .filter(
        resource =>
          resource.provider !== "AWS"
      )
      .map(
        resource => ({
          ...resource,

          source: "mock" as const
        })
      );


  /*
   * -------------------------------------------------------
   * ONE UNIFIED CLOUDWISE RESOURCE ARRAY
   * -------------------------------------------------------
   */

  return [
    ...awsResources,
    ...nonAwsResources
  ];
}