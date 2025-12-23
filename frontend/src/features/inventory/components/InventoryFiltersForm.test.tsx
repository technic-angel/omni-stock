import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import InventoryFiltersForm from './InventoryFiltersForm'

describe('InventoryFiltersForm', () => {
  it('submits entered filters', async () => {
    const onChange = vi.fn()
    render(<InventoryFiltersForm defaultFilters={{}} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText(/Search inventory/i), {
      target: { value: 'pikachu' },
    })
    fireEvent.change(screen.getByLabelText(/Category filter/i), { target: { value: 'pokemon_card' } })
    fireEvent.change(screen.getByLabelText(/Language filter/i), { target: { value: 'English' } })
    fireEvent.change(screen.getByLabelText(/Market region filter/i), { target: { value: 'JP' } })

    fireEvent.submit(screen.getByTestId('inventory-filters-form'))

    await waitFor(() => expect(onChange).toHaveBeenCalled())
    const payload = onChange.mock.calls[0][0]
    expect(payload).toMatchObject({
      search: 'pikachu',
      category: 'pokemon_card',
      language: 'English',
      market_region: 'JP',
    })
  })

  it('clears filters when Clear is clicked', async () => {
    const onChange = vi.fn()
    render(<InventoryFiltersForm defaultFilters={{}} onChange={onChange} />)

    fireEvent.change(screen.getByPlaceholderText(/Search inventory/i), {
      target: { value: 'charizard' },
    })
    fireEvent.submit(screen.getByTestId('inventory-filters-form'))
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1))

    fireEvent.click(screen.getByRole('button', { name: /Clear/i }))
    await waitFor(() => {
      const lastCall = onChange.mock.calls.at(-1)
      expect(lastCall?.[0]).toEqual({})
    })
  })
})
