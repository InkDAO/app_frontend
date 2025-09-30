import { Card, CardContent } from "@/components/ui/card";

export const HomeCardSkeleton = () => {
  return (
    <Card className="w-full max-w-sm overflow-hidden">
      {/* Image skeleton */}
      <div className="h-48 bg-muted/30 animate-pulse" />
      
      <CardContent className="p-4">
        {/* Title skeleton */}
        <div className="mb-2">
          <div className="h-5 bg-muted rounded w-3/4 animate-pulse" />
        </div>

        {/* Description skeleton */}
        <div className="mb-3 space-y-2">
          <div className="h-3 bg-muted rounded w-full animate-pulse" />
          <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
        </div>

        {/* Price and Action badges skeleton */}
        <div className="flex items-center justify-end mt-3 gap-2">
          <div className="h-6 bg-muted rounded-full w-20 animate-pulse" />
          <div className="h-6 bg-muted rounded-full w-16 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};
