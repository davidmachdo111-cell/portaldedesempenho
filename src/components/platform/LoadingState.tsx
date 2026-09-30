import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function LoadingCards({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div aria-busy="true" aria-label="Carregando" className={cn("grid gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 rounded-lg border bg-card p-5">
          <Skeleton className="h-4 w-2/5" />
          <Skeleton className="h-8 w-1/4" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}

export function LoadingList({ rows = 5 }: { rows?: number }) {
  return (
    <div aria-busy="true" aria-label="Carregando" className="overflow-hidden rounded-lg border bg-card">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0">
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="space-y-6">
      <LoadingCards />
      <LoadingList />
    </div>
  );
}