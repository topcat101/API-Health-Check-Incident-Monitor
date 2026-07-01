# Mock REST API (Express + TypeScript)

Standalone Node.js/Express API with CRUD for **users**, **projects**, **tasks**, and **notes**.

## Run

```bash
cp .env.example .env
bun run server            # http://localhost:3001
```

## Features

- `GET` / `POST` / `PUT` / `DELETE` for every resource
- Zod request-body validation → `400 VALIDATION_ERROR`
- Proper status codes: `200`, `201`, `204`, `400`, `404`, `500`
- Central error handler with structured JSON errors
- Structured JSON logging (`server/logger.ts`) + morgan HTTP logs
- Env-driven config (`server/config.ts`, validated with zod)
- In-memory store by default; set `DATABASE_URL` and swap the driver in `server/db.ts`

## Endpoints

| Method | Path                | Description       |
| ------ | ------------------- | ----------------- |
| GET    | `/health`           | Health check      |
| GET    | `/api/{resource}`   | List all          |
| GET    | `/api/{resource}/:id` | Get one          |
| POST   | `/api/{resource}`   | Create (201)      |
| PUT    | `/api/{resource}/:id` | Update           |
| DELETE | `/api/{resource}/:id` | Delete (204)     |

`{resource}` = `users` \| `projects` \| `tasks` \| `notes`.
