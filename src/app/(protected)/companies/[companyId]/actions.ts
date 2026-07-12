"use server";

import { revalidatePath } from "next/cache";

import {
  createRequestSchema,
  updateRequestStatusSchema,
} from "@/features/service-requests/schemas";
import { createAuthenticatedServerClient } from "@/lib/supabase/server";

export type RequestActionState = {
  error?: string;
  ok?: boolean;
};

async function requireActionUserId() {
  const supabase = await createAuthenticatedServerClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims?.sub) {
    return { supabase, userId: null };
  }

  return { supabase, userId: data?.claims.sub };
}

export async function createRequestAction(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const parsed = createRequestSchema.safeParse({
    companyId: formData.get("companyId"),
    title: formData.get("title"),
  });

  if (!parsed.success) {
    return { error: "Enter a request title between 1 and 200 characters." };
  }

  const { supabase, userId } = await requireActionUserId();

  if (!userId) {
    return { error: "Sign in again before making changes." };
  }

  const { error } = await supabase.from("service_requests").insert({
    company_id: parsed.data.companyId,
    title: parsed.data.title,
    status: "submitted",
    created_by: userId,
  });

  if (error) {
    return { error: "Request could not be created for this company." };
  }

  revalidatePath(`/companies/${parsed.data.companyId}`);
  return { ok: true };
}

export async function updateRequestStatusAction(
  _previousState: RequestActionState,
  formData: FormData,
): Promise<RequestActionState> {
  const parsed = updateRequestStatusSchema.safeParse({
    companyId: formData.get("companyId"),
    requestId: formData.get("requestId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    return { error: "Choose a valid request status." };
  }

  const { supabase, userId } = await requireActionUserId();

  if (!userId) {
    return { error: "Sign in again before making changes." };
  }

  const { error } = await supabase
    .from("service_requests")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.requestId)
    .eq("company_id", parsed.data.companyId);

  if (error) {
    return { error: "Request status could not be updated." };
  }

  revalidatePath(`/companies/${parsed.data.companyId}`);
  return { ok: true };
}
