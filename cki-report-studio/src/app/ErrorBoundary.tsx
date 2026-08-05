import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CKI Report Studio crash', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            height: '100%',
            padding: 24,
            color: '#f0f0ff',
            fontFamily: 'system-ui, sans-serif',
            background: '#12081f',
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Ошибка запуска</h1>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: 'rgba(255,255,255,0.06)',
              padding: 12,
              borderRadius: 12,
              fontSize: 12,
              color: '#fca5a5',
            }}
          >
            {this.state.error.message}
            {'\n\n'}
            {this.state.error.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}
