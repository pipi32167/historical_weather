import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Location } from '../types/weather';

interface LocationState {
  currentLocation: Location | null;
  recentLocations: Location[];
  favoriteLocations: Location[];
  setCurrentLocation: (location: Location) => void;
  addToRecent: (location: Location) => void;
  addToFavorites: (location: Location) => void;
  removeFromFavorites: (locationId: string) => void;
  clearHistory: () => void;
}

const defaultLocation: Location = {
  id: 'beijing',
  name: '北京',
  latitude: 39.9042,
  longitude: 116.4074,
  country: '中国',
  timezone: 'Asia/Shanghai'
};

export const useLocationStore = create<LocationState>()(
  persist(
    (set, get) => ({
      currentLocation: defaultLocation,
      recentLocations: [defaultLocation],
      favoriteLocations: [],
      
      setCurrentLocation: (location) => {
        console.log('设置当前位置:', location.name);
        set({ currentLocation: location });
        get().addToRecent(location);
      },
      
      addToRecent: (location) => set((state) => {
        const filtered = state.recentLocations.filter(l => l.id !== location.id);
        return {
          recentLocations: [location, ...filtered].slice(0, 10)
        };
      }),
      
      addToFavorites: (location) => set((state) => {
        const exists = state.favoriteLocations.some(l => l.id === location.id);
        if (!exists) {
          return {
            favoriteLocations: [...state.favoriteLocations, location]
          };
        }
        return state;
      }),
      
      removeFromFavorites: (locationId) => set((state) => ({
        favoriteLocations: state.favoriteLocations.filter(l => l.id !== locationId)
      })),

      clearHistory: () => set({
        recentLocations: [get().currentLocation].filter(Boolean) as Location[]
      })
    }),
    {
      name: 'location-storage',
      partialize: (state) => ({
        currentLocation: state.currentLocation,
        recentLocations: state.recentLocations,
        favoriteLocations: state.favoriteLocations,
      })
    }
  )
);