import { auth, signIn } from "@/auth";
import { Button } from "@ethos/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@ethos/ui/card";
import { redirect } from "next/navigation";

export default async function HomePage() {
	const session = await auth();
	if (session) redirect("/midas");

	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<CardTitle className="text-2xl">ethos</CardTitle>
					<CardDescription>Your personal suite of tools</CardDescription>
				</CardHeader>
				<CardContent>
					<p className="text-muted-foreground text-sm">Sign in to manage your finances.</p>
				</CardContent>
				<CardFooter>
					<form
						className="w-full"
						action={async () => {
							"use server";
							await signIn("github", { redirectTo: "/midas" });
						}}
					>
						<Button className="w-full" type="submit">
							Sign in with GitHub
						</Button>
					</form>
				</CardFooter>
			</Card>
		</main>
	);
}
