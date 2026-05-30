import { SettingsNav } from "@/components/SettingsNav";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex h-full flex-col sm:flex-row">
			<SettingsNav />
			<main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
		</div>
	);
}
