import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { createAuthenticatedServerClient } from "@/lib/supabase/server";

export default async function LoginPage() {
  const supabase = await createAuthenticatedServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (!error && data?.claims) {
    redirect("/companies");
  }

  return (
    <main className="page-shell narrow-page" aria-labelledby="login-title">
      <section className="panel">
        <p className="eyebrow">EasyPass</p>
        <h1 id="login-title">Sign in</h1>
        <LoginForm />
      </section>
    </main>
  );
}
