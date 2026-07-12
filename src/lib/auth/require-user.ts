import { redirect } from "next/navigation";

import { createAuthenticatedServerClient } from "@/lib/supabase/server";

export type AuthenticatedUser = {
  id: string;
  email?: string;
};

export async function requireUser(): Promise<AuthenticatedUser> {
  const supabase = await createAuthenticatedServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    redirect("/login");
  }

  return {
    id: data?.claims.sub,
    email: typeof data?.claims.email === "string" ? data?.claims.email : undefined,
  };
}
