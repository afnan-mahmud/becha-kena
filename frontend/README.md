# Becha-Kena Frontend

This is the frontend application for the Becha-Kena classifieds platform, built with React, TypeScript, and Vite.

## Setup Instructions

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Environment Variables:**
   Create a `.env` file in the root of the `frontend` directory (if required for specific API keys). Currently, the API endpoint is proxied to `http://localhost:5000`.

3. **Start Development Server:**
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Starts the development server using Vite.
- `npm run build`: Compiles TypeScript and builds the application for production into the `dist/` directory.
- `npm run lint`: Runs the linter to catch code quality issues.
- `npm run preview`: Previews the production build locally.

## Project Structure Overview

- `src/components/`: Reusable UI components (e.g., Layout, Cards, Forms).
- `src/pages/`: Page components representing different routes (e.g., Home, Listings, Chat, Admin).
- `src/services/`: API integration services using Axios.
- `src/store/`: Global state management using Zustand.
- `src/hooks/`: Custom React hooks.
- `src/utils/`: Utility functions and formatters.
- `src/types/`: TypeScript interface definitions.
- `src/styles/`: Global CSS and design tokens (`variables.css`).

## Important Note on Backend Dependency

This frontend application relies on the Becha-Kena backend API. **You must run the backend server on port 5000** (`http://localhost:5000`) for the frontend to function correctly, as the Vite dev server is configured to proxy API requests to this port.
