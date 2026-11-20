import { ZodError } from "zod";

import { errorMessage, errorStatus } from "@/lib/errors";

export interface FormState {
  status: "idle" | "success" | "error";
  message?: string;
  /** Field name for inline errors, when the failure maps to one input. */
  field?: string;
}

export const idleState: FormState = { status: "idle" };

/**
 * Wrap a server action so thrown authorization/validation errors come back as
 * form state instead of a stack trace, and unexpected errors stay generic.
 */
export async function runFormAction(
  handler: () => Promise<FormState>,
): Promise<FormState> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof ZodError) {
      const first = error.issues[0];
      return {
        status: "error",
        message: first?.message ?? "Check the form and try again.",
        field: first?.path.join("."),
      };
    }

    if (errorStatus(error) === 500) {
      console.error("[action] unhandled error", error);
    }

    return { status: "error", message: errorMessage(error) };
  }
}

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function formNumber(formData: FormData, key: string): number {
  return Number.parseInt(formString(formData, key), 10);
}
