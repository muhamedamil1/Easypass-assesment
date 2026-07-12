import { createAuthenticatedServerClient } from "@/lib/supabase/server";

import type { CompanyDetail, CompanyListItem, CompanyRole } from "./types";

type MembershipCompanyRow = {
  company_id: string;
  role: CompanyRole;
  companies: {
    id: string;
    name: string;
  } | null;
};

export async function listVisibleCompanies(
  userId: string,
): Promise<CompanyListItem[]> {
  const supabase = await createAuthenticatedServerClient();
  const { data, error } = await supabase
    .from("company_members")
    .select("company_id, role, companies(id, name)")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .returns<MembershipCompanyRow[]>();

  if (error) {
    throw new Error("Unable to load companies.");
  }

  return data
    .filter((row) => row.companies)
    .map((row) => ({
      id: row.company_id,
      name: row.companies?.name ?? "Unavailable company",
      role: row.role,
    }));
}

export async function getVisibleCompanyDetail(
  companyId: string,
  userId: string,
): Promise<CompanyDetail | null> {
  const supabase = await createAuthenticatedServerClient();

  const { data: company, error: companyError } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .maybeSingle();

  if (companyError) {
    throw new Error("Unable to load company.");
  }

  if (!company) {
    return null;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("company_members")
    .select("role")
    .eq("company_id", companyId)
    .eq("user_id", userId)
    .maybeSingle<{ role: CompanyRole }>();

  if (membershipError) {
    throw new Error("Unable to load membership.");
  }

  if (!membership) {
    return null;
  }

  return {
    id: company.id,
    name: company.name,
    role: membership.role,
  };
}
