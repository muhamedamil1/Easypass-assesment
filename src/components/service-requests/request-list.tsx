import type { CompanyRole } from "@/features/companies/types";
import type { ServiceRequestListItem, ServiceRequestStatus } from "@/features/service-requests/types";

import { RequestStatusForm } from "./request-status-form";

const statusLabels: Record<ServiceRequestStatus, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  completed: "Completed",
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function RequestList({
  companyId,
  requests,
  role,
}: {
  companyId: string;
  requests: ServiceRequestListItem[];
  role: CompanyRole;
}) {
  if (requests.length === 0) {
    return <p className="muted">No service requests are visible for this company.</p>;
  }

  return (
    <ul className="item-list">
      {requests.map((request) => (
        <li className="list-row request-row" key={request.id}>
          <div>
            <h2>{request.title}</h2>
            <p className="muted">
              Status: {statusLabels[request.status]} - Created {formatDate(request.createdAt)}
            </p>
          </div>
          {role === "admin" ? (
            <RequestStatusForm
              companyId={companyId}
              requestId={request.id}
              status={request.status}
            />
          ) : (
            <p className="read-only-pill">Read only</p>
          )}
        </li>
      ))}
    </ul>
  );
}
