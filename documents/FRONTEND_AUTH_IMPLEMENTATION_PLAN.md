# Frontend Auth & Profile Implementation Plan

## 🎯 Morning Session Goals

Build complete auth UX: landing page for guests → login/register → authenticated dashboard → user profile with edit capabilities.

**Just type "go" in the chat and we start with Task 1!**

---

# 📚 TUTORIAL SECTION: Understanding the Data Flow

Before we build, let's understand how data flows from Django → React. This is the mental model you'll use throughout.

---

## 🌊 The Complete Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (React)                                  │
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   Component │───▶│  React Hook │───▶│  API Layer  │───▶│  HTTP Client│  │
│  │  (UI Layer) │    │  (useQuery) │    │ (authApi.ts)│    │  (axios)    │  │
│  └─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘  │
│        ▲                   │                                     │          │
│        │                   │                                     ▼          │
│        │            ┌──────▼──────┐                        HTTP Request     │
│        │            │ Query Cache │                        with JWT token   │
│        │            │ (automatic) │                              │          │
│        │            └─────────────┘                              │          │
└────────┼─────────────────────────────────────────────────────────┼──────────┘
         │                                                         │
         │  Re-render with                                         ▼
         │  new data                               ┌───────────────────────────┐
         │                                         │      BACKEND (Django)     │
         │                                         │                           │
         │                                         │  ┌─────────────────────┐  │
         │                                         │  │  DRF ViewSet        │  │
         │                                         │  │  GET /api/v1/auth/me│  │
         │                                         │  └──────────┬──────────┘  │
         │                                         │             │             │
         │                                         │             ▼             │
         │                                         │  ┌─────────────────────┐  │
         │                                         │  │  Serializer         │  │
         │                                         │  │  UserProfileSerializer│ │
         │                                         │  └──────────┬──────────┘  │
         │                                         │             │             │
         │                                         │             ▼             │
         │                                         │  ┌─────────────────────┐  │
         │                                         │  │  Database (PostgreSQL)│ │
         │                                         │  └─────────────────────┘  │
         │                                         │                           │
         │                                         └───────────────────────────┘
         │                                                         │
         └─────────────────────────────────────────────────────────┘
                                JSON Response
```

---

## 📦 Layer 1: Zod Schemas (Validation & Types)

**What is Zod?** A TypeScript-first schema validation library. It does TWO things:
1. **Runtime validation** - Checks data at runtime (e.g., form inputs)
2. **Type generation** - Creates TypeScript types from schemas

### Example: Profile Schema

```typescript
// features/auth/schema/profileSchema.ts
import { z } from 'zod'

// 1. Define the schema - this describes the SHAPE of the data
export const profileSchema = z.object({
  id: z.number(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().nullable(),      // Can be null
  bio: z.string().nullable(),
  profile_picture_url: z.string().url().nullable(),
  vendor: z.object({
    id: z.number(),
    name: z.string(),
  }).nullable(),
  date_joined: z.string(),           // ISO date string from Django
})

// 2. Infer the TypeScript type FROM the schema
//    This means your type and validation are ALWAYS in sync!
export type Profile = z.infer<typeof profileSchema>

// 3. Schema for updating profile (only editable fields, all optional)
export const profileUpdateSchema = z.object({
  username: z.string().min(3).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().max(500, 'Bio must be under 500 characters').nullable().optional(),
})

export type ProfileUpdate = z.infer<typeof profileUpdateSchema>
```

### How Zod Works with Forms

```typescript
// In a form component
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { profileUpdateSchema, ProfileUpdate } from '../schema/profileSchema'

const ProfileEditForm = () => {
  const {
    register,        // Connect inputs to form state
    handleSubmit,    // Wrap submit handler with validation
    formState: { errors },  // Validation errors
  } = useForm<ProfileUpdate>({
    resolver: zodResolver(profileUpdateSchema),  // 👈 Zod validates on submit
    defaultValues: { username: '', email: '' },
  })

  const onSubmit = (data: ProfileUpdate) => {
    // 🎉 `data` is GUARANTEED to be valid here!
    // TypeScript knows the exact shape
    console.log(data.username)  // ✅ Type-safe
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('username')} />
      {errors.username && <p>{errors.username.message}</p>}  {/* "Username must be at least 3 characters" */}
    </form>
  )
}
```

---

## 🔌 Layer 2: API Functions (HTTP Calls)

**The API layer makes HTTP requests.** It's a thin wrapper around axios.

### Example: Auth API

```typescript
// features/auth/api/authApi.ts
import { http } from '../../../shared/lib/http'  // axios instance with JWT interceptor

