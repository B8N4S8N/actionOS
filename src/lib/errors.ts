/** Bad input that a staff member can fix by changing what they typed. */
export class ValidationError extends Error {
  readonly status = 400;

  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

/** Not signed in (as opposed to signed in without permission). */
export class UnauthenticatedError extends Error {
  readonly status = 401;

  constructor(message = "Sign in to continue.") {
    super(message);
    this.name = "UnauthenticatedError";
  }
}

export function errorStatus(error: unknown): number {
  if (
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return 500;
}

export function errorMessage(error: unknown): string {
  const status = errorStatus(error);
  if (status === 500) return "Something went wrong. Try again.";
  return error instanceof Error ? error.message : "Request failed.";
}
