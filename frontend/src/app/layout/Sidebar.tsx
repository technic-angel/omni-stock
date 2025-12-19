"use client"

import type { JSX } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Home,
  LogOut,
  Menu,
  Package,
  Plus,
  Search,
  Store,
  Users2,
  Settings,
} from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '../../components/ui/sheet'
import { useLocalStorage } from '../../shared/hooks/useLocalStorage'
import { useMediaQuery } from '../../shared/hooks/useMediaQuery'
import { useCurrentUser } from '../../features/auth/hooks/useCurrentUser'

const ENABLE_LOW_STOCK_AND_AUDIT =
  import.meta.env.VITE_ENABLE_LOW_STOCK_AND_AUDIT === 'true'
const USER_ROLE = 'Owner'

type IconComponent = (props: { className?: string }) => JSX.Element

type NavItem = {
  id: string
  name: string
  href?: string
  icon: IconComponent
  requiresStore?: boolean
  comingSoon?: boolean
  matchPaths?: string[]
}

type QuickAccessItem = {
  id: string
  name: string
  description: string
  icon: IconComponent
  href?: string
  requiresStore?: boolean
  comingSoon?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: Home },
  { id: 'inventory', name: 'Inventory', href: '/inventory', icon: Package, requiresStore: true },
  { id: 'members', name: 'Members & Roles', href: '/vendors', icon: Users2 },
  {
    id: 'vendor-settings',
    name: 'Vendor Settings',
    href: '/vendors',
    icon: Settings,
    matchPaths: ['/vendors/settings'],
  },
]

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: 'add-item',
    name: 'Add Item',
    description: 'Global shortcut for the active store.',
    icon: Plus,
    href: '/inventory/add',
    requiresStore: true,
  },
]

if (ENABLE_LOW_STOCK_AND_AUDIT) {
  QUICK_ACCESS_ITEMS.push(
    {
      id: 'low-stock',
      name: 'Low Stock',
      description: 'Instantly filter items that need restock.',
      icon: AlertTriangle,
      requiresStore: true,
      comingSoon: true,
    },
    {
      id: 'audit-log',
      name: 'Audit Log',
      description: 'Review recent price and inventory changes.',
      icon: ClipboardList,
      requiresStore: true,
      comingSoon: true,
    },
  )
}

