"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, {});

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[var(--color-paper)] px-4">
      {/* Halo décoratif discret, cohérent avec l'accent de marque */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[720px] -translate-x-1/2 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--color-brass), transparent 70%)" }}
      />

      <div className="relative w-full max-w-sm">
        <div className="text-center mb-8">
          <p className="font-[family-name:var(--font-display)] italic text-2xl text-[var(--color-ink)]">
            Nover<span className="text-[var(--color-brass)] not-italic"> Invoice</span>
          </p>
          <p className="text-sm text-[var(--color-ink-soft)] mt-1">Conciergerie & facturation</p>
        </div>

        <form
          action={formAction}
          className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper-raised)] shadow-lg p-7 space-y-5"
        >
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-ink)]">
              Connexion
            </h1>
            <p className="text-xs text-[var(--color-ink-soft)] mt-1">
              Accède à ton espace de gestion.
            </p>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-medium text-[var(--color-ink-soft)]">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-medium text-[var(--color-ink-soft)]">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-[var(--color-line)] bg-white px-3.5 py-2.5 text-sm text-[var(--color-ink)] transition-colors focus:outline-none focus:border-[var(--color-brass)] focus:ring-2 focus:ring-[var(--color-brass)]/20"
            />
          </div>

          {state?.error && (
            <p
              className="rounded-lg bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]"
              role="alert"
            >
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-[var(--color-brass)] text-white text-sm font-medium py-2.5 shadow-sm hover:bg-[var(--color-brass-dark)] transition-all active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100"
          >
            {pending ? "Connexion..." : "Se connecter"}
          </button>
        </form>
      </div>
    </div>
  );
}
