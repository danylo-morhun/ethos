"use client";

import { Spinner } from "@/components/Spinner";
import { deleteAccount, signOutAllDevices } from "@/features/auth/actions/settings";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@ethos/ui/alert-dialog";
import { Button } from "@ethos/ui/button";
import { useState } from "react";

export function DangerZone() {
	const [deletePending, setDeletePending] = useState(false);
	const [signOutPending, setSignOutPending] = useState(false);

	async function handleSignOutAll() {
		setSignOutPending(true);
		await signOutAllDevices();
		setSignOutPending(false);
	}

	async function handleDeleteAccount() {
		setDeletePending(true);
		await deleteAccount();
		setDeletePending(false);
	}

	return (
		<div className="space-y-4">
			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-sm font-medium">Sign out all devices</p>
					<p className="text-xs text-muted-foreground">
						Invalidates all active sessions immediately.
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					disabled={signOutPending}
					onClick={handleSignOutAll}
					className="shrink-0 gap-1.5"
				>
					{signOutPending && <Spinner />}
					{signOutPending ? "Signing out…" : "Sign out all"}
				</Button>
			</div>

			<div className="flex items-start justify-between gap-4">
				<div>
					<p className="text-sm font-medium text-destructive">Delete account</p>
					<p className="text-xs text-muted-foreground">
						Permanently deletes your account and all data. Cannot be undone.
					</p>
				</div>
				<AlertDialog>
					<AlertDialogTrigger asChild>
						<Button variant="destructive" size="sm" className="shrink-0">
							Delete account
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Delete account?</AlertDialogTitle>
							<AlertDialogDescription>
								This will permanently delete your account, workspace, and all financial data. This
								action cannot be undone.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<AlertDialogAction
								className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
								disabled={deletePending}
								onClick={handleDeleteAccount}
							>
								{deletePending && <Spinner />}
								{deletePending ? "Deleting…" : "Yes, delete everything"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</div>
	);
}
