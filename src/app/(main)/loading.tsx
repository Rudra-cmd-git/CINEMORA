import { RowSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="pt-[var(--cm-header)]">
      <div className="cm-shell space-y-4 py-16">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-12 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-1/2 max-w-md" />
      </div>
      <div className="cm-shell space-y-14 pb-24">
        {[0, 1, 2].map((row) => (
          <div key={row} className="space-y-5">
            <Skeleton className="h-4 w-40" />
            <RowSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
}
