import { useMemo } from 'react'
import { useReportStore, useActiveReport, type EditorSection } from '@/stores/report-store'
import { Field, Input, Textarea, Button } from '@/shared/ui/primitives'
import { formatDeltaLabel } from '@/core/format/format'
import { useViewModel } from '@/stores/report-store'

const SECTIONS: { id: EditorSection; label: string }[] = [
  { id: 'general', label: 'Общее' },
  { id: 'metrics', label: 'KPI' },
  { id: 'funnel', label: 'Воронка' },
  { id: 'activities', label: 'Активности' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'charts', label: 'Графики' },
  { id: 'team', label: 'Команда' },
  { id: 'products', label: 'Продукты' },
]

function matchesQuery(text: string, q: string) {
  return !q || text.toLowerCase().includes(q.toLowerCase())
}

export function EditorPanel() {
  const section = useReportStore((s) => s.section)
  const setSection = useReportStore((s) => s.setSection)
  const searchQuery = useReportStore((s) => s.searchQuery)
  const setSearchQuery = useReportStore((s) => s.setSearchQuery)
  const report = useActiveReport()
  const patchReport = useReportStore((s) => s.patchReport)
  const vm = useViewModel()

  const filteredMetrics = useMemo(
    () => report.metrics.filter((m) => matchesQuery(`${m.label} ${m.id} ${m.category}`, searchQuery)),
    [report.metrics, searchQuery],
  )

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <Input
        placeholder="Поиск полей (API, клиенты…)"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      <div className="flex flex-wrap gap-1">
        {SECTIONS.map((s) => (
          <Button
            key={s.id}
            variant={section === s.id ? 'primary' : 'ghost'}
            className="px-2 py-1 text-xs"
            onClick={() => setSection(s.id)}
          >
            {s.label}
          </Button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        {section === 'general' && (
          <>
            <Field label="Дата отчёта">
              <Input
                type="date"
                value={report.meta.reportDate}
                onChange={(e) =>
                  patchReport((d) => {
                    d.meta.reportDate = e.target.value
                    d.meta.id = e.target.value
                  })
                }
              />
            </Field>
            <Field label="Номер недели">
              <Input
                type="number"
                value={report.meta.weekNumber}
                onChange={(e) =>
                  patchReport((d) => {
                    d.meta.weekNumber = Number(e.target.value)
                  })
                }
              />
            </Field>
            <Field label="Заголовок">
              <Input
                value={report.general.title}
                onChange={(e) =>
                  patchReport((d) => {
                    d.general.title = e.target.value
                  })
                }
              />
            </Field>
            <Field label="Подзаголовок">
              <Input
                value={report.general.subtitle}
                onChange={(e) =>
                  patchReport((d) => {
                    d.general.subtitle = e.target.value
                  })
                }
              />
            </Field>
          </>
        )}

        {section === 'metrics' && (
          <>
            <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-black/20 p-3">
              <Field label="Цель: клиенты">
                <Input
                  type="number"
                  value={report.goals.clients}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.goals.clients = Number(e.target.value)
                    })
                  }
                />
              </Field>
              <Field label="Цель: подписки">
                <Input
                  type="number"
                  value={report.goals.subscriptions}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.goals.subscriptions = Number(e.target.value)
                    })
                  }
                />
              </Field>
              <Field label="Цель: выручка/мес">
                <Input
                  type="number"
                  value={report.goals.revenueMonthly}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.goals.revenueMonthly = Number(e.target.value)
                    })
                  }
                />
              </Field>
              <Field label="Цель: покрытие %">
                <Input
                  type="number"
                  value={report.goals.coverage}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.goals.coverage = Number(e.target.value)
                    })
                  }
                />
              </Field>
            </div>
            {filteredMetrics.map((metric) => {
              const derived = vm.metrics.find((m) => m.id === metric.id)
              return (
                <Field
                  key={metric.id}
                  label={metric.label}
                  hint={
                    derived
                      ? `${derived.deltaLabel}${derived.progressPercent != null ? ` · ${derived.progressPercent}% от цели` : ''}`
                      : undefined
                  }
                >
                  <Input
                    type="number"
                    value={metric.value}
                    onChange={(e) =>
                      patchReport((d) => {
                        const m = d.metrics.find((x) => x.id === metric.id)
                        if (m) m.value = Number(e.target.value)
                      })
                    }
                  />
                </Field>
              )
            })}
          </>
        )}

        {section === 'funnel' && (
          <>
            {report.funnel.stages.map((stage) => {
              const derived = vm.funnel.stages.find((s) => s.id === stage.id)
              return (
                <div key={stage.id} className="mb-3 rounded-xl border border-white/10 p-3">
                  <div className="mb-2 text-sm font-semibold">{stage.label}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label="Количество" hint={derived ? `Δ неделя: ${derived.weeklyDeltaLabel}` : undefined}>
                      <Input
                        type="number"
                        value={stage.count}
                        onChange={(e) =>
                          patchReport((d) => {
                            const s = d.funnel.stages.find((x) => x.id === stage.id)
                            if (s) s.count = Number(e.target.value)
                          })
                        }
                      />
                    </Field>
                    <Field label="Сумма, тыс ₽">
                      <Input
                        type="number"
                        value={stage.amountThousands}
                        onChange={(e) =>
                          patchReport((d) => {
                            const s = d.funnel.stages.find((x) => x.id === stage.id)
                            if (s) s.amountThousands = Number(e.target.value)
                          })
                        }
                      />
                    </Field>
                  </div>
                </div>
              )
            })}
            <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#8b8bb8]">
              Итого: {vm.funnel.totalCount} · {vm.funnel.totalAmount} тыс ₽
            </div>
            {report.funnel.comments.map((comment) => (
              <Field key={comment.id} label={`Комментарий ${comment.id}`}>
                <Textarea
                  value={comment.text}
                  onChange={(e) =>
                    patchReport((d) => {
                      const c = d.funnel.comments.find((x) => x.id === comment.id)
                      if (c) c.text = e.target.value
                    })
                  }
                />
              </Field>
            ))}
            <Button
              variant="secondary"
              onClick={() =>
                patchReport((d) => {
                  d.funnel.comments.push({
                    id: `c${d.funnel.comments.length + 1}`,
                    tone: 'purple',
                    text: '',
                  })
                })
              }
            >
              + Комментарий
            </Button>
          </>
        )}

        {section === 'activities' && (
          <>
            <div className="mb-3 grid grid-cols-3 gap-2">
              {report.activities.weekDates.map((date, idx) => (
                <Field key={date} label={`Колонка ${idx + 1}`}>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) =>
                      patchReport((d) => {
                        d.activities.weekDates[idx] = e.target.value
                      })
                    }
                  />
                </Field>
              ))}
            </div>
            {report.activities.rows.map((row) => (
              <div key={row.role} className="mb-4">
                <div className="mb-2 text-sm font-bold text-violet-300">{row.role}</div>
                {row.cells.map((cell, idx) => (
                  <Field key={`${row.role}-${idx}`} label={report.activities.weekDates[idx]}>
                    <Textarea
                      value={cell}
                      onChange={(e) =>
                        patchReport((d) => {
                          const r = d.activities.rows.find((x) => x.role === row.role)
                          if (r) r.cells[idx] = e.target.value
                        })
                      }
                    />
                  </Field>
                ))}
              </div>
            ))}
          </>
        )}

        {section === 'roadmap' &&
          report.roadmap.map((item) => (
            <div key={item.id} className="mb-3 rounded-xl border border-white/10 p-3">
              <Field label="Период">
                <Input
                  value={item.period}
                  onChange={(e) =>
                    patchReport((d) => {
                      const r = d.roadmap.find((x) => x.id === item.id)
                      if (r) r.period = e.target.value
                    })
                  }
                />
              </Field>
              <Field label="Статус">
                <select
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm"
                  value={item.status}
                  onChange={(e) =>
                    patchReport((d) => {
                      const r = d.roadmap.find((x) => x.id === item.id)
                      if (r) r.status = e.target.value as typeof item.status
                    })
                  }
                >
                  <option value="done">done</option>
                  <option value="current">current</option>
                  <option value="planned">planned</option>
                  <option value="future">future</option>
                </select>
              </Field>
              <Field label="Описание">
                <Textarea
                  value={item.description}
                  onChange={(e) =>
                    patchReport((d) => {
                      const r = d.roadmap.find((x) => x.id === item.id)
                      if (r) r.description = e.target.value
                    })
                  }
                />
              </Field>
            </div>
          ))}

        {section === 'charts' &&
          report.charts.map((chart) => (
            <div key={chart.id} className="mb-4 rounded-xl border border-white/10 p-3">
              <div className="mb-2 text-sm font-semibold">{chart.title}</div>
              <Field label="Факт по месяцам (через запятую)" hint="Например: 2.3, 4.5, 6.1">
                <Input
                  value={chart.fact.join(', ')}
                  onChange={(e) =>
                    patchReport((d) => {
                      const c = d.charts.find((x) => x.id === chart.id)
                      if (c) {
                        c.fact = e.target.value
                          .split(',')
                          .map((v) => Number(v.trim()))
                          .filter((v) => !Number.isNaN(v))
                      }
                    })
                  }
                />
              </Field>
              <Field label="План (12 значений)">
                <Input
                  value={chart.plan.join(', ')}
                  onChange={(e) =>
                    patchReport((d) => {
                      const c = d.charts.find((x) => x.id === chart.id)
                      if (c) {
                        const vals = e.target.value
                          .split(',')
                          .map((v) => Number(v.trim()))
                          .filter((v) => !Number.isNaN(v))
                        if (vals.length === 12) c.plan = vals
                      }
                    })
                  }
                />
              </Field>
            </div>
          ))}

        {section === 'team' && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="FTE всего">
                <Input
                  type="number"
                  value={report.team.fteTotal}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.team.fteTotal = Number(e.target.value)
                    })
                  }
                />
              </Field>
              <Field label="Штатных">
                <Input
                  type="number"
                  value={report.team.fteStaff}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.team.fteStaff = Number(e.target.value)
                    })
                  }
                />
              </Field>
              <Field label="Внештатных">
                <Input
                  type="number"
                  value={report.team.fteContract}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.team.fteContract = Number(e.target.value)
                    })
                  }
                />
              </Field>
              <Field label="Стоимость сейчас, тыс ₽">
                <Input
                  type="number"
                  value={report.team.dynamics.after.costThousands}
                  onChange={(e) =>
                    patchReport((d) => {
                      d.team.dynamics.after.costThousands = Number(e.target.value)
                    })
                  }
                />
              </Field>
            </div>
            <div className="mt-2 text-xs text-[#8b8bb8]">
              Δ FTE: {formatDeltaLabel(vm.team.deltaFte)} · Δ cost: {vm.team.deltaCostLabel}
            </div>
          </>
        )}

        {section === 'products' && (
          <>
            <Field label="Продукты (по одному на строку)">
              <Textarea
                value={report.products.items.join('\n')}
                onChange={(e) =>
                  patchReport((d) => {
                    d.products.items = e.target.value.split('\n').filter(Boolean)
                  })
                }
              />
            </Field>
            <Field label="Highlight">
              <Input
                value={report.products.highlight.label}
                onChange={(e) =>
                  patchReport((d) => {
                    d.products.highlight.label = e.target.value
                  })
                }
              />
            </Field>
          </>
        )}
      </div>
    </div>
  )
}
