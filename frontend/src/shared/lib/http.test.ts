/**
 * HTTP client tests covering axios configuration and interceptors.
 */
import axios from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('./tokenStore', () => {
  const tokenStoreMock = {
    getAccess: vi.fn(),
    setAccess: vi.fn(),
    getRefresh: vi.fn(),
    setRefresh: vi.fn(),
    clear: vi.fn(),
    setTokens: vi.fn(),
    hasSessionExpired: vi.fn(),
  }
  return { tokenStore: tokenStoreMock }
})

import { setUnauthorizedHandler, http } from './http'
import { tokenStore } from './tokenStore'

const getRequestInterceptor = () =>
  http.interceptors.request.handlers.find(Boolean)?.fulfilled as (config: any) => any

const getResponseInterceptor = () =>
  http.interceptors.response.handlers.find(Boolean)?.rejected as (error: any) => Promise<any>

describe('http client', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('configures axios defaults for base URL, headers, and timeout', () => {
    expect(http.defaults.baseURL).toBeDefined()
    expect(http.defaults.headers['Content-Type']).toBe('application/json')
    expect(http.defaults.headers['Accept']).toBe('application/json')
    expect(http.defaults.timeout).toBe(10000)
  })

  it('adds Authorization header when an access token exists', () => {
    const interceptor = getRequestInterceptor()
    tokenStore.getAccess.mockReturnValue('secret')
    const config = interceptor({ headers: {} })

    expect(config.headers.Authorization).toBe('Bearer secret')
  })

  it('leaves headers untouched when no token is present', () => {
    const interceptor = getRequestInterceptor()
    tokenStore.getAccess.mockReturnValue(null)
    const config = interceptor({ headers: {} })

    expect(config.headers.Authorization).toBeUndefined()
  })

  it('invokes unauthorized handler when refresh token is unavailable', async () => {
    const interceptor = getResponseInterceptor()
    const unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)

    tokenStore.getRefresh.mockReturnValue(null)
    tokenStore.hasSessionExpired.mockReturnValue(true)

    await expect(
      interceptor({
        response: { status: 401 },
        config: { headers: {} },
      }),
    ).rejects.toBeDefined()

    expect(unauthorized).toHaveBeenCalledTimes(1)
  })

  it('refreshes token and retries the original request', async () => {
    const interceptor = getResponseInterceptor()
    const unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)

    tokenStore.getRefresh.mockReturnValue('refresh-token')
    tokenStore.hasSessionExpired.mockReturnValue(false)

    const adapter = vi.fn(() =>
      Promise.resolve({
        data: { ok: true },
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {},
      }),
    )
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { access: 'next-access' },
    } as any)

    const response = await interceptor({
      response: { status: 401 },
      config: { headers: {}, adapter },
    })

    expect(adapter).toHaveBeenCalledTimes(1)
    expect(tokenStore.setAccess).toHaveBeenCalledWith('next-access')
    expect(response.data).toEqual({ ok: true })
    expect(unauthorized).not.toHaveBeenCalled()
  })

  it('notifies unauthorized when retry already attempted', async () => {
    const interceptor = getResponseInterceptor()
    const unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)

    const error = {
      response: { status: 401 },
      config: { headers: {}, _retry: true },
    }

    await expect(interceptor(error)).rejects.toBe(error)
    expect(unauthorized).toHaveBeenCalledTimes(1)
  })

  it('propagates non-401 errors unchanged', async () => {
    const interceptor = getResponseInterceptor()
    const error = { response: { status: 500 }, config: {} }

    await expect(interceptor(error)).rejects.toBe(error)
  })

  it('invokes queued requests after a refresh completes', async () => {
    const interceptor = getResponseInterceptor()
    tokenStore.getRefresh.mockReturnValue('refresh-token')
    tokenStore.hasSessionExpired.mockReturnValue(false)

    let resolveRefresh: (value: any) => void
    vi.spyOn(axios, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRefresh = () => resolve({ data: { access: 'queued-access' } })
        }),
    )

    const successResponse = {
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    }
    const firstAdapter = vi.fn(() => Promise.resolve(successResponse))
    const secondAdapter = vi.fn(() => Promise.resolve(successResponse))

    const firstPromise = interceptor({
      response: { status: 401 },
      config: { headers: {}, adapter: firstAdapter },
    })
    const secondPromise = interceptor({
      response: { status: 401 },
      config: { headers: {}, adapter: secondAdapter },
    })

    resolveRefresh!({ data: { access: 'queued-access' } })
    await Promise.all([firstPromise, secondPromise])

    expect(firstAdapter).toHaveBeenCalled()
    expect(secondAdapter).toHaveBeenCalled()
    expect(tokenStore.setAccess).toHaveBeenCalledWith('queued-access')
  })

  it('rejects when refresh request fails', async () => {
    const interceptor = getResponseInterceptor()
    const unauthorized = vi.fn()
    setUnauthorizedHandler(unauthorized)
    tokenStore.getRefresh.mockReturnValue('stale-refresh')
    tokenStore.hasSessionExpired.mockReturnValue(false)

    vi.spyOn(axios, 'post').mockRejectedValueOnce(new Error('network'))

    await expect(
      interceptor({
        response: { status: 401 },
        config: { headers: {} },
      }),
    ).rejects.toThrow('network')

    expect(unauthorized).toHaveBeenCalled()
  })
})
