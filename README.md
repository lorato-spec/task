TaskFlow MERN Assignment

TaskFlow is a task management app built with React, Node.js, Express, and MongoDB.

What it does

- lets users register and log in
- uses JWT for authentication
- lets users create, edit, delete, and view tasks
- lets users mark tasks as pending or completed
- supports search, filter, and pagination

Tech stack

- frontend: React, Vite, React Router, Axios
- backend: Node.js, Express, Mongoose, JWT
- database: MongoDB

Project structure

- client
- server
- .env.example
- package.json

Setup

1. Run `npm install`
2. Create a `.env` file if you want custom values
3. Run `npm run dev`

Example environment values

`PORT=5000`

`CLIENT_URL=http://localhost:5173`

`JWT_SECRET=your-secret-key`

`MONGODB_URI=mongodb://127.0.0.1:27017/task-manager`

Useful commands

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm test`

API routes

Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PUT /api/tasks/:id`
- `PATCH /api/tasks/:id/status`
- `DELETE /api/tasks/:id`

Notes

- if `MONGODB_URI` is empty, the app can use the in-memory MongoDB setup in local development
- after build, the Express server can serve the frontend
