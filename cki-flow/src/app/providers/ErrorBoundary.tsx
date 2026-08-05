import { Component, type ErrorInfo, type ReactNode } from 'react'
import { logger } from '@/shared/lib/logger'
import { Button } from '@/shared/ui/button'

type Props = {
  children: ReactNode
}

type State = {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unhandled UI error', { error: error.message, info }, 'error-boundary')
  }

  private handleReload = (): void => {
    this.setState({ error: null })
    window.location.assign('/')
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex h-full items-center justify-center bg-[var(--color-bg-app)] p-6">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 shadow-sm">
            <h1 className="text-base font-semibold">Что-то пошло не так</h1>
            <p className="mt-2 text-[var(--color-text-secondary)]">
              Интерфейс перехватил ошибку и не дал приложению упасть. Можно вернуться на Today и
              продолжить работу.
            </p>
            <pre className="mt-3 overflow-auto rounded-[var(--radius-sm)] bg-[var(--color-bg-subtle)] p-3 text-[11px] text-[var(--color-danger)]">
              {this.state.error.message}
            </pre>
            <div className="mt-4">
              <Button variant="primary" onClick={this.handleReload}>
                Открыть Today
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
