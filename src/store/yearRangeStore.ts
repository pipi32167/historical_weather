import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface YearRange {
  start: number;
  end: number;
}

interface YearRangeState {
  yearRange: YearRange;
  setYearRange: (yearRange: YearRange) => void;
  resetYearRange: () => void;
}

const getDefaultYearRange = (): YearRange => {
  const currentYear = new Date().getFullYear();
  return {
    start: currentYear - 20,
    end: currentYear
  };
};

export const useYearRangeStore = create<YearRangeState>()(
  persist(
    (set) => ({
      yearRange: getDefaultYearRange(),
      
      setYearRange: (yearRange: YearRange) => {
        console.log('设置年份范围:', yearRange);
        set({ yearRange });
      },
      
      resetYearRange: () => {
        console.log('重置年份范围为默认值');
        set({ yearRange: getDefaultYearRange() });
      }
    }),
    {
      name: 'year-range-storage',
      partialize: (state) => ({
        yearRange: state.yearRange
      })
    }
  )
);