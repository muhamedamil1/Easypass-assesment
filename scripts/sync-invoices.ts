import { config } from "dotenv";

import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

import { loadMockErpInvoicePayload } from "../src/features/erp/mock-erp-source";
import {
  syncInvoicesFromPayload,
  toSyncCompletedEvent,
} from "../src/features/invoices/sync-service";

config({ path: ".env.local", quiet: true });

const scriptEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = scriptEnvSchema.parse(process.env);

function createPrivilegedClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

async function main() {
  const client = createPrivilegedClient();
  const payload = await loadMockErpInvoicePayload();
  const result = await syncInvoicesFromPayload(payload, client);

  console.log(JSON.stringify(toSyncCompletedEvent(result)));
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
