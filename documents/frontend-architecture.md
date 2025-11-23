# Omni-Stock — Frontend Architecture (v1.0)

This document defines the official frontend structure, patterns, and rules for Omni-Stock.  
All GitHub Copilot Agents MUST follow this architecture exactly.

The frontend uses:

- **React + Vite**
- **TypeScript**
- **React Query**
- **React Hook Form + Zod**
- **Feature-Driven Architecture**
- **Supabase for image upload pipeline**
- **ShadCN UI (optional but recommended)**

---

# 🎯 FRONTEND GOALS

The frontend must be:

- Maintainable  
- Modular  
- Scalable  
- Easy for junior → senior developers to understand  
- Based on repeatable patterns  
- Future-proof for marketplace and customer-facing expansion  

This architecture is designed to match real startup engineering standards using modern best practices.

---

# 📁 FOLDER STRUCTURE (MANDATORY)

```
src/
  features/
    auth/
      api/
      components/
      hooks/
      pages/
      schema/
    inventory/
      api/
      components/
      hooks/
      pages/
      schema/
    vendors/
      api/
      components/
      hooks/
      pages/
      schema/
    dashboard/
      api/
      components/
      hooks/
      pages/
      schema/
  shared/
    components/
    hooks/
    lib/
    types/
  app/
    routes/
    providers/
    layout/
```

## ❗ REQUIRED RULES:

1. **All data fetching MUST live in `/api/` under each feature.**
2. **All business logic MUST live in reusable hooks (`/hooks`).**
3. **All forms must use React Hook Form + Zod schemas located in `/schema`.**
4. **Pages MUST contain ONLY:**
   - layout  
   - component composition  
   - no logic  
   - no async code  
5. **Components MUST remain presentational.**
6. **Shared folder MUST contain only generic reusable code.**
7. **Each feature must be isolated and self-contained.**

---

# 📦 FEATURE STRUCTURE TEMPLATE

Each feature follows this template:

```
<feature>/
  api/
    getSomething.ts
    createSomething.ts
    updateSomething.ts
    deleteSomething.ts
  components/
    SomethingCard.tsx
    SomethingForm.tsx
    SomethingTable.tsx
  hooks/
    useSomething.ts
    useCreateSomething.ts
    useUpdateSomething.ts
  pages/
    SomethingPage.tsx
    SomethingDetailsPage.tsx
  schema/
    somethingSchema.ts
```

This keeps logic and UI cleanly separated.

---

# 🔥 REACT QUERY REQUIREMENTS

All network interactions MUST use React Query.

## Example mutation file:

```ts
import { useMutation } from '@tanstack/react-query';
import { api } from '@/shared/lib/api';

export const useCreateItem = () => {
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post('/inventory/', payload);
      return res.data;
    },
    onSuccess: () => {
      // invalidate lists if needed
    },
  });
};
```

Rules:

- No fetch calls inside components.
- No async logic inside components.
- No inline business logic.

---

# 📚 FORM HANDLING (React Hook Form + Zod)

ALL forms MUST use:

- `react-hook-form`
- `@hookform/resolvers/zod`
- Zod validation schemas located inside `/schema`

Example schema:

```ts
import { z } from 'zod';

export const itemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  condition: z.string(),
  category: z.string(),
});
```

---

# 🧱 COMPONENT DESIGN RULES

### Components MUST:
- Be presentational  
- Not fetch data  
- Not contain forms directly (forms go in their own components)  
- Not contain business logic  
- Be reusable  

### Components MUST NOT:
- Call APIs directly  
- Hold complex state  
- Maintain global state  
- Exceed 200–250 lines  

---

# 🧠 HOOKS DESIGN RULES

Hooks MUST:

- Encapsulate business logic  
- Encapsulate React Query logic  
- Encapsulate derived state  
- Remain pure (only handle logic)  
- Be named `useSomething`  

Hooks MUST NOT:

- Render UI  
- Contain JSX  
- Import components  

Example:

```ts
export const useInventoryList = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/inventory/').then((r) => r.data),
  });
};
```

---

# 🧩 SHARED MODULES

```
src/shared/components/  → UI components usable anywhere
src/shared/hooks/       → truly generic hooks
src/shared/types/       → global TypeScript types
src/shared/lib/         → axios client, helpers
```

Shared modules MUST be:

- Generic  
- Without domain logic  
- Without feature-specific references  

---

# 🖼️ SUPABASE IMAGE PIPELINE

### Frontend Workflow:

1. User selects an image file  
2. Upload to Supabase:  
   ```ts
   const { data, error } = await supabase.storage
     .from('product-images')
     .upload(path, file);
   ```
3. Retrieve the public URL  
4. Send URL to backend as string  
5. Backend stores it in database  

Frontend MUST NOT store images itself.

---

# 🚀 ROUTING

Files under `src/app/routes/` define page routes.  
Pages inside features plug into these routes, example:

```
/inventory
/inventory/:id
/vendors
/login
```

Routing MUST remain minimal and feature-based.

---

# 🧪 FRONTEND TESTING POLICY

### Tests required (post-MVP):

- Zod validation tests  
- Form submission tests  
- React Query hook tests (mocked)  
- Rendering tests for key components  

Tests MUST live inside each feature:

```
features/<feature>/tests/
```

---

# 🔮 FUTURE FRONTEND EXPANSION

This architecture supports:

- Multi-image galleries  
- Search + filtering  
- Vendor public pages  
- Marketplace pages  
- Customer accounts  
- Analytics dashboards  
- Tagging + categorization  
- Price history graphs  

---

# END OF FRONTEND ARCHITECTURE (v1.0)
