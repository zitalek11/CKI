export function DataState({ title, description }: { title: string; description?: string }) {
  return (
    <div style={{ padding: 16, border: '1px solid rgba(148,163,184,0.15)', borderRadius: 16, background: 'rgba(15,23,42,0.65)' }}>
      <div style={{ fontWeight: 700 }}>{title}</div>
      {description ? <div style={{ marginTop: 6, color: '#94a3b8', fontSize: 12 }}>{description}</div> : null}
    </div>
  )
}
