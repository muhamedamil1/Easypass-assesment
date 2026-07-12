import "server-only";

import { z } from "zod";

import { getPublicEnv } from "./public";

const serverEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SEED_ADMIN_PASSWORD: z.string().min(1),
  SEED_VIEWER_PASSWORD: z.string().min(1),
});

export type ServerEnv = ReturnType<typeof getServerEnv>;

export function getServerEnv() {
  const publicEnv = getPublicEnv();
  const serverEnv = serverEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD,
    SEED_VIEWER_PASSWORD: process.env.SEED_VIEWER_PASSWORD,
  });

  return {
    ...publicEnv,
    ...serverEnv,
  };
}