// ─────────────────────────────────────────────────────────────
// GET /api/v1/auth/me/ - Fetch current user's profile
// ─────────────────────────────────────────────────────────────
export async function getMe() {
  const { data } = await http.get('/v1/auth/me/')
  return data  // Returns: { id, username, email, phone, bio, profile_picture_url, vendor, date_joined }
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/auth/me/ - Update profile fields
// ─────────────────────────────────────────────────────────────
export async function updateProfile(updates: Record<string, any>) {
  const { data } = await http.patch('/v1/auth/me/', updates)
  return data
}

// ─────────────────────────────────────────────────────────────
// PATCH /api/v1/auth/me/ - Upload profile picture (multipart)
// ─────────────────────────────────────────────────────────────
export async function uploadProfilePicture(file: File) {
  const formData = new FormData()
  formData.append('profile_picture', file)
  
  const { data } = await http.patch('/v1/auth/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/password/change/ - Change password
// ─────────────────────────────────────────────────────────────
export async function changePassword(oldPassword: string, newPassword: string) {
  const { data } = await http.post('/v1/auth/password/change/', {
    old_password: oldPassword,
    new_password: newPassword,
  })
  return data
}

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/password/reset/ - Request password reset email
// ─────────────────────────────────────────────────────────────
export async function requestPasswordReset(email: string) {
  const { data } = await http.post('/v1/auth/password/reset/', { email })
  return data
}

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/password/reset/confirm/ - Set new password with token
// ─────────────────────────────────────────────────────────────
export async function confirmPasswordReset(uid: string, token: string, newPassword: string) {
  const { data } = await http.post('/v1/auth/password/reset/confirm/', {
    uid,
    token,
    new_password: newPassword,
  })
  return data
}

// ─────────────────────────────────────────────────────────────
// POST /api/v1/auth/logout/ - Blacklist refresh token
// ─────────────────────────────────────────────────────────────
export async function logoutWithBlacklist(refreshToken: string) {
  await http.post('/v1/auth/logout/', { refresh: refreshToken })
}
```

---

## ⚛️ Layer 3: React Query Hooks (State Management)

**React Query handles:**
- Fetching data (`useQuery`)
- Caching responses
- Background refetching
- Loading/error states
- Mutations with cache invalidation (`useMutation`)

### useQuery: Fetching Data

```typescript
// features/auth/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/authApi'
import type { Profile } from '../schema/profileSchema'

export const useProfile = () => {
  return useQuery<Profile>({
    // 1. queryKey: Unique identifier for this query (used for caching)
    queryKey: ['profile', 'me'],
    
    // 2. queryFn: The function that fetches data
    queryFn: getMe,
    
    // 3. Options:
    staleTime: 5 * 60 * 1000,  // Consider data fresh for 5 minutes
    retry: 1,                   // Only retry once on failure
  })
}

// Usage in a component:
const ProfilePage = () => {
  const { 
    data: profile,    // The fetched data (undefined until loaded)
    isLoading,        // true while fetching
    isError,          // true if fetch failed
    error,            // The error object
    refetch,          // Function to manually refetch
  } = useProfile()

  if (isLoading) return <Skeleton />
  if (isError) return <div>Error: {error.message}</div>

  return <div>Hello, {profile.username}!</div>
}
```

### useMutation: Changing Data

```typescript
// features/auth/hooks/useUpdateProfile.ts
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '../api/authApi'
import type { ProfileUpdate } from '../schema/profileSchema'

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    // 1. mutationFn: The function that makes the API call
    mutationFn: (updates: ProfileUpdate) => updateProfile(updates),

    // 2. onSuccess: Called when mutation succeeds
    onSuccess: (newData) => {
      // Invalidate the cache so useProfile refetches fresh data
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
      
      // OR: Optimistically update the cache immediately
      // queryClient.setQueryData(['profile', 'me'], newData)
    },

    // 3. onError: Called when mutation fails
    onError: (error) => {
      console.error('Failed to update profile:', error)
    },
  })
}

