import axios, { AxiosRequestConfig } from 'axios'
import { tokenStore } from '../utils/tokenStore'

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

http.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token && config.headers) {
    (config.headers as any).Authorization = `Bearer ${token}`
  }
  return config
})
