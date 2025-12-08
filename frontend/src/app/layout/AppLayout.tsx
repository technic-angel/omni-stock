import { Outlet } from 'react-router-dom'
import { Sidebar, MobileSidebarTrigger } from './Sidebar'
import { useMediaQuery } from '@/shared/hooks/useMediaQuery'
import { useAppSelector } from '@/store/hooks'
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser'


export function AppLayout() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)
  useCurrentUser({ enabled: isAuthenticated })

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && <Sidebar className="hidden md:flex md:flex-col" />}

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header */}
        {isMobile && (
          <header className="flex h-16 items-center gap-4 border-b bg-white px-4 md:hidden">
            <MobileSidebarTrigger />
            <h1 className="text-lg font-semibold">Omni-Stock</h1>
          </header>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AppLayout
