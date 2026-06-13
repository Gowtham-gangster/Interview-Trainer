import type { AxiosError } from 'axios'

export enum ApiErrorCode {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  SERVER_ERROR = 'SERVER_ERROR',
  ORCHESTRATE_ERROR = 'ORCHESTRATE_ERROR',
  UNKNOWN = 'UNKNOWN',
}

export interface ApiErrorDetail {
  field?: string
  message: string
}

export interface ApiErrorBody {
  message?: string
  error?: string
  code?: string
  details?: ApiErrorDetail[] | Record<string, unknown>
}

export class ApiServiceError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details?: ApiErrorDetail[] | Record<string, unknown>
  readonly isRetryable: boolean
  readonly originalError?: unknown

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode = ApiErrorCode.UNKNOWN,
    options?: {
      details?: ApiErrorDetail[] | Record<string, unknown>
      isRetryable?: boolean
      originalError?: unknown
    }
  ) {
    super(message)
    this.name = 'ApiServiceError'
    this.status = status
    this.code = code
    this.details = options?.details
    this.isRetryable = options?.isRetryable ?? status >= 500
    this.originalError = options?.originalError
  }
}

function statusToCode(status: number): ApiErrorCode {
  if (status === 401) return ApiErrorCode.UNAUTHORIZED
  if (status === 403) return ApiErrorCode.FORBIDDEN
  if (status === 404) return ApiErrorCode.NOT_FOUND
  if (status === 422) return ApiErrorCode.VALIDATION_ERROR
  if (status === 429) return ApiErrorCode.RATE_LIMITED
  if (status >= 500) return ApiErrorCode.SERVER_ERROR
  return ApiErrorCode.UNKNOWN
}

export function parseAxiosError(error: AxiosError<ApiErrorBody>): ApiServiceError {
  if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
    return new ApiServiceError('Request timed out. Please try again.', 408, ApiErrorCode.TIMEOUT, {
      isRetryable: true,
      originalError: error,
    })
  }

  if (!error.response) {
    return new ApiServiceError(
      'Network error. Check your connection and try again.',
      0,
      ApiErrorCode.NETWORK_ERROR,
      { isRetryable: true, originalError: error }
    )
  }

  const { status, data } = error.response
  const message =
    data?.message ||
    data?.error ||
    error.message ||
    `Request failed with status ${status}`

  const code =
    (data?.code as ApiErrorCode) ||
    (status >= 500 ? ApiErrorCode.ORCHESTRATE_ERROR : statusToCode(status))

  return new ApiServiceError(message, status, code, {
    details: data?.details,
    isRetryable: status >= 500 || status === 429,
    originalError: error,
  })
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiServiceError) return error.message
  if (error instanceof Error) return error.message
  return 'An unexpected error occurred'
}

export function isApiServiceError(error: unknown): error is ApiServiceError {
  return error instanceof ApiServiceError
}

export function isUnauthorizedError(error: unknown): boolean {
  return isApiServiceError(error) && error.code === ApiErrorCode.UNAUTHORIZED
}

export function isNetworkError(error: unknown): boolean {
  return (
    isApiServiceError(error) &&
    (error.code === ApiErrorCode.NETWORK_ERROR || error.code === ApiErrorCode.TIMEOUT)
  )
}
