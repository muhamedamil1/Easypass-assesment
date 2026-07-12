"use client";

import { useActionState } from "react";

import {
  updateRequestStatusAction,
  type RequestActionState,
} from "@/app/(protected)/companies/[companyId]/actions";
import { serviceRequestStatuses, type ServiceRequestStatus } from "@/features/service-requests/types";

const initialState: RequestActionState = {};

const statusLabels: Record<ServiceRequestStatus, string> = {
  submitted: "Submitted",
  in_progress: "In progress",
  completed: "Completed",
};

export function RequestStatusForm({
  companyId,
  requestId,
  status,
}: {
  companyId: string;
  requestId: string;
  status: ServiceRequestStatus;
}) {
  const [state, formAction, pending] = useActionState(
    updateRequestStatusAction,
    initialState,
  );

  return (
    <form action={formAction} className="status-form">
      <input name="companyId" type="hidden" value={companyId} />
      <input name="requestId" type="hidden" value={requestId} />
      <label>
        <span>Status</span>
        <select defaultValue={status} disabled={pending} name="status">
          {serviceRequestStatuses.map((option) => (
            <option key={option} value={option}>
              {statusLabels[option]}
            </option>
          ))}
        </select>
      </label>
      <button disabled={pending} type="submit">
        {pending ? "Saving" : "Save"}
      </button>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.ok ? <p className="form-success">Saved.</p> : null}
    </form>
  );
}
