import { config } from "dotenv";

import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

config({ path: ".env.local" });

const scriptEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SEED_ADMIN_PASSWORD: z.string().min(1),
  SEED_VIEWER_PASSWORD: z.string().min(1),
});

const env = scriptEnvSchema.parse(process.env);

const ids = {
  companies: {
    falcon: "11111111-1111-4111-8111-111111111111",
    oasis: "22222222-2222-4222-8222-222222222222",
    marina: "33333333-3333-4333-8333-333333333333",
  },
  requests: {
    falconSubmitted: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1",
    falconProgress: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2",
    oasisSubmitted: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1",
    marinaPrivate: "cccccccc-cccc-4ccc-8ccc-ccccccccccc1",
    adminFalconVerification: "dddddddd-dddd-4ddd-8ddd-dddddddddd01",
    viewerFalconDenied: "dddddddd-dddd-4ddd-8ddd-dddddddddd02",
    viewerOasisVerification: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeee01",
  },
} as const;

const evidencePath = "evidence/rls-verification.txt";
const lines: string[] = [];
let failures = 0;

type AnyClient = SupabaseClient;
type QueryResult<T> = { data: T | null; error: { message: string } | null };

type SignedInClient = {
  client: AnyClient;
  userId: string;
};

function log(message: string) {
  lines.push(message);
  console.log(message);
}

function pass(label: string) {
  log(`PASS ${label}`);
}

function fail(label: string, detail: string) {
  failures += 1;
  log(`FAIL ${label} :: ${detail}`);
}

async function check(label: string, assertion: () => Promise<boolean>) {
  try {
    const ok = await assertion();

    if (ok) {
      pass(label);
    } else {
      fail(label, "assertion returned false");
    }
  } catch (error) {
    fail(label, error instanceof Error ? error.message : String(error));
  }
}

function createAdminClient(): AnyClient {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

function createUserClient(): AnyClient {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}

async function signIn(email: string, password: string): Promise<SignedInClient> {
  const client = createUserClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    throw new Error(`Unable to sign in ${email}: ${error?.message ?? "no user"}`);
  }

  return { client, userId: data.user.id };
}

async function cleanupVerificationRows(admin: AnyClient) {
  const { error } = await admin
    .from("service_requests")
    .delete()
    .in("id", [
      ids.requests.adminFalconVerification,
      ids.requests.viewerFalconDenied,
      ids.requests.viewerOasisVerification,
    ]);

  if (error) {
    throw new Error(`verification cleanup failed: ${error.message}`);
  }
}

function hasOnlyCompanyIds(
  rows: Array<{ id: string }>,
  expectedIds: string[],
) {
  const actual = rows.map((row) => row.id).sort();
  const expected = [...expectedIds].sort();
  return JSON.stringify(actual) === JSON.stringify(expected);
}

function hasMemberships(
  rows: Array<{ company_id: string; role: string }>,
  expected: Array<{ company_id: string; role: string }>,
) {
  const serialize = (value: Array<{ company_id: string; role: string }>) =>
    value
      .map((row) => `${row.company_id}:${row.role}`)
      .sort()
      .join("|");

  return serialize(rows) === serialize(expected);
}

function hasRows<T>(result: QueryResult<T[]>): result is { data: T[]; error: null } {
  return !result.error && Array.isArray(result.data) && result.data.length > 0;
}

function hasNoRows<T>(result: QueryResult<T[]>): result is { data: T[]; error: null } {
  return !result.error && Array.isArray(result.data) && result.data.length === 0;
}

function wasRejected(result: QueryResult<unknown>) {
  return Boolean(result.error);
}

async function getRequestStatus(client: AnyClient, requestId: string) {
  const { data, error } = await client
    .from("service_requests")
    .select("status")
    .eq("id", requestId)
    .single();

  if (error) {
    throw new Error(`status lookup failed: ${error.message}`);
  }

  return data.status as string;
}

