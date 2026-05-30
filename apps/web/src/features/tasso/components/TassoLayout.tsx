"use client";

import { PageLoader } from "@/components/PageLoader";
import { ProjectSidebar } from "@/features/tasso/components/ProjectSidebar";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";

type Project = {
	id: string;
	name: string;
	color: string | null;
};

interface Props {
	projects: Project[];
	workspaceId: string;
	children: React.ReactNode;
}

export function TassoLayout({ projects, workspaceId, children }: Props) {
	const [isPending, startTransition] = useTransition();
	const pathname = usePathname();

	// /tasso/<projectId>/... → extract second segment
	const activeProjectId = pathname.split("/")[2] ?? undefined;

	return (
		<div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
			<aside className="hidden md:flex w-56 shrink-0 flex-col border-r border-border overflow-y-auto">
				<ProjectSidebar
					projects={projects}
					workspaceId={workspaceId}
					activeProjectId={activeProjectId}
				/>
			</aside>

			<main className="flex-1 overflow-hidden relative">
				{isPending && <PageLoader overlay />}
				{children}
			</main>
		</div>
	);
}
