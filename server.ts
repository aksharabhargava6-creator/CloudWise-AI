import express, {

  Request,

  Response,

  NextFunction

} from 'express';



import cors from 'cors';

import path from 'path';

import { fileURLToPath } from 'url';



import { cloudService } from './src/server/services/cloudService.js';

import { detectCpuAnomalies } from './src/server/services/anomalyService.js';

import { forecastCost } from './src/server/services/forecastService.js';

import { generateRecommendations } from './src/server/services/recommendationService.js';



/*

 * Live AWS multi-cloud collector

 */

import {

  getNormalizedAwsResources

} from './src/server/services/cloud/awsCollector.js';

import {

  getAllCloudResources

} from './src/server/services/cloud/cloudAggregator.js';



import {

  AnalysisResponse,

  DashboardOverview,

  MetricData,

  CostData,

  ResourceData

} from './src/types/cloudwise.js';





const __filename = fileURLToPath(import.meta.url);

const __dirname = path.dirname(__filename);





const app = express();



const PORT = parseInt(

  process.env.PORT || '3000',

  10

);





app.use(cors());



app.use(

  express.json({

    limit: '10mb'

  })

);





// -------------------------------------------------------------

// Health & Diagnostic Endpoints

// -------------------------------------------------------------





app.get(

  '/health',

  (_req: Request, res: Response) => {



    res.json({

      status: 'healthy'

    });

  }

);





app.get(

  '/api/health',

  (_req: Request, res: Response) => {



    res.json({

      status: 'healthy'

    });

  }

);





app.get(

  '/api/auth/test',

  (_req: Request, res: Response) => {



    res.json({

      message: 'Authentication API is working'

    });

  }

);





// -------------------------------------------------------------

// LIVE MULTI-CLOUD ENDPOINTS

// -------------------------------------------------------------





/*

 * GET /api/cloud/aws/live

 *

 * Retrieves real AWS EC2 resources,

 * fetches CloudWatch CPU metrics,

 * normalizes the AWS data into the

 * common CloudWise format,

 * and returns it as JSON.

 */

app.get(

  '/api/cloud/aws/live',

  async (_req: Request, res: Response) => {



    try {



      const resources =

        await getNormalizedAwsResources();





      return res.json({



        provider: 'AWS',



        source: 'live',



        count: resources.length,



        resources

      });



    } catch (error: any) {



      console.error(

        'Failed to retrieve live AWS resources:',

        error

      );





      return res.status(500).json({



        error:

          'Failed to retrieve live AWS resources',



        details:

          error?.message ??

          'Unknown AWS error'

      });

    }

  }

);





// -------------------------------------------------------------

// Cloud Resources CRUD Endpoints

// -------------------------------------------------------------





/*

 * Currently returns the existing

 * seeded/mock multi-cloud resources.

 *

 * Later we will integrate real AWS,

 * Azure and GCP collectors here.

 */

app.get(

  '/api/cloud/resources',

  async (_req: Request, res: Response) => {

    try {

      const resources =
        await getAllCloudResources();

      return res.json(resources);

    } catch (error: any) {

      console.error(
        'Failed to retrieve cloud resources:',
        error
      );

      return res.status(500).json({
        error: 'Failed to retrieve cloud resources',
        details: error?.message ?? 'Unknown error'
      });
    }

  }

);





app.get(

  '/api/cloud/resources/:name',

  (req: Request, res: Response) => {



    const name =

      Array.isArray(req.params.name)

        ? req.params.name[0]

        : req.params.name;





    const resource =

      cloudService.getResourceByName(

        name

      );





    if (!resource) {



      return res.status(404).json({

        error: 'Resource not found'

      });

    }





    return res.json(resource);

  }

);





