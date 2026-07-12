import { SignOutButton } from "@/components/auth/sign-out-button";
import { CompanyList } from "@/components/companies/company-list";
import { listVisibleCompanies } from "@/features/companies/queries";
import { requireUser } from "@/lib/auth/require-user";

export default async function CompaniesPage() {
  const user = await requireUser();
  const companies = await listVisibleCompanies(user.id);

  return (
    <main className="page-shell" aria-labelledby="companies-title">
      <header className="page-header">
        <div>
          <p className="eyebrow">EasyPass</p>
          <h1 id="companies-title">Companies</h1>
          <p className="muted">Signed in{user.email ? ` as ${user.email}` : ""}</p>
        </div>
        <SignOutButton />
      </header>
      <CompanyList companies={companies} />
    </main>
  );
}
