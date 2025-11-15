# Omni-Stock: Project Roadmap

## 1. Project Vision & Portfolio Goals

*   **Vision**: To build a full-stack, multi-service application for tracking personal collectibles, complete with historical market data scraped from external sources.
*   **Portfolio Goals**: Demonstrate expertise in modern backend (Python/Django), frontend (React/TypeScript), and data engineering (Go, Scraping, Async tasks) practices, along with a professional approach to architecture, testing, and deployment.

## 2. Core Architecture & Deployment Goals

*   **Frontend**: React (Vite) hosted on **Vercel**.
    *   **Deployment Goal**: Continuous Deployment from the `main` branch. Every merge to `main` should trigger an automated build and deployment on Vercel. Preview deployments should be generated for all pull requests.
*   **Backend API**: Django/DRF (Dockerized) hosted on **Render**.
    *   **Deployment Goal**: Continuous Deployment from the `main` branch. Every merge to `main` triggers a new Docker build and deployment on Render. The deployment process must include running database migrations automatically.
*   **Scraper Service**: Go Microservice (Dockerized) hosted on **Render**.
    *   **Deployment Goal**: Deployed as a separate service on Render. Can be triggered via an API call or run on a schedule.
*   **Database**: PostgreSQL hosted on **Supabase**.
    *   **Deployment Goal**: Schema migrations are managed by the Django backend and applied automatically during deployment. A separate staging database should be used for testing migrations before production.
*   **Task Queue**: Redis hosted on **Render** (for Celery).
    *   **Deployment Goal**: Deployed as a managed Redis instance on Render, connected to the backend application.

---

## Phase 1: MVP - The Functional Foundation

**Goal**: A working, deployable, full-stack application for basic inventory management. This proves the ability to build and ship a complete product from scratch.
**Testing Requirement**: All core features in this phase must be accompanied by a robust suite of unit and integration tests. Backend API endpoints must have tests for success cases, failure cases (e.g., validation errors, authentication failures), and permissions. Frontend components should have unit tests for their logic and state management.

*   **Backend (Django)**:
    *   Complete user authentication (Login/Register/Refresh).
    *   Full CRUD API for `Collectibles`.
    *   Finalize basic filtering and pagination.
    *   Configure project for deployment on Render.
*   **Frontend (React)**:
    *   Implement user login, registration, and logout pages.
    *   Create a main dashboard to display a list of a user's collectibles.
    *   Implement forms to create and edit a collectible.
    *   Ensure the UI is clean, responsive, and uses `shadcn/ui` components.
*   **CI/CD & Quality Gates**:
    *   **Goal**: Establish a fully automated CI/CD pipeline that enforces quality and deploys with confidence.
    *   **Automated Testing**: Every push and pull request must trigger the full test suite (backend and frontend). No PR can be merged if tests fail.
    *   **Linting & Static Analysis**: Integrate `ruff` (backend) and `ESLint` (frontend) into the CI pipeline to enforce code style and catch common errors.
    *   **Code Coverage**: Integrate Codecov to track test coverage for both frontend and backend. Set a baseline coverage threshold (e.g., 80%) that must be maintained for PRs to be mergeable.
    *   **Automated Deployments**: Merges to the `main` branch will automatically deploy the frontend to Vercel and the backend to Render.
    *   **E2E Tests**: Implement a basic suite of Cypress E2E tests that run against the preview deployment of a PR to verify critical user flows (e.g., login, create item).
*   **Key Deliverable**: A live application where a user can sign up, log in, and manage their collection of items.

---

## Phase 2: The Data Engine - Scraping & Asynchronous Tasks

**Goal**: Build the unique data-aggregation feature. This demonstrates skills in microservices, data scraping, and handling slow, asynchronous tasks—a very common and valuable engineering challenge.

*   **Scraper Service (Go)**:
    *   Create a new Go microservice in a `/scraper` directory.
    *   Implement a scraper for 1-2 target websites (e.g., a popular card or game marketplace).
    *   The scraper should be runnable as a standalone command.
*   **Database & Backend**:
    *   Create a `PriceHistory` model in Django to store scraped data.
    *   Integrate **Celery** and **Redis** into the Django backend.
    *   Create a management command or an API endpoint that triggers the scraper via a Celery task.
*   **Key Deliverable**: The ability to trigger a background job that fetches real-world price data for a collectible and stores it in the database.

---

## Phase 3: The "Wow" Factor - Visualization & Advanced Features

**Goal**: Polish the application with features that showcase a senior level of product thinking and technical depth. This is what separates a good portfolio project from a great one.

*   **Data Visualization**:
    *   On the frontend, add a price history chart to the collectible detail page using a library like `Recharts`.
    *   Create a new API endpoint in Django to serve the historical price data.
*   **Advanced Search**:
    *   Implement full-text search on the backend using Django's built-in PostgreSQL features, allowing users to search across all their collectibles.
*   **CI/CD & Quality Gates**:
    *   Flesh out the GitHub Actions workflow to include linting, type-checking, and E2E tests (Cypress) for both frontend and backend.
    *   Ensure high test coverage is maintained.
*   **Key Deliverable**: A polished application with engaging data visualizations and a powerful search feature, all backed by a robust, automated quality pipeline.

---

## Future Enhancements (Post-MVP Backlog)

*A list of professional-grade features to discuss in interviews, showing you think about long-term growth and maintenance.*

*   **Observability**: Integrate structured logging and a service like Sentry for error tracking.
*   **User Experience**: Add features like public user profiles, sharing collections, and a "most valuable items" dashboard.
*   **Scalability**: Implement more advanced caching strategies (e.g., caching scraped data).
*   **Testing**: Introduce contract testing between the Django API and the React frontend.

---
## Agent Execution Rules

This project uses automation agents and CI to accelerate delivery. The following rules are required for all automation agents (and humans acting as agents) to keep the repository secure, auditable, and consistent. Other agents should reference this section before making any changes.

1.  **Explain before you edit**: Before touching files, post a plan describing what you'll change and why.
2.  **Branch per feature**: Always create a local feature branch (`feature/<short-description>`).
3.  **Todo list & status**: Update the project's todo list before and after tasks.
4.  **Commit messages & PR descriptions**: Use conventional commit prefixes and write descriptive PRs.
5.  **Safety & secrets**: Never commit secrets. Document requirements in `docs/ci-secrets-and-migrations.md`.
6.  **Tests & verification**: Run tests and linters locally before committing.
7.  **Agent identity & audit**: Include an identifying line in automated commits/PRs.
8.  **Rollback plan**: For DB changes, include a rollback plan in the PR.

