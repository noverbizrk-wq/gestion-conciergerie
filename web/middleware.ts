import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  // Protège tout sauf les assets statiques, l'API NextAuth et la page de login.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|login).*)"],
};
