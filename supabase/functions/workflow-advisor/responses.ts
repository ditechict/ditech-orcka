import { createOpenAI } from "npm:@ai-sdk/openai@4.0.121";
import { streamText } from "npm:ai@7.0.142";
import {
  createLovableAiGatewayRunIdFetch,
  getLovableAiGatewayRunId,
} from "./run-id.ts";
import { buildWorkflowInstructions } from "./schema.ts";

export function createWorkflowAdvice(request: Request, apiKey: string, workflowBrief: string) {
  const runIdFetch = createLovableAiGatewayRunIdFetch(getLovableAiGatewayRunId(request));
  const openai = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey,
    headers: {
      "Lovable-API-Key": apiKey,
      "X-Lovable-AIG-SDK": "vercel-ai-sdk",
    },
    fetch: runIdFetch.fetch,
  });

  const result = streamText({
    model: openai.responses("openai/gpt-6-astra"),
    instructions: buildWorkflowInstructions(),
    messages: [{ role: "user", content: workflowBrief }],
    abortSignal: request.signal,
    maxRetries: 0,
    providerOptions: {
      openai: {
        forceReasoning: true,
        reasoningEffort: "low",
        reasoningSummary: "auto",
        store: false,
        include: ["reasoning.encrypted_content"],
      },
    },
  });

  return { result, runIdFetch };
}

export function addGatewayHeaders(source: Headers, target: Headers) {
  for (const [name, value] of source.entries()) {
    if (name.toLowerCase().startsWith("x-lovable-aig-")) target.set(name, value);
  }
  const runId = target.get("X-Lovable-AIG-Run-ID");
  if (runId) target.set("Access-Control-Expose-Headers", "X-Lovable-AIG-Run-ID");
}