import { create } from 'zustand'

export const useStore = create((set) => ({
  timeframe: '1d',
  setTimeframe: (timeframe: string) => set({ timeframe }),
})) 