"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { createAuthenticatedServerClient } from "@/lib/supabase/server";

export type LoginState = {
  error?: string;
};

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function signInWithPassword(
  _previousState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Enter a valid email and password." };
  }

  const supabase = await createAuthenticatedServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Invalid email or password." };
  }

  redirect("/companies");
}
