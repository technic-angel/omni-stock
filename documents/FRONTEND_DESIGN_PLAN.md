# Omni-Stock Frontend Design & Implementation Plan

**Date:** November 24, 2025  
**Status:** Design Planning Phase  
**Target:** Production-Ready Collectibles Inventory Management System  
**Tech Stack:** React 18 + Vite + TypeScript + ShadCN UI + Tailwind CSS + Lucide React

---

## Table of Contents

1. [Design System Overview](#1-design-system-overview)
2. [Collapsible Sidebar (Primary Focus)](#2-collapsible-sidebar-primary-focus)
3. [Complete Layout Architecture](#3-complete-layout-architecture)
4. [Component Library Strategy](#4-component-library-strategy)
5. [Implementation Timeline](#5-implementation-timeline)
6. [Million.js Evaluation](#6-millionjs-evaluation)
7. [ShadCN vs Alternatives](#7-shadcn-vs-alternatives)
8. [Additional Recommendations](#8-additional-recommendations)

---

## 1. Design System Overview

### 1.1 Brand Identity (HARD REQUIREMENTS)

**Color Palette:**
```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#FFFFFF',           // Main background (MUST BE WHITE)
          surface: '#F9FBFB',      // Card backgrounds
          surfaceAlt: '#F3F7F7',   // Hover states
          border: '#E5EBEE',       // Borders/dividers
          primary: '#37C5B8',      // Tiffany blue (PRIMARY ACCENT)
          primarySoft: '#E6F7F5',  // Chip backgrounds
          primaryDark: '#0F9A8C',  // Hover states
        },
        text: {
          main: '#0F172A',         // Headings
          body: '#4B5563',         // Body text
          muted: '#6B7280',        // Secondary text
          subtle: '#9CA3AF',       // Meta labels
        },
        state: {
          goodBg: '#E6F7F5',
          goodText: '#0F766E',
          newBg: '#E0F2FE',
          newText: '#0369A1',
        }
      }
    }
  }
}
```

**Typography:**
- Font: System font stack (Tailwind's default `font-sans`)
- H1: `text-2xl md:text-3xl font-semibold text-slate-900`
- Body: `text-sm text-slate-600`
- Meta: `text-xs text-slate-500`

**Target Audience:**
- Collectors (TCG cards, fashion, beauty, toys, figures)
- Must appeal to both women (fashion-forward) AND men (nerdy collectors)
- Visual vibe: Clean, modern, neutral, NOT overly feminine or gamery

---

## 2. Collapsible Sidebar (Primary Focus)

### 2.1 Design Concept

**Desktop Behavior (≥ 768px):**
- **Collapsed State (Default):** Narrow 64px width, shows only icons
- **Expanded State:** 240px width, shows icons + labels
- **Trigger:** Click logo to toggle between states
- **Persistence:** State saved to localStorage

**Mobile Behavior (< 768px):**
- **Hidden by default:** Sidebar not visible
- **Drawer overlay:** Slides in from left when hamburger clicked
- **Full-height:** Uses ShadCN `Sheet` component
- **Click outside to close**

### 2.2 Implementation Code

#### Sidebar Component Structure

```typescript
// src/app/layout/Sidebar.tsx
import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/shared/lib/utils'
import { Sheet, SheetContent, SheetTrigger } from '@/shared/components/ui/sheet'
import { Button } from '@/shared/components/ui/button'
import { 
  LayoutDashboard, 
  Package, 
  Plus, 
  Building2, 
  Heart, 
  User, 
  LogOut,
  Menu
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'All Items', href: '/inventory', icon: Package },
  { label: 'Add New Item', href: '/inventory/new', icon: Plus },
  { label: 'Vendors', href: '/vendors', icon: Building2 },
  { label: 'Grails & Wishlist', href: '/wishlist', icon: Heart },
]

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const location = useLocation()

  // Load saved state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded')
    if (saved !== null) {
      setIsExpanded(saved === 'true')
    }
  }, [])

  // Save state to localStorage
  const toggleExpanded = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem('sidebar-expanded', String(newState))
  }

  const isActive = (href: string) => location.pathname === href

  return (
    <>
      {/* Mobile: Hamburger Button */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger asChild className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            className="fixed top-4 left-4 z-50"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        
        {/* Mobile: Drawer Content */}
        <SheetContent side="left" className="w-64 p-0">
          <MobileSidebarContent 
            navItems={navItems} 
            isActive={isActive}
            onItemClick={() => setIsMobileOpen(false)}
          />
        </SheetContent>
      </Sheet>

      {/* Desktop: Collapsible Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col fixed left-0 top-0 h-screen bg-white border-r border-brand-border transition-all duration-300',
          isExpanded ? 'w-60' : 'w-16'
        )}
      >
        {/* Logo Section */}
        <div className="flex items-center h-16 px-4 border-b border-brand-border">
          <button
            onClick={toggleExpanded}
            className="flex items-center gap-3 w-full group"
          >
            {/* Gem Icon (Always Visible) */}
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primarySoft flex-shrink-0 transition-all group-hover:bg-brand-primary/20">
              <svg 
                viewBox="0 0 24 24" 
                className="h-5 w-5 text-brand-primary"
                fill="currentColor"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>

            {/* Wordmark (Visible when expanded) */}
            {isExpanded && (
              <div className="flex flex-col items-start overflow-hidden">
                <span className="text-xs font-light text-slate-500">Omni</span>
                <span className="text-sm font-bold text-brand-primary -mt-1">STOCK</span>
              </div>
            )}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      active 
                        ? 'bg-brand-primarySoft text-brand-primary' 
                        : 'text-slate-600 hover:bg-brand-surfaceAlt hover:text-slate-900'
                    )}
                  >
                    <Icon className={cn(
                      'h-5 w-5 flex-shrink-0',
                      active ? 'text-brand-primary' : 'text-slate-500'
                    )} />
                    {isExpanded && (
                      <span className="text-sm font-medium truncate">
                        {item.label}
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Bottom Section: User Actions */}
        <div className="border-t border-brand-border p-2">
          <Link
            to="/account"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-brand-surfaceAlt hover:text-slate-900 transition-colors"
          >
            <User className="h-5 w-5 flex-shrink-0 text-slate-500" />
            {isExpanded && <span className="text-sm font-medium">Account</span>}
          </Link>
          
          <button
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-slate-600 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {isExpanded && <span className="text-sm font-medium">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

// Mobile Sidebar Content (Shared with Sheet)
function MobileSidebarContent({ 
  navItems, 
  isActive, 
  onItemClick 
}: {
  navItems: NavItem[]
  isActive: (href: string) => boolean
  onItemClick: () => void
}) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 h-16 px-6 border-b border-brand-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-brand-primarySoft">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-brand-primary" fill="currentColor">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-light text-slate-500">Omni</span>
          <span className="text-sm font-bold text-brand-primary -mt-1">STOCK</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-4">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onItemClick}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    active 
                      ? 'bg-brand-primarySoft text-brand-primary' 
                      : 'text-slate-600 hover:bg-brand-surfaceAlt'
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-brand-border p-4 space-y-2">
        <Link
          to="/account"
          onClick={onItemClick}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-slate-600 hover:bg-brand-surfaceAlt"
        >
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Account</span>
        </Link>
        <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50">
          <LogOut className="h-5 w-5" />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </div>
    </div>
  )
}
```

#### ShadCN Components Needed

```bash
# Install required ShadCN components
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add button
```

---

## 3. Complete Layout Architecture

### 3.1 App Layout Structure

```typescript
// src/app/layout/AppLayout.tsx
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
```

### 3.2 Top Navbar Component

```typescript
// src/app/layout/TopNavbar.tsx
import { Button } from '@/shared/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Plus, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TopNavbar() {
  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-sm border-b border-brand-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left: Breadcrumbs or Page Title (Mobile shows logo on small screens) */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-primarySoft">
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-brand-primary" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>

          {/* Desktop: Page Context */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-slate-900">Dashboard</h1>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm"
              className="hidden sm:flex border-brand-border text-slate-700 hover:bg-brand-surfaceAlt"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>

            <Link to="/inventory/new">
              <Button 
                size="sm"
                className="rounded-full bg-brand-primary hover:bg-brand-primaryDark text-white"
              >
                <Plus className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Add Item</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </Link>

            <Avatar className="h-8 w-8">
              <AvatarImage src="/api/placeholder/32/32" />
              <AvatarFallback className="bg-brand-primarySoft text-brand-primary text-xs">
                MB
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}
```

### 3.3 Dashboard Page Layout

```typescript
// src/features/dashboard/pages/DashboardPage.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Package, Building2, DollarSign, TrendingUp } from 'lucide-react'
import useDashboardSummary from '../hooks/useDashboardSummary'

export default function DashboardPage() {
  const { data: summary, isLoading } = useDashboardSummary()

  if (isLoading) return <DashboardSkeleton />

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div>
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
          Your collection, organized.
        </h1>
        <p className="text-sm text-slate-600">
          Track, manage, and grow your collectibles inventory with ease.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Items"
          value={summary?.total_items || 0}
          icon={Package}
          color="primary"
        />
        <StatCard
          title="From Vendors"
          value={summary?.total_vendors || 0}
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Estimated Value"
          value={`$${summary?.total_value?.toLocaleString() || 0}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Added This Month"
          value={summary?.items_this_month || 0}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recent Items (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-lg">Recent Items</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Recent items list */}
              <RecentItemsList />
            </CardContent>
          </Card>
        </div>

        {/* Right: Quick Stats & Actions (1/3 width) */}
        <div className="space-y-4">
          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-sm">Top Vendors</CardTitle>
            </CardHeader>
            <CardContent>
              <TopVendorsList />
            </CardContent>
          </Card>

          <Card className="bg-brand-surface border-brand-border">
            <CardHeader>
              <CardTitle className="text-sm">Low Stock Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <LowStockList />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  const colorClasses = {
    primary: 'bg-brand-primarySoft text-brand-primary',
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <Card className="bg-brand-surface border-brand-border hover:border-brand-primary transition-colors">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${colorClasses[color]}`}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{title}</p>
      </CardContent>
    </Card>
  )
}
```

### 3.4 Inventory List Layout

```typescript
// src/features/inventory/pages/CollectiblesListPage.tsx
import { useState } from 'react'
import { Input } from '@/shared/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/components/ui/tabs'
import { Search, Grid, List as ListIcon } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import CollectibleCard from '../components/CollectibleCard'
import CollectiblesTable from '../components/CollectiblesTable'
import InventoryFilters from '../components/InventoryFiltersForm'

export default function CollectiblesListPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')

  return (
    <div className="space-y-6">
      {/* Search & Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search items, SKUs, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-brand-border bg-white"
          />
        </div>
        
        <div className="flex gap-2">
          <InventoryFilters />
          
          {/* View Toggle */}
          <div className="flex rounded-lg border border-brand-border bg-white p-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-brand-primarySoft' : ''}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-brand-primarySoft' : ''}
            >
              <ListIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="border-b border-brand-border bg-transparent p-0">
          <TabsTrigger
            value="all"
            className="rounded-none border-b-2 border-transparent px-4 pb-3 data-[state=active]:border-brand-primary data-[state=active]:text-slate-900"
          >
            All items
          </TabsTrigger>
          <TabsTrigger value="cards">Cards</TabsTrigger>
          <TabsTrigger value="games">Video Games</TabsTrigger>
          <TabsTrigger value="fashion">Fashion</TabsTrigger>
          <TabsTrigger value="beauty">Beauty</TabsTrigger>
          <TabsTrigger value="toys">Toys & Figures</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Grid of CollectibleCard components */}
            </div>
          ) : (
            <CollectiblesTable />
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

### 3.5 Item Card Component

```typescript
// src/features/inventory/components/CollectibleCard.tsx
import { Card, CardContent } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Building2, Calendar, DollarSign, MoreVertical } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/components/ui/dropdown-menu'
import { Button } from '@/shared/components/ui/button'

interface CollectibleCardProps {
  item: {
    id: number
    name: string
    image_url?: string
    category: string
    condition: string
    vendor: string
    price: number
    updated_at: string
  }
}

export default function CollectibleCard({ item }: CollectibleCardProps) {
  const conditionColors = {
    'New': 'bg-state-newBg text-state-newText',
    'Very Good': 'bg-state-goodBg text-state-goodText',
    'Mint in Box': 'bg-state-goodBg text-state-goodText',
    'Used': 'bg-slate-100 text-slate-600',
  }

  return (
    <Card className="group bg-brand-surface border-brand-border hover:border-brand-primary hover:shadow-lg transition-all cursor-pointer">
      <CardContent className="p-4">
        {/* Image */}
        <div className="relative aspect-square mb-3 overflow-hidden rounded-lg bg-slate-100">
          {item.image_url ? (
            <img
              src={item.image_url}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="h-12 w-12 text-slate-300" />
            </div>
          )}
          
          {/* Actions Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8 bg-white/90 hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuItem>Duplicate</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Content */}
        <div className="space-y-2">
          {/* Category Badge */}
          <Badge variant="secondary" className="text-[10px] bg-slate-100 text-slate-600">
            {item.category}
          </Badge>

          {/* Name */}
          <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 leading-snug">
            {item.name}
          </h3>

          {/* Condition */}
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${conditionColors[item.condition] || conditionColors['Used']}`}>
              {item.condition}
            </span>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between pt-2 border-t border-brand-border">
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{item.vendor}</span>
            </div>
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-900">
              <DollarSign className="h-3 w-3" />
              {item.price.toFixed(2)}
            </div>
          </div>

          {/* Updated */}
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <Calendar className="h-3 w-3" />
            <span>Updated {new Date(item.updated_at).toLocaleDateString()}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 4. Component Library Strategy

### 4.1 ShadCN UI Components to Install

```bash
# Core components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add input
npx shadcn-ui@latest add label
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add checkbox
npx shadcn-ui@latest add switch

# Layout components
npx shadcn-ui@latest add sheet
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add separator
npx shadcn-ui@latest add avatar

# Data display
npx shadcn-ui@latest add table
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add scroll-area

# Feedback
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add progress

# Navigation
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add popover
npx shadcn-ui@latest add tooltip

# Forms
npx shadcn-ui@latest add form
npx shadcn-ui@latest add command
```

### 4.2 Icon Library Setup

```bash
# Install Lucide React (modern Font Awesome alternative, better with ShadCN)
npm install lucide-react

# Alternative: Font Awesome (if you prefer)
npm install @fortawesome/fontawesome-svg-core
npm install @fortawesome/free-solid-svg-icons
npm install @fortawesome/react-fontawesome
```

**Recommendation:** Use **Lucide React** instead of Font Awesome because:
- Better TypeScript support
- Tree-shakeable (smaller bundle)
- Consistent with ShadCN UI design language
- More modern stroke-based icons
- Easier to customize colors/sizes

**Icon Usage Example:**
```typescript
import { Home, Package, Plus, Search, Filter } from 'lucide-react'

<Home className="h-5 w-5 text-brand-primary" />
```

---

## 5. Implementation Timeline

### Phase 1: Foundation (Week 1) - 40 hours

**Priority: Core Layout & Design System**

#### Day 1-2 (16h): Design System Setup
- [ ] Install ShadCN UI components (all listed above)
- [ ] Configure Tailwind with brand colors
- [ ] Install Lucide React icons
- [ ] Create base layout components (`AppLayout`, `Sidebar`, `TopNavbar`)
- [ ] Implement collapsible sidebar with localStorage persistence
- [ ] Add mobile drawer navigation
- [ ] Test responsive breakpoints

**Deliverable:** Working sidebar that collapses/expands, responsive mobile drawer

#### Day 3-4 (16h): Error Boundaries & Auth Guards
- [ ] Create `ErrorBoundary` component with fallback UI
- [ ] Implement route-level error boundaries
- [ ] Create `ProtectedRoute` wrapper component
- [ ] Add `NoAuthView` component (for logged-out users)
- [ ] Add `RestrictedAccessView` component (insufficient permissions)
- [ ] Create `LoadingState` skeleton components
- [ ] Add global toast notification system

**Deliverable:** Error handling + auth guards working across all routes

#### Day 5 (8h): Dashboard Layout
- [ ] Create `DashboardPage` with hero section
- [ ] Implement stats cards grid
- [ ] Add "Recent Items" section
- [ ] Add "Top Vendors" sidebar panel
- [ ] Style with ShadCN components + Tiffany blue accents

**Deliverable:** Polished dashboard matching design spec

---

### Phase 2: Core Features (Week 2) - 40 hours

**Priority: Inventory Management**

#### Day 6-7 (16h): Inventory List Page
- [ ] Create `CollectiblesListPage` layout
- [ ] Implement search bar with icon
- [ ] Add tab navigation (All, Cards, Games, Fashion, etc.)
- [ ] Create `CollectibleCard` component with proper styling
- [ ] Add grid/list view toggle
- [ ] Implement basic filtering UI
- [ ] Add pagination controls

**Deliverable:** Functional inventory list with search, filters, tabs

#### Day 8-9 (16h): Item Details & Forms
- [ ] Create `CollectibleEditPage` layout
- [ ] Build `CollectibleForm` with all fields
- [ ] Implement image upload with Supabase
- [ ] Add image preview component
- [ ] Create delete confirmation dialog
- [ ] Add form validation with Zod
- [ ] Implement optimistic updates

**Deliverable:** Full CRUD operations with image upload working

#### Day 10 (8h): Vendors Page
- [ ] Create `VendorsPage` layout
- [ ] Build vendor cards/list
- [ ] Add "Items from [Vendor]" filtered view
- [ ] Create vendor stats display

**Deliverable:** Vendor management page

---

### Phase 3: Enhanced Features (Week 3) - 40 hours

**Priority: Polish & Advanced Features**

#### Day 11-12 (16h): Advanced Filtering & Sorting
- [ ] Enhance `InventoryFiltersForm` with all filter types:
  - Price range slider
  - Date range picker
  - Multi-select categories
  - Condition filter
  - Vendor filter
- [ ] Add sorting dropdown (Name, Price, Date, Quantity)
- [ ] Implement filter persistence (URL params)
- [ ] Add "Clear filters" button
- [ ] Show active filter count badge

**Deliverable:** Advanced filtering system

#### Day 13-14 (16h): Dashboard Charts & Analytics
- [ ] Install Recharts: `npm install recharts`
- [ ] Create `InventoryValueChart` (line chart: intake vs projected)
- [ ] Create `CategoryBreakdownChart` (pie chart)
- [ ] Add `LowStockAlert` component
- [ ] Create `RecentActivityFeed` component
- [ ] Add "Quick Actions" panel

**Deliverable:** Analytics dashboard with charts

#### Day 15 (8h): Bulk Operations
- [ ] Add multi-select checkboxes to inventory list
- [ ] Create bulk action toolbar (appears when items selected)
- [ ] Implement bulk delete
- [ ] Implement bulk category update
- [ ] Add CSV export functionality

**Deliverable:** Bulk operations working

---

### Phase 4: Polish & Optimization (Week 4) - 40 hours

**Priority: Performance & UX**

#### Day 16-17 (16h): Mobile Optimization
- [ ] Test all pages on mobile devices
- [ ] Fix touch targets (min 44px)
- [ ] Optimize image loading (lazy loading)
- [ ] Add pull-to-refresh on mobile
- [ ] Test drawer navigation on all pages
- [ ] Add mobile-specific shortcuts

**Deliverable:** Fully mobile-optimized app

#### Day 18-19 (16h): Loading States & Skeletons
- [ ] Create skeleton loaders for all pages
- [ ] Add loading spinners for mutations
- [ ] Implement optimistic updates everywhere
- [ ] Add empty states with illustrations
- [ ] Create "No results" states for filters

**Deliverable:** Professional loading/empty states

#### Day 20 (8h): Final Testing & Bug Fixes
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Accessibility audit (keyboard navigation, screen readers)
- [ ] Performance audit (Lighthouse scores)
- [ ] Fix any remaining bugs
- [ ] Update documentation

**Deliverable:** Production-ready frontend

---

### Total Timeline Summary

| Phase | Duration | Focus | Hours |
|-------|----------|-------|-------|
| Phase 1 | Week 1 | Foundation, Layout, Error Handling | 40h |
| Phase 2 | Week 2 | Core Features (Inventory CRUD) | 40h |
| Phase 3 | Week 3 | Advanced Features & Charts | 40h |
| Phase 4 | Week 4 | Polish, Mobile, Performance | 40h |
| **Total** | **4 weeks** | **Full MVP Frontend** | **160h** |

**Estimated Calendar Time:** 4-6 weeks (depending on availability)

---

## 6. Million.js Evaluation

### 6.1 What is Million.js?

Million.js is a lightweight virtual DOM replacement that claims 70% faster rendering by using a block-based compiler approach instead of traditional virtual DOM diffing.

### 6.2 Should You Use It?

**❌ RECOMMENDATION: NO - Skip Million.js for now**

**Reasons:**

1. **Premature Optimization**
   - Your app is in early development
   - React 18 is already fast enough for your use case
   - Focus on features, not micro-optimizations

2. **Limited Adoption**
   - Small community compared to React
   - Fewer resources/tutorials
   - Higher risk of bugs/compatibility issues

3. **React Query Already Optimizes**
   - Your app uses React Query for data fetching
   - React Query handles caching/memoization
   - Most performance gains come from data management, not rendering

4. **Potential Breaking Changes**
   - Million.js is still experimental
   - May break with React 19
   - Could cause issues with ShadCN UI components

5. **Your App's Bottlenecks Will Be:**
   - Network requests (backend API calls) ← React Query handles this
   - Image loading ← Use lazy loading
   - Large lists ← Use virtualization (`react-window`)
   - NOT React rendering speed

### 6.3 When to Consider Million.js

**Only reconsider if:**
- You have **measured performance issues** (use React DevTools Profiler)
- You're rendering **10,000+ items** in lists
- You have **complex animations** causing lag
- You've **already optimized** everything else

### 6.4 Better Performance Strategies

**Focus on these instead:**

1. **React Query Caching**
   ```typescript
   // Already implemented - keeps data fresh
   const { data } = useQuery({
     queryKey: ['collectibles'],
     queryFn: fetchCollectibles,
     staleTime: 5 * 60 * 1000, // 5 minutes
   })
   ```

2. **Code Splitting**
   ```typescript
   // Lazy load routes
   const DashboardPage = lazy(() => import('./features/dashboard/pages/DashboardPage'))
   ```

3. **Image Optimization**
   ```typescript
   // Use loading="lazy" and proper sizes
   <img 
     src={item.image_url} 
     loading="lazy"
     decoding="async"
   />
   ```

4. **Virtual Scrolling** (for large lists)
   ```bash
   npm install react-window
   ```

5. **Memoization** (when needed)
   ```typescript
   const MemoizedCard = memo(CollectibleCard)
   ```

**Verdict:** Million.js is a distraction. Focus on shipping features.

---

## 7. ShadCN vs Alternatives

### 7.1 Is ShadCN the Right Choice?

**✅ YES - ShadCN UI is the best choice for your project**

### 7.2 Why ShadCN UI Wins

| Criteria | ShadCN UI | Material UI | Ant Design | Chakra UI |
|----------|-----------|-------------|------------|-----------|
| **Design Match** | ✅ Perfect (clean, modern) | ❌ Material look conflicts | ❌ Too enterprise-y | ✅ Good |
| **Customization** | ✅ Full control (copy-paste) | ⚠️ Theme overrides complex | ⚠️ Theme overrides complex | ✅ Easy theming |
| **Bundle Size** | ✅ Tiny (tree-shakeable) | ❌ Large (~400KB) | ❌ Large (~500KB) | ✅ Small |
| **Tailwind Integration** | ✅ Native | ❌ Conflicts | ❌ Conflicts | ⚠️ Separate styling |
| **TypeScript** | ✅ Excellent | ✅ Good | ✅ Good | ✅ Good |
| **Accessibility** | ✅ Radix UI primitives | ✅ Good | ✅ Good | ✅ Good |
| **Learning Curve** | ✅ Easy (Tailwind knowledge) | ⚠️ Medium | ⚠️ Medium | ⚠️ Medium |
| **Maintenance** | ✅ You own the code | ⚠️ Dependency updates | ⚠️ Dependency updates | ⚠️ Dependency updates |

### 7.3 ShadCN Advantages for Your Project

1. **Design Flexibility**
   - You can tweak every component to match Tiffany blue brand
   - No fighting against Material Design or Ant Design opinions
   - Components live in your codebase (full control)

2. **Tailwind Native**
   - Your design spec already uses Tailwind classes
   - No CSS-in-JS conflicts
   - Consistent styling approach

3. **Modern Aesthetic**
   - Clean, minimal, fashion-forward look
   - Appeals to both female (fashion) and male (tech) collectors
   - Matches your "collector app" vibe perfectly

4. **Bundle Size**
   - Only include components you use
   - No bloated runtime
   - Faster page loads

5. **Future-Proof**
   - You own the code
   - No breaking changes from library updates
   - Easy to maintain long-term

### 7.4 Alternatives Considered

**Material UI (MUI)**
- ❌ Too "Material Design" opinionated
- ❌ Hard to achieve Tiffany blue aesthetic
- ❌ Large bundle size
- ✅ Good for enterprise B2B apps
- **Verdict:** Wrong aesthetic for collectors

**Ant Design**
- ❌ Chinese enterprise look (not fashion-forward)
- ❌ Too formal/corporate
- ✅ Great for admin dashboards
- **Verdict:** Too enterprise, conflicts with brand

**Chakra UI**
- ✅ Good component API
- ✅ Accessible
- ⚠️ Different styling paradigm (not Tailwind)
- ⚠️ Less "trendy" than ShadCN
- **Verdict:** Solid choice, but ShadCN better fits your stack

**Headless UI (Tailwind Labs)**
- ✅ Tailwind native
- ✅ Unstyled primitives
- ❌ More work (need to style everything)
- **Verdict:** ShadCN builds on this, so use ShadCN

### 7.5 Final Recommendation

**Stick with ShadCN UI** because:
- ✅ Perfect fit for your design spec
- ✅ Already using Tailwind
- ✅ Modern, collector-friendly aesthetic
- ✅ Small bundle size
- ✅ Full customization control
- ✅ Active community + great docs

---

## 8. Additional Recommendations

### 8.1 Must-Have Features

#### 1. Image Upload with Preview
```typescript
// src/shared/components/ImageUpload.tsx
import { useState, useCallback } from 'react'
import { Upload, X } from 'lucide-react'
import { Button } from './ui/button'

export function ImageUpload({ onUpload, defaultImage }) {
  const [preview, setPreview] = useState(defaultImage)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = useCallback(async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result)
    reader.readAsDataURL(file)

    // Upload to Supabase
    setUploading(true)
    try {
      const url = await uploadToSupabase(file)
      onUpload(url)
    } catch (error) {
      console.error('Upload failed:', error)
    } finally {
      setUploading(false)
    }
  }, [onUpload])

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative aspect-square w-48 rounded-xl overflow-hidden border-2 border-brand-border">
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8"
            onClick={() => setPreview(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-48 aspect-square border-2 border-dashed border-brand-border rounded-xl hover:border-brand-primary cursor-pointer transition-colors">
          <Upload className="h-8 w-8 text-slate-400 mb-2" />
          <span className="text-sm text-slate-600">Upload Image</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
      {uploading && <p className="text-sm text-slate-500">Uploading...</p>}
    </div>
  )
}
```

#### 2. Empty States
```typescript
// src/shared/components/EmptyState.tsx
import { PackageOpen } from 'lucide-react'
import { Button } from './ui/button'

export function EmptyState({ 
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-brand-primarySoft p-4 mb-4">
        <Icon className="h-8 w-8 text-brand-primary" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-sm text-slate-600 mb-6 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-brand-primary hover:bg-brand-primaryDark">
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
```

#### 3. Toast Notifications
```typescript
// Already included in ShadCN, just configure
// src/app/providers/AppProviders.tsx
import { Toaster } from '@/shared/components/ui/toaster'

export default function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster /> {/* Add this */}
      </AuthProvider>
    </QueryClientProvider>
  )
}

// Usage in components:
import { useToast } from '@/shared/hooks/use-toast'

const { toast } = useToast()

toast({
  title: "Item added!",
  description: "Your collectible has been added to inventory.",
})
```

#### 4. Search with Debounce
```typescript
// src/shared/hooks/useDebounce.ts
import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Usage:
const [search, setSearch] = useState('')
const debouncedSearch = useDebounce(search, 300)

const { data } = useQuery({
  queryKey: ['collectibles', debouncedSearch],
  queryFn: () => fetchCollectibles({ search: debouncedSearch })
})
```

### 8.2 Progressive Enhancements

#### After MVP, Add:

1. **Keyboard Shortcuts**
   - `Cmd/Ctrl + K` - Global search
   - `Cmd/Ctrl + N` - New item
   - `/` - Focus search
   - `Esc` - Close modals

2. **Drag & Drop**
   - Reorder items
   - Drag to upload images
   - Drag between categories

3. **Offline Support**
   - Service worker caching
   - Offline indicator
   - Queue failed mutations

4. **Dark Mode** (Future)
   - Add theme toggle
   - Store preference
   - Tailwind dark: classes

5. **Export/Import**
   - CSV export
   - CSV import with validation
   - PDF reports

### 8.3 Performance Checklist

- [ ] Lazy load routes with `React.lazy()`
- [ ] Use `loading="lazy"` on images
- [ ] Implement virtual scrolling for 100+ items
- [ ] Add pagination instead of infinite scroll
- [ ] Optimize images (use WebP, proper sizes)
- [ ] Add service worker for caching
- [ ] Use `React.memo()` on expensive components
- [ ] Debounce search inputs
- [ ] Use React Query's stale-while-revalidate

### 8.4 Accessibility Checklist

- [ ] All interactive elements have focus states
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works everywhere
- [ ] Screen reader announcements for dynamic content
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] All buttons have descriptive text/aria-label
- [ ] Skip to main content link

---

## 9. File Structure Reference

```
frontend/src/
├── app/
│   ├── layout/
│   │   ├── AppLayout.tsx          ← Main layout wrapper
│   │   ├── Sidebar.tsx            ← Collapsible sidebar ⭐
│   │   ├── TopNavbar.tsx          ← Top navigation bar
│   │   └── MobileMenu.tsx         ← Mobile drawer menu
│   ├── providers/
│   │   └── AppProviders.tsx       ← React Query, Auth, Toast
│   └── routes/
│       ├── AppRoutes.tsx          ← Route definitions
│       └── ProtectedRoute.tsx     ← Auth guard
│
├── features/
│   ├── auth/
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── NoAuthView.tsx     ← For logged-out users
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   └── providers/
│   │       └── AuthProvider.tsx
│   │
│   ├── dashboard/
│   │   ├── components/
│   │   │   ├── StatCard.tsx
│   │   │   ├── RecentItemsList.tsx
│   │   │   ├── TopVendorsList.tsx
│   │   │   ├── LowStockList.tsx
│   │   │   ├── InventoryValueChart.tsx  ← Recharts
│   │   │   └── CategoryBreakdownChart.tsx
│   │   └── pages/
│   │       └── DashboardPage.tsx
│   │
│   ├── inventory/
│   │   ├── components/
│   │   │   ├── CollectibleCard.tsx        ← Grid view card
│   │   │   ├── CollectiblesTable.tsx      ← List view table
│   │   │   ├── CollectibleForm.tsx        ← Create/Edit form
│   │   │   ├── InventoryFiltersForm.tsx   ← Advanced filters
│   │   │   └── ImageUpload.tsx            ← Image upload widget
│   │   └── pages/
│   │       ├── CollectiblesListPage.tsx   ← Main inventory
│   │       └── CollectibleEditPage.tsx
│   │
│   └── vendors/
│       ├── components/
│       │   ├── VendorCard.tsx
│       │   └── VendorForm.tsx
│       └── pages/
│           └── VendorsPage.tsx
│
├── shared/
│   ├── components/
│   │   ├── ui/                    ← ShadCN components (auto-generated)
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx      ← Error boundary wrapper
│   │   ├── LoadingState.tsx       ← Skeleton loaders
│   │   └── RestrictedView.tsx     ← Insufficient permissions
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   └── lib/
│       ├── utils.ts               ← cn() helper
│       └── api.ts                 ← Axios config
│
└── styles/
    └── globals.css                ← Tailwind + custom styles
```

---

## 10. Quick Start Commands

```bash
# 1. Install ShadCN UI components
npx shadcn-ui@latest add button card input label select sheet tabs \
  dialog badge skeleton toast avatar dropdown-menu table separator

# 2. Install icon library
npm install lucide-react

# 3. Install charting library
npm install recharts

# 4. Install utilities
npm install clsx tailwind-merge

# 5. Configure Tailwind (add to tailwind.config.ts)
# See section 1.1 for color configuration

# 6. Start development
npm run dev
```

---

## 11. Summary & Next Steps

### What We've Planned

✅ **Collapsible Sidebar** - Detailed implementation with code examples  
✅ **Complete Layout** - Dashboard, inventory, vendors pages  
✅ **Design System** - Tiffany blue brand colors, ShadCN UI  
✅ **Timeline** - 4-week implementation plan (160 hours)  
✅ **Million.js** - Evaluated and rejected (premature optimization)  
✅ **ShadCN vs Alternatives** - ShadCN is the best choice  
✅ **Recommendations** - Image upload, error boundaries, empty states, performance

### Immediate Action Items

1. **This Week: Foundation**
   - Install all ShadCN components
   - Configure Tailwind colors
   - Build collapsible sidebar
   - Implement error boundaries

2. **Next Week: Core Features**
   - Build inventory list page
   - Create item cards
   - Add CRUD operations
   - Connect image upload

3. **Week 3: Polish**
   - Add charts to dashboard
   - Implement advanced filtering
   - Add bulk operations
   - Mobile optimization

4. **Week 4: Ship**
   - Final testing
   - Performance audit
   - Accessibility check
   - Deploy to production

### Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **UI Framework** | ShadCN UI | Perfect design match, Tailwind native, full control |
| **Icons** | Lucide React | Modern, tree-shakeable, better than Font Awesome |
| **Charts** | Recharts | React-native, responsive, easy to style |
| **Million.js** | ❌ Skip | Premature optimization, React is fast enough |
| **Sidebar** | Collapsible + Mobile Drawer | Best UX for desktop and mobile |

---

## 12. References & Resources

- **ShadCN UI Docs:** https://ui.shadcn.com/
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Lucide Icons:** https://lucide.dev/icons/
- **Recharts:** https://recharts.org/
- **React Query:** https://tanstack.com/query/latest
- **Design Spec:** `/documents/omni-stock-ui-design-spec.md`
- **Frontend Architecture:** `/documents/frontend-architecture.md`

---

**Document Version:** 1.0  
**Last Updated:** November 24, 2025  
**Status:** Ready for Implementation
