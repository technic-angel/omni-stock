'use client'

import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  Home, 
  Package, 
  Plus, 
  Building2, 
  Heart,
  Settings,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronRight,
  Search
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'
import { useMediaQuery } from '../../shared/hooks/useMediaQuery'

// ============================================
// Navigation Configuration
// ============================================

const ENABLE_SEARCH = false

// Primary navigation - core inventory features
const PRIMARY_NAVIGATION = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, shortcut: '⌘1' },
  { name: 'Inventory', href: '/inventory', icon: Package, shortcut: '⌘2' },
  { name: 'Add Item', href: '/inventory/add', icon: Plus, shortcut: '⌘3' }
]

// Quick access section - organized management tools
// Post-MVP: Will support role-based visibility and vendor switching
const QUICK_ACCESS = [
  { name: 'Vendors', href: '/vendors', icon: Building2, color: 'text-blue-500' },
  { name: 'Wishlist', href: '/wishlist', icon: Heart, color: 'text-pink-500' },
  { name: 'Categories', href: '/categories', icon: Package, color: 'text-green-500' }
]

// User role - placeholder for future multi-vendor/RBAC support
const USER_ROLE = 'Owner' // Post-MVP: Dynamic from auth context

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isExpanded, setIsExpanded] = useLocalStorage('sidebar-expanded', true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActivePath = (href: string) => {
    if (href === '/dashboard' && location.pathname === '/') return true
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const NavigationContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div 
      className="flex h-full flex-col bg-white" 
      onClick={(e) => {
        // Toggle sidebar when clicking empty space (not on links)
        const target = e.target as Element
        if (!isMobile && (e.target === e.currentTarget || target.closest?.('.sidebar-toggle-area'))) {
          setIsExpanded(!isExpanded)
        }
      }}
    >
      {/* Header with Logo */}
      <div className="px-2 py-6 border-b border-gray-100">
        {/* Logo */}
        <div 
          className={`flex items-center cursor-pointer transition-all duration-300 hover:bg-gray-50 rounded-lg p-1 -m-1 overflow-hidden ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
          onClick={() => !isMobile && setIsExpanded(!isExpanded)}
        >
          {/* Logo Icon & Wordmark */}

          <div className={`flex items-center justify-center ${
            isMobile || isExpanded 
              ? 'w-auto' 
              : 'w-16 h-16'
          } transition-all duration-500`}>
            {isMobile ? (
              // Mobile-only version: Always show horizontal logo (drawer context)
              <img 
                src="/branding/omni-stock-logo-horizontal-gem-tiffany.svg" 
                alt="Omni-Stock" 
                className="h-20 w-auto object-contain max-w-[240px]"
              />
            ) : (
              // Desktop-only version: Cross-fade between icon and horizontal logo
              <div className="relative flex items-center justify-center">
                {/* Icon - fades out when expanded */}
                <img 
                  src="/branding/omni-stock-icon-gem-tiffany.svg" 
                  alt="Omni-Stock" 
                  className={`h-16 w-16 object-contain transition-opacity duration-500 absolute ${
                    isExpanded ? 'opacity-0' : 'opacity-100'
                  }`}
                />
                {/* Horizontal - fades in when expanded */}
                <img 
                  src="/branding/omni-stock-logo-horizontal-gem-tiffany.svg" 
                  alt="Omni-Stock" 
                  className={`h-30 w-auto object-contain max-w-[300px] transition-opacity duration-500 ${
                    isExpanded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </div>
            )}
          </div>
          {!isMobile && isExpanded && (
            <div className="ml-auto">
              <ChevronLeft className="h-4 w-4 text-gray-400" />
            </div>
          )}
          {!isMobile && !isExpanded && (
            <div className="absolute left-20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                Expand sidebar
              </div>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        {(isExpanded || isMobile) && (
          <div className="mt-4">
            <div className={`relative ${
              ENABLE_SEARCH ? '' : 'opacity-50 pointer-events-none'
            }`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent transition-all duration-200"
                disabled={!ENABLE_SEARCH}
              />
              <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-mono">
                ⌘K
              </kbd>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-4 sidebar-toggle-area">
        <nav className="space-y-1">
          {PRIMARY_NAVIGATION.map((item) => {
            const Icon = item.icon
            const isActive = isActivePath(item.href)
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onLinkClick}
                className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-brand-primary text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100 hover:shadow-sm'
                } ${!isExpanded && !isMobile ? 'justify-center' : 'justify-between'}`}
              >
                <div className="flex items-center">
                  <Icon className={`flex-shrink-0 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}`} />
                  {(isExpanded || isMobile) && (
                    <span className="ml-3">{item.name}</span>
                  )}
                </div>
                {(isExpanded || isMobile) && item.shortcut && (
                  <span className={`text-xs ${isActive ? 'text-brand-primary-soft' : 'text-gray-400'}`}>
                    {item.shortcut}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
        
        {/* Quick Access Section */}
        {(isExpanded || isMobile) && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Quick Access
              </h3>
              <Plus className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </div>
            <nav className="space-y-1">
              {QUICK_ACCESS.map((item) => {
                const Icon = item.icon
                const isActive = isActivePath(item.href)
                
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={onLinkClick}
                    className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-600 hover:bg-gray-50 hover:shadow-sm'
                    }`}
                  >
                    <Icon className={`flex-shrink-0 h-4 w-4 ${item.color || 'text-gray-500'}`} />
                    <span className="ml-3">{item.name}</span>
                  </Link>
                )
              })}
            </nav>
          </div>
        )}
      </div>

      {/* User Account Section */}
      <div className="border-t border-gray-100 sidebar-toggle-area">
      {/* User Profile */}
      {(isExpanded || isMobile) && (
        <div className="p-4 transition-opacity duration-700">
          <div className="flex items-center space-x-4">
            {/* Avatar - grows smoothly with navbar expansion */}
            <div className={`flex-shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-sm transition-all duration-700 ${
              isExpanded || isMobile 
                ? 'w-14 h-14 text-lg' 
                : 'w-10 h-10 text-xs'
            }`}>
              JD
            </div>
            {/* User Info - visible when expanded */}
            <div className="flex-1 min-w-0">
              <div className="text-base font-medium text-gray-900 truncate">
                John Doe
              </div>
              {/* Post-MVP: Display dynamic role and vendor info */}
              <div className="text-sm text-gray-500 truncate">
                {USER_ROLE} • TechCorp
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-gray-400" />
          </div>
        </div>
      )}
      
      {/* Collapsed User Profile */}
      {(!isExpanded && !isMobile) && (
        <div className="p-1">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs shadow-sm mx-auto cursor-pointer hover:shadow-md transition-all duration-700">
            JD
          </div>
        </div>
      )}
        
        {/* Settings and Logout */}
        <div className="p-4">
          {(isExpanded || isMobile) && (
            <div className="space-y-1">
              <Link
                to="/settings"
                onClick={onLinkClick}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:shadow-sm"
              >
                <Settings className="flex-shrink-0 h-4 w-4 text-gray-500 group-hover:text-gray-700" />
                <span className="ml-3">Settings</span>
              </Link>
              <Link
                to="/logout"
                onClick={onLinkClick}
                className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:shadow-sm"
              >
                <LogOut className="flex-shrink-0 h-4 w-4 text-gray-500 group-hover:text-red-500" />
                <span className="ml-3">Sign out</span>
              </Link>
            </div>
          )}
          {(!isExpanded && !isMobile) && (
            <div className="space-y-2">
              <button className="w-full p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm group">
                <Settings className="h-5 w-5 text-gray-500 mx-auto group-hover:text-gray-700" />
              </button>
              <button className="w-full p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200 hover:shadow-sm hover:bg-red-50 group">
                <LogOut className="h-5 w-5 text-gray-500 mx-auto group-hover:text-red-500" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        {/* Mobile menu button */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm"
              className="md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <NavigationContent onLinkClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div 
      className={`bg-white border-r border-gray-200 shadow-sm overflow-hidden ${
        isExpanded ? 'w-64' : 'w-16'
      } transition-all duration-700 ease-in-out ${className}`}
    >
      <NavigationContent />
    </div>
  )
}

export function MobileSidebarTrigger() {
  const isMobile = useMediaQuery('(max-width: 768px)')
  
  if (!isMobile) return null
  
  return <Sidebar />
}
