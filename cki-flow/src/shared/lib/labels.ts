import {
  EpicStatus,
  InitiativeStatus,
  QuarterStatus,
  ReleaseStatus,
  SprintStatus,
  StoryStatus,
  StoryType,
  WorkItemStatus,
} from '@/domain/model/enums'

const STORY_STATUS: Record<string, string> = {
  [StoryStatus.Draft]: 'Черновик',
  [StoryStatus.Refining]: 'Уточнение',
  [StoryStatus.Ready]: 'Готова',
  [StoryStatus.Planned]: 'Запланирована',
  [StoryStatus.InProgress]: 'В работе',
  [StoryStatus.InReview]: 'На ревью',
  [StoryStatus.Done]: 'Готово',
  [StoryStatus.Cancelled]: 'Отменена',
  [StoryStatus.Archived]: 'В архиве',
}

const STORY_TYPE: Record<string, string> = {
  [StoryType.Feature]: 'Функция / API',
  [StoryType.Enhancement]: 'Улучшение',
  [StoryType.Bugfix]: 'Исправление',
  [StoryType.Spike]: 'Исследование',
  [StoryType.Documentation]: 'Документация',
  [StoryType.Integration]: 'Интеграция',
  [StoryType.Infrastructure]: 'Инфраструктура',
  [StoryType.Other]: 'Прочее',
}

const WORK_ITEM_STATUS: Record<string, string> = {
  [WorkItemStatus.Planned]: 'Запланировано',
  [WorkItemStatus.Ready]: 'Готово к работе',
  [WorkItemStatus.InProgress]: 'В работе',
  [WorkItemStatus.Blocked]: 'Заблокировано',
  [WorkItemStatus.InReview]: 'На ревью',
  [WorkItemStatus.Done]: 'Готово',
  [WorkItemStatus.Cancelled]: 'Отменено',
}

const SPRINT_STATUS: Record<string, string> = {
  [SprintStatus.Future]: 'Будущий',
  [SprintStatus.Planning]: 'Планирование',
  [SprintStatus.Active]: 'Активный',
  [SprintStatus.Completed]: 'Завершён',
  [SprintStatus.Cancelled]: 'Отменён',
}

const QUARTER_STATUS: Record<string, string> = {
  [QuarterStatus.Draft]: 'Черновик',
  [QuarterStatus.Planning]: 'Планирование',
  [QuarterStatus.Active]: 'Активный',
  [QuarterStatus.Closing]: 'Закрытие',
  [QuarterStatus.Closed]: 'Закрыт',
}

const INITIATIVE_STATUS: Record<string, string> = {
  [InitiativeStatus.Idea]: 'Идея',
  [InitiativeStatus.Shaping]: 'Формирование',
  [InitiativeStatus.Committed]: 'Принята',
  [InitiativeStatus.Executing]: 'В работе',
  [InitiativeStatus.Done]: 'Готово',
  [InitiativeStatus.Dropped]: 'Снята',
  [InitiativeStatus.Archived]: 'В архиве',
}

const EPIC_STATUS: Record<string, string> = {
  [EpicStatus.Proposed]: 'Предложен',
  [EpicStatus.Approved]: 'Утверждён',
  [EpicStatus.InDelivery]: 'В поставке',
  [EpicStatus.Done]: 'Готово',
  [EpicStatus.Cancelled]: 'Отменён',
  [EpicStatus.Archived]: 'В архиве',
}

const RELEASE_STATUS: Record<string, string> = {
  [ReleaseStatus.Planned]: 'Запланирован',
  [ReleaseStatus.InProgress]: 'В работе',
  [ReleaseStatus.CodeFreeze]: 'Заморозка кода',
  [ReleaseStatus.Ready]: 'Готов',
  [ReleaseStatus.Released]: 'Выпущен',
  [ReleaseStatus.Cancelled]: 'Отменён',
}

const HEALTH: Record<string, string> = {
  on_track: 'В норме',
  at_risk: 'Под риском',
  off_track: 'Срыв',
}

const GOAL_STATUS: Record<string, string> = {
  draft: 'Черновик',
  committed: 'Принята',
  tracking: 'В отслеживании',
  achieved: 'Достигнута',
  missed: 'Не достигнута',
  cancelled: 'Отменена',
}

const THEME: Record<string, string> = {
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Системная',
}

export function labelStoryStatus(value: string): string {
  return STORY_STATUS[value] ?? value
}

export function labelStoryType(value: string): string {
  return STORY_TYPE[value] ?? value
}

export function labelWorkItemStatus(value: string): string {
  return WORK_ITEM_STATUS[value] ?? value
}

export function labelSprintStatus(value: string): string {
  return SPRINT_STATUS[value] ?? value
}

export function labelQuarterStatus(value: string): string {
  return QUARTER_STATUS[value] ?? value
}

export function labelInitiativeStatus(value: string): string {
  return INITIATIVE_STATUS[value] ?? value
}

export function labelEpicStatus(value: string): string {
  return EPIC_STATUS[value] ?? value
}

export function labelReleaseStatus(value: string): string {
  return RELEASE_STATUS[value] ?? value
}

export function labelHealth(value: string): string {
  return HEALTH[value] ?? value
}

export function labelTheme(value: string): string {
  return THEME[value] ?? value
}

export function labelOrRaw(value: string): string {
  return (
    STORY_STATUS[value] ??
    STORY_TYPE[value] ??
    WORK_ITEM_STATUS[value] ??
    SPRINT_STATUS[value] ??
    QUARTER_STATUS[value] ??
    INITIATIVE_STATUS[value] ??
    EPIC_STATUS[value] ??
    RELEASE_STATUS[value] ??
    HEALTH[value] ??
    GOAL_STATUS[value] ??
    value
  )
}
