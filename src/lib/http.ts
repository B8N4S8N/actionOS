import { ZodError } from "zod";

import { errorMessage, errorStatus } from "@/lib/errors";

/**
 * Turn a thrown error into a JSON response without leaking internals.
 *
 * Authorization, validation and authentication errors carry their own status
 * and a message written for staff. Everything else becomes a generic 500 and
 * is logged server-side.
 */
export function jsonError(error: unknown): Response {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return Response.json(
      {
        error: first?.message ?? "That request was not valid.",
        field: first?.path.join("."),
      },
      { status: 400 },
    );
  }

  const status = errorStatus(error);
  if (status === 500) {
    console.error("[api] unhandled error", error);
  }

  return Response.json({ error: errorMessage(error) }, { status });
}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return {};
  }
}
