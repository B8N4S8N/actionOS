import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";

import { db, schema } from "@/db";
import { env, getBaseUrl } from "@/lib/env";

/**
 * Better Auth instance.
 *
 * ActionOS is invite-only: public self sign-up is disabled, so no one can
 * create an account against a real agency's database from the internet. Staff
 * accounts are provisioned by `npm run db:seed` or `npm run staff:create`,
 * which build their own instance with `allowSignUp: true` in a local process
 * that is never exposed over HTTP.
 *
 * The extra user columns (role, organizationId, jobTitle, isActive) are
 * declared with `input: false` so an auth request can never set them, and
 * authorization re-reads them from the database on every request (see
 * `src/lib/actor.ts`) rather than trusting the session payload.
 */
export function buildAuth({ allowSignUp = false }: { allowSignUp?: boolean } = {}) {
  return betterAuth({
    appName: "ActionOS",
    baseURL: getBaseUrl(),
    secret: env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !allowSignUp,
      minPasswordLength: 12,
      maxPasswordLength: 256,
      autoSignIn: false,
    },
    user: {
      additionalFields: {
        role: { type: "string", required: false, input: false },
        organizationId: { type: "string", required: false, input: false },
        jobTitle: { type: "string", required: false, input: false },
        isActive: {
          type: "boolean",
          required: false,
          input: false,
          defaultValue: true,
        },
      },
    },
    session: {
      // A session should not outlive a couple of shifts on a shared staff
      // workstation.
      expiresIn: 60 * 60 * 24,
      updateAge: 60 * 60,
    },
    rateLimit: {
      enabled: true,
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 60, max: 10 },
      },
    },
    advanced: {
      useSecureCookies: env.NODE_ENV === "production",
    },
    telemetry: { enabled: false },
    plugins: [nextCookies()],
  });
}

export const auth = buildAuth();

export type AuthSession = Awaited<ReturnType<typeof auth.api.getSession>>;
