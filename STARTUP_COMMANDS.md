# Startup Commands

## Backend Only (Default)
To start only the backend API service:
```bash
pnpm run start
```
This will start the API service on port 3001.

## Web App Only
To start only the web application:
```bash
pnpm run start:web
```
This will start the Next.js web app on port 3000.

## API Service Only
To start only the API service (same as default start):
```bash
pnpm run start:api
```
This will start the API service on port 3001.

## Development Mode
To start both services in development mode:
```bash
pnpm run dev
```
This will start both the web app and API in development mode.

## Build
To build all services:
```bash
pnpm run build
```

## Docker
To start services using Docker:
```bash
docker-compose up
```
This will start both services in containers.

## Notes
- The default `pnpm run start` now only starts the backend API
- Use `pnpm run start:web` if you need to start the web application separately
- Both services need to be built before starting (`pnpm run build`)
- The web app runs on port 3000, API on port 3001
