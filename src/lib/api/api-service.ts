import type { AxiosInstance, AxiosResponse } from 'axios'
import { getApiBaseUrl } from './api-base-url'
import {
  axiosInstance,
  withRequestOptions,
  type RequestOptions,
} from './axios'
import { WATSONX_ENDPOINTS } from './watsonx-endpoints'
import type { ApiEnvelope, WatsonxHealthResponse } from './types/watsonx'
import { LOADING_KEYS } from '@/lib/store/api-loading-store'

/**
 * Base API service — generic HTTP methods over the configured Axios instance.
 * All requests target NEXT_PUBLIC_API_BASE_URL (IBM watsonx Orchestrate BFF).
 */
export class ApiService {
  constructor(private readonly client: AxiosInstance = axiosInstance) {}

  get baseURL(): string {
    return getApiBaseUrl()
  }

  async get<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.client.get<T>(
      url,
      withRequestOptions({}, options)
    )
    return this.unwrap<T>(response)
  }

  async post<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.client.post<T>(
      url,
      data,
      withRequestOptions({}, options)
    )
    return this.unwrap<T>(response)
  }

  async put<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.client.put<T>(
      url,
      data,
      withRequestOptions({}, options)
    )
    return this.unwrap<T>(response)
  }

  async patch<T>(url: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const response = await this.client.patch<T>(
      url,
      data,
      withRequestOptions({}, options)
    )
    return this.unwrap<T>(response)
  }

  async delete<T>(url: string, options?: RequestOptions): Promise<T> {
    const response = await this.client.delete<T>(
      url,
      withRequestOptions({}, options)
    )
    return this.unwrap<T>(response)
  }

  /** Upload multipart form data (e.g. resume PDF) */
  async upload<T>(
    url: string,
    formData: FormData,
    options?: Omit<RequestOptions, 'onUploadProgress'> & {
      onUploadProgress?: (progress: number) => void
    }
  ): Promise<T> {
    const { onUploadProgress, ...requestOptions } = options ?? {}

    const response = await this.client.post<T>(
      url,
      formData,
      withRequestOptions(
        {
          // Let axios set multipart boundary automatically
          onUploadProgress: onUploadProgress
            ? (event) => {
                if (event.total) {
                  onUploadProgress(Math.round((event.loaded / event.total) * 100))
                }
              }
            : undefined,
        },
        requestOptions
      )
    )
    return this.unwrap<T>(response)
  }

  /** Health check for BFF / watsonx Orchestrate connectivity */
  async healthCheck(): Promise<WatsonxHealthResponse> {
    return this.get<WatsonxHealthResponse>(WATSONX_ENDPOINTS.HEALTH, {
      loadingKey: LOADING_KEYS.HEALTH,
      silentError: true,
      timeout: 10_000,
    })
  }

  private unwrap<T>(response: AxiosResponse<T | ApiEnvelope<T>>): T {
    const data = response.data

    if (
      data &&
      typeof data === 'object' &&
      'success' in data &&
      'data' in data
    ) {
      const envelope = data as ApiEnvelope<T>
      if (!envelope.success) {
        throw new Error(envelope.message || 'API request failed')
      }
      return envelope.data
    }

    return data as T
  }
}

export const apiService = new ApiService()
