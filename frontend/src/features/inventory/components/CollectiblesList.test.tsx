import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { act, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import CollectiblesList from './CollectiblesList'
import { useCollectibles } from '../hooks/useCollectibles'
import { useDeleteCollectible } from '../hooks/useDeleteCollectible'

vi.mock('../hooks/useCollectibles', () => ({
  useCollectibles: vi.fn(),
}))
vi.mock('../hooks/useDeleteCollectible', () => ({
  useDeleteCollectible: vi.fn(),
}))

const mockedUseCollectibles = vi.mocked(useCollectibles)
const mockedUseDeleteCollectible = vi.mocked(useDeleteCollectible)

describe('CollectiblesList', () => {
  const renderComponent = () => render(
    <MemoryRouter>
      <CollectiblesList filters={{}} />
    </MemoryRouter>,
  )

  it('shows loading state', () => {
    mockedUseCollectibles.mockReturnValue({ isLoading: true } as any)
    renderComponent()
    expect(screen.getByText(/loading collectibles/i)).toBeInTheDocument()
  })

  it('shows error state', () => {
    mockedUseCollectibles.mockReturnValue({ error: new Error('boom') } as any)
    renderComponent()
    expect(screen.getByText(/error loading collectibles/i)).toBeInTheDocument()
  })

  it('renders list items', () => {
    mockedUseCollectibles.mockReturnValue({
      data: { results: [{ id: 1, name: 'Card A', language: 'EN', market_region: 'US' }] },
      isLoading: false,
      error: null,
    } as any)
    mockedUseDeleteCollectible.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    renderComponent()
    expect(screen.getByText('Card A')).toBeInTheDocument()
    expect(screen.getByText(/en — us/i)).toBeInTheDocument()
  })

  it('shows empty state', () => {
    mockedUseCollectibles.mockReturnValue({
      data: { results: [] },
      isLoading: false,
      error: null,
    } as any)
    mockedUseDeleteCollectible.mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as any)
    renderComponent()
    expect(screen.getByText(/no collectibles match/i)).toBeInTheDocument()
  })

  it('opens confirm dialog and deletes item', async () => {
    const mutateSpy = vi.fn().mockResolvedValue(undefined)
    mockedUseCollectibles.mockReturnValue({
      data: { results: [{ id: 1, name: 'Card A', language: 'EN', market_region: 'US' }] },
      isLoading: false,
      error: null,
    } as any)
    mockedUseDeleteCollectible.mockReturnValue({ mutateAsync: mutateSpy } as any)

    renderComponent()

    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByText(/delete collectible/i)).toBeInTheDocument()

    await act(async () => {
      const dialog = screen.getByTestId('confirm-dialog')
      const confirmButton = within(dialog).getByRole('button', { name: /^delete$/i })
      fireEvent.click(confirmButton)
    })

    expect(mutateSpy).toHaveBeenCalledWith(1)
  })
})
