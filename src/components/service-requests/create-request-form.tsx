"use client";

import { useActionState } from "react";

import {
  createRequestAction,
  type RequestActionState,
} from "@/app/(protected)/companies/[companyId]/actions";

const initialState: RequestActionState = {};

export function CreateRequestForm({ companyId }: { companyId: string }) {
  const [state, formAction, pending] = useActionState(
    createRequestAction,
    initialState,
  );

  return (
    <form action={formAction} className="form-stack inline-form">
      <input name="companyId" type="hidden" value={companyId} />
      <label>
        <span>New request title</span>
        <input maxLength={200} name="title" required type="text" />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      {state.ok ? <p className="form-success">Request created.</p> : null}
      <button disabled={pending} type="submit">
        {pending ? "Creating" : "Create request"}
      </button>
    </form>
  );
}
