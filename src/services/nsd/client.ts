import axios from 'axios'
import { getApiMode, shouldUseMock } from '../api/config'

export const MOEX_ISS_BASE_URL = 'https://iss.moex.com/iss'
export const MOEX_CCI_NEW_API_BASE_URL = 'https://iss.moex.com/iss/apps/nsd_corp_info/v1'
export const MOEX_PASSPORT_AUTH_URL = 'https://passport.moex.com/authenticate'

const isBrowser = typeof window !== 'undefined'

/** Dev proxy paths avoid CORS when talking to MOEX from the browser. */
export const ISS_PROXY_BASE = isBrowser ? '/moex-iss' : MOEX_ISS_BASE_URL
export const CCI_PROXY_BASE = isBrowser ? '/moex-api' : MOEX_CCI_NEW_API_BASE_URL

export const issClient = axios.create({
  baseURL: ISS_PROXY_BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

export const cciApiClient = axios.create({
  baseURL: CCI_PROXY_BASE,
  timeout: 20000,
  headers: { Accept: 'application/json' },
})

/** @deprecated use issClient */
export const nsdClient = issClient

export function isMockMode(): boolean {
  return shouldUseMock()
}

export function getRuntimeApiMode() {
  return getApiMode()
}
