import { auth } from "@/auth";
import { SignInCard } from "@/features/auth/components/SignInCard";
import { redirect } from "next/navigation";

export default async function HomePage() {
	const session = await auth();
	if (session) redirect("/midas");

	return (
		<main className="flex min-h-screen items-center justify-center p-4">
			<SignInCard />
		</main>
	);
}
