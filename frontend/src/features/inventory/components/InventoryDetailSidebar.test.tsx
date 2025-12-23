import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import InventoryDetailSidebar from './InventoryDetailSidebar'
import type { Collectible } from '@/shared/types'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

describe('InventoryDetailSidebar', () => {
  it('shows empty state when no collectible selected', () => {
    render(
      <MemoryRouter>
        <InventoryDetailSidebar collectible={null} />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Select an item to view details/i)).toBeVisible()
  })

  it('renders detail information and supports actions', () => {
    const mockCollectible: Collectible = {
      id: 99,
      name: 'Charizard VMAX',
      sku: 'POK-123',
      quantity: 3,
      category: 'pokemon_card',
      image_url: null,
      card_details: { market_region: 'US', language: 'English', psa_grade: '10' },
      variants: [{ id: 1, quantity: 3, condition: 'Raw' }],
    }
    const onDelete = vi.fn()

    render(
      <MemoryRouter>
        <InventoryDetailSidebar collectible={mockCollectible} onDelete={onDelete} />
      </MemoryRouter>,
    )

    expect(screen.getByText(/Charizard VMAX/i)).toBeVisible()
    expect(screen.getByText(/POK-123/i)).toBeVisible()
    expect(screen.getByText(/Flagship Store/i)).toBeVisible()
    expect(screen.getByText(/3x/i)).toBeVisible()

    fireEvent.click(screen.getByRole('button', { name: /Delete/i }))
    expect(onDelete).toHaveBeenCalledWith(mockCollectible)

    fireEvent.click(screen.getByRole('button', { name: /Edit/i }))
    expect(navigate).toHaveBeenCalledWith('/inventory/99/edit')
  })
})
