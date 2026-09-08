# 10xRecipes Frontend

React + Vite + Tailwind CSS frontend for the 10xRecipes API.

## Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

```bash
cd client
npm install
npm run dev
```

App will run on `http://localhost:5173`

### Environment

The app connects to the backend API at `http://localhost:9090/api`.

Make sure the backend is running before starting the frontend.

## Features

- 🔍 **User Authentication** — Register/login with JWT tokens
- 🔍 **Recipe Search** — Search by ingredients and cooking time
- ⭐ **Favorites** — Save recipes (coming soon)
- 📱 **Responsive Design** — Mobile-friendly UI with Tailwind CSS

## Build

```bash
npm run build
```

Outputs to `dist/` directory.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Build for production
- `npm run preview` — Preview production build

## Tech Stack

- React 18
- Vite
- Tailwind CSS
- Axios (for API calls)

## Architecture

- `src/services/api.js` — API client
- `src/context/AuthContext.jsx` — Auth state management
- `src/components/` — React components
- `src/App.jsx` — Main app component
