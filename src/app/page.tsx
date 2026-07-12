import { redirect } from "next/navigation";

import { createAuthenticatedServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createAuthenticatedServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims) {
    redirect("/companies");
  }

  redirect("/login");
}
