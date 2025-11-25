import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-brand-bg">
      <Sidebar />

      {/* Main Content Area */}
      <div className="md:pl-16 transition-all duration-300">
        <TopNavbar />

        <main className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
