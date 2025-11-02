import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  gradient?: string;
  iconGradient?: string;
  iconShadow?: string;
}

export const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  gradient = "from-blue-50 via-purple-50 to-pink-50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20",
  iconGradient = "from-blue-500 via-purple-600 to-pink-600",
  iconShadow = "shadow-blue-500/50",
}: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {/* Beautiful Card Container */}
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} p-8 sm:p-12 max-w-2xl w-full shadow-2xl dark:shadow-primary/10 border-0`}>
        {/* Animated Background Blobs */}
        <div className="absolute top-0 left-0 w-40 h-40 sm:w-64 sm:h-64 bg-gradient-to-br from-blue-400/30 to-purple-400/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-pink-400/20 to-rose-400/20 rounded-full blur-3xl animate-pulse delay-1000" />
        
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(180deg,transparent,white,white,transparent)] dark:bg-grid-slate-400/5 opacity-30" />
        
        {/* Content */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Icon */}
          <div className="mb-6 sm:mb-8">
            <div className="relative group">
              <div className={`absolute inset-0 bg-gradient-to-br ${iconGradient} rounded-3xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-300`}></div>
              <div className={`relative bg-gradient-to-br ${iconGradient} p-6 sm:p-8 rounded-3xl shadow-2xl ${iconShadow} transform group-hover:scale-105 transition-transform duration-300`}>
                <Icon className="h-12 w-12 sm:h-16 sm:w-16 text-white animate-[float_3s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight mb-3 sm:mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            {title}
          </h2>

          {/* Description */}
          <p className="text-base sm:text-lg text-muted-foreground mb-6 sm:mb-8 max-w-md font-medium leading-relaxed">
            {description}
          </p>

          {/* Actions */}
          {(actionLabel || secondaryActionLabel) && (
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
              {actionLabel && onAction && (
                <Button
                  onClick={onAction}
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 text-white font-bold shadow-lg hover:shadow-xl transition-all transform hover:scale-105 px-8 py-6 text-base"
                >
                  {actionLabel}
                </Button>
              )}
              {secondaryActionLabel && onSecondaryAction && (
                <Button
                  onClick={onSecondaryAction}
                  variant="outline"
                  size="lg"
                  className="border-2 border-foreground/20 hover:border-foreground/40 hover:bg-foreground/5 font-semibold px-8 py-6 text-base backdrop-blur-sm"
                >
                  {secondaryActionLabel}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
