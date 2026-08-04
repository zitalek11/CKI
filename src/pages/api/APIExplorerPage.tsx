import { useMemo, useState } from 'react'
import { Copy, ExternalLink, Play, Search } from 'lucide-react'
import {
  API_ENDPOINT_CATEGORIES,
  CCI_DOCS_LEGACY,
  CCI_DOCS_URL,
  CCI_ISS_BASE_URL,
  CCI_NEW_API_BASE_URL,
  MOEX_PASSPORT_AUTH_URL,
  buildSampleRequest,
  ckiApiEndpoints,
  type ApiEndpointCategory,
  type ApiEndpointDefinition,
} from '../../services/api/endpoints'
import { getApiMode } from '../../services/api/config'
import { liveTryRequest } from '../../services/api/live/moexLive'
import { CCI_PROXY_BASE, ISS_PROXY_BASE } from '../../services/nsd/client'

type ApiVersion = 'legacy' | 'new'

export function APIExplorerPage() {
  const [selectedId, setSelectedId] = useState(ckiApiEndpoints[0].id)
  const [apiVersion, setApiVersion] = useState<ApiVersion>('new')
  const [category, setCategory] = useState<ApiEndpointCategory | 'all'>('all')
  const [search, setSearch] = useState('')
  const [tryResult, setTryResult] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const filtered = useMemo(() => ckiApiEndpoints.filter((endpoint) => {
    const matchesCategory = category === 'all' || endpoint.category === category
    const q = search.trim().toLowerCase()
    const matchesSearch = !q
      || endpoint.name.toLowerCase().includes(q)
      || endpoint.legacyPath.toLowerCase().includes(q)
      || endpoint.newApiPath.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  }), [category, search])

  const selected = useMemo(
    () => ckiApiEndpoints.find((endpoint) => endpoint.id === selectedId) ?? ckiApiEndpoints[0],
    [selectedId],
  )

  const requestUrl = useMemo(
    () => buildSampleRequest(selected, apiVersion),
    [selected, apiVersion],
  )

  const curlExample = useMemo(
    () => `curl -u "$MOEX_USER:$MOEX_PASSWORD" \\
  -H "Accept: application/json" \\
  "${requestUrl}"`,
    [requestUrl],
  )

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1500)
  }

  const handleTryRequest = async () => {
    const proxiedUrl = requestUrl
      .replace('https://iss.moex.com/iss/apps/nsd_corp_info/v1', CCI_PROXY_BASE)
      .replace('https://iss.moex.com/iss', ISS_PROXY_BASE)

    if (getApiMode() === 'mock') {
      setTryResult(`Mock mode: UI использует локальные данные.

Пример production URL:
${requestUrl}

Proxy URL для dev:
${proxiedUrl}

Установите VITE_API_MODE=auto или live для запросов к MOEX.`)
      return
    }

    try {
      setTryResult('Выполняется запрос через dev proxy...')
      const result = await liveTryRequest(proxiedUrl)
      setTryResult(result)
    } catch (error) {
      setTryResult(`Ошибка запроса: ${error instanceof Error ? error.message : 'unknown error'}`)
    }
  }

  return (
    <div className="page-grid">
      <section className="hero-card">
        <div className="eyebrow">API Explorer</div>
        <h1>ЦКИ API — production endpoints</h1>
        <p>
          Каталог реальных методов NSD Corporate Information Services на базе официальной документации MOEX ISS.
          Новый OpenAPI-интерфейс: <a href={CCI_DOCS_URL} target="_blank" rel="noreferrer">Swagger UI</a>.
        </p>
        <div className="api-meta-row">
          <span className="status-pill">Auth: MOEX Passport</span>
          <span className="muted">Legacy base: {CCI_ISS_BASE_URL}</span>
          <span className="muted">New base: {CCI_NEW_API_BASE_URL}</span>
        </div>
      </section>

      <section className="api-explorer-layout">
        <aside className="panel-card api-sidebar">
          <div className="api-toolbar">
            <div className="search-input-wrap">
              <Search size={16} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск endpoint..."
                className="copilot-input compact"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ApiEndpointCategory | 'all')}
              className="api-select"
            >
              <option value="all">Все категории</option>
              {Object.entries(API_ENDPOINT_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="endpoint-list">
            {filtered.map((endpoint) => {
              const active = endpoint.id === selected.id
              return (
                <button
                  key={endpoint.id}
                  type="button"
                  className={`endpoint-item${active ? ' active' : ''}`}
                  onClick={() => {
                    setSelectedId(endpoint.id)
                    setTryResult(null)
                  }}
                >
                  <div className="endpoint-item-top">
                    <span className="endpoint-badge">{API_ENDPOINT_CATEGORIES[endpoint.category]}</span>
                    <span className="method-badge">{endpoint.method}</span>
                  </div>
                  <div className="endpoint-name">{endpoint.name}</div>
                  <div className="muted endpoint-path">{endpoint.newApiPath}</div>
                </button>
              )
            })}
          </div>
        </aside>

        <div className="api-details">
          <section className="panel-card">
            <div className="panel-header">
              <div>
                <div className="eyebrow">{API_ENDPOINT_CATEGORIES[selected.category]}</div>
                <div className="panel-title">{selected.name}</div>
              </div>
              <div className="api-version-toggle">
                <button type="button" className={apiVersion === 'new' ? 'toggle active' : 'toggle'} onClick={() => setApiVersion('new')}>New API</button>
                <button type="button" className={apiVersion === 'legacy' ? 'toggle active' : 'toggle'} onClick={() => setApiVersion('legacy')}>Legacy ISS</button>
              </div>
            </div>
            <p className="api-description">{selected.description}</p>
            <div className="request-box">
              <code>{requestUrl}</code>
              <div className="request-actions">
                <button type="button" className="ghost-button small" onClick={() => handleCopy(requestUrl)}>
                  <Copy size={14} /> {copied ? 'Скопировано' : 'Copy URL'}
                </button>
                <button type="button" className="ghost-button small" onClick={() => handleCopy(curlExample)}>
                  <Copy size={14} /> Copy cURL
                </button>
                <button type="button" className="primary-button small" onClick={() => handleTryRequest()}>
                  <Play size={14} /> Try request
                </button>
                <a href={CCI_DOCS_URL} target="_blank" rel="noreferrer" className="ghost-button small inline-link">
                  <ExternalLink size={14} /> Swagger
                </a>
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="eyebrow">Параметры</div>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Имя</th>
                    <th>Где</th>
                    <th>Обяз.</th>
                    <th>Описание</th>
                    <th>Пример</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.params.length ? selected.params.map((param) => (
                    <tr key={`${param.name}-${param.in}`}>
                      <td><code>{param.name}</code></td>
                      <td className="muted">{param.in}</td>
                      <td className="muted">{param.required ? 'да' : 'нет'}</td>
                      <td>{param.description}</td>
                      <td className="muted">{param.example ?? '—'}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="muted">Параметры не требуются</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="api-details-grid">
            <div className="panel-card">
              <div className="eyebrow">Response objects</div>
              <div className="tag-list">
                {selected.responseObjects.map((item) => (
                  <span key={item} className="tag">{item}</span>
                ))}
              </div>
            </div>
            <div className="panel-card">
              <div className="eyebrow">Auth & docs</div>
              <div className="docs-links">
                <a href={MOEX_PASSPORT_AUTH_URL} target="_blank" rel="noreferrer">MOEX Passport</a>
                <a href={CCI_DOCS_URL} target="_blank" rel="noreferrer">OpenAPI Swagger</a>
                <a href={CCI_DOCS_LEGACY} target="_blank" rel="noreferrer">Legacy docs</a>
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="eyebrow">Пример ответа</div>
            <pre className="code-block">{selected.exampleResponse}</pre>
          </section>

          {tryResult ? (
            <section className="panel-card">
              <div className="eyebrow">Try request result</div>
              <pre className="code-block">{tryResult}</pre>
            </section>
          ) : null}
        </div>
      </section>
    </div>
  )
}
