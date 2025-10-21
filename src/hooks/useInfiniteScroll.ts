import { useEffect, useRef, useCallback } from "react";

interface UseInfiniteScrollOptions {
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  threshold?: number; // Distance from bottom (in pixels) to trigger load
}

export const useInfiniteScroll = ({
  hasMore,
  isLoading,
  onLoadMore,
  threshold = 500,
}: UseInfiniteScrollOptions) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const handleScroll = useCallback(() => {
    // Prevent multiple simultaneous loads
    if (!hasMore || isLoading || isLoadingRef.current) return;

    // Find the scrollable container (main element with overflow-y-auto)
    const scrollContainer = document.querySelector('main');
    
    if (scrollContainer) {
      // Check scroll position within the container
      const scrollPosition = scrollContainer.scrollTop + scrollContainer.clientHeight;
      const bottomPosition = scrollContainer.scrollHeight;
      
      // Check if user is within threshold pixels of the bottom
      if (bottomPosition - scrollPosition < threshold) {
        isLoadingRef.current = true;
        onLoadMore();
        // Reset after a delay to allow next load
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 1000);
      }
    } else {
      // Fallback to window scroll if no container found
      const scrollPosition = window.innerHeight + window.scrollY;
      const bottomPosition = document.documentElement.scrollHeight;
      
      if (bottomPosition - scrollPosition < threshold) {
        isLoadingRef.current = true;
        onLoadMore();
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 1000);
      }
    }
  }, [hasMore, isLoading, onLoadMore, threshold]);

  useEffect(() => {
    // Only add listener if there's more to load
    if (!hasMore) return;

    let rafId: number;
    let lastScrollTime = 0;
    const throttleDelay = 200; // Throttle scroll events to every 200ms

    const throttledHandleScroll = () => {
      const now = Date.now();
      if (now - lastScrollTime < throttleDelay) {
        return;
      }
      lastScrollTime = now;

      if (rafId) {
        cancelAnimationFrame(rafId);
      }
      
      rafId = requestAnimationFrame(handleScroll);
    };

    // Find the scrollable container
    const scrollContainer = document.querySelector('main');
    const targetElement = scrollContainer || window;

    targetElement.addEventListener("scroll", throttledHandleScroll, { passive: true });
    
    return () => {
      targetElement.removeEventListener("scroll", throttledHandleScroll);
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [handleScroll, hasMore]);

  return { observerTarget };
};

