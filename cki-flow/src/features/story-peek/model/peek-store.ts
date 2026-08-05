import { create } from 'zustand'

type StoryPeekState = {
  selectedStoryId: string | null
  open: (storyId: string) => void
  close: () => void
}

export const useStoryPeekStore = create<StoryPeekState>((set) => ({
  selectedStoryId: null,
  open: (storyId) => set({ selectedStoryId: storyId }),
  close: () => set({ selectedStoryId: null }),
}))
