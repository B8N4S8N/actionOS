import { getLlmProvider } from "@/lib/env";

import { classifyWithKeywords } from "./keyword-classifier";
import { classifyWithLlm } from "./llm";
import type { ActionClassification, ClassifierContext } from "./types";

/**
 * Classify a staff observation into proposals.
 *
 * The LLM is tried first when a key is configured; the keyword classifier is
 * both the no-key path and the safety net. Either way the result is only a
 * proposal — `applyProposals` is what writes, and only after a human confirms.
 */
export async function classifyObservation(
  input: string,
  context: ClassifierContext,
): Promise<ActionClassification> {
  if (!getLlmProvider()) {
    return classifyWithKeywords(input, context);
  }

  try {
    return await classifyWithLlm(input, context);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown LLM error";
    // Worth a server log: staff still get a usable result, but an operator
    // should know the provider is misbehaving.
    console.warn(`[action] LLM classification failed, using keywords: ${reason}`);

    const fallback = classifyWithKeywords(input, context);
    return { ...fallback, fallbackReason: reason };
  }
}
