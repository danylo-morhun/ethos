import { MidasNavTabs } from "@/features/midas/components/MidasNavTabs";

export default function MidasLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			{children}
			<MidasNavTabs />
		</>
	);
}
