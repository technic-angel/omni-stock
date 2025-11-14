Frontend scaffold (Vite + React + TypeScript + Tailwind)

Quick start (after you `cd frontend`):

```bash
# install deps
npm install
# dev server
npm run dev
```

Notes:
- This scaffold creates a minimal app and a typed axios wrapper at `src/api/http.ts`.
- Tailwind is configured in `tailwind.config.cjs` and entry CSS is `src/index.css`.
- To add shadcn/ui and its design system, follow the official shadcn guide after deps are installed.
- To scaffold components for the collectibles list and auth, I'll add files under `src/features/collectibles` next.
