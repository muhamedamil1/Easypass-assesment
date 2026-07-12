import { config } from "dotenv";

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
  },
} as const;

type AdminClient = SupabaseClient;

function createAdminClient(): AdminClient {
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

async function findUserIdByEmail(client: AdminClient, email: string) {
  const normalizedEmail = email.toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`);
    }

    const user = data.users.find(
      (candidate) => candidate.email?.toLowerCase() === normalizedEmail,
    );

    if (user) {
      return user.id;
    }

    if (data.users.length < 1000) {
      return null;
    }
  }

  throw new Error("Unable to locate user: auth user list exceeded seed search limit");
}

async function upsertUser(client: AdminClient, email: string, password: string) {
  const existingUserId = await findUserIdByEmail(client, email);

  if (existingUserId) {
    const { data, error } = await client.auth.admin.updateUserById(
      existingUserId,
      {
        email,
        password,
        email_confirm: true,
      },
    );

    if (error) {
      throw new Error(`Unable to update seed user ${email}: ${error.message}`);
    }

    return data.user.id;
  }

  const { data, error } = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Unable to create seed user ${email}: ${error.message}`);
  }

  return data.user.id;
}

async function requireOk<T>(
  result: { data: T; error: { message: string } | null },
  label: string,
) {
  if (result.error) {
    throw new Error(`${label}: ${result.error.message}`);
  }

  return result.data;
}

async function main() {
  const admin = createAdminClient();

  const adminUserId = await upsertUser(
    admin,
    "admin@easypass.test",
    env.SEED_ADMIN_PASSWORD,
  );
  const viewerUserId = await upsertUser(
    admin,
    "viewer@easypass.test",
    env.SEED_VIEWER_PASSWORD,
  );

  await requireOk(
    await admin.from("companies").upsert(
      [
        { id: ids.companies.falcon, name: "Falcon Trading LLC" },
        { id: ids.companies.oasis, name: "Oasis Foods FZE" },
        { id: ids.companies.marina, name: "Marina Tech DMCC" },
      ],
      { onConflict: "id" },
    ),
    "upsert companies",
  );

  await requireOk(
    await admin.from("company_members").upsert(
      [
        {
          company_id: ids.companies.falcon,
          user_id: adminUserId,
          role: "admin",
        },
        {
          company_id: ids.companies.falcon,
          user_id: viewerUserId,
          role: "viewer",
        },
        {
          company_id: ids.companies.oasis,
          user_id: viewerUserId,
          role: "admin",
        },
      ],
      { onConflict: "company_id,user_id" },
    ),
    "upsert memberships",
  );

  await requireOk(
    await admin.from("service_requests").upsert(
      [
        {
          id: ids.requests.falconSubmitted,
          company_id: ids.companies.falcon,
          title: "Review trade license renewal",
          status: "submitted",
          created_by: adminUserId,
        },
        {
          id: ids.requests.falconProgress,
          company_id: ids.companies.falcon,
          title: "Prepare payroll documents",
          status: "in_progress",
          created_by: adminUserId,
        },
        {
          id: ids.requests.oasisSubmitted,
          company_id: ids.companies.oasis,
          title: "Submit food import permit",
          status: "submitted",
          created_by: viewerUserId,
        },
        {
          id: ids.requests.marinaPrivate,
          company_id: ids.companies.marina,
          title: "Private marina compliance review",
          status: "submitted",
          created_by: adminUserId,
        },
      ],
      { onConflict: "id" },
    ),
    "upsert service requests",
  );

  console.log("Seed complete.");
  console.log("Users: admin@easypass.test, viewer@easypass.test");
  console.log(
    "Companies: Falcon Trading LLC, Oasis Foods FZE, Marina Tech DMCC",
  );
  console.log(
    "Memberships: admin=Falcon admin; viewer=Falcon viewer, Oasis admin; Marina has no members",
  );
  console.log("Requests: Falcon=2, Oasis=1, Marina=1");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
