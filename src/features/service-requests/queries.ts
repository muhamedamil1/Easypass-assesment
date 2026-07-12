import { createAuthenticatedServerClient } from "@/lib/supabase/server";

import type { ServiceRequestListItem, ServiceRequestStatus } from "./types";

type ServiceRequestRow = {
  id: string;
  title: string;
  status: ServiceRequestStatus;
  created_at: string;
  updated_at: string;
};

export async function listVisibleServiceRequests(
  companyId: string,
): Promise<ServiceRequestListItem[]> {
  const supabase = await createAuthenticatedServerClient();
  const { data, error } = await supabase
    .from("service_requests")
    .select("id, title, status, created_at, updated_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .returns<ServiceRequestRow[]>();

  if (error) {
    throw new Error("Unable to load service requests.");
  }

  return data.map((request) => ({
    id: request.id,
    title: request.title,
    status: request.status,
    createdAt: request.created_at,
    updatedAt: request.updated_at,
  }));
}