// Usage in a component:
const ProfileField = ({ fieldName, value }) => {
  const { mutateAsync, isPending } = useUpdateProfile()

  const handleSave = async (newValue: string) => {
    try {
      await mutateAsync({ [fieldName]: newValue })
      // Success! Cache is automatically invalidated
    } catch (err) {
      // Handle error
    }
  }

  return (
    <button onClick={() => handleSave('new value')} disabled={isPending}>
      {isPending ? 'Saving...' : 'Save'}
    </button>
  )
}
```

### Query Key Patterns

```typescript
// Query keys are arrays - they form a hierarchy for cache management

['profile', 'me']              // Current user's profile
['profile', 123]               // Profile of user 123
['collectibles']               // All collectibles
['collectibles', { vendor: 5 }] // Collectibles filtered by vendor
['collectible', 42]            // Single collectible

// Invalidating queries:
queryClient.invalidateQueries({ queryKey: ['profile'] })      // Invalidates ALL profile queries
queryClient.invalidateQueries({ queryKey: ['profile', 'me'] }) // Only invalidates current user
```

---

## 🧪 Layer 4: Testing (Vitest + React Testing Library)

### Testing Philosophy

1. **Test hooks** → Mock the API layer, verify React Query behavior
2. **Test components** → Mock the hooks, verify UI behavior
3. **Don't test React Query internals** → Trust the library

### Pattern 1: Testing a Query Hook

```typescript
// features/auth/hooks/useProfile.test.tsx
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useProfile } from './useProfile'
import * as api from '../api/authApi'  // Import the module to mock

describe('useProfile', () => {
  // Helper to wrap hooks in QueryClientProvider
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } }  // Don't retry in tests
    })
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }

  it('fetches and returns profile data', async () => {
    // 1. ARRANGE: Mock the API response
    const mockProfile = {
      id: 1,
      username: 'melissa',
      email: 'melissa@example.com',
      phone: null,
      bio: 'Collectibles enthusiast',
      profile_picture_url: null,
      vendor: null,
      date_joined: '2025-01-01T00:00:00Z',
    }
    const spy = vi.spyOn(api, 'getMe').mockResolvedValue(mockProfile)

    // 2. ACT: Render the hook
    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() })

    // 3. ASSERT: Wait for data to load, verify result
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    
    expect(result.current.data).toEqual(mockProfile)
    expect(spy).toHaveBeenCalledOnce()
  })

  it('handles API errors', async () => {
    // Mock a failed request
    vi.spyOn(api, 'getMe').mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error?.message).toBe('Network error')
  })
})
```

### Pattern 2: Testing a Mutation Hook

```typescript
// features/auth/hooks/useUpdateProfile.test.tsx
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import { useUpdateProfile } from './useUpdateProfile'
import * as api from '../api/authApi'

describe('useUpdateProfile', () => {
  it('calls API and invalidates cache on success', async () => {
    // 1. Setup
    const updatedProfile = { id: 1, username: 'newname', email: 'test@example.com' }
    const spy = vi.spyOn(api, 'updateProfile').mockResolvedValue(updatedProfile)
    
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')
    
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    // 2. Render hook and call mutation
    const { result } = renderHook(() => useUpdateProfile(), { wrapper })

    await waitFor(async () => {
      await result.current.mutateAsync({ username: 'newname' })
    })

    // 3. Verify API was called correctly
    expect(spy).toHaveBeenCalledWith({ username: 'newname' })
    
    // 4. Verify cache was invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['profile', 'me'] })
  })
})
```

### Pattern 3: Testing a Component

```typescript
// features/auth/pages/ProfilePage.test.tsx
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import ProfilePage from './ProfilePage'
import * as profileHook from '../hooks/useProfile'

// Mock the hook entirely
vi.mock('../hooks/useProfile')