app.post(

  '/api/cloud/resources',

  (req: Request, res: Response) => {



    const body =

      req.body;





    if (

      !body.name ||

      !body.provider ||

      !body.resource_type ||

      !body.region

    ) {



      return res.status(400).json({



        error:

          'Missing required fields (name, provider, resource_type, region)'

      });

    }





    const created =

      cloudService.addResource({



        name:

          body.name,



        provider:

          body.provider,



        resource_type:

          body.resource_type,



        region:

          body.region,



        status:

          body.status ||

          'running',



        instance_type:

          body.instance_type ||

          'standard-tier',



        cpu_utilization:

          Number(

            body.cpu_utilization ??

            45

          ),



        memory_utilization:

          Number(

            body.memory_utilization ??

            50

          ),



        storage_utilization:

          Number(

            body.storage_utilization ??

            40

          ),



        network_in_mb:

          Number(

            body.network_in_mb ??

            300

          ),



        network_out_mb:

          Number(

            body.network_out_mb ??

            250

          ),



        cost_usd:

          Number(

            body.cost_usd ??

            0.20

          ),



        monthly_cost:

          Number(

            body.monthly_cost ??

            144

          )

      });





    return res

      .status(201)

      .json(created);

  }

);





app.patch(

  '/api/cloud/resources/:id',

  (req: Request, res: Response) => {



    const id =

      Array.isArray(req.params.id)

        ? req.params.id[0]

        : req.params.id;





    const updated =

      cloudService.updateResource(

        id,

        req.body

      );





    if (!updated) {



      return res.status(404).json({

        error: 'Resource not found'

      });

    }





    return res.json(updated);

  }

);





app.delete(

  '/api/cloud/resources/:id',

  (req: Request, res: Response) => {



    const id =

      Array.isArray(req.params.id)

        ? req.params.id[0]

        : req.params.id;





    const success =

      cloudService.deleteResource(id);





    if (!success) {



      return res.status(404).json({

        error: 'Resource not found'

      });

    }





    return res.json({

      message:

        'Resource deleted successfully'

    });

  }

);





// -------------------------------------------------------------

// AI Engine Handlers

// Mounted on both /ai/* and /api/ai/*

// -------------------------------------------------------------





const handleAnomalies =

  (

    req: Request,

    res: Response

  ) => {



    try {



      const metrics:

        MetricData[] =

          req.body?.metrics ||

          cloudService

            .getAsMetricDataList();





      const contamination =

        req.body?.contamination !==

        undefined

          ? Number(

              req.body.contamination

            )

          : 0.05;





      const result =

        detectCpuAnomalies(

          metrics,

          contamination

        );





      const anomalies =

        result.filter(

          item =>

            item.anomaly

        );





      res.json({



        anomalies,



        total_evaluated:

          result.length,



        count:

          anomalies.length

      });



    } catch (err: any) {



      res.status(400).json({



        error:

          err.message ||

          'Failed to detect anomalies'

      });

    }

  };





const handleForecast =

  (

    req: Request,

    res: Response

  ) => {



    try {



      const provider =

        req.query.provider as string ||

        req.body?.provider;





      const costs:

        CostData[] =

          req.body?.costs &&

          req.body.costs.length > 0

            ? req.body.costs

            : cloudService

                .getHistoricalCosts(

                  provider

                );





      const periods =

        req.body?.periods !==

        undefined

          ? Number(

              req.body.periods

            )

          : 3;





      const forecast =

        forecastCost(

          costs,

          periods

        );





      res.json({

        forecast,

        periods

      });



    } catch (err: any) {



      res.status(400).json({



        error:

          err.message ||

          'Failed to generate forecast'

      });

    }

  };





const handleRecommendations =

  (

    req: Request,

    res: Response

  ) => {



    try {



      const resources:

        ResourceData[] =

          req.body?.resources &&

          req.body.resources.length > 0

            ? req.body.resources

            : cloudService

                .getAsResourceDataList();





      const recommendations =

        generateRecommendations(

          resources

        );





      res.json({



        recommendations,



        count:

          recommendations.length

      });



    } catch (err: any) {



      res.status(400).json({



        error:

          err.message ||

          'Failed to generate recommendations'

      });

    }

  };





