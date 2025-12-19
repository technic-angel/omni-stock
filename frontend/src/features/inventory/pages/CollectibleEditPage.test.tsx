import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import CollectibleEditPage from './CollectibleEditPage'
import { routerFuture } from '@/app/routes/routerFuture'
import { useCollectible } from '../hooks/useCollectible'

vi.mock('../hooks/useCollectible', () => ({
  useCollectible: vi.fn(),
}))

vi.mock('../components/CollectibleEditForm', () => ({
  __esModule: true,
  default: ({ collectible, onSuccess }: { collectible: any; onSuccess: () => void }) => (
    <div>
      EditForm {collectible.name}
      <button onClick={onSuccess}>Done</button>
    </div>
  ),
}))

const mockUseCollectible = vi.mocked(useCollectible)
const navigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ collectibleId: '5' }),
    useNavigate: () => navigate,
  }
})

describe('CollectibleEditPage', () => {
  it('renders loading and error states', () => {
    mockUseCollectible.mockReturnValue({ isLoading: true } as any)
    const { rerender } = render(
      <MemoryRouter future={routerFuture}>
        <CollectibleEditPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Loading collectible/i)).toBeVisible()

    mockUseCollectible.mockReturnValue({ error: new Error('bad') } as any)
    rerender(
      <MemoryRouter future={routerFuture}>
        <CollectibleEditPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Error loading collectible/i)).toBeVisible()
  })

  it('renders form when data ready', () => {
    mockUseCollectible.mockReturnValue({
      data: { id: 5, name: 'Card' },
      isLoading: false,
      error: null,
    } as any)
    render(
      <MemoryRouter future={routerFuture}>
        <CollectibleEditPage />
      </MemoryRouter>,
    )
    expect(screen.getByText(/Edit Card/i)).toBeVisible()
    screen.getByText(/Done/).click()
    expect(navigate).toHaveBeenCalledWith('/inventory')
  })
})
