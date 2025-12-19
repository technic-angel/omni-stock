import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import React from 'react'

import AuthProvider, { AuthContext } from './AuthProvider'

const tokenStoreMock = vi.hoisted(() => ({
  getAccess: vi.fn(),
  setAccess: vi.fn(),
}))

vi.mock('../../../shared/lib/tokenStore', () => ({
  tokenStore: tokenStoreMock,
}))

const logoutMock = vi.hoisted(() => vi.fn().mockResolvedValue(undefined))
vi.mock('../api/authApi', () => ({
  logout: () => logoutMock(),
}))

const Consumer = () => {
  const auth = React.useContext(AuthContext)
  return (
    <div>
      <span data-testid="status">{auth?.isAuthenticated ? 'yes' : 'no'}</span>
      <button onClick={() => auth?.setAccessToken('abc')} data-testid="set-token">
        set
      </button>
      <button onClick={() => auth?.logout()} data-testid="logout">
        logout
      </button>
    </div>
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    tokenStoreMock.getAccess.mockReturnValue(null)
    logoutMock.mockResolvedValue(undefined)
  })

  it('provides authentication helpers to descendants', () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    expect(screen.getByTestId('status')).toHaveTextContent('no')
    fireEvent.click(screen.getByTestId('set-token'))

    expect(tokenStoreMock.setAccess).toHaveBeenCalledWith('abc')
    expect(screen.getByTestId('status')).toHaveTextContent('yes')
  })

  it('logs out via API and clears access token', async () => {
    render(
      <AuthProvider>
        <Consumer />
      </AuthProvider>,
    )

    fireEvent.click(screen.getByTestId('logout'))

    await waitFor(() => expect(logoutMock).toHaveBeenCalled())
    expect(screen.getByTestId('status')).toHaveTextContent('no')
  })
})