async function main() {
  log("RLS verification for EasyPass Task 02");
  log("Authorization clients: authenticated publishable-key sessions only");
  log("Privileged client use: verification row cleanup only");

  const admin = createAdminClient();
  await cleanupVerificationRows(admin);

  const adminUser = await signIn(
    "admin@easypass.test",
    env.SEED_ADMIN_PASSWORD,
  );
  const viewerUser = await signIn(
    "viewer@easypass.test",
    env.SEED_VIEWER_PASSWORD,
  );

  await check("admin lists Falcon only", async () => {
    const result = await adminUser.client.from("companies").select("id,name");
    return (
      !result.error &&
      Array.isArray(result.data) &&
      hasOnlyCompanyIds(result.data, [ids.companies.falcon])
    );
  });

  await check("admin reads Falcon requests", async () => {
    const result = await adminUser.client
      .from("service_requests")
      .select("id")
      .eq("company_id", ids.companies.falcon);
    return hasRows(result);
  });

  await check("admin cannot read Oasis requests by known ID", async () => {
    const result = await adminUser.client
      .from("service_requests")
      .select("id")
      .eq("id", ids.requests.oasisSubmitted);
    return hasNoRows(result);
  });

  await check("viewer lists Falcon and Oasis only", async () => {
    const result = await viewerUser.client.from("companies").select("id,name");
    return (
      !result.error &&
      Array.isArray(result.data) &&
      hasOnlyCompanyIds(result.data, [ids.companies.falcon, ids.companies.oasis])
    );
  });

  await check("viewer reads Falcon and Oasis memberships", async () => {
    const result = await viewerUser.client
      .from("company_members")
      .select("company_id,role");
    return (
      !result.error &&
      Array.isArray(result.data) &&
      hasMemberships(result.data, [
        { company_id: ids.companies.falcon, role: "viewer" },
        { company_id: ids.companies.oasis, role: "admin" },
      ])
    );
  });

  await check("viewer reads Falcon requests", async () => {
    const result = await viewerUser.client
      .from("service_requests")
      .select("id")
      .eq("company_id", ids.companies.falcon);
    return hasRows(result);
  });

  await check("viewer insert into Falcon fails", async () => {
    const result = await viewerUser.client.from("service_requests").insert({
      id: ids.requests.viewerFalconDenied,
      company_id: ids.companies.falcon,
      title: "Viewer should not create Falcon request",
      created_by: viewerUser.userId,
    });
    return wasRejected(result);
  });

  await check("viewer status update in Falcon fails without side effect", async () => {
    const before = await getRequestStatus(
      viewerUser.client,
      ids.requests.falconSubmitted,
    );
    const result = await viewerUser.client
      .from("service_requests")
      .update({ status: "completed" })
      .eq("id", ids.requests.falconSubmitted);
    const after = await getRequestStatus(
      viewerUser.client,
      ids.requests.falconSubmitted,
    );
    return (wasRejected(result) || before === after) && before === after;
  });

  await check("admin insert into Falcon succeeds", async () => {
    const result = await adminUser.client
      .from("service_requests")
      .insert({
        id: ids.requests.adminFalconVerification,
        company_id: ids.companies.falcon,
        title: "Admin Falcon verification request",
        created_by: adminUser.userId,
      })
      .select("id")
      .single();
    return !result.error && result.data?.id === ids.requests.adminFalconVerification;
  });

  await check("admin status update in Falcon succeeds", async () => {
    const result = await adminUser.client
      .from("service_requests")
      .update({ status: "completed" })
      .eq("id", ids.requests.adminFalconVerification)
      .select("status")
      .single();
    return !result.error && result.data?.status === "completed";
  });

  await check("viewer as Oasis admin inserts into Oasis", async () => {
    const result = await viewerUser.client
      .from("service_requests")
      .insert({
        id: ids.requests.viewerOasisVerification,
        company_id: ids.companies.oasis,
        title: "Viewer Oasis admin verification request",
        created_by: viewerUser.userId,
      })
      .select("id")
      .single();
    return !result.error && result.data?.id === ids.requests.viewerOasisVerification;
  });

  await check("viewer as Oasis admin updates Oasis status", async () => {
    const result = await viewerUser.client
      .from("service_requests")
      .update({ status: "in_progress" })
      .eq("id", ids.requests.viewerOasisVerification)
      .select("status")
      .single();
    return !result.error && result.data?.status === "in_progress";
  });

  await check("neither user reads Marina company", async () => {
    const adminResult = await adminUser.client
      .from("companies")
      .select("id")
      .eq("id", ids.companies.marina);
    const viewerResult = await viewerUser.client
      .from("companies")
      .select("id")
      .eq("id", ids.companies.marina);
    return hasNoRows(adminResult) && hasNoRows(viewerResult);
  });

  await check("neither user reads Marina request by known ID", async () => {
    const adminResult = await adminUser.client
      .from("service_requests")
      .select("id")
      .eq("id", ids.requests.marinaPrivate);
    const viewerResult = await viewerUser.client
      .from("service_requests")
      .select("id")
      .eq("id", ids.requests.marinaPrivate);
    return hasNoRows(adminResult) && hasNoRows(viewerResult);
  });

  await check("user insert on company_members fails", async () => {
    const result = await adminUser.client.from("company_members").insert({
      company_id: ids.companies.oasis,
      user_id: adminUser.userId,
      role: "admin",
    });
    return wasRejected(result);
  });

  await check("user cannot promote membership role", async () => {
    const result = await viewerUser.client
      .from("company_members")
      .update({ role: "admin" })
      .eq("company_id", ids.companies.falcon)
      .eq("user_id", viewerUser.userId);
    return wasRejected(result);
  });

  await check("user delete on company_members fails", async () => {
    const result = await viewerUser.client
      .from("company_members")
      .delete()
      .eq("company_id", ids.companies.falcon)
      .eq("user_id", viewerUser.userId);
    return wasRejected(result);
  });

  const immutableUpdates: Array<[string, Record<string, unknown>]> = [
    ["title", { title: "Tampered title" }],
    ["company_id", { company_id: ids.companies.oasis }],
    ["created_by", { created_by: viewerUser.userId }],
    ["created_at", { created_at: new Date().toISOString() }],
    ["updated_at", { updated_at: new Date().toISOString() }],
  ];

  for (const [column, patch] of immutableUpdates) {
    await check(`user cannot update request ${column}`, async () => {
      const result = await adminUser.client
        .from("service_requests")
        .update(patch)
        .eq("id", ids.requests.adminFalconVerification);
      return wasRejected(result);
    });
  }

  await check("user delete on service_requests fails", async () => {
    const result = await adminUser.client
      .from("service_requests")
      .delete()
      .eq("id", ids.requests.adminFalconVerification);
    return wasRejected(result);
  });

  await check("authenticated users cannot select invoices", async () => {
    const adminResult = await adminUser.client.from("invoices").select("id");
    const viewerResult = await viewerUser.client.from("invoices").select("id");
    return wasRejected(adminResult) && wasRejected(viewerResult);
  });

  await cleanupVerificationRows(admin);

  if (failures > 0) {
    log(`Result: FAIL (${failures} failing assertion(s))`);
  } else {
    log("Result: PASS (all RLS assertions passed)");
  }

  await mkdir(dirname(evidencePath), { recursive: true });
  await writeFile(evidencePath, `${lines.join("\n")}\n`, "utf8");

  if (failures > 0) {
    process.exitCode = 1;
  }
}

main().catch(async (error: unknown) => {
  fail("verify:rls crashed", error instanceof Error ? error.message : String(error));
  try {
    await mkdir(dirname(evidencePath), { recursive: true });
    await writeFile(evidencePath, `${lines.join("\n")}\n`, "utf8");
  } catch {
    // Best effort evidence write after a setup failure.
  }
  process.exitCode = 1;
});
