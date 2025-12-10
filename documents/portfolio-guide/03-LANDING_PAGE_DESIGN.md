# Landing Page Design Specification

> Make a killer first impression with a professional landing page

---

## Overview

The landing page is the **first thing hiring managers see** when they click your portfolio link. It should:
1. Explain what Omni-Stock does in 5 seconds
2. Look visually impressive
3. Showcase your frontend skills
4. Provide easy access to try the app

---

## Page Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                           HEADER (Sticky)                           │
├─────────────────────────────────────────────────────────────────────┤
│                           HERO SECTION                              │
├─────────────────────────────────────────────────────────────────────┤
│                         FEATURES SECTION                            │
├─────────────────────────────────────────────────────────────────────┤
│                         PRODUCT PREVIEW                             │
├─────────────────────────────────────────────────────────────────────┤
│                        TESTIMONIALS (Mock)                          │
├─────────────────────────────────────────────────────────────────────┤
│                          CTA SECTION                                │
├─────────────────────────────────────────────────────────────────────┤
│                            FOOTER                                   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Section Details

### 1. Header (Navigation)

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Logo]                      Features  About  GitHub    [Sign Up]   │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Sticky header with blur backdrop on scroll
- Logo links to landing page
- "Features" scrolls to features section
- "About" scrolls to product preview
- "GitHub" opens repo in new tab
- "Sign Up" button uses brand-primary color
- Mobile: Hamburger menu

**Code Pattern:**
```tsx
<header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
  <nav className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
    <Logo />
    <div className="hidden md:flex items-center gap-8">
      <a href="#features" className="text-sm text-slate-600 hover:text-slate-900">
        Features
      </a>
      {/* ... */}
    </div>
    <Button>Sign Up Free</Button>
  </nav>
</header>
```

---

### 2. Hero Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│               Your collection, organized.                           │
│                                                                     │
│    The smart inventory system for collectors and resellers.         │
│    Track items across vendors, manage stock, and grow your          │
│    business — all in one place.                                     │
│                                                                     │
│         [Get Started Free]      [View Demo →]                       │
│                                                                     │
│                    ┌─────────────────────┐                          │
│                    │   Product Screenshot │                         │
│                    │    or Animated Demo  │                         │
│                    └─────────────────────┘                          │
│                                                                     │
│              🏆 500+ collectors  ⭐ 4.9 rating  🔒 Secure            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Headline: Large, bold, centered
- Subheadline: 2-3 sentences explaining value
- Two CTAs: Primary (filled) and Secondary (outlined)
- Product mockup or animated preview
- Social proof strip (can be mocked for portfolio)

**Design Tokens:**
- Headline: `text-4xl md:text-6xl font-bold text-slate-900`
- Subheadline: `text-lg md:text-xl text-slate-600 max-w-2xl`
- Background: Subtle gradient `bg-gradient-to-b from-brand-primary-soft to-white`

**Code Pattern:**
```tsx
<section className="relative overflow-hidden bg-gradient-to-b from-brand-primary-soft/30 to-white py-20 md:py-32">
  <div className="max-w-6xl mx-auto px-4 text-center">
    <h1 className="text-4xl md:text-6xl font-bold text-slate-900 tracking-tight">
      Your collection, <span className="text-brand-primary">organized.</span>
    </h1>
    <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
      The smart inventory system for collectors and resellers.
      Track items across vendors, manage stock, and grow your business.
    </p>
    <div className="mt-10 flex flex-wrap justify-center gap-4">
      <Button size="lg" className="rounded-full px-8">
        Get Started Free
      </Button>
      <Button variant="outline" size="lg" className="rounded-full px-8">
        View Demo <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
    {/* Product screenshot */}
    <div className="mt-16 relative">
      <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
      <img 
        src="/screenshots/dashboard-preview.png"
        alt="Omni-Stock Dashboard"
        className="rounded-xl shadow-2xl border mx-auto"
      />
    </div>
  </div>
</section>
```

---

### 3. Features Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    Everything you need to manage                    │
│                        your collection                              │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  📦            │  │  🏪            │  │  ☁️            │      │
│  │  Smart         │  │  Multi-Vendor   │  │  Cloud         │      │
│  │  Inventory     │  │  Support        │  │  Storage       │      │
│  │                │  │                 │  │                 │      │
│  │  Track items   │  │  Organize items │  │  Your images   │      │
│  │  with detailed │  │  by vendor for  │  │  stored        │      │
│  │  metadata      │  │  easy mgmt      │  │  securely      │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐     │
│  │  📊            │  │  🔍            │  │  📱            │      │
│  │  Analytics     │  │  Quick Search   │  │  Mobile Ready   │     │
│  │  Dashboard     │  │  & Filters      │  │                 │      │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- 6 feature cards in 3x2 grid (2x3 on mobile)
- Each card has: Icon, Title, Description
- Icons: Use Lucide React icons
- Cards: Subtle border, hover elevation

**Feature Content:**

| Icon | Title | Description |
|------|-------|-------------|
| Package | Smart Inventory | Track items with detailed metadata including condition, value, and purchase info |
| Store | Multi-Vendor Support | Organize inventory by vendor to see exactly what's in each location |
| Cloud | Cloud Image Storage | Upload and store item photos securely with Supabase storage |
| BarChart3 | Analytics Dashboard | Get insights into your collection with charts and statistics |
| Search | Quick Search & Filters | Find any item instantly with powerful search and filter options |
| Smartphone | Mobile Ready | Manage your inventory on the go with a fully responsive design |

