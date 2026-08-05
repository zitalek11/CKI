import { useEffect, useMemo, useRef, useState } from 'react'
import templateSource from '../../../resources/templates/template.html?raw'
import { renderHtml } from '@/core/render/render-html'
import { useReportStore, useViewModel } from '@/stores/report-store'
import { Button, Input } from '@/shared/ui/primitives'

export function LivePreview() {
  const vm = useViewModel()
  const setFieldByPath = useReportStore((s) => s.setFieldByPath)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [edit, setEdit] = useState<{ path: string; value: string; x: number; y: number } | null>(null)

  const html = useMemo(() => renderHtml(templateSource, vm), [vm])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return
      const data = event.data as { type?: string; path?: string; value?: string; x?: number; y?: number }
      if (data?.type === 'cki-edit' && data.path) {
        setEdit({
          path: data.path,
          value: String(data.value ?? ''),
          x: data.x ?? 24,
          y: data.y ?? 24,
        })
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return
    const doc = iframe.contentDocument
    if (!doc) return
    doc.open()
    doc.write(html)
    doc.close()

    const script = doc.createElement('script')
    script.textContent = `
      document.addEventListener('click', (e) => {
        const el = e.target.closest('[data-field]');
        if (!el) return;
        e.preventDefault();
        e.stopPropagation();
        const path = el.getAttribute('data-field');
        const value = el.getAttribute('data-raw') || el.textContent || '';
        window.parent.postMessage({
          type: 'cki-edit',
          path,
          value: value.trim(),
          x: e.clientX,
          y: e.clientY
        }, '*');
      });
      document.querySelectorAll('[data-field]').forEach((el) => {
        el.style.cursor = 'pointer';
        el.title = 'Кликните, чтобы изменить';
      });
    `
    doc.body.appendChild(script)
  }, [html])

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <iframe ref={iframeRef} title="CKI Report Preview" className="h-full w-full border-0 bg-[#050510]" />
      {edit ? (
        <div
          className="absolute z-20 w-72 rounded-2xl border border-violet-500/40 bg-[#12121f] p-3 shadow-2xl"
          style={{ left: Math.min(edit.x, 420), top: Math.min(edit.y, 420) }}
        >
          <div className="mb-2 text-xs text-[#8b8bb8]">{edit.path}</div>
          <Input
            autoFocus
            value={edit.value}
            onChange={(e) => setEdit({ ...edit, value: e.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setFieldByPath(edit.path, edit.value)
                setEdit(null)
              }
              if (e.key === 'Escape') setEdit(null)
            }}
          />
          <div className="mt-2 flex gap-2">
            <Button
              className="flex-1"
              onClick={() => {
                setFieldByPath(edit.path, edit.value)
                setEdit(null)
              }}
            >
              Сохранить
            </Button>
            <Button variant="ghost" onClick={() => setEdit(null)}>
              Отмена
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
