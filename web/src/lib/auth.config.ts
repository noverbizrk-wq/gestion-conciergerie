import type { NextAuthConfig } from "next-auth";

/**
 * Config "edge-safe" : ne doit importer ni Prisma ni bcrypt (utilisée par le
 * middleware qui tourne potentiellement en Edge Runtime). Le provider
 * Credentials (qui a besoin de la base) est ajouté séparément dans auth.ts.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user?.id) {
        token.userId = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && typeof token.userId === "string") {
        session.user.id = token.userId;
      }
      return session;
    },
    authorized: ({ auth, request }) => {
      const isLoggedIn = Boolean(auth?.user);
      const isOnLogin = request.nextUrl.pathname.startsWith("/login");

      if (isOnLogin) {
        return !isLoggedIn ? true : Response.redirect(new URL("/dashboard", request.nextUrl));
      }

      return isLoggedIn;
    },
  },
} satisfies NextAuthConfig;