describe('ProfilePage', () => {
  it('shows loading skeleton while fetching', () => {
    // Mock hook to return loading state
    vi.mocked(profileHook.useProfile).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any)

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('profile-skeleton')).toBeInTheDocument()
  })

  it('renders profile data when loaded', () => {
    vi.mocked(profileHook.useProfile).mockReturnValue({
      data: {
        id: 1,
        username: 'melissa',
        email: 'melissa@example.com',
        bio: 'Loves collectibles',
      },
      isLoading: false,
      isError: false,
    } as any)

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    expect(screen.getByText('melissa')).toBeInTheDocument()
    expect(screen.getByText('melissa@example.com')).toBeInTheDocument()
    expect(screen.getByText('Loves collectibles')).toBeInTheDocument()
  })

  it('shows error message on failure', () => {
    vi.mocked(profileHook.useProfile).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to load profile'),
    } as any)

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    )

    expect(screen.getByText(/failed to load profile/i)).toBeInTheDocument()
  })
})
```

---

## 🔄 Complete Data Flow Example: Editing Username

Let's trace what happens when a user edits their username:

```
1. USER ACTION
   └── User clicks "Edit" next to username field
       └── ProfileField component switches to edit mode

2. USER TYPES & SUBMITS
   └── User types "newname" and clicks "Save"
       └── Zod validates input via react-hook-form
           └── ✅ Passes: triggers onSubmit
           └── ❌ Fails: shows error message, stops here

3. MUTATION TRIGGERED
   └── Component calls: mutateAsync({ username: 'newname' })
       └── useUpdateProfile hook executes

4. API CALL
   └── updateProfile({ username: 'newname' }) called
       └── axios.patch('/api/v1/auth/me/', { username: 'newname' })
           └── JWT token attached by interceptor

5. DJANGO PROCESSES
   └── UserProfileViewSet.partial_update()
       └── UserProfileSerializer validates & saves
           └── Database updated

6. RESPONSE RETURNED
   └── Django returns updated profile JSON
       └── { id: 1, username: 'newname', email: '...', ... }

7. CACHE INVALIDATED
   └── onSuccess callback fires
       └── queryClient.invalidateQueries(['profile', 'me'])
           └── Marks cached data as stale

8. AUTOMATIC REFETCH
   └── useProfile query sees stale data
       └── Refetches in background
           └── New data arrives

9. UI RE-RENDERS
   └── ProfilePage receives new data via useProfile
       └── ProfileField exits edit mode
           └── Shows "newname" in view mode
