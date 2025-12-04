# Omni Stock Frontend

Modern React application for inventory management built with the latest web technologies.

## Tech Stack

- **React 19.0.0** - Latest React with improved performance and concurrent features
- **React Router 7.0.2** - Modern client-side routing with future flags enabled
- **TypeScript 5.9.3** - Type-safe JavaScript with latest features
- **Vite 7.2.6** - Next-generation frontend build tool
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Redux Toolkit 2.11.0** - Predictable state management
- **React Query 5.90** - Powerful data synchronization and caching
- **Vitest 4.0** - Fast unit testing framework
- **Cypress 15.7** - End-to-end testing

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Build for production
npm run build

# Preview production build
npm preview
```

## Project Structure

```
frontend/
├── src/
│   ├── app/              # App-level components (layout, routes, providers)
│   ├── features/         # Feature modules (auth, inventory, vendors)
│   ├── shared/           # Shared utilities, components, hooks
│   ├── store/            # Redux store and slices
│   ├── components/       # UI component library (shadcn/ui)
│   └── index.css         # Global styles and Tailwind config
├── cypress/              # E2E tests
└── scripts/              # Build and deployment scripts
```

## Key Features

- **Authentication** - JWT-based auth with Redux persistence
- **Inventory Management** - Full CRUD for collectibles with image upload
- **Vendor Management** - Track and manage vendor relationships
- **Type Safety** - Comprehensive TypeScript coverage
- **Testing** - Unit tests with Vitest, E2E with Cypress
- **Form Validation** - Zod schemas with React Hook Form
- **API Client** - Axios with interceptors for auth tokens

## Development

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE=http://localhost:8000/api/v1
```

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Check formatting
npm run format:check
```

### Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run cypress:open

# Run smoke tests (CI)
npm run test:smoke
```

## Deployment

The app is configured for deployment to Vercel with automatic API routing:

- **Production**: omni-stock-three.vercel.app
- **API**: omni-stock.onrender.com

Vercel deployments automatically use the production API URL. Local development uses `VITE_API_BASE` or falls back to `localhost:8000`.

## Architecture Notes

- **Redux + React Query**: Redux for auth state, React Query for server data
- **Feature-based**: Code organized by feature (auth, inventory, vendors)
- **Protected Routes**: Automatic auth checks and redirects
- **Token Management**: Automatic JWT injection and refresh handling
- **Type-Safe API**: Strongly typed API client with error handling
