import { Skeleton } from "@ethos/ui";

export default function MidasLoading() {
	return (
		<div className="flex flex-col gap-6 p-4 pb-28 md:p-6 md:pb-6">
			<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-24 rounded-xl" />
				))}
			</div>
			<Skeleton className="h-64 rounded-xl" />
			<Skeleton className="h-48 rounded-xl" />
		</div>
	);
}
