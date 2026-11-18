import type { Config, Context } from "@netlify/functions";
import { createHostedDeepeningHandler } from "../../server/hosted-deepening.ts";

const handle = createHostedDeepeningHandler(() => ({
  apiKey: Netlify.env.get("OPENAI_API_KEY"),
  model: Netlify.env.get("OPENAI_MODEL"),
}));

export default async (request: Request, context: Context): Promise<Response> =>
  handle(request, context.site.url ?? Netlify.env.get("URL"));

export const config: Config = {
  path: ["/api/deepening/aspects", "/api/deepening/questions"],
  rateLimit: {
    windowLimit: 10,
    windowSize: 60,
    aggregateBy: ["ip", "domain"],
    action: "rate_limit",
  },
};