**Code Pattern:**
```tsx
const features = [
  {
    icon: Package,
    title: "Smart Inventory",
    description: "Track items with detailed metadata including condition, value, and purchase info"
  },
  // ...
]

<section id="features" className="py-20 bg-white">
  <div className="max-w-6xl mx-auto px-4">
    <div className="text-center mb-16">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
        Everything you need to manage your collection
      </h2>
      <p className="mt-4 text-lg text-slate-600">
        Powerful features to help you organize, track, and grow
      </p>
    </div>
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title} className="p-6 hover:shadow-lg transition-shadow">
          <feature.icon className="h-10 w-10 text-brand-primary" />
          <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
          <p className="mt-2 text-slate-600">{feature.description}</p>
        </Card>
      ))}
    </div>
  </div>
</section>
```

---

### 4. Product Preview Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌────────────────────────┐      Built for collectors,             │
│  │                        │      by collectors                      │
│  │   [Screenshot of       │                                        │
│  │    inventory list]     │      ✓ TCG Cards (Pokémon, Magic,      │
│  │                        │        Yu-Gi-Oh)                        │
│  │                        │      ✓ Video Games & Consoles          │
│  │                        │      ✓ Fashion & Luxury Items           │
│  │                        │      ✓ Designer Toys & Figures          │
│  └────────────────────────┘      ✓ Jewelry & Watches               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Two-column layout (image left, text right)
- Switches on mobile (stacks vertically)
- Checklist of use cases
- Optional: Animated screenshot carousel

---

### 5. Testimonials Section (Mock)

**Note:** Since this is a portfolio project, mock testimonials are acceptable. Be transparent in interviews that these are placeholder content.

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    What collectors are saying                       │
│                                                                     │
│  ┌──────────────────────┐  ┌──────────────────────┐                │
│  │ "Omni-Stock made     │  │ "Finally, an         │                │
│  │ managing my TCG      │  │ inventory app that   │                │
│  │ inventory so much    │  │ understands what     │                │
│  │ easier!"             │  │ collectors need."    │                │
│  │                      │  │                      │                │
│  │ — Sarah M.           │  │ — Alex K.            │                │
│  │   Card Collector     │  │   Reseller           │                │
│  └──────────────────────┘  └──────────────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

---

### 6. Final CTA Section

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│                    Ready to organize your collection?               │
│                                                                     │
│                    [Get Started Free]                               │
│                                                                     │
│                    No credit card required.                         │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Gradient or colored background (brand-primary-soft)
- Single prominent CTA
- Reassurance text below

---

### 7. Footer

**Layout:**
```
┌─────────────────────────────────────────────────────────────────────┐
│  [Logo]                                                             │
│                                                                     │
│  Product        Resources       Connect                             │
│  • Features     • Documentation • GitHub                            │
│  • Pricing      • API Reference • Twitter                           │
│  • Roadmap      • Changelog     • LinkedIn                          │
│                                                                     │
│  ───────────────────────────────────────────────────────────────    │
│  © 2024 Omni-Stock. Built with React, Django, and ❤️                │
│                                                                     │
│  [Portfolio Note: This is a personal project by YOUR_NAME]          │
└─────────────────────────────────────────────────────────────────────┘
```

**Requirements:**
- Link columns (can be mock links)
- Social media links (GitHub required, others optional)
- Copyright notice
- **Portfolio Note:** Add a subtle note that this is a portfolio project

---

## Mobile Considerations

| Section | Mobile Adaptation |
|---------|-------------------|
| Header | Hamburger menu replaces nav links |
| Hero | Smaller fonts, stacked CTAs |
| Features | 1-column grid |
| Product Preview | Image stacks above text |
| Testimonials | 1-column, carousel optional |
| Footer | Stacked columns |

---

## Animation Ideas

### Subtle & Professional

1. **Fade-in on scroll** - Elements fade up as they enter viewport
2. **Number count-up** - Stats animate from 0 to value
3. **Hover elevations** - Cards lift slightly on hover
4. **Button micro-interactions** - Subtle scale on hover

### Implementation with Framer Motion

```tsx
import { motion } from 'framer-motion'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
}

<motion.div {...fadeInUp}>
  <FeatureCard />
</motion.div>
```

---

## File Structure

```
src/features/landing/
├── pages/
│   └── LandingPage.tsx
├── components/
│   ├── LandingHeader.tsx
│   ├── HeroSection.tsx
│   ├── FeaturesSection.tsx
│   ├── ProductPreview.tsx
│   ├── TestimonialsSection.tsx
│   ├── CTASection.tsx
│   └── LandingFooter.tsx
└── data/
    ├── features.ts
    └── testimonials.ts
```

---

## Implementation Checklist

- [ ] Create landing feature folder structure
- [ ] Build responsive header with navigation
- [ ] Build hero section with gradient background
- [ ] Add product screenshot/mockup
- [ ] Build features grid with icons
- [ ] Build product preview with use cases
- [ ] Add testimonials section (mock data)
- [ ] Build final CTA section
- [ ] Build footer with links
- [ ] Add scroll animations
- [ ] Test on mobile devices
- [ ] Update routing to show landing for unauthenticated users

---

## Routes Update

```tsx
// AppRoutes.tsx
<Routes>
  {/* Public routes */}
  <Route path="/" element={<LandingPage />} />
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  
  {/* Protected routes with AppLayout */}
  <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/inventory" element={<CollectiblesListPage />} />
    {/* ... */}
  </Route>
</Routes>
```
