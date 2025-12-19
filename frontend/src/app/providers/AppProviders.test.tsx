import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import AppProviders from './AppProviders'
import { store } from '../../store'
import { clearCredentials } from '../../store/slices/authSlice'

let unauthorizedHandler: (() => void) | null = null
const setUnauthorizedHandlerMock = vi.fn((handler: () => void) => {
  unauthorizedHandler = handler
})

vi.mock('../../shared/lib/http', () => ({
  setUnauthorizedHandler: (handler: () => void) => setUnauthorizedHandlerMock(handler),
}))

describe('AppProviders', () => {
  const dispatchSpy = vi.spyOn(store, 'dispatch')

  beforeEach(() => {
    unauthorizedHandler = null
    vi.clearAllMocks()
    dispatchSpy.mockClear()
  })

  it('renders children inside application providers', () => {
    render(
      <AppProviders>
        <div data-testid="app-child">ready</div>
      </AppProviders>,
    )

    expect(screen.getByTestId('app-child')).toBeInTheDocument()
    expect(setUnauthorizedHandlerMock).toHaveBeenCalledTimes(1)
  })

  it('wires unauthorized handler to clear credentials', () => {
    render(
      <AppProviders>
        <div />
      </AppProviders>,
    )

    unauthorizedHandler?.()
    expect(dispatchSpy).toHaveBeenCalledWith(clearCredentials())
  })
})
