import { auth } from "@/auth";
import { getWorkspace } from "@/features/midas/actions/workspace";
import { MidasContentShell } from "@/features/midas/components/MidasContentShell";
import { MidasNavTabs } from "@/features/midas/components/MidasNavTabs";

export default async function MidasLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	const workspace = session?.user?.id ? await getWorkspace(session.user.id) : null;

	return (
		<>
			<MidasContentShell>{children}</MidasContentShell>
			{workspace && (
				<MidasNavTabs workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
			)}
		</>
	);
}
