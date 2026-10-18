# vbehive-lite

A small image upload and gallery app with a React/Vite frontend, Express API, PostgreSQL metadata, and local-disk image storage.

## Run locally

Requirements: Node.js 20.19+ and Docker Compose.

From this directory, start PostgreSQL:

```sh
docker compose up -d
```

In a terminal, configure and start the backend:

```sh
cd backend
cp .env.example .env
npm install
npm run dev
```

In another terminal, configure and start the frontend:

```sh
cd frontend
cp .env.example .env
npm install
npm run dev
```

Open the URL printed by Vite. The backend creates the `posts` table on startup and stores uploaded images in `backend/uploads`.

## Production build

Build the frontend, then run the backend with production settings. Set `NODE_ENV=production` and configure the backend environment values for the deployment, including `IMAGE_BASE_URL` to the public URL prefix for `/uploads`.

```sh
cd frontend
npm run build
cd ../backend
NODE_ENV=production npm start
```

The Express server serves `frontend/dist` and the API. The database and upload directory must be available to the backend process.
