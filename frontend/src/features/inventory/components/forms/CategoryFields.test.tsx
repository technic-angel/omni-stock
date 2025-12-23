import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PokemonFields from './PokemonFields'
import ClothingFields from './ClothingFields'
import VideoGameFields from './VideoGameFields'

describe('Category specific fields', () => {
  it('renders Pokémon inputs', () => {
    render(<PokemonFields />)
    expect(screen.getByLabelText(/Set Name/i)).toBeVisible()
    expect(screen.getByLabelText(/Card Number/i)).toBeVisible()
    expect(screen.getByLabelText(/Rarity/i)).toBeVisible()
    expect(screen.getByLabelText(/Finish/i)).toBeVisible()
  })

  it('renders clothing inputs', () => {
    render(<ClothingFields />)
    expect(screen.getByLabelText(/Size/i)).toBeVisible()
    expect(screen.getByLabelText(/Color/i)).toBeVisible()
    expect(screen.getByLabelText(/Material/i)).toBeVisible()
    expect(screen.getByLabelText(/Brand/i)).toBeVisible()
  })

  it('renders video game inputs', () => {
    render(<VideoGameFields />)
    expect(screen.getByLabelText(/Platform/i)).toBeVisible()
    expect(screen.getByLabelText(/Region/i)).toBeVisible()
    expect(screen.getByLabelText(/Completeness/i)).toBeVisible()
    expect(screen.getByLabelText(/Genre/i)).toBeVisible()
  })
})
