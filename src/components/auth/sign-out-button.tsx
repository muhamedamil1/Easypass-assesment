import { redirect } from "next/navigation";

import { createAuthenticatedServerClient } from "@/lib/supabase/server";

async function signOut() {
  "use server";

  const supabase = await createAuthenticatedServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button className="secondary-button" type="submit">
        Sign out
      </button>
    </form>
  );
}
