import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export type AnalysisType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

interface AnalysisState {
  currentAnalysisType: AnalysisType;
  setAnalysisType: (type: AnalysisType) => void;
}

export const useAnalysisStore = create<AnalysisState>()(
  devtools(
    persist(
      (set) => ({
        currentAnalysisType: 'daily',
        setAnalysisType: (type: AnalysisType) => set({ currentAnalysisType: type }),
      }),
      {
        name: 'analysis-storage',
        partialize: (state) => ({
          currentAnalysisType: state.currentAnalysisType,
        }),
      }
    ),
    {
      name: 'analysis-store',
    }
  )
);