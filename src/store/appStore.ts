import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppState, Location, WeatherQuery, NLQuery } from '../types/weather';

interface AppStore extends AppState {
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  
  // Locations
  addLocation: (location: Location) => void;
  removeLocation: (locationId: string) => void;
  clearLocations: () => void;
  
  // Queries
  setCurrentQuery: (query: WeatherQuery | null) => void;
  addToHistory: (query: NLQuery) => void;
  clearHistory: () => void;
  
  // Loading and error states
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        theme: 'light',
        sidebarOpen: true,
        selectedLocations: [],
        currentQuery: null,
        queryHistory: [],
        isLoading: false,
        error: null,

        // Theme actions
        setTheme: (theme) => {
          set({ theme });
          // Apply theme to document
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        },

        // Sidebar actions
        toggleSidebar: () => set((state) => ({ 
          sidebarOpen: !state.sidebarOpen 
        })),
        
        setSidebarOpen: (open) => set({ sidebarOpen: open }),

        // Location actions
        addLocation: (location) => set((state) => {
          const exists = state.selectedLocations.some(loc => loc.id === location.id);
          if (exists) return state;
          
          return {
            selectedLocations: [...state.selectedLocations, location]
          };
        }),

        removeLocation: (locationId) => set((state) => ({
          selectedLocations: state.selectedLocations.filter(loc => loc.id !== locationId)
        })),

        clearLocations: () => set({ selectedLocations: [] }),

        // Query actions
        setCurrentQuery: (query) => set({ currentQuery: query }),

        addToHistory: (query) => set((state) => {
          const newHistory = [query, ...state.queryHistory].slice(0, 50); // Keep last 50
          return { queryHistory: newHistory };
        }),

        clearHistory: () => set({ queryHistory: [] }),

        // Loading and error actions
        setLoading: (loading) => set({ isLoading: loading }),
        
        setError: (error) => set({ error }),
      }),
      {
        name: 'weather-app-storage',
        partialize: (state) => ({
          theme: state.theme,
          selectedLocations: state.selectedLocations,
          queryHistory: state.queryHistory,
        }),
      }
    ),
    {
      name: 'weather-app',
    }
  )
);

// Initialize theme on app start
const initializeTheme = () => {
  const { theme } = useAppStore.getState();
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  }
};

// Call on module load
if (typeof window !== 'undefined') {
  initializeTheme();
}