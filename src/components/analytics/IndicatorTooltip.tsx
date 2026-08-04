import { useState } from 'react'
import { Info } from 'lucide-react'
import type { IndicatorDefinition } from '../../types/financialIndicators'

export function IndicatorTooltip({ definition }: { definition: IndicatorDefinition }) {
  const [open, setOpen] = useState(false)

  return (
    <span
      className="indicator-tooltip-wrap"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <button type="button" className="indicator-info-btn" aria-label={`Формула: ${definition.fullName}`}>
        <Info size={14} />
      </button>
      {open ? (
        <div className="indicator-tooltip" role="tooltip">
          <div className="indicator-tooltip-title">{definition.fullName}</div>
          <div className="indicator-tooltip-formula">{definition.formula}</div>
          <div className="indicator-tooltip-desc">{definition.description}</div>
          <div className="indicator-tooltip-inputs">
            Строки отчётности: {definition.inputs.join(', ')}
          </div>
        </div>
      ) : null}
    </span>
  )
}
