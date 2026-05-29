import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { authAccounts, authSessions, authUsers, db, verificationTokens } from "@ethos/db";
import NextAuth, { type DefaultSession } from "next-auth";
import GitHub from "next-auth/providers/github";

declare module "next-auth" {
	interface Session {
		user: { id: string } & DefaultSession["user"];
	}
}

export const { handlers, auth, signIn, signOut } = NextAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: authUsers,
		accountsTable: authAccounts,
		sessionsTable: authSessions,
		verificationTokensTable: verificationTokens,
	}),
	// JWT strategy avoids DB lookups in Edge middleware
	session: { strategy: "jwt" },
	providers: [GitHub],
	callbacks: {
		jwt({ token, user }) {
			if (user?.id) token.sub = user.id;
			return token;
		},
		session({ session, token }) {
			if (token.sub) session.user.id = token.sub;
			return session;
		},
	},
	pages: {
		signIn: "/",
	},
});
