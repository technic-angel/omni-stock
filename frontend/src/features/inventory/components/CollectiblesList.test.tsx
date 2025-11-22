import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

import CollectiblesList from './CollectiblesList'
import { useCollectibles } from '../hooks/useCollectibles'

vi.mock('../hooks/useCollectibles', () => ({
  useCollectibles: vi.fn(),
}))

const mockedUseCollectibles = vi.mocked(useCollectibles)

describe('CollectiblesList', () => {
  it('shows loading state', () => {
    mockedUseCollectibles.mockReturnValue({ isLoading: true } as any)
    render(<CollectiblesList filters={{}} />)
    expect(screen.getByText(/loading collectibles/i)).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockedUseCollectibles.mockReturnValue({ error: new Error('boom') } as any)
    render(<CollectiblesList filters={{}} />)
    expect(screen.getByText(/error loading collectibles/i)).toBeInTheDocument()
  })

  it('renders list items', () => {
    mockedUseCollectibles.mockReturnValue({
      data: { results: [{ id: 1, name: 'Card A', language: 'EN', market_region: 'US' }] },
      isLoading: false,
      error: null,
    } as any)
    render(<CollectiblesList filters={{}} />)
    expect(screen.getByText('Card A')).toBeInTheDocument()
    expect(screen.getByText(/en — us/i)).toBeInTheDocument()
  })

  it('shows empty state', () => {
    mockedUseCollectibles.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      error: null,
    } as any)
    render(<CollectiblesList filters={{}} />)
    expect(screen.getByText(/no collectibles match/i)).toBeInTheDocument()
  })
})
