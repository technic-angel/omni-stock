import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

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

import App from './App'

describe('App', () => {
  it('renders the main application component', () => {
    render(<App />)
    const mainElement = screen.getByRole('main')
    expect(mainElement).toBeInTheDocument()
  })
})
