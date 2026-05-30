import { ThemeProvider } from "@/components/ThemeProvider";
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
	manifest: "/manifest.webmanifest",
	appleWebApp: {
		capable: true,
		statusBarStyle: "black-translucent",
		title: "ethos",
	},
	icons: {
		apple: "/icons/apple-touch-icon.png",
	},
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={geistSans.variable} suppressHydrationWarning>
			<body className="antialiased">
				<ThemeProvider>
					<TooltipProvider delayDuration={0}>{children}</TooltipProvider>
					<Toaster richColors position="bottom-right" />
				</ThemeProvider>
			</body>
		</html>
	);
}
