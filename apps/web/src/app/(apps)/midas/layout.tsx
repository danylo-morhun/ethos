import { auth } from "@/auth";
import { getWorkspace } from "@/features/midas/actions/workspace";
import { MidasNavTabs } from "@/features/midas/components/MidasNavTabs";

export default async function MidasLayout({ children }: { children: React.ReactNode }) {
	const session = await auth();
	const workspace = session?.user?.id ? await getWorkspace(session.user.id) : null;

	return (
		<>
			{children}
			{workspace && (
				<MidasNavTabs workspaceId={workspace.id} baseCurrency={workspace.baseCurrency} />
			)}
		</>
	);
}
