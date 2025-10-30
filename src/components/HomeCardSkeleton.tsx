import { Card, CardContent } from "@/components/ui/card";

export const HomeCardSkeleton = () => {
  return (
    <div className="relative w-full max-w-sm">
      {/* Glowing border effect */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-2xl blur opacity-10 animate-pulse"></div>
      
      <Card className="relative w-full overflow-hidden border-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {/* Image skeleton */}
        <div className="relative h-48 bg-gradient-to-br from-muted/30 to-muted/50 animate-pulse rounded-t-2xl">
          {/* Subtle animated blob */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-2xl animate-pulse" />
        </div>
        
        <CardContent className="p-5 relative">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,transparent)] dark:bg-grid-slate-400/5 opacity-30" />
          
          {/* Author Info and Price skeleton at top */}
          <div className="relative z-10 flex items-center mb-3 gap-2">
            <div className="h-6 bg-muted/60 rounded-full w-28 animate-pulse flex-shrink-0 backdrop-blur-sm" />
            <div className="h-6 bg-muted/60 rounded-full w-20 animate-pulse flex-shrink-0 backdrop-blur-sm" />
          </div>

          {/* Content area */}
          <div className="relative z-10 flex flex-col">
            {/* Title skeleton */}
            <div className="mb-2">
              <div className="h-5 bg-muted/60 rounded w-3/4 animate-pulse mb-1" />
              <div className="h-5 bg-muted/60 rounded w-1/2 animate-pulse" />
            </div>

            {/* Description skeleton with fixed height */}
            <div className="relative min-h-[4.5rem] max-h-[4.5rem] overflow-hidden">
              <div className="space-y-2">
                <div className="h-4 bg-muted/60 rounded w-full animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-5/6 animate-pulse" />
                <div className="h-4 bg-muted/60 rounded w-4/5 animate-pulse" />
              </div>
              {/* Gradient fade overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white/80 dark:from-gray-900/80 to-transparent pointer-events-none" />
            </div>
          </div>

          {/* Total Supply and Action section skeleton */}
          <div className="relative z-10 flex items-center justify-between mt-3 pt-3 border-t border-border/30">
            <div className="h-4 bg-muted/60 rounded w-24 animate-pulse" />
            <div className="h-6 bg-muted/60 rounded-full w-16 animate-pulse" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
