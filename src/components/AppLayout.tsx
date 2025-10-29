import { ReactNode, useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ThemeProvider } from "@/context/ThemeContext";
import { SearchProvider } from "@/context/SearchContext";
import { EditorProvider } from "@/context/EditorContext";
import Sidebar from "@/components/Sidebar";
import TopHeader from "@/components/TopHeader";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  // Show sidebar only for app routes (routes that start with /app)
  const showSidebar = location.pathname.startsWith('/app');

  // Set sidebar to open by default on large screens
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };

    // Check on mount
    checkScreenSize();

    // Listen for resize events
    window.addEventListener('resize', checkScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Swipe gesture support for mobile
  useEffect(() => {
    if (!showSidebar) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = () => {
      const swipeDistance = touchEndX.current - touchStartX.current;
      const minSwipeDistance = 50;

      // Swipe from left edge to open
      if (touchStartX.current < 50 && swipeDistance > minSwipeDistance && !sidebarOpen) {
        setSidebarOpen(true);
      }
      // Swipe left to close
      else if (swipeDistance < -minSwipeDistance && sidebarOpen) {
        setSidebarOpen(false);
      }

      // Reset values
      touchStartX.current = 0;
      touchEndX.current = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [showSidebar, sidebarOpen]);

  return (
    <ThemeProvider>
      <SearchProvider>
        <EditorProvider>
          <div className={`h-screen max-h-screen bg-background flex flex-col`}>
          {/* Top Header - only show for app routes */}
          {showSidebar && (
            <TopHeader />
          )}
          
          {/* Floating Edge Button - only show for app routes and on smaller screens or when sidebar is closed */}
          {showSidebar && (
            <Button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="fixed left-0 top-24 z-50 rounded-l-none rounded-r-lg shadow-lg transition-all duration-300 ease-in-out hover:scale-105 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0 h-12 w-10 p-0 flex items-center justify-center lg:hidden"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <ChevronLeft className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </Button>
          )}

          {/* Floating Edge Button for Desktop - subtle version */}
          {showSidebar && !sidebarOpen && (
            <Button
              onClick={() => setSidebarOpen(true)}
              className="hidden lg:flex fixed left-0 top-24 z-50 rounded-l-none rounded-r-lg shadow-md transition-all duration-300 ease-in-out hover:scale-105 bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border-0 h-16 w-8 p-0 items-center justify-center"
              aria-label="Open sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
          
          {/* Main content area with sidebar and content */}
          <div className={`flex-1 flex transition-all duration-300 ease-in-out ${showSidebar ? 'pt-16' : ''} min-h-0 max-h-full`}>
            {/* Sidebar - only show for app routes */}
            {showSidebar && (
              <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            )}
            
            {/* Main content area - natural flex layout */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${showSidebar && sidebarOpen ? 'lg:ml-72' : ''} min-h-0 max-h-full`}>
              {/* Main content - scrollable only when needed */}
              <main className={`flex-1 w-full bg-background overflow-y-auto min-h-0 max-h-full`}>
                {children}
              </main>
            </div>
          </div>
          </div>
        </EditorProvider>
      </SearchProvider>
    </ThemeProvider>
  );
};

export default AppLayout;



