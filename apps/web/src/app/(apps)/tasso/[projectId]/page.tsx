import { auth } from "@/auth";
import { getWorkspace } from "@/features/midas/actions/workspace";
import { getProjects } from "@/features/tasso/actions/projects";
import { notFound, redirect } from "next/navigation";

export default async function TassoProjectPage({
	params,
}: {
	params: Promise<{ projectId: string }>;
}) {
	const session = await auth();
	if (!session?.user?.id) redirect("/");

	const workspace = await getWorkspace(session.user.id);
	if (!workspace) redirect("/");

	const { projectId } = await params;
	const projects = await getProjects(workspace.id);
	const project = projects.find((p) => p.id === projectId);

	if (!project) notFound();

	return (
		<div className="flex h-full items-center justify-center">
			<div className="text-center space-y-2">
				<p className="text-lg font-medium">{project.name}</p>
				<p className="text-sm text-muted-foreground">Board coming in Phase 2.</p>
			</div>
		</div>
	);
}
