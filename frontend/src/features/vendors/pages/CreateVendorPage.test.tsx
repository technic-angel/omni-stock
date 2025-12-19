import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'

import CreateVendorPage from './CreateVendorPage'

const navigateMock = vi.fn()
const mutateSpy = vi.fn()
const mockUseCreateVendor = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../hooks/useCreateVendor', () => ({
  useCreateVendor: () => mockUseCreateVendor(),
}))

describe('CreateVendorPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mutateSpy.mockResolvedValue(undefined)
    mockUseCreateVendor.mockReturnValue({
      mutateAsync: mutateSpy,
      isPending: false,
      error: null,
    })
  })

  it('submits vendor values and navigates back to settings', async () => {
    render(<CreateVendorPage />)

    fireEvent.input(screen.getByLabelText(/vendor name/i), { target: { value: 'Mellycorp' } })
    fireEvent.input(screen.getByLabelText(/short description/i), {
      target: { value: 'Collectibles brand' },
    })
    fireEvent.input(screen.getByLabelText(/contact info/i), {
      target: { value: 'ops@mellycorp.test' },
    })

    fireEvent.click(screen.getByRole('button', { name: /save vendor/i }))

    await waitFor(() =>
      expect(mutateSpy).toHaveBeenCalledWith({
        name: 'Mellycorp',
        description: 'Collectibles brand',
        contact_info: 'ops@mellycorp.test',
      }),
    )
    expect(navigateMock).toHaveBeenCalledWith('/vendors')
  })

  it('displays validation errors when required fields missing', async () => {
    render(<CreateVendorPage />)

    fireEvent.click(screen.getByRole('button', { name: /save vendor/i }))

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()
    expect(mutateSpy).not.toHaveBeenCalled()
  })

  it('shows mutation error state', () => {
    mockUseCreateVendor.mockReturnValue({
      mutateAsync: mutateSpy,
      isPending: false,
      error: new Error('Unable to save'),
    })
    render(<CreateVendorPage />)

    expect(screen.getByText(/unable to save/i)).toBeInTheDocument()
  })
})
