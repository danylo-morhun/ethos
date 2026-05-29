import { TooltipProvider } from "@ethos/ui";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
	subsets: ["latin"],
	variable: "--font-sans",
});

export const metadata: Metadata = {
	title: "ethos",
	description: "Your personal suite of tools",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={`dark ${geistSans.variable}`}>
			<body className="antialiased">
				<TooltipProvider delayDuration={0}>{children}</TooltipProvider>
				<Toaster richColors position="bottom-right" />
			</body>
		</html>
	);
}
