import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] transition-colors"
      >
        Déconnexion
      </button>
    </form>
  );
}
