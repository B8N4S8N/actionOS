"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { auth } from "@/lib/auth";

import { formString, runFormAction, type FormState } from "./shared";

const signInSchema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
});

export async function signInAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const result = await runFormAction(async () => {
    const input = signInSchema.parse({
      email: formString(formData, "email").toLowerCase(),
      password: formString(formData, "password"),
    });

    try {
      await auth.api.signInEmail({
        body: { email: input.email, password: input.password },
        headers: await headers(),
      });
    } catch {
      // Deliberately identical for a wrong password and an unknown email, so
      // the form cannot be used to discover who has an account.
      return {
        status: "error" as const,
        message: "Email or password is incorrect.",
      };
    }

    return { status: "success" as const };
  });

  // redirect() throws, so it has to happen outside the try/catch above.
  if (result.status === "success") redirect("/dashboard");
  return result;
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
