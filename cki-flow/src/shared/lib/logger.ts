export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type LogEvent = {
  level: LogLevel
  message: string
  scope?: string
  payload?: unknown
  at: string
}

const listeners = new Set<(event: LogEvent) => void>()

function emit(event: LogEvent): void {
  for (const listener of listeners) {
    listener(event)
  }

  const prefix = event.scope ? `[CKI Flow:${event.scope}]` : '[CKI Flow]'
  const line = `${prefix} ${event.message}`

  switch (event.level) {
    case 'debug':
      console.debug(line, event.payload ?? '')
      break
    case 'info':
      console.info(line, event.payload ?? '')
      break
    case 'warn':
      console.warn(line, event.payload ?? '')
      break
    case 'error':
      console.error(line, event.payload ?? '')
      break
  }
}

export const logger = {
  subscribe(listener: (event: LogEvent) => void): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
  debug(message: string, payload?: unknown, scope?: string): void {
    emit({ level: 'debug', message, payload, scope, at: new Date().toISOString() })
  },
  info(message: string, payload?: unknown, scope?: string): void {
    emit({ level: 'info', message, payload, scope, at: new Date().toISOString() })
  },
  warn(message: string, payload?: unknown, scope?: string): void {
    emit({ level: 'warn', message, payload, scope, at: new Date().toISOString() })
  },
  error(message: string, payload?: unknown, scope?: string): void {
    emit({ level: 'error', message, payload, scope, at: new Date().toISOString() })
  },
}
