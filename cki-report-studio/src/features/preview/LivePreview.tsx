import { useEffect, useMemo, useRef, useState } from 'react'
import templateSource from '../../../resources/templates/template.html?raw'
import { renderHtml } from '@/core/render/render-html'
import { useReportStore, useViewModel } from '@/stores/report-store'
import { Button, Input } from '@/shared/ui/primitives'

const EDIT_BRIDGE = `
<script>
(function () {
  function bind() {
    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('[data-field]') : null;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      var path = el.getAttribute('data-field');
      var value = el.getAttribute('data-raw') || el.textContent || '';
      window.parent.postMessage({
        type: 'cki-edit',
        path: path,
        value: String(value).trim(),
        x: e.clientX,
        y: e.clientY
      }, '*');
    });
    document.querySelectorAll('[data-field]').forEach(function (el) {
      el.style.cursor = 'pointer';
      el.title = 'Кликните, чтобы изменить';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
})();
</script>
`

function injectBridge(html: string): string {
  if (html.includes('</body>')) {
    return html.replace('</body>', `${EDIT_BRIDGE}</body>`)
  }
  return `${html}${EDIT_BRIDGE}`
}

export function LivePreview() {
  const vm = useViewModel()
  const setFieldByPath = useReportStore((s) => s.setFieldByPath)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [edit, setEdit] = useState<{ path: string; value: string; x: number; y: number } | null>(null)

  const reportId = useReportStore((s) => s.activeId)
  const reportUpdatedAt = useReportStore((s) => s.library[s.activeId]?.meta.updatedAt ?? '')
  const previousId = useReportStore((s) => s.previous?.meta.id ?? '')

  const html = useMemo(() => {
    try {
      return injectBridge(renderHtml(templateSource, vm))
    } catch (error) {
      console.error('preview render failed', error)
      return `<!doctype html><html><body style="font-family:sans-serif;background:#050510;color:#fca5a5;padding:24px">
        <h1>Ошибка рендера preview</h1>
        <pre>${String(error)}</pre>
      </body></html>`
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on report identity/content markers
  }, [reportId, reportUpdatedAt, previousId, vm.metrics, vm.funnel, vm.formattedDate, vm.chartsJson])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const iframe = iframeRef.current
      if (!iframe || event.source !== iframe.contentWindow) return
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

  return (
    <div className="relative h-full min-h-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
      <iframe
        ref={iframeRef}
        title="CKI Report Preview"
        className="h-full w-full border-0 bg-[#050510]"
        srcDoc={html}
        sandbox="allow-scripts allow-same-origin"
      />
      {edit ? (
        <div
          className="absolute z-20 w-72 rounded-2xl border border-violet-500/40 bg-[#12121f] p-3 shadow-2xl"
          style={{ left: Math.min(edit.x, 420), top: Math.min(edit.y, 420) }}
        >
          <div className="mb-2 text-xs text-[#8b8bb8]">{edit.path}</div>
          {edit.path.includes('Date') || edit.path.includes('date') ? (
            <div className="mb-2 text-[11px] text-[#6060a0]">
              Формат: 2026-08-06 или 06.08.2026 или 6 августа 2026
            </div>
          ) : null}
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
