import { notFound } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { CreateRequestForm } from "@/components/service-requests/create-request-form";
import { RequestList } from "@/components/service-requests/request-list";
import { getVisibleCompanyDetail } from "@/features/companies/queries";
import { companyIdSchema } from "@/features/service-requests/schemas";
import { listVisibleServiceRequests } from "@/features/service-requests/queries";
import { requireUser } from "@/lib/auth/require-user";

type CompanyPageProps = {
  params: Promise<{ companyId: string }>;
};

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { companyId } = await params;
  const parsedCompanyId = companyIdSchema.safeParse(companyId);

  if (!parsedCompanyId.success) {
    notFound();
  }

  const user = await requireUser();
  const company = await getVisibleCompanyDetail(parsedCompanyId.data, user.id);

  if (!company) {
    notFound();
  }

  const requests = await listVisibleServiceRequests(company.id);
  const isAdmin = company.role === "admin";

  return (
    <main className="page-shell" aria-labelledby="company-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">EasyPass</p>
          <h1 id="company-title">{company.name}</h1>
          <p className="muted">Your role: {company.role}</p>
        </div>
        <SignOutButton />
      </header>

      {isAdmin ? (
        <section className="section-block" aria-labelledby="create-request-title">
          <h2 id="create-request-title">Create request</h2>
          <CreateRequestForm companyId={company.id} />
        </section>
      ) : (
        <section className="section-block" aria-label="Read-only access">
          <p className="muted">This company is read-only for your account.</p>
        </section>
      )}

      <section className="section-block" aria-labelledby="requests-title">
        <h2 id="requests-title">Service requests</h2>
        <RequestList companyId={company.id} requests={requests} role={company.role} />
      </section>
    </main>
  );
}