const handleAnalyze =

  (

    req: Request,

    res: Response

  ) => {



    try {



      const contamination =

        req.body?.contamination !==

        undefined

          ? Number(

              req.body.contamination

            )

          : 0.05;





      const periods =

        req.body?.forecast_periods !==

        undefined

          ? Number(

              req.body.forecast_periods

            )

          : 3;





      const metrics:

        MetricData[] =

          req.body?.metrics &&

          req.body.metrics.length > 0

            ? req.body.metrics

            : cloudService

                .getAsMetricDataList();





      const costs:

        CostData[] =

          req.body?.costs &&

          req.body.costs.length > 0

            ? req.body.costs

            : cloudService

                .getHistoricalCosts();





      const resources:

        ResourceData[] =

          req.body?.resources &&

          req.body.resources.length > 0

            ? req.body.resources

            : cloudService

                .getAsResourceDataList();





      const allMetricsResult =

        detectCpuAnomalies(

          metrics,

          contamination

        );





      const anomalies =

        allMetricsResult.filter(

          item =>

            item.anomaly

        );





      const forecast =

        forecastCost(

          costs,

          periods

        );





      const recommendations =

        generateRecommendations(

          resources

        );





      const response:

        AnalysisResponse = {



          anomalies,



          forecast,



          recommendations

        };





      res.json(response);



    } catch (err: any) {



      res.status(400).json({



        error:

          err.message ||

          'Analysis pipeline failed'

      });

    }

  };





// -------------------------------------------------------------

// Mount AI Handlers

// -------------------------------------------------------------





app.post(

  '/ai/anomalies',

  handleAnomalies

);



app.post(

  '/api/ai/anomalies',

  handleAnomalies

);





app.post(

  '/ai/forecast',

  handleForecast

);



app.post(

  '/api/ai/forecast',

  handleForecast

);





app.post(

  '/ai/recommendations',

  handleRecommendations

);



app.post(

  '/api/ai/recommendations',

  handleRecommendations

);





app.post(

  '/ai/analyze',

  handleAnalyze

);



app.post(

  '/api/ai/analyze',

  handleAnalyze

);





// -------------------------------------------------------------

// Overview KPI Aggregations

// -------------------------------------------------------------





app.get(

  '/api/ai/overview',

  (_req: Request, res: Response) => {



    const allResources =

      cloudService

        .getAllResources();





    const metricDataList =

      cloudService

        .getAsMetricDataList();





    const anomaliesResult =

      detectCpuAnomalies(

        metricDataList

      );





    const activeAnomalies =

      anomaliesResult.filter(

        a =>

          a.anomaly

      );





    const resourceDataList =

      cloudService

        .getAsResourceDataList();





    const recommendations =

      generateRecommendations(

        resourceDataList

      );





    const totalMonthlySpend =

      allResources.reduce(

        (

          acc,

          r

        ) =>

          acc +

          (

            r.monthly_cost ||

            0

          ),

        0

      );





    const totalPredictedSavings =

      recommendations.reduce(

        (

          acc,

          rec

        ) =>

          acc +

          (

            rec

              .estimated_saving_usd ||

            0

          ),

        0

      );





    const highPriority =

      recommendations.filter(

        r =>

          r.priority ===

          'HIGH'

      ).length;





    const spendByCloud = {



      AWS: 0,



      Azure: 0,



      GCP: 0

    };





    const spendByTypeMap =

      new Map<

        string,

        number

      >();





    for (

      const r

      of allResources

    ) {



      if (

        r.provider === 'AWS'

      ) {



        spendByCloud.AWS +=

          r.monthly_cost ||

          0;



      } else if (

        r.provider === 'Azure'

      ) {



        spendByCloud.Azure +=

          r.monthly_cost ||

          0;



      } else if (

        r.provider === 'GCP'

      ) {



        spendByCloud.GCP +=

          r.monthly_cost ||

          0;

      }





      const currentTypeSpend =

        spendByTypeMap.get(

          r.resource_type

        ) || 0;





      spendByTypeMap.set(

        r.resource_type,



        currentTypeSpend +

        (

          r.monthly_cost ||

          0

        )

      );

    }





    const resourceTypeSpend =

      Array.from(

        spendByTypeMap.entries()

      )



        .map(

          (

            [

              type,

              amount

            ]

          ) => ({



            type,



            amount:

              Math.round(

                amount *

                100

              ) /

              100,



            percentage:

              totalMonthlySpend > 0

                ? Math.round(

                    (

                      amount /

                      totalMonthlySpend

                    ) *

                    100

                  )

                : 0

          })

        )



        .sort(

          (

            a,

            b

          ) =>

            b.amount -

            a.amount

        );





    const costs =

      cloudService

        .getHistoricalCosts();





    const forecast1Period =

      forecastCost(

        costs,

        1

      );





    const forecastNextMonth =

      forecast1Period[0]

        ?.predicted_cost ||

      totalMonthlySpend *

        1.03;





    const overview:

      DashboardOverview = {



        totalMonthlySpend:

          Math.round(

            totalMonthlySpend *

            100

          ) /

          100,



        totalPredictedSavings:

          Math.round(

            totalPredictedSavings *

            100

          ) /

          100,



        totalResourcesCount:

          allResources.length,



        runningResourcesCount:

          allResources.filter(

            r =>

              r.status ===

              'running'

          ).length,



        stoppedResourcesCount:

          allResources.filter(

            r =>

              r.status ===

              'stopped'

          ).length,



        activeAnomaliesCount:

          activeAnomalies.length,



        highPriorityRecommendationsCount:

          highPriority,



        forecastNextMonth:

          Math.round(

            forecastNextMonth *

            100

          ) /

          100,



        spendDeltaPercent:

          3.4,



        savingsDeltaPercent:

          totalMonthlySpend > 0

            ? Math.round(

                (

                  totalPredictedSavings /

                  totalMonthlySpend

                ) *

                1000

              ) /

              10

            : 0,



        cloudSpendBreakdown: {



          AWS:

            Math.round(

              spendByCloud.AWS *

              100

            ) /

            100,



          Azure:

            Math.round(

              spendByCloud.Azure *

              100

            ) /

            100,



          GCP:

            Math.round(

              spendByCloud.GCP *

              100

            ) /

            100

        },



        resourceTypeSpend

      };





    res.json(

      overview

    );

  }

);





