import { create } from 'zustand'

type PaletteState = {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const usePaletteStore = create<PaletteState>((set, get) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set({ open: !get().open }),
}))
