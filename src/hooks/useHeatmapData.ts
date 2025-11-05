import { useState, useEffect } from 'react';

interface HeatmapData {
  creator: string[];
  holder: string[];
}

interface ActivityData {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  creatorCount: number;
  holderCount: number;
}

export const useHeatmapData = (userAddress: string | undefined) => {
  const [heatmapData, setHeatmapData] = useState<ActivityData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeatmapData = async () => {
      if (!userAddress) {
        setHeatmapData([]);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_SERVER_URL}/heatmap?userAddress=${userAddress}`
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch heatmap data: ${response.status}`);
        }

        const result = await response.json();

        if (result.statusCode === 200 && result.data) {
          const processedData = processHeatmapData(result.data);
          setHeatmapData(processedData);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching heatmap data:', error);
        setError(error instanceof Error ? error.message : 'Failed to load heatmap data');
        setHeatmapData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHeatmapData();
  }, [userAddress]);

  return { heatmapData, isLoading, error };
};

// Process the heatmap data from API format to react-activity-calendar format
const processHeatmapData = (data: HeatmapData): ActivityData[] => {
  const creatorMap = new Map<string, number>();
  const holderMap = new Map<string, number>();

  // Parse date strings from "D/M/YYYY" or "DD/MM/YYYY" format to "YYYY-MM-DD"
  const parseDate = (dateStr: string): string => {
    const [day, month, year] = dateStr.split('/');
    const paddedDay = day.padStart(2, '0');
    const paddedMonth = month.padStart(2, '0');
    return `${year}-${paddedMonth}-${paddedDay}`;
  };

  // Count creator activities
  if (data.creator && Array.isArray(data.creator)) {
    data.creator.forEach((dateStr) => {
      try {
        const normalizedDate = parseDate(dateStr);
        creatorMap.set(normalizedDate, (creatorMap.get(normalizedDate) || 0) + 1);
      } catch (error) {
        console.error('Error parsing creator date:', dateStr, error);
      }
    });
  }

  // Count holder activities
  if (data.holder && Array.isArray(data.holder)) {
    data.holder.forEach((dateStr) => {
      try {
        const normalizedDate = parseDate(dateStr);
        holderMap.set(normalizedDate, (holderMap.get(normalizedDate) || 0) + 1);
      } catch (error) {
        console.error('Error parsing holder date:', dateStr, error);
      }
    });
  }

  // Get all unique dates
  const allDates = new Set([...creatorMap.keys(), ...holderMap.keys()]);

  // Convert to array format and calculate levels
  const activityArray: ActivityData[] = Array.from(allDates).map((date) => {
    const creatorCount = creatorMap.get(date) || 0;
    const holderCount = holderMap.get(date) || 0;
    const count = creatorCount + holderCount;

    // Calculate level based on count (0-4 scale)
    let level: 0 | 1 | 2 | 3 | 4;
    if (count === 0) level = 0;
    else if (count <= 2) level = 1;
    else if (count <= 4) level = 2;
    else if (count <= 6) level = 3;
    else level = 4;

    return {
      date,
      count,
      level,
      creatorCount,
      holderCount,
    };
  });

  // Sort by date
  activityArray.sort((a, b) => a.date.localeCompare(b.date));

  // Fill in missing dates for the past year to create a continuous heatmap
  const today = new Date();
  const oneYearAgo = new Date(today);
  oneYearAgo.setFullYear(today.getFullYear() - 1);

  const filledData: ActivityData[] = [];
  const currentDate = new Date(oneYearAgo);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const existingData = activityArray.find((item) => item.date === dateStr);

    if (existingData) {
      filledData.push(existingData);
    } else {
      filledData.push({
        date: dateStr,
        count: 0,
        level: 0,
        creatorCount: 0,
        holderCount: 0,
      });
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return filledData;
};

export type { ActivityData };
