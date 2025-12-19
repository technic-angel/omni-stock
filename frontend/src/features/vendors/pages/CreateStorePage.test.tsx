import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { fireEvent, render, screen } from '@testing-library/react'

import CreateStorePage from './CreateStorePage'
import { routerFuture } from '@/app/routes/routerFuture'

const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../components/StoreForm', () => ({
  __esModule: true,
  default: ({ onCreated }: { onCreated: () => void }) => (
    <button onClick={onCreated}>Mock Store Form</button>
  ),
}))

describe('CreateStorePage', () => {
  it('renders and navigates after store is created', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <CreateStorePage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText(/mock store form/i))
    expect(navigate).toHaveBeenCalledWith('/vendors')
  })
})
