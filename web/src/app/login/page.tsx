"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-paper)] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-[family-name:var(--font-display)] italic text-2xl text-[var(--color-ink)]">
            Nover<span className="text-[var(--color-brass)] not-italic"> Invoice</span>
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Conciergerie & facturation</p>
        </div>

        <form
          action={formAction}
          className="rounded-lg border border-[var(--color-line)] bg-[var(--color-paper-raised)] p-6 space-y-4"
        >
          <h1 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-ink)] mb-2">
            Connexion
          </h1>

          <div className="space-y-1">
            <label htmlFor="email" className="text-xs font-medium text-[var(--color-ink-soft)]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brass)]"
            />
          </div>

          <div className="space-y-1">
            <label htmlFor="password" className="text-xs font-medium text-[var(--color-ink-soft)]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-md border border-[var(--color-line)] bg-white px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-brass)]"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-[var(--color-danger)]" role="alert">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[var(--color-ink)] text-white text-sm font-medium py-2 hover:bg-[var(--color-ink)]/90 transition-colors disabled:opacity-60"
          >
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
