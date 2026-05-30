"use client";

import { updateProfile } from "@/features/auth/actions/settings";
import type { SettingsState } from "@/features/auth/actions/settings";
import { Avatar } from "@ethos/ui";
import { Button } from "@ethos/ui/button";
import { Input } from "@ethos/ui/input";
import { Label } from "@ethos/ui/label";
import { useActionState } from "react";

interface Props {
	name: string | null;
	image: string | null;
}

export function ProfileForm({ name, image }: Props) {
	const [state, action, pending] = useActionState<SettingsState, FormData>(updateProfile, null);

	return (
		<form action={action} className="space-y-4">
			<div className="flex items-center gap-4">
				<Avatar src={image} name={name} size="lg" />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="name">Display name</Label>
				<Input id="name" name="name" defaultValue={name ?? ""} required maxLength={100} />
			</div>
			<div className="space-y-1.5">
				<Label htmlFor="image">Avatar URL</Label>
				<Input
					id="image"
					name="image"
					type="url"
					defaultValue={image ?? ""}
					placeholder="https://..."
				/>
			</div>
			{state && "error" in state && <p className="text-sm text-destructive">{state.error}</p>}
			{state && "success" in state && (
				<p className="text-sm text-green-500">Profile updated.</p>
			)}
			<Button type="submit" disabled={pending}>
				{pending ? "Saving…" : "Save changes"}
			</Button>
		</form>
	);
}
