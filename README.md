# MindVault

MindVault is a full-stack content saving app where users can sign up, sign in, store useful links in one place, and generate a public share link for their saved collection. It is built with a React frontend and a Node.js/Express backend, with MongoDB used for persistence.

## Tech Stack

### Frontend
- React
- TypeScript
- Vite
- React Router
- Axios
- Tailwind CSS
- Lucide React

### Backend
- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- JWT Authentication
- Zod

## Features

- User authentication with sign up and sign in flows
- Protected dashboard for authenticated users
- Create and save content with title, link, and content type
- View all saved content in a personal library
- Delete saved content
- Generate a public shareable link for saved content
- Open shared content through a public route without logging in

## Project Structure

```text
MindVault/
  backend/
  frontend/
```

## How To Clone

```bash
git clone <your-repository-url>
cd MindVault
```

## How To Run

### 1. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` using this format:

```env
PORT=5000
MONGO_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
FRONTEND_BASE_URL=http://localhost:5173
```

Start the backend server:

```bash
npm run dev
```

### 2. Set up the frontend

Open a new terminal:

```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/` using this format:

```env
VITE_API_BASE_URL=http://localhost:5000/api/v1
```

Start the frontend:

```bash
npm run dev
```

### 3. Open the app

After both servers are running, open the frontend URL shown by Vite in your browser. In local development this is usually:

```text
http://localhost:5173
```

## Build Commands

### Backend

```bash
cd backend
npm run build
```

### Frontend

```bash
cd frontend
npm run build
```

## Notes

- The backend runs on port `5000` by default.
- The frontend expects the backend API at `http://localhost:5000/api/v1`.
- For production share links, set `FRONTEND_BASE_URL` in the backend to your deployed frontend domain.
