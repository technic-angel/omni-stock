# Codebase Upgrade ERD / Roadmap

## Phase 0 – Baseline & Prep
- Snapshot current CI / preview status (tests, deploys, curl to register). Document as reference.
- Ensure local dev commands (`make dev-up`, `npm run dev`, `npm run test`) pass so we know what “good” looks like.

## Phase 1 – Tooling / Minor Upgrades
1. Dependency alignment within current majors
   - Update frontend dependencies to latest compatible versions (React 18.x, Router 6.x, Vite 5.x, etc.).
   - Remove unused packages.
2. Frontend lint/format tooling
   - Add ESLint + Prettier configs, scripts (`npm run lint`, `npm run format`).
3. Backend lint/format tooling
   - Add Ruff, Black, isort via `pyproject.toml` / scripts.
4. CI updates
   - Extend GitHub Actions to run frontend lint/tests and backend lint/tests.
5. Documentation refresh
   - README/.env comments explaining Vercel/Render host detection, CORS/CSRF logic.

## Phase 2 – Major Upgrades (per subsystem)
1. React & React Router
   - Move to React 19 + Router 7. Update routes, tests, future flags.
2. Data/state layer
   - Upgrade TanStack Query v5, Redux Toolkit latest; refactor hooks/services.
3. Styling stack
   - Tailwind 4 migration (config, CSS entrypoints, class updates).
4. Build/test tooling
   - Vite 7, Vitest 4+, Cypress updates, TypeScript latest.
5. Form/validation libs
   - react-hook-form, zod, resolvers to latest majors.

Each sub-phase: upgrade deps → run codemods (if available) → fix compile errors → run unit/E2E tests.

## Phase 3 – Documentation & Portfolio Artifacts
- Record summary of upgrade impact for hiring portfolio.
- Update runbooks/README.
- Capture before/after metrics (build times, bundle size).

## Execution Notes
- Work from branch `chore/codebase-hygiene` (or feature-specific branches per phase).
- Before editing, explain the goal and expected changes to keep the roadmap traceable.
- Validate after each phase (tests + builds + deploy check).
