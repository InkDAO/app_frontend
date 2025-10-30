import { Card, CardContent } from "@/components/ui/card";

export const SavedPostCardSkeleton = () => {
  return (
    <div className="relative w-full max-w-sm">
      {/* Glowing border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl blur opacity-10 animate-pulse"></div>
      
      <Card className="relative w-full overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {/* Image skeleton */}
        <div className="relative h-48 bg-gradient-to-br from-muted/30 to-muted/50 animate-pulse rounded-t-2xl">
          {/* Subtle animated blob */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-400/10 to-orange-400/10 rounded-full blur-2xl animate-pulse" />
          
          {/* Action buttons skeleton */}
          <div className="absolute top-2 right-2 flex gap-2 z-10">
            <div className="h-8 w-8 bg-white/60 dark:bg-gray-800/60 rounded backdrop-blur-sm animate-pulse" />
            <div className="h-8 w-8 bg-white/60 dark:bg-gray-800/60 rounded backdrop-blur-sm animate-pulse" />
          </div>
        </div>
        
        <CardContent className="p-4 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,transparent)] dark:bg-grid-slate-400/5 opacity-30" />
          
          {/* Title skeleton */}
          <div className="relative z-10 mb-2">
            <div className="h-5 bg-muted/60 rounded w-3/4 animate-pulse" />
          </div>

          {/* Content preview skeleton */}
          <div className="relative z-10 mb-3 space-y-2">
            <div className="h-3 bg-muted/60 rounded w-full animate-pulse" />
            <div className="h-3 bg-muted/60 rounded w-full animate-pulse" />
            <div className="h-3 bg-muted/60 rounded w-2/3 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
