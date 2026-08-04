import https from 'node:https'
import type { IncomingMessage } from 'node:http'
import type { Plugin } from 'vite'

interface MoexAuthPluginOptions {
  user?: string
  password?: string
}

const ISS_TARGET = 'https://iss.moex.com/iss'
const CCI_TARGET = 'https://iss.moex.com/iss/apps/nsd_corp_info/v1'

const httpsAgent = new https.Agent({ rejectUnauthorized: false })

let cachedCookie: string | null = null

function httpsGet(url: string, headers: Record<string, string>): Promise<{ status: number; body: string; contentType?: string }> {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { agent: httpsAgent, headers }, (response: IncomingMessage) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
      response.on('end', () => {
        resolve({
          status: response.statusCode ?? 502,
          body: Buffer.concat(chunks).toString('utf8'),
          contentType: response.headers['content-type'],
        })
      })
    })

    request.on('error', reject)
  })
}

async function authenticate(user: string, password: string): Promise<string | null> {
  const token = Buffer.from(`${user}:${password}`).toString('base64')
  const result = await httpsGet('https://passport.moex.com/authenticate', {
    Authorization: `Basic ${token}`,
    Accept: 'application/json',
  })
  if (result.status >= 400) return null

  const match = result.body.match(/MicexPassportCert=[^;\s]+/)
  return match?.[0] ?? null
}

async function getCookie(user?: string, password?: string): Promise<string | undefined> {
  if (!user || !password) return undefined
  if (cachedCookie) return cachedCookie
  cachedCookie = await authenticate(user, password)
  return cachedCookie ?? undefined
}

export function moexAuthPlugin(options: MoexAuthPluginOptions = {}): Plugin {
  const user = options.user ?? process.env.MOEX_USER ?? process.env.VITE_MOEX_USER
  const password = options.password ?? process.env.MOEX_PASSWORD ?? process.env.VITE_MOEX_PASSWORD

  return {
    name: 'moex-proxy',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url ?? ''
        let targetBase: string | null = null
        let rewrittenPath = ''

        if (url.startsWith('/moex-iss')) {
          targetBase = ISS_TARGET
          rewrittenPath = url.replace(/^\/moex-iss/, '') || '/'
        } else if (url.startsWith('/moex-api')) {
          targetBase = CCI_TARGET
          rewrittenPath = url.replace(/^\/moex-api/, '') || '/'
        } else {
          next()
          return
        }

        try {
          const cookie = await getCookie(user, password)
          const targetUrl = `${targetBase}${rewrittenPath}`
          const result = await httpsGet(targetUrl, {
            Accept: 'application/json',
            ...(cookie ? { Cookie: cookie } : {}),
          })

          res.statusCode = result.status
          res.setHeader('Content-Type', result.contentType ?? 'application/json')
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.end(result.body)
        } catch (error) {
          res.statusCode = 502
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            error: 'MOEX proxy error',
            message: error instanceof Error ? error.message : 'unknown error',
          }))
        }
      })
    },
  }
}