export function Sidebar({ className = '' }: { className?: string }) {
  const location = useLocation()
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isExpanded, setIsExpanded] = useLocalStorage('sidebar-expanded', true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { data: currentUser } = useCurrentUser({ enabled: true })

  const avatarUrl = currentUser?.profile?.profile_picture ?? null
  const userInitials = useMemo(() => {
    const nameParts = [currentUser?.first_name, currentUser?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim()
    const base = nameParts || currentUser?.username || currentUser?.email || 'JD'
    const initials = base
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
    return initials ? initials.toUpperCase() : 'JD'
  }, [currentUser?.email, currentUser?.first_name, currentUser?.last_name, currentUser?.username])

  const renderAvatar = (size: 'large' | 'small') => {
    const dimensionClasses = size === 'large' ? 'w-14 h-14' : 'w-10 h-10'
    const textSizeClass = size === 'large' ? 'text-lg' : 'text-xs'
    return (
      <div
        data-testid={`sidebar-avatar-${size}`}
        className={`relative flex-shrink-0 overflow-hidden rounded-full shadow-sm transition-all duration-700 ${dimensionClasses}`}
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" aria-hidden="true" />
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="User avatar"
            className="absolute inset-0 h-full w-full rounded-full object-cover border-2 border-white"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className={`relative z-10 flex h-full w-full items-center justify-center text-white font-semibold ${textSizeClass}`}>
            {userInitials}
          </span>
        )}
      </div>
    )
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = (e.key || '').toLowerCase()
      const isModifier = e.ctrlKey || e.metaKey
      if (!isModifier || key !== 'b') return
      e.preventDefault()

      if (isMobile) {
        setMobileOpen((v) => !v)
      } else {
        setIsExpanded((v) => !v)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMobile, setIsExpanded, setMobileOpen])

  const isActivePath = (href: string) => {
    if (href === '/dashboard' && location.pathname === '/') return true
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  const hasVendor = Boolean(currentUser?.active_vendor)
  const hasStore = Boolean(currentUser?.active_store)
  const showFullContent = isExpanded || isMobile

  const renderNoVendorState = () => (
    <div className="px-4 py-6">
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-700">
        <p className="font-semibold text-gray-900">No vendor yet</p>
        <p className="mt-1 text-xs text-gray-500">
          Vendors power stores, invite teammates, and manage billing.
        </p>
        <Link
          to="/vendors/new"
          className="mt-4 inline-flex w-full justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Create Your First Vendor
        </Link>
      </div>
    </div>
  )

  const renderVendorContext = () => {
    if (!showFullContent) return null
    if (!hasVendor) {
      return renderNoVendorState()
    }

    const vendorName = currentUser?.active_vendor?.name ?? 'Select vendor'

    return (
      <div className="space-y-4 border-b border-gray-100 px-4 py-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Vendor</p>
          <Link
            to="/vendors"
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-brand-primary hover:shadow-sm"
          >
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-primary" /> {vendorName}
            </span>
            <span className="text-xs text-gray-400">View</span>
          </Link>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Store</p>
          {hasStore ? (
            <Link
              to={currentUser?.active_store?.id ? `/stores/${currentUser.active_store.id}` : '/stores'}
              className="mt-2 flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-900 transition hover:border-brand-primary hover:shadow-sm"
            >
              <span className="flex items-center gap-2">
                <Store className="h-4 w-4 text-indigo-500" /> {currentUser?.active_store?.name}
              </span>
              <span className="text-xs text-gray-400">View</span>
            </Link>
          ) : (
            <div className="mt-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm">
              <p className="font-medium text-gray-800">Store: None yet</p>
              <p className="text-xs text-gray-500">Create a store to start managing inventory.</p>
              <Link
                to="/stores/new"
                className="mt-3 inline-flex w-full justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-brand-primary"
              >
                Create First Store
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderSearchBar = () => {
    if (!hasStore || !showFullContent) return null
    return (
      <div className="border-b border-gray-100 px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search inventory, stores…"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-400">
            ⌘K
          </kbd>
        </div>
      </div>
    )
  }

  const resolvedIsActive = (item: NavItem) => {
    const paths = item.matchPaths ?? (item.href ? [item.href] : [])
    return paths.some((path) => isActivePath(path))
  }

  const renderNavItem = (item: NavItem, onLinkClick?: () => void) => {
    const Icon = item.icon
    const disabled = !hasVendor || (item.requiresStore && !hasStore) || item.comingSoon || !item.href
    const isActive = resolvedIsActive(item)
    const baseClass = showFullContent
      ? 'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm'
      : 'flex w-full items-center justify-center rounded-lg p-2 text-sm'

    if (disabled) {
      return (
        <button
          key={item.id}
          type="button"
          className={`${baseClass} border border-transparent text-gray-400`}
          disabled
        >
          <Icon className="h-4 w-4" />
          {showFullContent && <span>{item.name}</span>}
          {item.comingSoon && <span className="ml-auto text-[10px] uppercase text-gray-300">soon</span>}
        </button>
      )
    }

    return (
      <Link
        key={item.id}
        to={item.href}
        onClick={onLinkClick}
        className={`${baseClass} font-medium transition ${
          isActive ? 'bg-brand-primary text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <Icon className="h-4 w-4" />
        {showFullContent && <span>{item.name}</span>}
      </Link>
    )
  }

  const renderMainNavigation = (onLinkClick?: () => void) => {
    if (!hasVendor) return null
    return (
      <div className="sidebar-toggle-area border-b border-gray-100 px-4 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Main</p>
        <div className="mt-3 space-y-2">
          {NAV_ITEMS.map((item) => renderNavItem(item, onLinkClick))}
        </div>
      </div>
    )
  }

  const renderQuickAccessItem = (item: QuickAccessItem, onLinkClick?: () => void) => {
    const Icon = item.icon
    const disabled = !hasVendor || (item.requiresStore && !hasStore) || item.comingSoon || !item.href

    if (disabled) {
      return (
        <div
          key={item.id}
          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-left text-gray-400"
          aria-hidden="true" // Mark as aria-hidden
        >
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-gray-300" />
            <span className="font-semibold">{item.name}</span>
            {item.comingSoon && <span className="ml-auto text-[10px] uppercase text-gray-300">soon</span>}
          </div>
          <p className="mt-1 text-xs text-gray-400">{item.description}</p>
        </div>
      )
    }

    return (
      <Link
        key={item.id}
        to={item.href}
        onClick={onLinkClick}
        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-gray-700 transition hover:border-brand-primary hover:shadow-none focus:outline-none focus-visible:outline-none focus:ring-0"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-gray-500" />
          <span className="font-semibold">{item.name}</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">{item.description}</p>
      </Link>
    )
  }

  const renderQuickAccess = (onLinkClick?: () => void) => {
    if (!hasVendor || !showFullContent) return null
    return (
      <div className="border-b border-gray-100 px-4 py-5">
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick Access</p>
          <Plus className="h-4 w-4 text-gray-400" />
        </div>
        <div className="mt-3 space-y-3">
          {QUICK_ACCESS_ITEMS.map((item) => renderQuickAccessItem(item, onLinkClick))}
        </div>
      </div>
    )
  }

  const NavigationContent = ({ onLinkClick }: { onLinkClick?: () => void }) => (
    <div
      className="flex h-full min-h-0 flex-col bg-white"
      onClick={(e) => {
        if (isMobile) return
        const target = e.target as Element
        const clickedInteractive =
          Boolean(target.closest?.('a, button, input, textarea, select')) ||
          Boolean(target.closest?.('.sidebar-link')) ||
          Boolean(target.closest?.('[role="button"]'))

        if (!clickedInteractive) {
          setIsExpanded((v) => !v)
        }
      }}
    >
      <div className="flex-shrink-0 border-b border-gray-100 px-2 py-6">
        <div
          className={`group flex items-center cursor-pointer transition-all duration-300 hover:bg-gray-50 rounded-lg p-1 -m-1 overflow-hidden ${
            isExpanded ? 'justify-start' : 'justify-center'
          }`}
          onClick={() => !isMobile && setIsExpanded((v) => !v)}
        >
          <div
            className={`flex items-center justify-center ${
              isMobile || isExpanded ? 'w-auto' : 'w-16 h-16'
            } transition-all duration-500`}
          >
            {isMobile ? (
              <img src="/branding/omni-stock-logo-horizontal-gem-tiffany.svg" alt="Omni-Stock" />
            ) : (
              <div className="relative flex items-center justify-center">
                <img
                  src="/branding/omni-stock-icon-gem-tiffany.svg"
                  alt="Omni-Stock"
                  className={`h-16 w-16 object-contain transition-opacity duration-500 absolute ${
                    isExpanded ? 'opacity-0' : 'opacity-100'
                  }`}
                />
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
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {renderVendorContext()}
        {renderSearchBar()}
        {renderMainNavigation(onLinkClick)}
        {renderQuickAccess(onLinkClick)}
      </div>

      <div className="flex-shrink-0 border-t border-gray-100 px-4 py-5">
        {showFullContent && (
          <Link
            to="/profile"
            onClick={onLinkClick}
            className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3"
          >
            {renderAvatar('large')}
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900">
                {currentUser?.full_name ?? currentUser?.username ?? 'John Doe'}
              </span>
              <span className="text-xs text-gray-500">{USER_ROLE}</span>
            </div>
            <ChevronRight className="ml-auto h-4 w-4 text-gray-400" />
          </Link>
        )}

        {!showFullContent && !isMobile && (
          <div className="p-1 flex justify-center">{renderAvatar('small')}</div>
        )}

        <div className="mt-3 space-y-1">
          <Link
            to="/settings"
            onClick={onLinkClick}
            className={`sidebar-link group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:shadow-sm ${
              showFullContent ? '' : 'justify-center'
            }`}
          >
            <Settings className="flex-shrink-0 h-4 w-4 text-gray-500 group-hover:text-gray-700" />
            {showFullContent && <span className="ml-3">Settings</span>}
          </Link>
          <Link
            to="/logout"
            onClick={onLinkClick}
            className={`sidebar-link group flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-red-600 hover:shadow-sm ${
              showFullContent ? '' : 'justify-center'
            }`}
          >
            <LogOut className="flex-shrink-0 h-4 w-4 text-gray-500 group-hover:text-red-500" />
            {showFullContent && <span className="ml-3">Sign out</span>}
          </Link>
        </div>
      </div>
    </div>
  )

  if (isMobile) {
    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open sidebar</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="h-full w-64 p-0">
            <NavigationContent onLinkClick={() => setMobileOpen(false)} />
          </SheetContent>
        </Sheet>
      </>
    )
  }

  return (
    <div
      className={`bg-white border-r border-gray-200 shadow-sm ${
        isExpanded ? 'w-64' : 'w-16'
      } transition-all duration-700 ease-in-out ${className}`}
    >
      <div className="h-full">
        <NavigationContent />
      </div>
    </div>
  )
}

export function MobileSidebarTrigger() {
  const isMobile = useMediaQuery('(max-width: 768px)')

  if (!isMobile) return null

  return <Sidebar />
}
