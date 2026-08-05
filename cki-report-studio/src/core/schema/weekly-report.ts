import { z } from 'zod'

const accentTone = z.enum(['cyan', 'purple', 'green', 'amber', 'red', 'muted'])

export const weeklyReportSchema = z.object({
  meta: z.object({
    id: z.string().min(1),
    weekNumber: z.number().int().positive(),
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    previousReportId: z.string().optional(),
    status: z.enum(['draft', 'ready', 'exported']),
    schemaVersion: z.number().int().positive(),
    notes: z.string().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    author: z.string().optional(),
  }),
  general: z.object({
    title: z.string().min(1),
    subtitle: z.string().min(1),
    brandTag: z.string().min(1),
    pillars: z
      .array(
        z.object({
          title: z.string(),
          caption: z.string(),
          tone: accentTone,
        }),
      )
      .min(1),
  }),
  goals: z.object({
    revenueYear: z.number().nonnegative(),
    revenueMonthly: z.number().nonnegative(),
    clients: z.number().nonnegative(),
    subscriptions: z.number().nonnegative(),
    coverage: z.number().min(0).max(100),
  }),
  products: z.object({
    items: z.array(z.string()),
    highlight: z.object({ label: z.string(), tone: accentTone }),
    valueProps: z.object({
      external: z.array(z.object({ title: z.string(), description: z.string() })),
      internal: z.array(z.object({ title: z.string(), description: z.string() })),
      strategy: z.array(z.object({ title: z.string(), description: z.string() })),
    }),
  }),
  metrics: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        category: z.enum(['base', 'activity', 'retention', 'monetization']),
        value: z.number(),
        unit: z.string(),
        goalKey: z
          .enum(['revenueYear', 'revenueMonthly', 'clients', 'subscriptions', 'coverage'])
          .optional(),
        format: z.enum(['number', 'currency', 'percent', 'thousands']),
        compareWithPrevious: z.boolean(),
        accent: accentTone,
      }),
    )
    .min(1),
  funnel: z.object({
    stages: z
      .array(
        z.object({
          id: z.string(),
          label: z.string(),
          count: z.number().nonnegative(),
          amountThousands: z.number().nonnegative(),
          highlight: z.enum(['amber', 'green']).optional(),
        }),
      )
      .min(1),
    comments: z.array(
      z.object({
        id: z.string(),
        tone: accentTone,
        text: z.string().min(1),
      }),
    ),
  }),
  roadmap: z.array(
    z.object({
      id: z.string(),
      period: z.string(),
      status: z.enum(['done', 'current', 'planned', 'future']),
      description: z.string(),
    }),
  ),
  activities: z.object({
    weekDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).length(3),
    rows: z.array(
      z.object({
        role: z.enum(['CLIENTS', 'FRONT', 'BACK', 'ADMIN']),
        cells: z.array(z.string()).length(3),
      }),
    ),
  }),
  team: z.object({
    fteTotal: z.number().nonnegative(),
    fteStaff: z.number().nonnegative(),
    fteContract: z.number().nonnegative(),
    fteNrd: z.number().nonnegative(),
    fteMb: z.number().nonnegative(),
    dynamics: z.object({
      before: z.object({ fte: z.number(), costThousands: z.number() }),
      after: z.object({ fte: z.number(), costThousands: z.number() }),
    }),
    orgUnits: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        fte: z.number(),
        accent: accentTone,
        members: z.array(z.string()),
      }),
    ),
  }),
  charts: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      unit: z.string(),
      yMax: z.number().positive(),
      color: z.string(),
      plan: z.array(z.number()).length(12),
      fact: z.array(z.number()).min(1).max(12),
    }),
  ),
  ticker: z.object({
    slides: z.object({
      title: z.array(
        z.union([
          z.object({ type: z.literal('static'), text: z.string() }),
          z.object({ type: z.literal('binding'), template: z.string() }),
        ]),
      ),
      closing: z.array(
        z.union([
          z.object({ type: z.literal('static'), text: z.string() }),
          z.object({ type: z.literal('binding'), template: z.string() }),
        ]),
      ),
    }),
  }),
})

export type WeeklyReportInput = z.infer<typeof weeklyReportSchema>
