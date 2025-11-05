import ActivityCalendar from 'react-activity-calendar';
import { useHeatmapData, ActivityData } from '@/hooks/useHeatmapData';
import { Loader2, Calendar } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useState, useEffect, cloneElement, isValidElement } from 'react';

interface ActivityHeatmapProps {
  userAddress: string | undefined;
}

export const ActivityHeatmap = ({ userAddress }: ActivityHeatmapProps) => {
  const { heatmapData, isLoading, error } = useHeatmapData(userAddress);
  const { theme } = useTheme();
  const [blockSize, setBlockSize] = useState(12);
  const [blockMargin, setBlockMargin] = useState(4);
  const [fontSize, setFontSize] = useState(12);
  const [tooltip, setTooltip] = useState<{ x: number; y: number; content: string } | null>(null);

  // Adjust block size based on screen width for better responsiveness (GitHub-style)
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 640) {
        // Mobile - compact for small screens
        setBlockSize(8);
        setBlockMargin(2);
        setFontSize(10);
      } else if (width < 768) {
        // Large mobile / Small tablet
        setBlockSize(9);
        setBlockMargin(2);
        setFontSize(11);
      } else if (width < 1024) {
        // Tablet
        setBlockSize(11);
        setBlockMargin(3);
        setFontSize(12);
      } else if (width < 1280) {
        // Desktop
        setBlockSize(13);
        setBlockMargin(3);
        setFontSize(13);
      } else if (width < 1536) {
        // Large Desktop
        setBlockSize(14);
        setBlockMargin(4);
        setFontSize(14);
      } else {
        // Extra Large Desktop (2K, 4K)
        setBlockSize(15);
        setBlockMargin(4);
        setFontSize(15);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Define color schemes for light and dark modes (GitHub-style)
  const colorScheme = {
    light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    dark: ['#161b22', '#0e4429', '#006d32', '#26a641', '#39d353'],
  };

  if (error) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="max-w-[1920px] mx-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-5 lg:px-8 lg:py-6 xl:px-10 xl:py-6 flex justify-center">
          <div className="border border-red-200 dark:border-red-900/50 rounded-lg bg-red-50 dark:bg-red-950/20 p-4 sm:p-5 md:p-5 lg:p-6 xl:p-8 w-fit max-w-full">
            <p className="text-xs sm:text-sm md:text-base text-red-600 dark:text-red-400 text-center">
              Failed to load activity data: {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="max-w-[1920px] mx-auto px-3 py-6 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-6 xl:px-10 xl:py-6 flex justify-center">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 p-6 sm:p-8 md:p-8 lg:p-10 xl:p-12 w-fit max-w-full">
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4">
              <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-blue-600" />
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">Loading activity data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="max-w-[1920px] mx-auto px-3 py-6 sm:px-4 sm:py-6 md:px-6 lg:px-8 lg:py-6 xl:px-10 xl:py-6 flex justify-center">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 p-6 sm:p-8 md:p-8 lg:p-10 xl:p-12 w-fit max-w-full">
            <div className="flex flex-col items-center justify-center gap-3 sm:gap-4 text-center">
              <Calendar className="h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 text-gray-400" />
              <p className="text-xs sm:text-sm md:text-base text-muted-foreground">No activity data available yet</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      <div className="max-w-[1920px] mx-auto px-3 py-4 sm:px-4 sm:py-5 md:px-6 md:py-5 lg:px-8 lg:py-6 xl:px-10 xl:py-6 flex justify-center">
        {/* Scrollable container - calendar scrolls horizontally inside the card like GitHub */}
        <div 
          className="scrollbar-thin overflow-x-auto overflow-y-hidden border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50/50 dark:bg-gray-800/30 p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 w-fit max-w-full"
          style={{
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div
            style={{
              minWidth: '600px',
              width: 'max-content',
              margin: '0 auto',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <ActivityCalendar
              data={heatmapData}
              theme={colorScheme}
              labels={{
                totalCount: '{{count}} activities in the last year',
              }}
              renderBlock={(block, activity) => {
                const activityData = activity as ActivityData;
                const date = new Date(activityData.date);
                const formattedDate = date.toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                });
                const tooltipContent = `${formattedDate}|Posts Created: ${activityData.creatorCount}|Posts Subscribed: ${activityData.holderCount}|Total: ${activityData.count} ${activityData.count === 1 ? 'activity' : 'activities'}`;
                
                if (isValidElement(block)) {
                  return cloneElement(block, {
                    ...block.props,
                    onMouseEnter: (e: React.MouseEvent) => {
                      const rect = (e.target as HTMLElement).getBoundingClientRect();
                      setTooltip({
                        x: rect.left + rect.width / 2,
                        y: rect.top - 10,
                        content: tooltipContent,
                      });
                    },
                    onMouseLeave: () => {
                      setTooltip(null);
                    },
                    style: {
                      ...block.props.style,
                      cursor: 'pointer',
                    },
                  } as any);
                }
                return block;
              }}
              showWeekdayLabels
              blockSize={blockSize}
              blockMargin={blockMargin}
              fontSize={fontSize}
              style={{
                color: theme === 'dark' ? '#e5e7eb' : '#374151',
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Custom Tooltip */}
      {tooltip && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${tooltip.x}px`,
            top: `${tooltip.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-xl text-xs sm:text-sm font-medium whitespace-nowrap">
            {tooltip.content.split('|').map((line, index) => (
              <div key={index} className={index === 0 ? 'font-semibold mb-1' : index === tooltip.content.split('|').length - 1 ? 'mt-1 pt-1 border-t border-gray-700 dark:border-gray-300 text-gray-300 dark:text-gray-700' : ''}>
                {line}
              </div>
            ))}
          </div>
          {/* Arrow */}
          <div className="absolute left-1/2 -translate-x-1/2 -bottom-1">
            <div className="w-2 h-2 bg-gray-900 dark:bg-gray-100 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  );
};
