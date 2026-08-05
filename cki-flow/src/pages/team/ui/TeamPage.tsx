import { useCallback, useEffect, useState } from 'react'
import { appServices } from '@/application/composition'
import type { Absence, AbsenceKind, Employee, Team } from '@/domain/model/entities'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'
import { labelAbsenceKind } from '@/shared/lib/labels'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'

const ABSENCE_KINDS: AbsenceKind[] = ['vacation', 'sick', 'holiday', 'other']

const inputClass =
  'h-8 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 outline-none focus:border-[var(--color-accent)]'
const labelClass = 'text-[11px] font-medium text-[var(--color-text-tertiary)]'

type EmployeeFormState = {
  id: string | null
  displayName: string
  email: string
  jobTitle: string
  defaultTeamId: string
  color: string
  hoursPerDay: string
  workDaysPerWeek: string
  maxLoadPercent: string
  productAllocationPercent: string
  notes: string
}

const EMPTY_FORM: EmployeeFormState = {
  id: null,
  displayName: '',
  email: '',
  jobTitle: '',
  defaultTeamId: '',
  color: '#2563eb',
  hoursPerDay: '8',
  workDaysPerWeek: '5',
  maxLoadPercent: '100',
  productAllocationPercent: '100',
  notes: '',
}

export function TeamPage() {
  const summary = useWorkspaceStore((s) => s.summary)
  const refreshWorkspace = useWorkspaceStore((s) => s.refresh)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [form, setForm] = useState<EmployeeFormState>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const [absenceKind, setAbsenceKind] = useState<AbsenceKind>('vacation')
  const [absenceStart, setAbsenceStart] = useState('')
  const [absenceEnd, setAbsenceEnd] = useState('')
  const [absenceNote, setAbsenceNote] = useState('')

  const reload = useCallback(async () => {
    if (!summary) return
    const productId = summary.product.id
    const [employeeList, absenceList] = await Promise.all([
      appServices.team.listEmployees(productId),
      appServices.team.listAbsences(productId),
    ])
    setEmployees(employeeList)
    setAbsences(absenceList)
    const db = await appServices.uow.read()
    setTeams(db.teams.filter((item) => item.productId === productId))
  }, [summary])

  useEffect(() => {
    void reload()
  }, [reload])

  const resetForm = () => {
    setSelectedEmployeeId(null)
    setForm(EMPTY_FORM)
  }

  const selectEmployee = (employee: Employee) => {
    setSelectedEmployeeId(employee.id)
    setForm({
      id: employee.id,
      displayName: employee.displayName,
      email: employee.email ?? '',
      jobTitle: employee.jobTitle ?? '',
      defaultTeamId: employee.defaultTeamId ?? '',
      color: employee.color ?? '#2563eb',
      hoursPerDay: String(employee.hoursPerDay),
      workDaysPerWeek: String(employee.workDaysPerWeek),
      maxLoadPercent: String(employee.maxLoadPercent),
      productAllocationPercent: String(employee.productAllocationPercent),
      notes: employee.notes ?? '',
    })
  }

  const onSubmit = async () => {
    if (!summary) return
    setError(null)
    setMessage(null)
    setBusy(true)
    try {
      const payload = {
        displayName: form.displayName,
        email: form.email || undefined,
        jobTitle: form.jobTitle || undefined,
        defaultTeamId: form.defaultTeamId || undefined,
        color: form.color || undefined,
        hoursPerDay: Number(form.hoursPerDay) || 8,
        workDaysPerWeek: Number(form.workDaysPerWeek) || 5,
        maxLoadPercent: Number(form.maxLoadPercent) || 100,
        productAllocationPercent: Number(form.productAllocationPercent) || 100,
        notes: form.notes || undefined,
      }
      if (form.id) {
        await appServices.team.updateEmployee({ employeeId: form.id, ...payload })
        setMessage('Сотрудник обновлён')
      } else {
        await appServices.team.createEmployee({ productId: summary.product.id, ...payload })
        setMessage('Сотрудник добавлен')
      }
      resetForm()
      await reload()
      await refreshWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сохранить сотрудника')
    } finally {
      setBusy(false)
    }
  }

  const onDeactivate = async (employeeId: string) => {
    setBusy(true)
    setError(null)
    try {
      await appServices.team.deactivateEmployee({ employeeId })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось деактивировать сотрудника')
    } finally {
      setBusy(false)
    }
  }

  const onActivate = async (employeeId: string) => {
    setBusy(true)
    setError(null)
    try {
      await appServices.team.updateEmployee({ employeeId, status: 'active' })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось активировать сотрудника')
    } finally {
      setBusy(false)
    }
  }

  const onDelete = async (employeeId: string) => {
    setBusy(true)
    setError(null)
    try {
      await appServices.team.deleteEmployee({ employeeId })
      if (selectedEmployeeId === employeeId) resetForm()
      await reload()
      await refreshWorkspace()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить сотрудника')
    } finally {
      setBusy(false)
    }
  }

  const onAddAbsence = async () => {
    if (!summary || !selectedEmployeeId || !absenceStart || !absenceEnd) return
    setBusy(true)
    setError(null)
    try {
      await appServices.team.addAbsence({
        productId: summary.product.id,
        employeeId: selectedEmployeeId,
        kind: absenceKind,
        startDate: absenceStart,
        endDate: absenceEnd,
        note: absenceNote || undefined,
      })
      setAbsenceStart('')
      setAbsenceEnd('')
      setAbsenceNote('')
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось добавить отсутствие')
    } finally {
      setBusy(false)
    }
  }

  const onRemoveAbsence = async (absenceId: string) => {
    setBusy(true)
    setError(null)
    try {
      await appServices.team.removeAbsence({ absenceId })
      await reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось удалить отсутствие')
    } finally {
      setBusy(false)
    }
  }

  const selectedEmployee = employees.find((item) => item.id === selectedEmployeeId)
  const selectedEmployeeAbsences = absences.filter((item) => item.employeeId === selectedEmployeeId)

  return (
    <section className="flex h-full flex-col gap-4 p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold tracking-tight">Команда</h1>
          <p className="text-[var(--color-text-secondary)]">
            Сотрудники, роли и отсутствия. Используется в расчёте загрузки и планировании.
          </p>
        </div>
        <Badge tone="accent">{employees.length} сотрудников</Badge>
      </header>

      {error && <div className="text-[12px] text-[var(--color-danger)]">{error}</div>}
      {message && <div className="text-[12px] text-[var(--color-success)]">{message}</div>}

      <div className="grid gap-4 xl:grid-cols-[320px_1fr]">
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void onSubmit()
          }}
          className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4"
        >
          <h2 className="text-[13px] font-semibold">
            {form.id ? 'Редактировать сотрудника' : 'Новый сотрудник'}
          </h2>
          <input
            value={form.displayName}
            onChange={(event) => setForm({ ...form, displayName: event.target.value })}
            placeholder="Имя"
            className={inputClass}
            required
          />
          <input
            value={form.jobTitle}
            onChange={(event) => setForm({ ...form, jobTitle: event.target.value })}
            placeholder="Должность"
            className={inputClass}
          />
          <input
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="Email"
            className={inputClass}
          />
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Команда</span>
            <select
              value={form.defaultTeamId}
              onChange={(event) => setForm({ ...form, defaultTeamId: event.target.value })}
              className={inputClass}
            >
              <option value="">Без команды</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Часов в день</span>
              <input
                type="number"
                min={1}
                max={24}
                value={form.hoursPerDay}
                onChange={(event) => setForm({ ...form, hoursPerDay: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Дней в неделю</span>
              <input
                type="number"
                min={1}
                max={7}
                value={form.workDaysPerWeek}
                onChange={(event) => setForm({ ...form, workDaysPerWeek: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Загрузка продукта, %</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.productAllocationPercent}
                onChange={(event) => setForm({ ...form, productAllocationPercent: event.target.value })}
                className={inputClass}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelClass}>Макс. загрузка, %</span>
              <input
                type="number"
                min={0}
                max={200}
                value={form.maxLoadPercent}
                onChange={(event) => setForm({ ...form, maxLoadPercent: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>Цвет</span>
            <input
              type="color"
              value={form.color}
              onChange={(event) => setForm({ ...form, color: event.target.value })}
              className="h-8 w-16 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)]"
            />
          </label>
          <textarea
            value={form.notes}
            onChange={(event) => setForm({ ...form, notes: event.target.value })}
            placeholder="Заметки"
            className="min-h-[52px] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--color-accent)]"
          />
          <div className="flex gap-2">
            <Button type="submit" variant="primary" disabled={busy || form.displayName.trim().length === 0}>
              {form.id ? 'Сохранить' : 'Добавить'}
            </Button>
            {form.id && (
              <Button type="button" variant="ghost" onClick={resetForm} disabled={busy}>
                Отмена
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)]">
            <table className="w-full border-collapse text-left">
              <thead className="bg-[var(--color-bg-subtle)] text-[11px] tracking-wide text-[var(--color-text-tertiary)] uppercase">
                <tr>
                  <th className="px-3 py-2 font-semibold">Имя</th>
                  <th className="px-3 py-2 font-semibold">Должность</th>
                  <th className="px-3 py-2 font-semibold">Часы/день</th>
                  <th className="px-3 py-2 font-semibold">Загрузка</th>
                  <th className="px-3 py-2 font-semibold">Статус</th>
                  <th className="px-3 py-2 font-semibold" />
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-8 text-center text-[var(--color-text-tertiary)]">
                      Сотрудников пока нет
                    </td>
                  </tr>
                ) : (
                  employees.map((employee) => (
                    <tr
                      key={employee.id}
                      className="cursor-pointer border-t border-[var(--color-border-subtle)] hover:bg-[var(--color-bg-app)]"
                      onClick={() => selectEmployee(employee)}
                    >
                      <td className="px-3 py-2 font-medium">
                        <span
                          className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-middle"
                          style={{ background: employee.color ?? '#94a3b8' }}
                        />
                        {employee.displayName}
                      </td>
                      <td className="px-3 py-2 text-[var(--color-text-secondary)]">
                        {employee.jobTitle ?? '—'}
                      </td>
                      <td className="px-3 py-2">{employee.hoursPerDay} ч</td>
                      <td className="px-3 py-2">{employee.maxLoadPercent}%</td>
                      <td className="px-3 py-2">
                        <Badge tone={employee.status === 'active' ? 'success' : 'neutral'}>
                          {employee.status === 'active' ? 'Активен' : 'Неактивен'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-right" onClick={(event) => event.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {employee.status === 'active' ? (
                            <Button size="sm" variant="ghost" onClick={() => void onDeactivate(employee.id)}>
                              Деактивировать
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => void onActivate(employee.id)}>
                              Активировать
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => void onDelete(employee.id)}>
                            Удалить
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-4">
            <h2 className="text-[13px] font-semibold">
              Отсутствия{selectedEmployee ? ` · ${selectedEmployee.displayName}` : ''}
            </h2>
            {!selectedEmployee ? (
              <p className="mt-2 text-[12px] text-[var(--color-text-tertiary)]">
                Выберите сотрудника в таблице выше, чтобы посмотреть и добавить отсутствия.
              </p>
            ) : (
              <>
                <ul className="mt-2 space-y-1.5">
                  {selectedEmployeeAbsences.map((absence) => (
                    <li
                      key={absence.id}
                      className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-2.5 py-1.5 text-[13px]"
                    >
                      <span>
                        <Badge tone="warning">{labelAbsenceKind(absence.kind)}</Badge>{' '}
                        {absence.startDate} → {absence.endDate}
                        {absence.note ? ` · ${absence.note}` : ''}
                      </span>
                      <Button size="sm" variant="ghost" onClick={() => void onRemoveAbsence(absence.id)}>
                        Удалить
                      </Button>
                    </li>
                  ))}
                  {selectedEmployeeAbsences.length === 0 && (
                    <li className="text-[12px] text-[var(--color-text-tertiary)]">Отсутствий не запланировано</li>
                  )}
                </ul>
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <select
                    value={absenceKind}
                    onChange={(event) => setAbsenceKind(event.target.value as AbsenceKind)}
                    className={inputClass}
                  >
                    {ABSENCE_KINDS.map((kind) => (
                      <option key={kind} value={kind}>
                        {labelAbsenceKind(kind)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={absenceStart}
                    onChange={(event) => setAbsenceStart(event.target.value)}
                    className={inputClass}
                  />
                  <input
                    type="date"
                    value={absenceEnd}
                    onChange={(event) => setAbsenceEnd(event.target.value)}
                    className={inputClass}
                  />
                  <Button
                    variant="secondary"
                    disabled={busy || !absenceStart || !absenceEnd}
                    onClick={() => void onAddAbsence()}
                  >
                    Добавить
                  </Button>
                </div>
                <input
                  value={absenceNote}
                  onChange={(event) => setAbsenceNote(event.target.value)}
                  placeholder="Комментарий (необязательно)"
                  className={`${inputClass} mt-2 w-full`}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
