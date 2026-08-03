import axios from 'axios'

export const NSD_API_BASE_URL = 'https://api.nsddata.ru'

export const nsdClient = axios.create({
  baseURL: NSD_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

export const isMockMode = true
