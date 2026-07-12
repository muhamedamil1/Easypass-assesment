import Link from "next/link";

import type { CompanyListItem } from "@/features/companies/types";

export function CompanyList({ companies }: { companies: CompanyListItem[] }) {
  if (companies.length === 0) {
    return <p className="muted">No companies are visible for this account.</p>;
  }

  return (
    <ul className="item-list">
      {companies.map((company) => (
        <li className="list-row" key={company.id}>
          <div>
            <h2>{company.name}</h2>
            <p className="muted">Role: {company.role}</p>
          </div>
          <Link className="text-link" href={`/companies/${company.id}`}>
            View requests
          </Link>
        </li>
      ))}
    </ul>
  );
}