// -------------------------------------------------------------

// Dataset Endpoints

// -------------------------------------------------------------





app.get(

  '/api/ai/dataset/costs',

  (

    req: Request,

    res: Response

  ) => {



const provider = req.query.provider as string | undefined;





    res.json(

      cloudService

        .getHistoricalCosts(

          provider

        )

    );

  }

);





app.get(

  '/api/ai/dataset/metrics',

  (

    _req: Request,

    res: Response

  ) => {



    const metricDataList =

      cloudService

        .getAsMetricDataList();





    const anomalies =

      detectCpuAnomalies(

        metricDataList

      );





    res.json(

      anomalies

    );

  }

);





// -------------------------------------------------------------

// Frontend Integration

// Vite in development, static files in production

// -------------------------------------------------------------





async function startServer() {



  const isProduction =

    process.env.NODE_ENV ===

    'production';





  if (!isProduction) {



    const {

      createServer:

        createViteServer

    } =

      await import(

        'vite'

      );





    const vite =

      await createViteServer({



        server: {

          middlewareMode:

            true

        },



        appType:

          'spa'

      });





    app.use(

      vite.middlewares

    );



  } else {



    const distPath =

      path.resolve(

        __dirname,

        'dist'

      );





    app.use(

      express.static(

        distPath

      )

    );





    app.get(

      '*',

      (

        _req: Request,

        res: Response

      ) => {



        res.sendFile(

          path.join(

            distPath,

            'index.html'

          )

        );

      }

    );

  }





  // Error handling middleware



  app.use(

    (

      err: any,

      _req: Request,

      res: Response,

      _next: NextFunction

    ) => {



      console.error(

        'Unhandled server exception:',

        err

      );





      res

        .status(500)

        .json({



          error:

            'Internal server error',



          details:

            err?.message

        });

    }

  );





  app.listen(

    PORT,

    '0.0.0.0',

    () => {



      console.log(

        `CloudWise-AI full-stack server running on http://0.0.0.0:${PORT}`

      );

    }

  );

}





startServer().catch(

  err => {



    console.error(

      'Fatal initialization error:',

      err

    );



    process.exit(1);

  }

);