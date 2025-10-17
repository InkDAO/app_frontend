import React from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const PaginationControl: React.FC<PaginationControlProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="py-8 flex items-center justify-between w-full max-w-7xl mx-auto px-4">
      {/* Previous Button - Left */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage <= 1}
        className="px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Button>

      {/* Page Numbers - Center (Large screens only) */}
      <div className="hidden lg:flex items-center gap-2">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              page === currentPage
                ? "bg-black text-white dark:bg-white dark:text-black font-medium"
                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      {/* Next Button - Right */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleNext}
        disabled={currentPage >= totalPages}
        className="px-4 py-2 text-sm bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 hover:text-white dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

