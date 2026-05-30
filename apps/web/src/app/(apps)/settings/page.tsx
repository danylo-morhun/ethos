import { auth } from "@/auth";
import { ChangeEmailForm } from "@/features/auth/components/ChangeEmailForm";
import { ChangePasswordForm } from "@/features/auth/components/ChangePasswordForm";
import { DangerZone } from "@/features/auth/components/DangerZone";
import { LinkedProviders } from "@/features/auth/components/LinkedProviders";
import { ProfileForm } from "@/features/auth/components/ProfileForm";
import { authAccounts, authUsers, db, eq } from "@ethos/db";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@ethos/ui/card";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
	const session = await auth();
	if (!session?.user?.id) redirect("/");

	const [dbUser, accounts] = await Promise.all([
		db.query.authUsers.findFirst({ where: eq(authUsers.id, session.user.id) }),
		db.query.authAccounts.findMany({
			where: eq(authAccounts.userId, session.user.id),
			columns: { provider: true },
		}),
	]);

	if (!dbUser) redirect("/");

	const providers = accounts.map((a) => a.provider);

	return (
		<div className="mx-auto max-w-2xl space-y-6 p-6">
			<h1 className="text-2xl font-semibold">Account settings</h1>

			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Your display name and avatar.</CardDescription>
				</CardHeader>
				<CardContent>
					<ProfileForm name={dbUser.name} image={dbUser.image} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Email address</CardTitle>
					<CardDescription>
						Current:{" "}
						<span className="font-medium text-foreground">{dbUser.email}</span>
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ChangeEmailForm
						currentEmail={dbUser.email}
						pendingEmail={dbUser.pendingEmail ?? null}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Password</CardTitle>
					<CardDescription>
						{dbUser.passwordHash
							? "Update your password."
							: "Set a password to enable email + password sign-in."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<ChangePasswordForm hasPassword={!!dbUser.passwordHash} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle>Linked accounts</CardTitle>
					<CardDescription>Sign-in methods connected to your account.</CardDescription>
				</CardHeader>
				<CardContent>
					<LinkedProviders providers={providers} hasPassword={!!dbUser.passwordHash} />
				</CardContent>
			</Card>

			<Card className="border-destructive/30">
				<CardHeader>
					<CardTitle>Danger zone</CardTitle>
				</CardHeader>
				<CardContent>
					<DangerZone />
				</CardContent>
			</Card>
		</div>
	);
}
