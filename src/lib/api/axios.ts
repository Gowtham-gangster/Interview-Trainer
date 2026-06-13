import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'
import { getApiBaseUrl } from './api-base-url'
import { parseAxiosError } from './errors'
import { useApiLoadingStore } from '@/lib/store/api-loading-store'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    loadingKey?: string
    silentError?: boolean
  }
}

const DEFAULT_TIMEOUT = 30_000

export interface AxiosConfigOptions {
  baseURL?: string
  timeout?: number
  getAuthToken?: () => string | null
  onUnauthorized?: () => void
}

function createAxiosInstance(options: AxiosConfigOptions = {}): AxiosInstance {
  const instance = axios.create({
    baseURL: options.baseURL ?? getApiBaseUrl(),
    timeout: options.timeout ?? DEFAULT_TIMEOUT,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  })

  // Request interceptor — auth + loading tracking
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = options.getAuthToken?.()
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }

      if (config.loadingKey) {
        useApiLoadingStore.getState().startLoading(config.loadingKey)
      }

      return config
    },
    (error) => Promise.reject(error)
  )

  // Response interceptor — error normalization + loading cleanup
  instance.interceptors.response.use(
    (response) => {
      if (response.config.loadingKey) {
        useApiLoadingStore.getState().stopLoading(response.config.loadingKey)
      }
      return response
    },
    (error) => {
      const config = error.config as InternalAxiosRequestConfig | undefined
      if (config?.loadingKey) {
        useApiLoadingStore.getState().stopLoading(config.loadingKey)
      }

      const apiError = parseAxiosError(error)

      if (apiError.status === 401) {
        options.onUnauthorized?.()
      }

      return Promise.reject(apiError)
    }
  )

  return instance
}

/** Singleton Axios instance for watsonx Orchestrate BFF */
export const axiosInstance = createAxiosInstance({
  getAuthToken: () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('auth_token')
  },
  onUnauthorized: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token')
    }
  },
})

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return
  if (token) {
    localStorage.setItem('auth_token', token)
  } else {
    localStorage.removeItem('auth_token')
  }
}

export type RequestOptions = AxiosRequestConfig & {
  loadingKey?: string
  silentError?: boolean
}

export function withRequestOptions(
  config: AxiosRequestConfig = {},
  options?: RequestOptions
): InternalAxiosRequestConfig {
  const { loadingKey, silentError, ...axiosOptions } = options ?? {}

  return {
    ...config,
    ...axiosOptions,
    loadingKey,
    silentError,
  } as InternalAxiosRequestConfig
}

export { createAxiosInstance, getApiBaseUrl, DEFAULT_TIMEOUT }
