import { Card, CardContent } from "@/components/ui/card";

export const SavedPostCardSkeleton = () => {
  return (
    <Card className="w-full max-w-sm overflow-hidden">
      {/* Image skeleton */}
      <div className="relative h-48 bg-muted/30 animate-pulse">
        {/* Action buttons skeleton */}
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="h-8 w-8 bg-muted/50 rounded animate-pulse" />
          <div className="h-8 w-8 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
      
      <CardContent className="p-4">
        {/* Title skeleton */}
        <div className="mb-2">
          <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
        </div>

        {/* Content preview skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-3 bg-muted rounded w-full animate-pulse" />
          <div className="h-3 bg-muted rounded w-full animate-pulse" />
          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};
