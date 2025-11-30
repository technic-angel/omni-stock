import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock child components to avoid importing heavier runtime code that can
// cause duplicate React/runtime mismatches in the test environment.
vi.mock('./features/inventory/pages/CollectiblesListPage', () => ({
  default: () => <div role="main">Mock Collectibles</div>,
}))
vi.mock('./features/auth/pages/LoginPage', () => ({
  default: () => <div role="main">Mock Login</div>,
}))
vi.mock('./features/auth/pages/RegisterPage', () => ({
  default: () => <div role="main">Mock Register</div>,
}))

// Mock useMediaQuery hook
vi.mock('./shared/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => false), // Default to desktop
}))

// Mock useLocalStorage hook
vi.mock('./shared/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key, defaultValue) => [defaultValue, vi.fn()]),
}))

// Mock tokenStore
vi.mock('./shared/lib/tokenStore', () => ({
  tokenStore: {
    getAccess: vi.fn(() => null),
    setAccess: vi.fn(),
    getRefresh: vi.fn(() => null),
    setRefresh: vi.fn(),
    setTokens: vi.fn(),
    clear: vi.fn(),
  }
}))

import App from './App'

describe('App', () => {
  it('renders the main application component', () => {
    render(<App />)
    // When unauthenticated, app renders landing page which has heading
    const heading = screen.getByRole('heading', { name: /track your collectibles/i })
    expect(heading).toBeInTheDocument()
  })
})
