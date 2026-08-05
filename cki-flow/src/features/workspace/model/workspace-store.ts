import { create } from 'zustand'
import { appServices } from '@/application/composition'
import type { StoryListItem } from '@/application/services/story-service'
import { DomainError } from '@/domain/model/errors'
import type { StoryType } from '@/domain/model/enums'
import { logger } from '@/shared/lib/logger'

type WorkspaceSummary = Awaited<ReturnType<typeof appServices.catalog.getWorkspaceSummary>>
type TemplateListItem = Awaited<ReturnType<typeof appServices.catalog.listTemplates>>[number]

type WorkspaceState = {
  ready: boolean
  loading: boolean
  error: string | null
  summary: WorkspaceSummary | null
  stories: StoryListItem[]
  templates: TemplateListItem[]
  bootstrap: () => Promise<void>
  refresh: () => Promise<void>
  createStory: (input: { title: string; storyType?: StoryType }) => Promise<void>
  resetDemoData: () => Promise<void>
}

function toErrorMessage(error: unknown): string {
  if (error instanceof DomainError) return error.message
  if (error instanceof Error) return error.message
  return 'Неизвестная ошибка'
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ready: false,
  loading: false,
  error: null,
  summary: null,
  stories: [],
  templates: [],

  bootstrap: async () => {
    set({ loading: true, error: null })
    try {
      await appServices.bootstrap.ensureReady()
      await get().refresh()
      set({ ready: true })
      logger.info('Workspace ready', undefined, 'workspace')
    } catch (error) {
      set({ error: toErrorMessage(error), ready: false })
      logger.error('Workspace bootstrap failed', error, 'workspace')
    } finally {
      set({ loading: false })
    }
  },

  refresh: async () => {
    const summary = await appServices.catalog.getWorkspaceSummary()
    const stories = await appServices.stories.listByProduct(summary.product.id)
    const templates = await appServices.catalog.listTemplates(summary.product.id)
    set({ summary, stories, templates, error: null })
  },

  createStory: async ({ title, storyType }) => {
    const summary = get().summary
    if (!summary) throw new DomainError('PRECONDITION', 'Workspace is not ready')
    set({ loading: true, error: null })
    try {
      await appServices.stories.create({
        productId: summary.product.id,
        title,
        storyType,
        epicId: summary.epic?.id,
        initiativeId: summary.initiative?.id,
        actor: 'pm',
      })
      await get().refresh()
    } catch (error) {
      set({ error: toErrorMessage(error) })
      throw error
    } finally {
      set({ loading: false })
    }
  },

  resetDemoData: async () => {
    set({ loading: true, error: null })
    try {
      await appServices.bootstrap.ensureReady({ forceSeed: true })
      await get().refresh()
    } catch (error) {
      set({ error: toErrorMessage(error) })
    } finally {
      set({ loading: false })
    }
  },
}))
