import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import GuestLayout from './GuestLayout'

const renderGuestLayout = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<GuestLayout />}>
          <Route index element={<div data-testid="guest-content">Auth Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )

describe('GuestLayout', () => {
  it('renders header links and outlet content', () => {
    renderGuestLayout()

    expect(screen.getByRole('link', { name: /Log in/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /Get Started/i })).toHaveAttribute(
      'href',
      '/register',
    )
    expect(screen.getByTestId('guest-content')).toHaveTextContent('Auth Content')
  })
})
