import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import SettingsPage from './SettingsPage'

describe('SettingsPage', () => {
  it('renders placeholder content', () => {
    render(<SettingsPage />)
    expect(screen.getAllByText(/Settings/i)[0]).toBeInTheDocument()
    expect(screen.getByText(/Coming soon/i)).toBeInTheDocument()
  })
})
