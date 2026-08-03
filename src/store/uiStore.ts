import { create } from 'zustand'

export type AppMode = 'executive' | 'analyst'

interface UIState {
  mode: AppMode
  setMode: (mode: AppMode) => void
}

export const useUIStore = create<UIState>((set) => ({
  mode: 'executive',
  setMode: (mode) => set({ mode }),
}))
