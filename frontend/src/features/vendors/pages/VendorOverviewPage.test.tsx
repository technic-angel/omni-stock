import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'

import VendorOverviewPage from './VendorOverviewPage'
import { routerFuture } from '@/app/routes/routerFuture'

vi.mock('../components/VendorProfileCard', () => ({
  __esModule: true,
  default: () => <div>ProfileCard</div>,
}))
vi.mock('../components/VendorStatsCard', () => ({
  __esModule: true,
  default: () => <div>StatsCard</div>,
}))
vi.mock('../components/StoreListCard', () => ({
  __esModule: true,
  default: () => <div>StoreList</div>,
}))
vi.mock('../components/VendorMembersCard', () => ({
  __esModule: true,
  default: () => <div>MembersCard</div>,
}))

describe('VendorOverviewPage', () => {
  it('renders vendor overview actions and sections', () => {
    render(
      <MemoryRouter future={routerFuture}>
        <VendorOverviewPage />
      </MemoryRouter>,
    )
    expect(screen.getByText('Vendor Overview')).toBeVisible()
    expect(screen.getByRole('link', { name: /Switch vendor/i })).toHaveAttribute('href', '/vendors/switch')
    expect(screen.getByText('ProfileCard')).toBeVisible()
    expect(screen.getByText('MembersCard')).toBeVisible()
  })
})
