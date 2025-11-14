# Omni-Stock: Delivery Plan (Backend + Frontend)

This document lays out an adjusted multi-week plan to deliver a stable backend API and a functional React frontend. Timeline is aligned with current acceleration (Weeks 1–2 already completed; we are entering the Filtering + Frontend bootstrap phase). It includes: current status, technology stack, phased roadmap (backend + frontend), acceptance gates, and risks.

## Agent Quick Reference Index

Use these anchors for fast jumps when automating tasks:
- [Technology Stack Summary](#technology-stack-summary)
- [Current Status Snapshot](#1-current-status-snapshot-as-of-2025-11-10)
- [Assumptions & Constraints](#2-assumptions-and-constraints)
- [Phased Roadmap](#3-adjusted-phased-roadmap-acceleration-considered)
- [Detailed Weekly Plan](#4-detailed-plan-with-day-by-day-action-items)
- [Frontend Early Task Breakdown](#8-frontend-detailed-task-breakdown-early-phases)
- [Network Layer & Typing Reference](#11-frontend-network-layer--typing-agent-reference)
- [Immediate Next Actions](#9-immediate-next-actions-execution)
- [Ownership & Next Action](#10-ownership--next-action)


## Technology Stack Summary

## Agent Execution Rules

This project uses automation agents and CI to accelerate delivery. The following rules are required for all automation agents (and humans acting as agents) to keep the repository secure, auditable, and consistent. Other agents should reference this section before making any changes.

1. Explain before you edit
  - Before touching files programmatically, post a one-paragraph plan describing what you'll change and why, and list the files you intend to modify.
  - The plan must reference the relevant roadmap anchor(s) (for example: "See `#11-frontend-network-layer--typing-agent-reference` for network-layer changes").

2. Branch per feature / task
  - Always create a local feature branch for any non-trivial change. Use the `feature/<short-description>` pattern (e.g., `feature/frontend-bootstrap`).
  - Make commits on that branch. Push only when a PR is intended for review; do not push private or sensitive drafts to the remote default branch.

3. Todo list & status
  - Update the project's todo list before starting work: set the related todo item's status to `in-progress`.
  - When work completes, update the todo item to `completed` (or create follow-ups if partial).

4. Commit messages & PR descriptions
  - Commit messages should start with a conventional prefix: `feat:`, `fix:`, `docs:`, `test:`, `chore:` and include a short description and the roadmap anchor if relevant.
  - PR descriptions must summarize the plan, list changed files, and reference any OpenAPI or migration impacts.

5. Safety & secrets
  - Never write secrets to committed files. If a change requires a secret, update CI docs (`docs/ci-secrets-and-migrations.md`) and request the secret be added to the appropriate secure store.
  - Sensitive planning documents may remain unstaged if explicitly requested (use `.git/info/exclude` to keep them local). Note this in the PR description if relevant.

6. Tests & verification
  - For code changes, run unit tests and linters locally where feasible before committing.
  - For frontend scaffolds, smoke the app locally (vite dev server) and verify that at least the collectibles list page can hit the dev API or be stubbed.

7. Agent identity & audit
  - Each automated commit or PR must include an identifying line in the description (agent name and timestamp) for auditability.

8. Rollback plan
  - When a change touches migrations or DB schema, include a short rollback/dry-run plan in the PR description and link `docs/ci-secrets-and-migrations.md`.

Agents SHOULD reference this anchor: `#agent-execution-rules`.


Backend:
- Python / Django / Django REST Framework
- PostgreSQL (pg_trgm extension, GIN/BTree indexes)
- JWT auth (SimpleJWT)
- Pytest, coverage, Codecov

Frontend:
- React + Tailwind CSS + shadcn/ui components
- Redux Toolkit (global app state) + TanStack Query (server-state caching)
- Cypress (E2E) + React Testing Library (unit/integration)
- Vite or Next.js (SSR optional) — initial assumption: React+Vite for speed; upgrade to Next.js if SSR/SEO becomes required

Shared Tooling:
- Codecov flags (backend, frontend)
- Linting: ruff (backend), ESLint (frontend)
- Type checking: mypy (backend), TypeScript (frontend)

## 1) Current status snapshot (as of 2025-11-10)

Backend
- Django + DRF app `collectibles` with `Collectible` and nested `CardDetails` models.
- API:
  - Vendor-scoped access in list; guarded create (rejects creating for other vendors).
  - Writable nested `card_details` via explicit `CollectibleSerializer.create/update` with transactions.
  - Basic query-parameter filtering for `card_details.language` and `card_details.market_region`.
- Tests: pytest with factories; coverage XML written to `core_api/coverage.xml`; OpenAPI snapshot test in place.
- OpenAPI: baseline JSON committed; schema includes writable `card_details` (root `api_schema.json` and `core_api/api_schema.json`).
- Dev ergonomics: `core_api/Dockerfile.dev`, `docker-compose.override.yml`, `Makefile` targets for tests and dev shell.
- CI: Matrix tests and OpenAPI snapshot jobs previously green.

Frontend
- Not yet scaffolded in this repo; ready to begin now using OpenAPI baseline and CORS config already in settings.

Outstanding hygiene (Week 0)
- Smoke test run and README “Developer quickstart”.
- CI secrets note (e.g., Codecov) and migration rollback checklist.

## 2) Assumptions and constraints
- Local development runs via Docker Compose; dev image contains test deps for fast iteration.
- JWT auth via `rest_framework_simplejwt`; CORS configured for localhost.
- OpenAPI schema is the contract; changes must update the baseline and tests.
- Production deployment specifics are out of scope here; we focus on dev/staging readiness.

## 3) Adjusted Phased Roadmap (Acceleration Considered)

Weeks 1–2 (Completed): Backend MVP, hardening, edge tests, OpenAPI baseline.

Current Phase (Filtering + Frontend Bootstrap):
- Backend: Introduce `django-filter` FilterSet for `language`, `market_region` (and optional date range).
- Frontend: Bootstrap React + Tailwind + shadcn, set up Redux Toolkit store, TanStack Query provider, authentication skeleton (token obtain/refresh), and basic collectibles list page.

Upcoming Phases:
1. Filtering & Ergonomics (Backend + Frontend integration)
  - Replace manual filtering logic; add pagination clarifications.
  - Frontend list view gains filter controls, loading skeleton, and error boundaries.
2. Data Model Improvement (JSON Field Migration)
  - Migrate `external_ids` to `JSONField` with safe conversion.
  - Frontend displays external IDs as key/value entries, gracefully handling empty/malformed legacy data.
3. Quality Automation (CI Gates)
  - Backend: ruff, mypy integrated.
  - Frontend: ESLint, TypeScript strict mode, Cypress smoke run, frontend coverage reported.
4. Docs, Performance & Governance
  - Backend: refine indexes, document API versioning & deprecation policy.
  - Frontend: caching strategy (TanStack Query prefetch), accessibility (axe/Lighthouse), minor perf tweaks (bundle size, code splitting).
5. Beta Hardening / Optional Extensions
  - Observability, error tracking, feature flags, production rollback runbooks.

Acceptance Gate Each Phase:
- Build PASS (backend + frontend)
- Lint & Typecheck PASS
- Tests PASS (unit/API + E2E smoke)
- Coverage threshold met (e.g., backend ≥ 85%, frontend baseline established)
- OpenAPI updated (backend changes) & UI contract stable

Acceptance gates each week
- Build PASS (local + CI)
- Lint/Typecheck PASS (if enabled)
- Tests PASS (unit/API/E2E smoke)
- OpenAPI baseline aligned for any API changes
- Docs updated and migrations validated (incl. rollback) when applicable

## 4) Detailed plan with day-by-day action items

### Week 0 — Prep and smoke (1–2 days)
Goals: Freeze new features, ensure dev env reproducible, run smoke test, and document quickstart and CI secrets.

- Day 1
  - Announce feature freeze for MVP window and tag the current commit in git (internal milestone).
  - Verify dev environment:
    - Build dev image: `make build-dev`
    - Start services: `make dev-up`
    - Open shell: `make dev-shell`
  - If any build/install issues arise, fix `core_api/Dockerfile.dev` or `docker-compose.override.yml`.

- Day 2
  - Run smoke tests: `make test-docker TEST=collectibles/tests/test_card_details_api.py`
  - Add README “Developer quickstart” (build, up, smoke test, full test with coverage).
  - Create `docs/ci-secrets-and-migrations.md` capturing required CI secrets and a rollback outline for DB migrations.
  - Open a draft PR to confirm CI jobs start; note any secret-dependent steps that are skipped.

Deliverables & acceptance
- README quickstart present; smoke test passes locally; CI starts without blocking on missing secrets; migration rollback doc exists.

#### Week 0 — Tomorrow plan (2025-11-11)

Time-boxed checklist to execute tomorrow. Mark each item as you complete it.

- [ ] 0. Kickoff (5 min)
  - Confirm feature freeze for MVP window (no feature merges without sign-off)
  - Tag current commit (internal milestone) and create a short Slack/notes update

- [ ] 1. Verify dev environment (30–45 min)
  - Build dev image: `make build-dev`
  - Start services: `make dev-up`
  - Open shell: `make dev-shell` (verify Python, pytest, and dev deps installed)
  - Acceptance: Container is up; `pytest --version` works inside container

- [ ] 2. Run smoke tests (15–25 min)
  - Run: `make test-docker TEST=collectibles/tests/test_card_details_api.py`
  - Optional: run full suite with coverage: `make test-ci` (writes `core_api/coverage.xml`)
  - Acceptance: Smoke file passes; optional coverage file generated

- [ ] 3. README Developer quickstart (20–30 min)
  - Add a short section covering: build, up, smoke test, full tests with coverage, and single-file test invocation
  - Acceptance: A new “Developer quickstart” is present in `README.md`, accurate for macOS + Docker

- [ ] 4. CI smoke & secrets check (20–30 min)
  - Open a draft PR (or push a no-op commit) to trigger CI
  - Verify jobs start; note any secret-dependent steps (e.g., Codecov) that are skipped/conditional
  - Acceptance: CI green except for documented, intentionally skipped steps; capture notes

- [ ] 5. CI secrets & rollback notes (20–30 min)
  - Create `docs/ci-secrets-and-migrations.md` outlining:
    - Secrets needed (e.g., CODECOV_TOKEN, if used)
    - Migration rollback steps (backup, staging test, rollback commands)
  - Acceptance: Document present and linked from `docs/project-roadmap.md`

- [ ] 6. Wrap-up (5–10 min)
  - Update the roadmap todo statuses for Week 0 items
  - Jot any blockers or follow-ups for Week 3 kickoff (django-filter)

Notes
- If any step fails (e.g., build), paste the output into a new issue or your notes so it can be addressed immediately.
- Keep each step time-boxed; defer non-critical fixes to a follow-up task.

### Week 1 — Hardening & DX (COMPLETED)
- Day 1–2: Make `CollectibleSerializer` explicit (no `__all__`), mark `user`/`vendor` read-only.
- Day 3: Add `select_related('card_details')` in `CollectibleViewSet.get_queryset()`; minor settings cleanup.
- Day 4–5: Run tests locally and in CI; update README dev/test steps; merge PR.

Deliverables & acceptance
- API safer surface; no N+1 on list; tests green; README updated.

### Week 2 — Edge tests & OpenAPI (COMPLETED)
- Day 1–2: Add negative/edge-case tests (forbidden vendor create, invalid `release_date`, malformed `external_ids`).
- Day 3: Regenerate OpenAPI schema and update baseline.
- Day 4–5: CI snapshot green; coverage artifact generated; merge PR.

Deliverables & acceptance
- Stronger tests; OpenAPI up-to-date; CI green with coverage.

### Current Phase — Filtering & Frontend Bootstrap (NOW)
Backend:
- Add `django-filter` dependency & `CollectibleFilter` (language, market_region, optional release_date range).
- Integrate `DjangoFilterBackend` and ensure query optimization (`select_related('card_details')`).
- Add pagination defaults & document query params.

Frontend:
- Initialize React project with Tailwind + shadcn (component tokens & dark mode ready).
- Configure Redux Toolkit for global UI / auth state; TanStack Query for server state.
- Auth flows: login page (JWT obtain), token refresh handler.
- Collectibles list: fetch & display; loading skeleton; basic error state.

Deliverables & Acceptance:
- Filtered API responses tested.
- Frontend list renders with filters adjusting query & URL params.

### Next Phase — Data Model Improvement (JSON Field Migration)

- Day 1
  - Add `django-filter` to `core_api/requirements-dev.txt` and dev image.
  - Enable `DjangoFilterBackend` in DRF settings or per-viewset.
  - Create `CollectibleFilter` mapping `language` and `market_region` to nested fields.

- Day 2
  - Replace manual filtering in `CollectibleViewSet` with backend + filterset.
  - Write unit/API tests for filters (exact/iexact if desired) and edge cases.

- Day 3
  - Update docs/README with filter parameters and examples.
  - Optional: OpenAPI parameter documentation (drf-spectacular settings for parameters).

- Day 4
  - Frontend: implement filter UI and state management; wire to API using typed client (generated from OpenAPI) or ad-hoc fetch with TS types.

- Day 5
  - QA, small fixes, OpenAPI baseline update if parameter names are formalized; merge PRs.

Deliverables & acceptance
- Filter endpoints pass tests; documented query params; frontend filter UI functions against dev backend.

Backend:
- Migration script (forward & rollback) for `external_ids` → JSONField.
- Data audit script: classify valid vs malformed JSON before migration (log issues).
- Adjust serializers/helper methods (remove manual JSON dump/load wrappers).

Frontend:
- Detail & edit views: external IDs editor (add/remove key-value pairs).
- Validation feedback (empty keys, duplicate keys).

Deliverables & Acceptance:
- Migration applied & rollback tested in staging.
- Frontend gracefully handles empty/malformed data; edit persists JSON.

- Day 1
  - Write migration plan: forward migration steps, data conversion strategy, rollback strategy.
  - Implement schema migration and initial data migration (copy/convert TextField to JSONField in manageable batches if needed).

- Day 2
  - Add migration tests (forward/back). Handle malformed JSON gracefully (coerce to `{}` or `null`).
  - Update model helpers/serializers to treat external_ids as real JSON.

- Day 3
  - Run migrations locally; validate data round-trips; update code paths.
  - Optional: add DB indexes for frequent filters (e.g., language/market_region) in `CardDetails`.

- Day 4
  - Frontend forms: implement create/edit with nested `card_details`; client-side validation.
  - Uploads (if in scope): wire image upload field and test dev media storage.

- Day 5
  - Staging migration dry-run and rollback test; finalize docs; merge PRs.

Deliverables & acceptance
- JSONField migration complete with rollback; tests green; forms working with nested JSON field.

### Quality Automation Phase (after JSON migration)
Repo focus: Make quality checks part of CI and enforce them on PRs.
Frontend focus: Add E2E smoke tests.

- Day 1
  - Add linter (ruff/flake8) config; fix baseline issues in a dedicated PR.

- Day 2
  - Add type checking (mypy or pyright for backend/TS client); fix high-signal errors.

- Day 3
  - Update `.github/workflows/ci.yml` to include lint and type checks; keep Codecov upload conditional on token.

- Day 4
  - Frontend: Add E2E smoke tests (Cypress/Playwright) running against dev backend or mocked with MSW in CI.

- Day 5
  - Ensure CI green across tests, lint, and types; document contribution guidelines.

Deliverables & acceptance
- CI enforces quality gates; E2E smoke green; contribution docs updated.

### Docs, Performance & Governance Phase
Backend focus: Publish API docs, improve performance hotspots, define versioning.
Frontend focus: A11y and UX polish, staging demo.

- Day 1
  - Enhance drf-spectacular settings; generate static docs or host Swagger UI route.

- Day 2
  - Add `select_related`/`prefetch_related` to other hotspots; quick load checks.

- Day 3
  - Add DB indexes for frequent filters if not done; simple performance metrics before/after.

- Day 4
  - Define API versioning strategy (URL or header) and deprecation policy; add docs.

- Day 5
  - Release checklist execution; staging demo and sign-off.

Deliverables & acceptance
- Published API docs; measurable perf improvements; versioning policy documented; stakeholder sign-off.

### Beta Hardening / Optional
- Observability & telemetry (logging standards, minimal tracing, error reporting).
- Feature flags for risky rollouts; progressive delivery plan.
- Production runbook and on-call basics.

Deliverables & acceptance
- Runbooks and dashboards established; feature flags in place where helpful.

## 5) Current progress mapped to phases
- Weeks 1–2 (Backend MVP & Edge Tests): Completed.
- Current Phase (Filtering + Frontend Bootstrap): In progress (to start backend filter + frontend scaffolding).
- JSON Migration: Pending.
- Quality Automation: Pending.
- Docs/Perf/Governance: Pending.
- Beta Hardening: Backlog.

### ER diagram

An annotated ER diagram for the primary models was added to `docs/er-diagram.svg`. This is a simplified visual reference showing the relationships between `Vendor`, `Collectible`, `CardDetails`, `auth_user`, and `UserProfile`. See the SVG file for the diagram.

## 6) Success metrics
- Engineering: CI green on tests+lint+types; < 5% flaky tests; code coverage stable/improving.
- API: OpenAPI baseline diffs only on intentional changes; client integration unblocked.
- Frontend: Core flows (login, list/detail, create/edit with nested details, filters) demonstrable on staging.
- Performance: p50/p95 latencies for key endpoints improved or within acceptable targets.

## 7) Risks and mitigations
- DB migrations: mitigate with staging dry-runs, backups, and rollback scripts.
- API breaking changes: mitigate with versioning, OpenAPI governance, and client comms.
- CI secrets: mitigate with conditional steps and documented secret requirements.

---

## 8) Frontend Detailed Task Breakdown (Early Phases)

Phase 0 (Bootstrap):
- Initialize repo (React + Tailwind + shadcn). Configure PostCSS + Tailwind.
- Add Redux Toolkit store skeleton (auth slice, UI slice) and TanStack Query provider.
- Set up Axios/fetch wrapper with interceptor attaching access token; refresh logic.
- Cypress setup: basic smoke test hitting collectibles list (mock or dev backend).

Phase 1 (Filtering Integration):
- Filter controls (language dropdown, market region dropdown, clear button).
- URL sync (query params reflect active filters; back/forward navigation preserved).
- Loading skeleton + empty state component.
- Basic accessibility review (labels, focus order).

Phase 2 (External IDs UI):
- Key/value editor component with add/remove rows.
- Client-side validation (unique keys, non-empty key).
- Error boundary for invalid server data fallback.

## 9) Immediate Next Actions (Execution)
1. Backend: Add `django-filter` & implement `CollectibleFilter`.
2. Frontend: Bootstrap project (React + Tailwind + shadcn + Redux + TanStack Query) & create collectibles list page.
3. Shared: Define filter query param contract in README (language, market_region, page, page_size).
4. Prepare JSON audit script (management command) to classify `external_ids` validity.

## 10) Ownership & Next Action
Primary immediate focus: Filtering & Frontend Bootstrap. Start backend filtering code first (tests ensure stability), then wire frontend list + filters.

---
Update: Roadmap expanded to include explicit frontend phases and technology choices. This file should be revisited after completing Filtering Phase to mark progress and schedule JSON migration work.

## 11) Frontend Network Layer & Typing (Agent Reference)

This section acts as a canonical reference for other automation agents to scaffold, extend, or refactor the frontend data access layer. Keep changes additive; avoid breaking exported function signatures unless coordinated with backend schema updates.

### Goals
- Centralized HTTP config (timeouts, base URL, auth headers).
- Typed request/response contracts; minimal drift from OpenAPI schema.
- Automatic JWT refresh; single-flight refresh to prevent token stampede.
- Clear error normalization for UI and Cypress tests.
- Easy testability (mock at module boundary with dependency injection).

### File Map (proposed `frontend/src`)
```
api/
  http.ts              # Axios instance, interceptors
  auth.ts              # login/refresh/logout token flows
  collectibles.ts      # endpoint wrappers (list/detail/mutations)
  errors.ts            # normalize server error -> UI shape
  types.ts             # shared TS interfaces (or generated)
hooks/
  useCollectibles.ts   # TanStack Query wrapper
lib/
  queryClient.ts       # Creates and exports QueryClient
utils/
  tokenStore.ts        # In-memory token holder (optionally localStorage fallback)
config/
  env.ts               # Wraps import.meta.env with defaults & validation
```

### Axios Instance Contract (`http.ts`)
Inputs: AxiosRequestConfig (with optional params, data).  
Outputs: AxiosResponse<T>.  
Errors: Throws normalized AxiosError; 401 triggers refresh flow; network errors mapped to `NetworkError` classification.

Required headers:
- `Accept: application/json`
- `Content-Type: application/json`
- `Authorization: Bearer <access>` (injected if token present)

Timeout: 10s (adjust if slow endpoints appear). Retries are handled by TanStack Query, not Axios.

### Refresh Strategy
Single refresh in flight using queue of pending requests:
1. First 401 → call `refresh()`.
2. Subsequent 401s while refreshing → push resolvers to queue.
3. On success: replay queued requests with new token.
4. On failure: reject all; dispatch logout (Redux) & clear tokens.

### Normalized Error Shape
```
interface NormalizedError {
  message: string;
  status?: number;
  fields?: Record<string, string[]>; // validation errors
  raw: unknown;                      // original error for logging
}
```
Mapping rules:
- `{ detail: "..." }` → message.
- Validation dict `{ field: ["msg"] }` → fields + generic "Validation error" message.
- Unknown → `message = 'Unknown error'`.

### Sample Axios Interceptor Skeleton
```ts
// http.ts
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { tokenStore } from '../utils/tokenStore';
import { refresh } from './auth';

let isRefreshing = false;
let queue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null) {
  queue.forEach(cb => cb(token));
  queue = [];
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE ?? '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

http.interceptors.request.use((config: AxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(r => r, async (error: AxiosError) => {
  if (error.response?.status === 401) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refresh();
        tokenStore.setAccess(newToken);
        processQueue(newToken);
      } catch (e) {
        processQueue(null);
        // TODO: dispatch logout
      } finally {
        isRefreshing = false;
      }
    }
    return new Promise(resolve => {
      queue.push(token => {
        if (token && error.config) {
          error.config.headers = { ...(error.config.headers || {}), Authorization: `Bearer ${token}` };
          resolve(http(error.config));
        } else {
          resolve(Promise.reject(error));
        }
      });
    });
  }
  return Promise.reject(error);
});
```

### Query Hook Pattern (`useCollectibles.ts`)
```ts
import { useQuery } from '@tanstack/react-query';
import { fetchCollectibles } from '../api/collectibles';

export function useCollectibles(filters: { language?: string; market_region?: string; page?: number }) {
  return useQuery({
    queryKey: ['collectibles', filters],
    queryFn: () => fetchCollectibles(filters),
    staleTime: 60_000,
    keepPreviousData: true
  });
}
```

### Testing Guidance
- Unit: mock `http` module; assert normalized error shapes.
- Integration: Cypress intercept (`cy.intercept`) for `/collectibles/` to validate filter param encoding.
- Contract drift: optional nightly OpenAPI → type generation diff check.

### Agent Automation Notes
- When adding new endpoint wrappers, append to `api/<resource>.ts`; avoid mixing UI logic.
- Regenerate types only after backend schema change merged & snapshot updated.
- Keep interceptor logic stateless beyond token queue; avoid introducing global mutation outside token management.

### Future Enhancements (Backlog)
- Switch from manual interfaces to generated `types.generated.ts`.
- Introduce zod validation for high-risk payloads (e.g., external_ids) before rendering.
- Add MSW for local storybook-style mocks (if adopted).

Revision Control: Update this section whenever network layer contracts change. Other agents should reference the heading anchor `#11-frontend-network-layer--typing-agent-reference` for automation scripts.

