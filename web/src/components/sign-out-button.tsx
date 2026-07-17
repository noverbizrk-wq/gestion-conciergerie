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
        className="w-full text-left text-xs font-medium text-[var(--color-ink-soft)] hover:text-[var(--color-danger)] transition-colors py-1"
      >
        Déconnexion
      </button>
    </form>
  );
}
