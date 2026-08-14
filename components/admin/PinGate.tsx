"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { loginAdmin } from "@/lib/admin/actions";
import { PRODUCT_NAME } from "@/lib/branding";

export function PinGate() {
  const [state, action, pending] = useActionState(loginAdmin, { error: null });
  const [pin, setPin] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[0_12px_40px_rgba(15,32,28,0.06)]">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
          {PRODUCT_NAME}
        </p>
        <h1 className="mt-2 text-2xl font-medium text-[var(--ink)]">Admin</h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Enter the 4-digit PIN to continue.
        </p>
        <form action={action} className="mt-6 space-y-4">
          <label className="block">
            <span className="sr-only">Admin PIN</span>
            <input
              ref={inputRef}
              name="pin"
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{4}"
              maxLength={4}
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 4))
              }
              className="w-full rounded-lg border border-[var(--border-strong)] bg-[var(--panel)] px-3 py-3 text-center text-2xl tracking-[0.4em] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              placeholder="••••"
              required
            />
          </label>
          {state.error ? (
            <p className="text-sm text-[#8B1E1E]" role="alert">
              {state.error}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={pending || pin.length !== 4}
            className="w-full rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {pending ? "Signing in…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
