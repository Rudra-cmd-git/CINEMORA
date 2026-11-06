import { PosterSkeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface CatalogueGridSkeletonProps {
  count?: number;
  className?: string;
}

/** Poster-shaped placeholder grid for Suspense fallbacks and hydration gaps. */
export function CatalogueGridSkeleton({ count = 10, className }: CatalogueGridSkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4 xl:grid-cols-5 xl:gap-6",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <PosterSkeleton key={index} />
      ))}
    </div>
  );
}
