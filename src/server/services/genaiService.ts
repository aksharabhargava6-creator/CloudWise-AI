
import "dotenv/config";

import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not configured");
}

const ai = new GoogleGenAI({
  apiKey
});

const MODEL = "gemini-3.6-flash";

export interface RecommendationExplanationInput {
  resource_id: string;
  resource_type: string;
  recommendation: string;
  reason: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  optimization_type?: string;
  optimization_action?: string;
  estimated_saving_usd?: number;
  cpu_utilization?: number;
  memory_utilization?: number;
  storage_utilization?: number;
  cost_usd?: number;
  status?: string;
}

export async function explainRecommendation(
  recommendation: RecommendationExplanationInput
): Promise<string> {

  const prompt = `
You are the AI explanation assistant for CloudWise AI,
a cloud monitoring and cost-optimization platform.

Explain the existing cloud optimization recommendation
provided below in simple, professional language.

IMPORTANT RULES:
- Do not invent any metrics, facts, or recommendations.
- Do not change the existing recommendation.
- Do not calculate a different saving amount.
- Use only the information provided below.
- Explain why the existing recommendation was generated.
- Explain what the recommendation means in practical terms.
- Explain the suggested action already associated with the recommendation.
- Keep the response concise and useful for a cloud administrator.
- If a value is unavailable, do not make one up.

Recommendation data:

Resource ID: ${recommendation.resource_id}
Resource Type: ${recommendation.resource_type}
Recommendation: ${recommendation.recommendation}
Reason: ${recommendation.reason}
Priority: ${recommendation.priority}

Optimization Type:
${recommendation.optimization_type ?? "Not specified"}

Optimization Action:
${recommendation.optimization_action ?? "Not specified"}

Estimated Saving (USD):
${
  recommendation.estimated_saving_usd !== undefined
    ? recommendation.estimated_saving_usd.toFixed(2)
    : "Not specified"
}

CPU Utilization:
${
  recommendation.cpu_utilization !== undefined
    ? `${recommendation.cpu_utilization}%`
    : "Not available"
}

Memory Utilization:
${
  recommendation.memory_utilization !== undefined
    ? `${recommendation.memory_utilization}%`
    : "Not available"
}

Storage Utilization:
${
  recommendation.storage_utilization !== undefined
    ? `${recommendation.storage_utilization}%`
    : "Not available"
}

Current Cost (USD):
${
  recommendation.cost_usd !== undefined
    ? recommendation.cost_usd.toFixed(2)
    : "Not available"
}

Resource Status:
${recommendation.status ?? "Not available"}

Return the answer using exactly these three sections:

Why this recommendation:
Explain the main reason based only on the supplied data.

What it means:
Explain the practical impact for this cloud resource.

Suggested action:
Explain the action associated with the existing recommendation.
`;

  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {

    try {

      console.log(
        `Calling Gemini (attempt ${attempt}/${maxAttempts})...`
      );

      const response =
        await ai.models.generateContent({
          model: MODEL,
          contents: prompt,
          config: {
  maxOutputTokens: 500,
  temperature: 0.2,
  thinkingConfig: {
    thinkingLevel: "minimal"
  },
  httpOptions: {
    timeout: 30000
  }
}
        });

      console.log("Gemini response received.");

      const text =
        response.text?.trim();

      if (!text) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      return text;

    } catch (error: any) {

      console.error(
        `Gemini attempt ${attempt} failed:`,
        error
      );

      if (attempt === maxAttempts) {
        throw error;
      }

      const delay = 5000 * Math.pow(2, attempt - 1);

console.log(
  `Retrying Gemini request in ${delay / 1000} seconds...`
);

await new Promise(
  resolve => setTimeout(resolve, delay)
);
    }
  }

  throw new Error(
    "Gemini request failed after multiple attempts."
  );
}