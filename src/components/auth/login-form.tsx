"use client";

import { useActionState } from "react";

import { signInWithPassword, type LoginState } from "@/app/(auth)/login/actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    signInWithPassword,
    initialState,
  );

  return (
    <form action={formAction} className="form-stack">
      <label>
        <span>Email</span>
        <input
          autoComplete="email"
          name="email"
          required
          type="email"
        />
      </label>
      <label>
        <span>Password</span>
        <input
          autoComplete="current-password"
          name="password"
          required
          type="password"
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button disabled={pending} type="submit">
        {pending ? "Signing in" : "Sign in"}
      </button>
    </form>
  );
}
