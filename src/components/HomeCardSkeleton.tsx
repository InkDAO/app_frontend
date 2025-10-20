import { Card, CardContent } from "@/components/ui/card";

export const HomeCardSkeleton = () => {
  return (
    <Card className="w-full max-w-sm overflow-hidden border-2">
      {/* Image skeleton */}
      <div className="h-48 bg-muted/30 animate-pulse rounded-t-2xl" />
      
      <CardContent className="p-5">
        {/* Author Info and Price skeleton at top */}
        <div className="flex items-center mb-3 gap-2">
          <div className="h-6 bg-muted rounded-full w-28 animate-pulse flex-shrink-0" />
          <div className="h-6 bg-muted rounded-full w-20 animate-pulse flex-shrink-0" />
        </div>

        {/* Content area */}
        <div className="flex flex-col">
          {/* Title skeleton */}
          <div className="mb-2">
            <div className="h-5 bg-muted rounded w-3/4 animate-pulse mb-1" />
            <div className="h-5 bg-muted rounded w-1/2 animate-pulse" />
          </div>

          {/* Description skeleton with fixed height */}
          <div className="relative min-h-[4.5rem] max-h-[4.5rem] overflow-hidden">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full animate-pulse" />
              <div className="h-4 bg-muted rounded w-5/6 animate-pulse" />
              <div className="h-4 bg-muted rounded w-4/5 animate-pulse" />
            </div>
            {/* Gradient fade overlay */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Total Supply and Action section skeleton */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
          <div className="h-4 bg-muted rounded w-24 animate-pulse" />
          <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};
