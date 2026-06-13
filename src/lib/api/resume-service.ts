import { apiService, ApiService } from '@/lib/api/api-service'
import { getApiBaseUrl } from '@/lib/api/api-base-url'
import { isWatsonxMockMode } from '@/lib/api/config/watsonx-config'
import { ApiServiceError } from '@/lib/api/errors'
import { mockResumeAdapter } from '@/lib/api/mock/mock-resume-adapter'
import { WATSONX_ENDPOINTS } from '@/lib/api/watsonx-endpoints'
import { LOADING_KEYS, useApiLoadingStore } from '@/lib/store/api-loading-store'
import type {
  ResumeAnalysisResult,
  ResumeDocument,
  ResumeListParams,
  ResumeUploadOptions,
} from '@/lib/api/types/resume-api'
export class ResumeService {
  constructor(private readonly api: ApiService = apiService) {}

  async upload(options: ResumeUploadOptions): Promise<ResumeDocument> {
    if (isWatsonxMockMode()) {
      return mockResumeAdapter.upload(options)
    }

    const formData = new FormData()
    formData.append('file', options.file)
    if (options.thread_id) formData.append('thread_id', options.thread_id)
    if (options.session_id) formData.append('session_id', options.session_id)

    const key = LOADING_KEYS.RESUME_UPLOAD
    useApiLoadingStore.getState().startLoading(key)

    try {
      const response = await fetch(
        `${getApiBaseUrl()}${WATSONX_ENDPOINTS.RESUME.UPLOAD}`,
        {
          method: 'POST',
          credentials: 'include',
          body: formData,
        }
      )

      const body = (await response.json().catch(() => ({}))) as ResumeDocument & {
        message?: string
        success?: boolean
      }

      if (!response.ok) {
        throw new ApiServiceError(
          body.message || `Resume upload failed (${response.status})`,
          response.status
        )
      }

      options.onProgress?.(100)
      return body
    } finally {
      useApiLoadingStore.getState().stopLoading(key)
    }
  }

  async list(params?: ResumeListParams): Promise<ResumeDocument[]> {
    if (isWatsonxMockMode()) {
      return mockResumeAdapter.list(params)
    }

    const search = new URLSearchParams()
    if (params?.limit) search.set('limit', String(params.limit))
    if (params?.offset) search.set('offset', String(params.offset))
    if (params?.thread_id) search.set('thread_id', params.thread_id)
    const qs = search.toString()

    return this.api.get<ResumeDocument[]>(
      `${WATSONX_ENDPOINTS.RESUME.LIST}${qs ? `?${qs}` : ''}`,
      { loadingKey: LOADING_KEYS.RESUME_LIST }
    )
  }

  async get(resumeId: string): Promise<ResumeDocument> {
    if (isWatsonxMockMode()) {
      return mockResumeAdapter.get(resumeId)
    }

    return this.api.get<ResumeDocument>(WATSONX_ENDPOINTS.RESUME.GET(resumeId))
  }

  async getStatus(
    resumeId: string
  ): Promise<Pick<ResumeDocument, 'id' | 'status' | 'error'>> {
    if (isWatsonxMockMode()) {
      return mockResumeAdapter.getStatus(resumeId)
    }

    return this.api.get(WATSONX_ENDPOINTS.RESUME.STATUS(resumeId), {
      loadingKey: LOADING_KEYS.RESUME_STATUS,
    })
  }

  async analyze(resumeId: string): Promise<ResumeAnalysisResult> {
    if (isWatsonxMockMode()) {
      return mockResumeAdapter.analyze(resumeId)
    }

    return this.api.post<ResumeAnalysisResult>(
      WATSONX_ENDPOINTS.RESUME.ANALYZE(resumeId),
      {},
      { loadingKey: LOADING_KEYS.RESUME_ANALYZE, timeout: 90_000 }
    )
  }

  async delete(resumeId: string): Promise<void> {
    if (isWatsonxMockMode()) {
      return mockResumeAdapter.delete(resumeId)
    }

    await this.api.delete<void>(WATSONX_ENDPOINTS.RESUME.DELETE(resumeId))
  }
}

export const resumeService = new ResumeService()
