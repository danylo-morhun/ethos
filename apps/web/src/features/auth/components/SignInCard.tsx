"use client";

import { Spinner } from "@/components/Spinner";
import {
	handleCredentials,
	signInWithGoogle,
	signInWithMagicLink,
} from "@/features/auth/actions/auth";
import type { AuthState } from "@/features/auth/actions/auth";
import { Button } from "@ethos/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@ethos/ui/card";
import { Input } from "@ethos/ui/input";
import { Label } from "@ethos/ui/label";
import { Separator } from "@ethos/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ethos/ui/tabs";
import Link from "next/link";
import { useActionState, useState } from "react";

function GoogleButton() {
	const [pending, setPending] = useState(false);
	return (
		<form
			action={async () => {
				setPending(true);
				await signInWithGoogle();
			}}
		>
			<Button className="w-full gap-1.5" variant="outline" type="submit" disabled={pending}>
				{pending && <Spinner />}
				{pending ? "Redirecting…" : "Continue with Google"}
			</Button>
		</form>
	);
}

function MagicLinkForm() {
	const [state, action, pending] = useActionState<AuthState, FormData>(signInWithMagicLink, null);

	if (state && "success" in state) {
		return (
			<p className="text-muted-foreground py-4 text-center text-sm">
				Check your inbox — link sent.
			</p>
		);
	}

	return (
		<form action={action} className="space-y-3">
			<div className="space-y-1">
				<Label htmlFor="magic-email">Email</Label>
				<Input id="magic-email" name="email" type="email" placeholder="you@example.com" required />
			</div>
			{state && "error" in state && <p className="text-destructive text-sm">{state.error}</p>}
			<Button className="w-full gap-1.5" type="submit" disabled={pending}>
				{pending && <Spinner />}
				{pending ? "Sending…" : "Send magic link"}
			</Button>
		</form>
	);
}

function PasswordForm() {
	const [mode, setMode] = useState<"signin" | "signup">("signin");
	const [state, action, pending] = useActionState<AuthState, FormData>(handleCredentials, null);

	return (
		<form action={action} className="space-y-3">
			<input type="hidden" name="mode" value={mode} />
			{mode === "signup" && (
				<div className="space-y-1">
					<Label htmlFor="cred-name">Name</Label>
					<Input id="cred-name" name="name" type="text" placeholder="Your name" required />
				</div>
			)}
			<div className="space-y-1">
				<Label htmlFor="cred-email">Email</Label>
				<Input id="cred-email" name="email" type="email" placeholder="you@example.com" required />
			</div>
			<div className="space-y-1">
				<Label htmlFor="cred-password">Password</Label>
				<Input
					id="cred-password"
					name="password"
					type="password"
					placeholder="••••••••"
					required
					minLength={8}
				/>
			</div>
			{state && "error" in state && <p className="text-destructive text-sm">{state.error}</p>}
			<Button className="w-full gap-1.5" type="submit" disabled={pending}>
				{pending && <Spinner />}
				{pending ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
			</Button>
			{mode === "signin" && (
				<p className="text-center text-sm">
					<Link
						href="/auth/forgot-password"
						className="text-muted-foreground underline underline-offset-2 hover:text-foreground"
					>
						Forgot password?
					</Link>
				</p>
			)}
			<p className="text-muted-foreground text-center text-sm">
				{mode === "signin" ? (
					<>
						No account?{" "}
						<button
							type="button"
							className="underline underline-offset-2"
							onClick={() => setMode("signup")}
						>
							Sign up
						</button>
					</>
				) : (
					<>
						Have an account?{" "}
						<button
							type="button"
							className="underline underline-offset-2"
							onClick={() => setMode("signin")}
						>
							Sign in
						</button>
					</>
				)}
			</p>
		</form>
	);
}

export function SignInCard() {
	return (
		<Card className="w-full max-w-sm">
			<CardHeader>
				<CardTitle className="text-2xl">ethos</CardTitle>
				<CardDescription>Your personal suite of tools</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<GoogleButton />
				<div className="flex items-center gap-3">
					<Separator className="flex-1" />
					<span className="text-muted-foreground text-xs">or</span>
					<Separator className="flex-1" />
				</div>
				<Tabs defaultValue="magic">
					<TabsList className="w-full">
						<TabsTrigger value="magic" className="flex-1">
							Magic link
						</TabsTrigger>
						<TabsTrigger value="password" className="flex-1">
							Password
						</TabsTrigger>
					</TabsList>
					<TabsContent value="magic" className="pt-3">
						<MagicLinkForm />
					</TabsContent>
					<TabsContent value="password" className="pt-3">
						<PasswordForm />
					</TabsContent>
				</Tabs>
			</CardContent>
		</Card>
	);
}