```

---

# 📋 Todo List (12 Tasks)

### Phase 1: Guest Experience (Tasks 1-3)
| # | Task | Est. Time |
|---|------|-----------|
| 1 | Landing Page for Guests | 30 min |
| 2 | Guest vs Auth Layout Split | 20 min |
| 3 | User Dropdown & Header Auth | 25 min |

### Phase 2: Profile Core (Tasks 4-7)
| # | Task | Est. Time |
|---|------|-----------|
| 4 | Profile Page (Read View) | 30 min |
| 5 | Profile Edit (Inline Fields) | 40 min |
| 6 | Profile Picture Upload | 45 min |
| 7 | Change Password Form | 25 min |

### Phase 3: Password Reset (Tasks 8-9)
| # | Task | Est. Time |
|---|------|-----------|
| 8 | Forgot/Reset Password Flow | 35 min |
| 9 | Logout with Token Blacklist | 15 min |

### Phase 4: Polish (Tasks 10-12)
| # | Task | Est. Time |
|---|------|-----------|
| 10 | Add Missing shadcn/ui Components | 15 min |
| 11 | Tests for Auth Features | 45 min |
| 12 | Polish & Responsive | 30 min |

**Total Estimated: ~5.5 hours**

---

## 🏗️ Existing Infrastructure

### Already Have ✅
- `AuthProvider` with token state management
- `useAuth` hook (accessToken, isAuthenticated, logout)
- `useLogin` / `useRegister` hooks with React Query
- `LoginPage` / `RegisterPage` (basic forms)
- `ProtectedRoute` wrapper
- `tokenStore` for localStorage
- `http` client (axios) with base URL

### Need to Build 🔨
- Landing page for guests
- Profile page & edit functionality
- User dropdown in header
- Password change/reset flows
- Profile picture upload
- Proper logout with token blacklist

---

## 📁 File Structure (New Files)

```
frontend/src/
├── features/auth/
│   ├── api/
│   │   └── authApi.ts           # ADD: me(), updateProfile(), changePassword(), etc.
│   ├── components/
│   │   ├── UserDropdown.tsx     # NEW: Avatar + dropdown menu
│   │   ├── ProfileField.tsx     # NEW: Inline editable field
│   │   ├── ProfileHeader.tsx    # NEW: Avatar + name section
│   │   ├── ProfilePictureUpload.tsx  # NEW: Upload modal
│   │   └── ChangePasswordForm.tsx    # NEW: Password change form
│   ├── hooks/
│   │   ├── useProfile.ts        # NEW: GET/PATCH /auth/me/
│   │   ├── useChangePassword.ts # NEW: POST /auth/password/change/
│   │   └── usePasswordReset.ts  # NEW: reset flow hooks
│   └── pages/
│       ├── ProfilePage.tsx      # NEW: Full profile view/edit
│       ├── ForgotPasswordPage.tsx   # NEW
│       └── ResetPasswordPage.tsx    # NEW
├── app/
│   ├── layout/
│   │   ├── AppLayout.tsx        # UPDATE: Conditional header
│   │   ├── GuestLayout.tsx      # NEW: Minimal guest header
│   │   └── Header.tsx           # UPDATE: Auth-aware
│   └── routes/
│       └── AppRoutes.tsx        # UPDATE: Add new routes
├── pages/
│   └── LandingPage.tsx          # NEW: Public landing page
└── components/ui/
    ├── avatar.tsx               # ADD via shadcn CLI
    ├── dropdown-menu.tsx        # ADD via shadcn CLI
    ├── dialog.tsx               # ADD via shadcn CLI
    ├── input.tsx                # ADD via shadcn CLI
    ├── label.tsx                # ADD via shadcn CLI
    ├── card.tsx                 # ADD via shadcn CLI
    ├── alert.tsx                # ADD via shadcn CLI
    ├── skeleton.tsx             # ADD via shadcn CLI
    └── toast/                   # ADD via shadcn CLI
```

---

## 🔌 API Integration

### Endpoints to Implement

```typescript
// features/auth/api/authApi.ts - ADD these functions:

// Get current user profile
export async function getMe() {
  const { data } = await http.get('/v1/auth/me/')
  return data // { id, username, email, phone, bio, profile_picture_url, vendor, ... }
}

// Update profile (partial update)
export async function updateProfile(updates: Partial<ProfileUpdate>) {
  const { data } = await http.patch('/v1/auth/me/', updates)
  return data
}

