import { z } from "zod";

/**
 * Server environment, validated once and lazily.
 *
 * Validation is deferred until a value is actually read so that importing a
 * module which happens to touch `env` (during `next build`, for example) does
 * not fail a build that never runs the code path needing a database.
 */

const booleanish = z
  .union([z.boolean(), z.enum(["true", "false", "1", "0", ""])])
  .transform((value) => value === true || value === "true" || value === "1");

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required (see .env.example)")
    .refine(
      (value) =>
        value.startsWith("postgres://") || value.startsWith("postgresql://"),
      "DATABASE_URL must be a postgres:// or postgresql:// connection string",
    ),
  DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DATABASE_SSL: booleanish.default(false),

  BETTER_AUTH_SECRET: z
    .string()
    .min(
      32,
      "BETTER_AUTH_SECRET must be at least 32 characters (openssl rand -base64 32)",
    ),
  BETTER_AUTH_URL: z.string().url().optional(),

  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),

  GEMINI_API_KEY: z.string().min(1).optional(),
  GEMINI_MODEL: z.string().min(1).default("gemini-2.0-flash"),

  SEED_DEMO_PASSWORD: z.string().min(10).default("DemoPassword123!"),
});

export type Env = z.infer<typeof envSchema>;

const BUILD_DATABASE_URL = "postgresql://build:build@127.0.0.1:5432/build";
const BUILD_AUTH_SECRET = "build-time-placeholder-secret-min-32-chars";

let cached: Env | undefined;

function isBuildTimeSoftFail(): boolean {
  // Next sets NEXT_PHASE while collecting page data. Vercel also sets CI=1
  // for the install/build step. Either is enough to allow placeholders when
  // the project has missing or leftover-invalid secrets.
  return (
    process.env.NEXT_PHASE === "phase-production-build" ||
    process.env.NEXT_PHASE === "phase-export" ||
    process.env.npm_lifecycle_event === "build" ||
    (process.env.CI === "1" && process.env.VERCEL === "1")
  );
}

function looksLikeDatabaseUrl(value: string | undefined): value is string {
  return Boolean(
    value &&
      (value.startsWith("postgres://") || value.startsWith("postgresql://")),
  );
}

function looksLikeAuthSecret(value: string | undefined): value is string {
  return Boolean(value && value.length >= 32);
}

function buildTimeEnv(): Env {
  // Do not spread raw process.env for required fields — Vercel projects often
  // carry empty strings or short leftovers from a previous stack, and `??`
  // would keep those invalid values.
  return envSchema.parse({
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: looksLikeDatabaseUrl(process.env.DATABASE_URL)
      ? process.env.DATABASE_URL
      : BUILD_DATABASE_URL,
    DATABASE_POOL_MAX: process.env.DATABASE_POOL_MAX,
    DATABASE_SSL: process.env.DATABASE_SSL,
    BETTER_AUTH_SECRET: looksLikeAuthSecret(process.env.BETTER_AUTH_SECRET)
      ? process.env.BETTER_AUTH_SECRET
      : BUILD_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || undefined,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY || undefined,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || undefined,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    SEED_DEMO_PASSWORD: process.env.SEED_DEMO_PASSWORD,
  });
}

export function getEnv(): Env {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    if (isBuildTimeSoftFail()) {
      cached = buildTimeEnv();
      return cached;
    }

    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".") || "(root)"}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${details}`);
  }

  cached = parsed.data;
  return cached;
}

export const env = new Proxy({} as Env, {
  get: (_target, key: string) => getEnv()[key as keyof Env],
  has: (_target, key: string) => key in getEnv(),
});

/** Base URL used for auth callbacks and absolute links. */
export function getBaseUrl(): string {
  const configured = process.env.BETTER_AUTH_URL;
  if (configured) return configured.replace(/\/$/, "");

  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}`;

  return "http://localhost:3000";
}

/**
 * Whether to list the seeded demo credentials on the sign-in page. On by
 * default outside production so a fresh clone is usable; opt in explicitly for
 * a hosted demo.
 */
export function showDemoLogins(): boolean {
  if (process.env.SHOW_DEMO_LOGINS === "true") return true;
  if (process.env.SHOW_DEMO_LOGINS === "false") return false;
  return process.env.NODE_ENV !== "production";
}

/** Which LLM provider is configured, if any. */
export function getLlmProvider(): "openai" | "gemini" | null {
  if (process.env.OPENAI_API_KEY) return "openai";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return null;
}
