import Handlebars from 'handlebars'
import type { ReportViewModel } from '@/core/model/types'
import { formatNumber, formatShortDate } from '@/core/format/format'

let helpersRegistered = false

function registerHelpers() {
  if (helpersRegistered) return
  helpersRegistered = true

  Handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b)
  Handlebars.registerHelper('formatNumber', (value: number, digits?: number) =>
    formatNumber(value, typeof digits === 'number' ? digits : 0),
  )
  Handlebars.registerHelper('formatShortDate', (iso: string) => formatShortDate(iso))
  Handlebars.registerHelper('nl2br', (text: string) => {
    const escaped = Handlebars.escapeExpression(text ?? '')
    return new Handlebars.SafeString(escaped.replace(/\n/g, '<br>'))
  })
  Handlebars.registerHelper('toneClass', (tone: string) => {
    const map: Record<string, string> = {
      up: 'tone-up',
      down: 'tone-down',
      flat: 'tone-flat',
      green: 'tone-up',
      red: 'tone-down',
      cyan: 'accent-cyan',
      purple: 'accent-purple',
      amber: 'accent-amber',
    }
    return map[tone] ?? ''
  })
  Handlebars.registerHelper('categoryLabel', (category: string) => {
    const map: Record<string, string> = {
      base: 'БАЗА',
      activity: 'АКТИВНОСТЬ',
      retention: 'УДЕРЖАНИЕ',
      monetization: 'МОНЕТИЗАЦИЯ',
    }
    return map[category] ?? category
  })
  Handlebars.registerHelper('categoryTag', (category: string) => {
    const map: Record<string, string> = {
      base: 'tag-cyan',
      activity: 'tag-purple',
      retention: 'tag-green',
      monetization: 'tag-amber',
    }
    return map[category] ?? 'tag-purple'
  })
  Handlebars.registerHelper('json', (ctx: unknown) => JSON.stringify(ctx))
}

export function renderHtml(templateSource: string, viewModel: ReportViewModel): string {
  registerHelpers()
  const template = Handlebars.compile(templateSource, { noEscape: false })
  return template(viewModel)
}
