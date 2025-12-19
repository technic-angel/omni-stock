# Omni Stock

Omni Stock is a multi-vendor inventory management system designed to help vendors track collectibles and commodity items across multiple physical and digital store locations.

[**View Live Demo**](https://omni-stock-three.vercel.app)

## Tech Stack

**Frontend**
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Query & Axios

**Backend**
- Python 3.11
- Django 5 + Django REST Framework
- PostgreSQL (Supabase)

**Infrastructure**
- **Frontend:** Vercel
- **Backend:** Render
- **CI/CD:** GitHub Actions

## Project Status

This project is currently in active MVP development. The core architecture is established, and we are rolling out vendor and inventory management features in phases.

### Completed Features
- **Architecture:** Full separation of concerns between frontend and backend; CI/CD pipelines established.
- **Vendor Design:** Data models for Vendors, Members, and Stores are fully specified.
- **Frontend Foundation:** API client types, authentication hooks, and UI scaffolding (Store Cards, Forms) are in place.

### What's Next (MVP)
- **Vendor & Member Management:** Full implementation of vendor creation, ownership transfer, and member invites.
- **Store Access Controls:** Assigning specific members to stores with granular roles (Manager, Sales, View Only).
- **Inventory Core:** Tracking unique collectibles (graded cards) vs. commodities (sealed product), including price bands and input costs.
- **Point of Sale (Lite):** A basket system to select items and "Make Sale," removing them from inventory transactionally.

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- PostgreSQL (or a local DB url)

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

*Note: You will need a `.env` file in both `frontend/` and `backend/` with appropriate API keys and database URLs.*

## How to Build

The project is structured as a monorepo with distinct `frontend` and `backend` directories.

- **Frontend:** Built with Vite. Run `npm run build` to generate static assets.
- **Backend:** Standard Django application. Use `gunicorn backend.wsgi:application` for production serving.

## Deployment

Deployments are automated via GitHub Actions:
- Pushes to `main` trigger a frontend build on Vercel.
- Pushes to `main` trigger a backend build and deploy on Render.
