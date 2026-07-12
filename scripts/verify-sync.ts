import { config } from "dotenv";

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { loadMockErpInvoicePayload } from "../src/features/erp/mock-erp-source";
import type { MockErpEnvelope } from "../src/features/erp/types";
import { syncInvoicesFromPayload } from "../src/features/invoices/sync-service";

config({ path: ".env.local", quiet: true });

const scriptEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

const env = scriptEnvSchema.parse(process.env);

const evidence = {
  firstRun: "evidence/sync-run-1.txt",
  secondRun: "evidence/sync-run-2.txt",
  edgeCases: "evidence/sync-edge-cases.txt",
} as const;

const lines = {
  firstRun: [] as string[],
  secondRun: [] as string[],
  edgeCases: [] as string[],
};

let failures = 0;

type InvoiceSnapshot = {
  external_id: string;
  amount_aed: string;
  status: string;
  source_updated_at: string;
  last_synced_at: string;
};

function createPrivilegedClient() {
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

function log(section: keyof typeof lines, message: string) {
  lines[section].push(message);
  console.log(message);
}

function pass(section: keyof typeof lines, label: string) {
  log(section, `PASS ${label}`);
}

function fail(section: keyof typeof lines, label: string, detail: string) {
  failures += 1;
  log(section, `FAIL ${label} :: ${detail}`);
}

async function check(
  section: keyof typeof lines,
  label: string,
  assertion: () => Promise<boolean> | boolean,
) {
  try {
    if (await assertion()) {
      pass(section, label);
    } else {
      fail(section, label, "assertion returned false");
    }
  } catch (error) {
    fail(section, label, error instanceof Error ? error.message : String(error));
  }
}

async function writeEvidence() {
  for (const [section, path] of Object.entries(evidence) as Array<
    [keyof typeof evidence, string]
  >) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${lines[section].join("\n")}\n`, "utf8");
  }
}

async function resetInvoices(client: SupabaseClient) {
  const { error } = await client.from("invoices").delete().eq("source", "mock-erp");

  if (error) {
    throw new Error(`invoice reset failed: ${error.message}`);
  }
}

async function countInvoices(client: SupabaseClient) {
  const { count, error } = await client
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("source", "mock-erp");

  if (error || count === null) {
    throw new Error(`invoice count failed: ${error?.message ?? "missing count"}`);
  }

  return count;
}

async function getInvoice(client: SupabaseClient, externalId: string) {
  const { data, error } = await client
    .from("invoices")
    .select("external_id, amount_aed, status, source_updated_at, last_synced_at")
    .eq("source", "mock-erp")
    .eq("external_id", externalId)
    .single<InvoiceSnapshot>();

  if (error) {
    throw new Error(`invoice lookup failed for ${externalId}: ${error.message}`);
  }

  return data;
}

async function getSnapshot(client: SupabaseClient) {
  const { data, error } = await client
    .from("invoices")
    .select("external_id, amount_aed, status, source_updated_at, last_synced_at")
    .eq("source", "mock-erp")
    .order("external_id", { ascending: true })
    .returns<InvoiceSnapshot[]>();

  if (error) {
    throw new Error(`invoice snapshot failed: ${error.message}`);
  }

  return data;
}

function serializeSnapshot(rows: InvoiceSnapshot[]) {
  return rows
    .map(
      (row) =>
        `${row.external_id}|${row.amount_aed}|${row.status}|${row.source_updated_at}|${row.last_synced_at}`,
    )
    .join("\n");
}

function clonePayload(payload: MockErpEnvelope): MockErpEnvelope {
  return JSON.parse(JSON.stringify(payload)) as MockErpEnvelope;
}

async function expectSyncFailure(
  section: keyof typeof lines,
  label: string,
  client: SupabaseClient,
  payload: MockErpEnvelope,
  expectedCode: string,
) {
  try {
    await syncInvoicesFromPayload(payload, client);
    fail(section, label, "sync unexpectedly succeeded");
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes(expectedCode)) {
      pass(section, label);
    } else {
      fail(section, label, message);
    }
  }
}

async function main() {
  const client = createPrivilegedClient();
  const canonicalPayload = await loadMockErpInvoicePayload();

  log("firstRun", "Sync verification for EasyPass Task 04");
  log("firstRun", "Resetting mock-erp invoices before first run");
  await resetInvoices(client);

  const first = await syncInvoicesFromPayload(canonicalPayload, client);
  log(
    "firstRun",
    `first result: received=${first.received} unique=${first.unique} affected=${first.affected} final=${first.finalInvoiceCount}`,
  );

  await check("firstRun", "first run receives 8 source objects", () => first.received === 8);
  await check("firstRun", "first run reduces to 6 invoice identities", () => first.unique === 6);
  await check("firstRun", "first run affects 6 rows", () => first.affected === 6);
  await check("firstRun", "first run final count is 6", () => first.finalInvoiceCount === 6);

  const inv002 = await getInvoice(client, "INV-2026-002");
  const inv005 = await getInvoice(client, "INV-2026-005");

  await check(
    "firstRun",
    "INV-2026-002 ends paid with June 15 timestamp",
    () =>
      inv002.status === "paid" &&
      inv002.source_updated_at === "2026-06-15T09:00:00+00:00",
  );
  await check(
    "firstRun",
    "INV-2026-005 ends AED 1049.99 with June 16 timestamp",
    () =>
      Number(inv005.amount_aed) === 1049.99 &&
      inv005.source_updated_at === "2026-06-16T13:40:00+00:00",
  );

  const beforeSecond = serializeSnapshot(await getSnapshot(client));
  const second = await syncInvoicesFromPayload(canonicalPayload, client);
  const afterSecond = serializeSnapshot(await getSnapshot(client));

  log(
    "secondRun",
    `second result: received=${second.received} unique=${second.unique} affected=${second.affected} final=${second.finalInvoiceCount}`,
  );

  await check("secondRun", "second run receives 8 source objects", () => second.received === 8);
  await check("secondRun", "second run reduces to 6 invoice identities", () => second.unique === 6);
  await check("secondRun", "second identical run affects 0 rows", () => second.affected === 0);
  await check("secondRun", "second identical run final count remains 6", () => second.finalInvoiceCount === 6);
  await check(
    "secondRun",
    "second identical run does not alter stored business/source/sync timestamps",
    () => beforeSecond === afterSecond,
  );

  const baselineSnapshot = serializeSnapshot(await getSnapshot(client));
  const baselineCount = await countInvoices(client);

  const stalePayload = clonePayload(canonicalPayload);
  stalePayload.invoices = [
    {
      external_id: "INV-2026-005",
      company_name: "Marina Tech DMCC",
      amount_aed: 1,
      status: "paid",
      updated_at: "2026-06-01T00:00:00Z",
    },
  ];
  const stale = await syncInvoicesFromPayload(stalePayload, client);
  const inv005AfterStale = await getInvoice(client, "INV-2026-005");
  await check("edgeCases", "stale input affects 0 rows", () => stale.affected === 0);
  await check(
    "edgeCases",
    "stale input cannot roll newer data backward",
    () =>
      Number(inv005AfterStale.amount_aed) === 1049.99 &&
      inv005AfterStale.status === "unpaid" &&
      inv005AfterStale.source_updated_at === "2026-06-16T13:40:00+00:00",
  );

  const conflictPayload = clonePayload(canonicalPayload);
  conflictPayload.invoices = [
    {
      external_id: "INV-EDGE-CONFLICT",
      company_name: "Falcon Trading LLC",
      amount_aed: 10,
      status: "paid",
      updated_at: "2026-06-20T00:00:00Z",
    },
    {
      external_id: "INV-EDGE-CONFLICT",
      company_name: "Falcon Trading LLC",
      amount_aed: 11,
      status: "paid",
      updated_at: "2026-06-20T00:00:00Z",
    },
  ];
  await expectSyncFailure(
    "edgeCases",
    "equal-timestamp conflicting input is rejected",
    client,
    conflictPayload,
    "CONFLICTING_SOURCE_VERSIONS",
  );
  await check(
    "edgeCases",
    "conflict failure creates no partial writes",
    async () =>
      (await countInvoices(client)) === baselineCount &&
      serializeSnapshot(await getSnapshot(client)) === baselineSnapshot,
  );

  const unmatchedPayload = clonePayload(canonicalPayload);
  unmatchedPayload.invoices = [
    {
      external_id: "INV-EDGE-PARTIAL",
      company_name: "Falcon Trading LLC",
      amount_aed: 20,
      status: "paid",
      updated_at: "2026-06-21T00:00:00Z",
    },
    {
      external_id: "INV-EDGE-UNMATCHED",
      company_name: "Unknown Assessment Company",
      amount_aed: 30,
      status: "unpaid",
      updated_at: "2026-06-21T00:00:00Z",
    },
  ];
  await expectSyncFailure(
    "edgeCases",
    "unmatched company input is rejected",
    client,
    unmatchedPayload,
    "UNMATCHED_COMPANY",
  );
  await check(
    "edgeCases",
    "unmatched failure creates no partial writes",
    async () =>
      (await countInvoices(client)) === baselineCount &&
      serializeSnapshot(await getSnapshot(client)) === baselineSnapshot,
  );
  await check("edgeCases", "unique source/external_id count remains 6", async () => {
    const { data, error } = await client
      .from("invoices")
      .select("external_id")
      .eq("source", "mock-erp");

    if (error || !data) {
      throw new Error(error?.message ?? "missing unique query data");
    }

    return new Set(data.map((row) => row.external_id)).size === 6 && data.length === 6;
  });

  if (failures > 0) {
    log("edgeCases", `Result: FAIL (${failures} failing assertion(s))`);
  } else {
    log("edgeCases", "Result: PASS (all sync assertions passed)");
  }

  await writeEvidence();

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error: unknown) => {
  fail("edgeCases", "verify:sync crashed", error instanceof Error ? error.message : String(error));
  try {
    await writeEvidence();
  } catch {
    // Best effort evidence write after a setup failure.
  }
  process.exitCode = 1;
});
