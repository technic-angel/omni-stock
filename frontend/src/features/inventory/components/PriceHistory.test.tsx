import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PriceHistory from './PriceHistory'

describe('PriceHistory', () => {
  it('renders market insights placeholder content', () => {
    render(<PriceHistory />)
    expect(screen.getByText(/Market Insights/i)).toBeVisible()
    expect(screen.getByText(/Current Market Price/i)).toBeVisible()
    expect(screen.getByText(/Price history chart will appear here/i)).toBeVisible()
    expect(screen.getByRole('button', { name: /View External/i })).toBeVisible()
  })
})