// Update profile picture (multipart)
export async function uploadProfilePicture(file: File) {
  const formData = new FormData()
  formData.append('profile_picture', file)
  const { data } = await http.patch('/v1/auth/me/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return data
}

// Change password
export async function changePassword(currentPassword: string, newPassword: string) {
  const { data } = await http.post('/v1/auth/password/change/', {
    old_password: currentPassword,
    new_password: newPassword
  })
  return data
}

// Request password reset email
export async function requestPasswordReset(email: string) {
  const { data } = await http.post('/v1/auth/password/reset/', { email })
  return data
}

// Confirm password reset with token
export async function confirmPasswordReset(uid: string, token: string, newPassword: string) {
  const { data } = await http.post('/v1/auth/password/reset/confirm/', {
    uid,
    token,
    new_password: newPassword
  })
  return data
}

// Logout (blacklist refresh token)
export async function logoutWithBlacklist(refreshToken: string) {
  await http.post('/v1/auth/logout/', { refresh: refreshToken })
}
```

---

## 🧩 Component Details

### 1. Landing Page (`LandingPage.tsx`)

```
┌─────────────────────────────────────────────────────────────────┐
│  🔷 Omni-Stock                              [Login] [Register]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│           Welcome to Omni-Stock                                 │
│     Track your collectibles inventory with ease                 │
│                                                                 │
│           [Get Started]                                         │
│                                                                 │
│     ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│     │ 📦 Track    │  │ 💰 Value    │  │ 📊 Analyze  │          │
│     │ Inventory   │  │ Portfolio   │  │ Trends      │          │
│     └─────────────┘  └─────────────┘  └─────────────┘          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Features:**
- Hero section with tagline
- 3 feature cards (track, value, analyze)
- CTA button → /register
- Minimal guest header with Login/Register links

---

### 2. User Dropdown (`UserDropdown.tsx`)

```tsx
<DropdownMenu>
  <DropdownMenuTrigger>
    <Avatar>
      {profile_picture_url ? <img /> : <Initials />}
    </Avatar>
    <span>melissa</span>
    <ChevronDown />
  </DropdownMenuTrigger>
  <DropdownMenuContent>
    <DropdownMenuItem onClick={() => navigate('/profile')}>
      <User /> My Profile
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => navigate('/settings')}>
      <Settings /> Settings
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem onClick={handleLogout}>
      <LogOut /> Logout
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

---

### 3. Profile Page (`ProfilePage.tsx`)

**Sections:**
1. **Header**: Avatar + username + email + "Member since"
2. **Profile Fields**: Inline editable fields for username, email, phone, bio
3. **Vendor Link**: Read-only link to associated vendor (if any)
4. **Security**: Change password button

**State:**
- `useProfile()` hook for fetching/caching user data
- Each `ProfileField` has local edit state
- Optimistic updates with rollback on error

---

### 4. Profile Picture Upload (`ProfilePictureUpload.tsx`)

**UX Flow:**
1. Click avatar or "Change Photo" button → opens Dialog
2. Drag-and-drop zone or file picker
3. Preview selected image before upload
4. Upload button → PATCH /auth/me/ with multipart form data
5. Success → close dialog, show new avatar
6. Error → show inline error message

**Validations:**
- File type: JPEG, PNG, GIF, WebP
- Max size: 5MB
- Square crop (optional, can be phase 2)

---

### 5. Inline Profile Field (`ProfileField.tsx`)

```tsx
type ProfileFieldProps = {
  label: string
  value: string
  fieldName: keyof ProfileUpdate
  onSave: (fieldName: string, value: string) => Promise<void>
}

// States:
// - View mode: Display value + [Edit] button
// - Edit mode: Input + [Save] [Cancel] buttons
// - Loading: Input disabled, spinner
// - Error: Show error message below
```

---

## 🛣️ Routing Updates

```tsx
// AppRoutes.tsx - Updated routes

<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />  {/* NEW */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/forgot-password" element={<ForgotPasswordPage />} />  {/* NEW */}
  <Route path="/reset-password/:uid/:token" element={<ResetPasswordPage />} />  {/* NEW */}

  {/* Protected routes */}
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/inventory" element={<CollectiblesListPage />} />
    <Route path="/inventory/:id/edit" element={<CollectibleEditPage />} />
    <Route path="/profile" element={<ProfilePage />} />  {/* NEW */}
    <Route path="/vendors" element={<VendorOverviewPage />} />
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## 🎨 shadcn/ui Components to Add

Run these commands before starting:

```bash
cd frontend
npx shadcn@latest add avatar
npx shadcn@latest add dropdown-menu
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add alert
npx shadcn@latest add skeleton
npx shadcn@latest add toast
```

---

## 🧪 Test Coverage Targets

| Component | Test Focus |
|-----------|------------|
| `useProfile` | Fetches data, caches, handles errors |
| `ProfilePage` | Renders fields, shows loading state |
| `ProfileField` | Edit mode toggle, validation, save |
| `ChangePasswordForm` | Validation, API call, error handling |
| `UserDropdown` | Renders menu, logout works |
| `LandingPage` | Renders hero, feature cards, CTA links |

---

## ⚡ Quick Start Commands

```bash
# 1. Install shadcn components first
cd frontend
npx shadcn@latest add avatar dropdown-menu dialog input label card alert skeleton toast

# 2. Run frontend dev server
npm run dev

# 3. Run tests in watch mode
npm run test

# 4. Check for lint/type errors
npm run lint
npm run type-check
```

---

## 📝 Notes

- **Existing LoginPage/RegisterPage**: Already work, just need minor styling updates
- **Token Refresh**: Already handled by http interceptor
- **Protected Routes**: Already have ProtectedRoute component
- **Mobile First**: Use Tailwind responsive classes (sm:, md:, lg:)

---

## 🚀 Ready to Build!

Start with Task 1 (Landing Page) and work through sequentially. Each task builds on the previous. 

Good morning and happy coding! ☕

---

# 📖 QUICK REFERENCE: Hooks We'll Build

## Query Hooks (Fetching Data)

```typescript
// ─────────────────────────────────────────────────────────────
// useProfile - Fetch current user's profile
// ─────────────────────────────────────────────────────────────
import { useQuery } from '@tanstack/react-query'
import { getMe } from '../api/authApi'

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile', 'me'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,  // Fresh for 5 minutes
  })
}

// Returns: { data, isLoading, isError, error, refetch }
```

## Mutation Hooks (Changing Data)

```typescript
// ─────────────────────────────────────────────────────────────
// useUpdateProfile - Update profile fields
// ─────────────────────────────────────────────────────────────
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateProfile } from '../api/authApi'

export const useUpdateProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    },
  })
}

// Returns: { mutateAsync, isPending, isError, error }

// ─────────────────────────────────────────────────────────────
// useUploadProfilePicture - Upload avatar image
// ─────────────────────────────────────────────────────────────
export const useUploadProfilePicture = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: uploadProfilePicture,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', 'me'] })
    },
  })
}

// ─────────────────────────────────────────────────────────────
// useChangePassword - Change user password
// ─────────────────────────────────────────────────────────────
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }: { oldPassword: string; newPassword: string }) =>
      changePassword(oldPassword, newPassword),
  })
}

// ─────────────────────────────────────────────────────────────
// useRequestPasswordReset - Request reset email
// ─────────────────────────────────────────────────────────────
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => requestPasswordReset(email),
  })
}

// ─────────────────────────────────────────────────────────────
// useConfirmPasswordReset - Set new password with token
// ─────────────────────────────────────────────────────────────
export const useConfirmPasswordReset = () => {
  return useMutation({
    mutationFn: ({ uid, token, newPassword }: { uid: string; token: string; newPassword: string }) =>
      confirmPasswordReset(uid, token, newPassword),
  })
}

// ─────────────────────────────────────────────────────────────
// useLogout - Logout and blacklist token
// ─────────────────────────────────────────────────────────────
export const useLogout = () => {
  const { logout: clearAuth } = useAuth()
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (refreshToken: string) => logoutWithBlacklist(refreshToken),
    onSettled: () => {
      // Always clear local state, even if API call fails
      clearAuth()
      queryClient.clear()  // Clear all cached data
    },
  })
}
```

## Zod Schemas (Validation)

```typescript
// features/auth/schema/profileSchema.ts
import { z } from 'zod'

// Profile from API
export const profileSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  bio: z.string().nullable(),
  profile_picture_url: z.string().url().nullable(),
  vendor: z.object({ id: z.number(), name: z.string() }).nullable(),
  date_joined: z.string(),
})
export type Profile = z.infer<typeof profileSchema>

// Profile update (partial)
export const profileUpdateSchema = z.object({
  username: z.string().min(3, 'Min 3 characters').optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().nullable().optional(),
  bio: z.string().max(500, 'Max 500 characters').nullable().optional(),
})
export type ProfileUpdate = z.infer<typeof profileUpdateSchema>

// Password change
export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>

// Password reset request
export const passwordResetSchema = z.object({
  email: z.string().email('Valid email required'),
})
export type PasswordResetInput = z.infer<typeof passwordResetSchema>

// Password reset confirm
export const passwordResetConfirmSchema = z.object({
  newPassword: z.string().min(8, 'Min 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords must match',
  path: ['confirmPassword'],
})
export type PasswordResetConfirmInput = z.infer<typeof passwordResetConfirmSchema>
```

---

# 🎯 TYPE "GO" TO START!

When you're ready, just type **"go"** and we'll start with Task 1: Landing Page for Guests.

---

*Created: November 29, 2025*
*Last updated: November 29, 2025*
