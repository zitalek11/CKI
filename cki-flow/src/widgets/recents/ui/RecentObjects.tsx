import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { History } from 'lucide-react'
import { appServices } from '@/application/composition'
import type { RecentObject } from '@/domain/model/entities'
import { useWorkspaceStore } from '@/features/workspace/model/workspace-store'

export function RecentObjects() {
  const summary = useWorkspaceStore((s) => s.summary)
  const [items, setItems] = useState<RecentObject[]>([])

  useEffect(() => {
    if (!summary) return
    void appServices.navigation.listRecents(summary.product.id).then(setItems)
  }, [summary, summary?.counts.stories])

  if (items.length === 0) return null

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-app)] px-4 py-1.5">
      <History className="h-3.5 w-3.5 shrink-0 text-[var(--color-text-tertiary)]" />
      <span className="shrink-0 text-[11px] text-[var(--color-text-tertiary)]">Недавние:</span>
      {items.slice(0, 6).map((item) => (
        <Link
          key={item.id}
          to={item.path}
          className="shrink-0 rounded-[6px] bg-[var(--color-bg-subtle)] px-2 py-0.5 text-[11px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          title={item.label}
        >
          {item.label}
        </Link>
      ))}
    </div>
  )
}
