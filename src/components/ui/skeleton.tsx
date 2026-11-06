import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("cm-skeleton rounded-md", className)} {...props} />;
}

export function PosterSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      <Skeleton className="aspect-[2/3] w-full rounded-md" />
      <Skeleton className="h-3.5 w-3/4 rounded-xs" />
      <Skeleton className="h-3 w-1/2 rounded-xs" />
    </div>
  );
}

export function RowSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="w-[210px] shrink-0 sm:w-[190px]">
          <PosterSkeleton />
        </div>
      ))}
    </div>
  );
}

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn(
        "inline-block size-5 animate-spin-slow rounded-full border-2 border-white/20 border-t-gold",
        className,
      )}
    />
  );
}
