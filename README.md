# Todo App

A small full-stack Todo application (Node + Express backend, vanilla JS frontend) intended as a lightweight example and local development project.

This repository is a simple starting point for experimenting with a file-backed API and a minimal frontend. It includes an Express API that persists todos to `backend/todos.json` and a small static frontend in the `frontend/` folder.

**Status:** Working local demo — features include create, read, update, delete, toggle complete, and a modern card-style UI.

---

## Features

- REST API: `GET /todos`, `POST /todos`, `PUT /todos/:id`, `DELETE /todos/:id`
- Frontend UI: add, edit (inline), toggle completion, delete
- File-backed persistence using `backend/todos.json`
- Server optimizations: in-memory cache + write queue + atomic writes
- Modern card-style CSS in `frontend/styles.css`

## Tech stack

- Node.js + Express
- Vanilla JavaScript for frontend (no frameworks)
- `todos.json` for storage (suitable for prototypes)

## Prerequisites

- Node.js (v14+ recommended)
- npm (for installing dependencies)

## Install

From the project root:

```bash
npm install
```

This will install the server dependencies (already includes `express` and `cors`).

## Run

Start the backend API:

```bash
node backend/server.js
```

Open the frontend in your browser (the frontend is static, no build step required):

```bash
open frontend/index.html
```

The frontend expects the API to be available at `http://localhost:5000/todos`.

## API

All endpoints are JSON-based.

- GET /todos

  - Returns: JSON array of todos
  - Example:
    ```bash
    curl http://localhost:5000/todos
    ```

- POST /todos

  - Body: `{ "text": "Buy milk" }`
  - Returns: created todo object `{ id, text, completed }`
  - Example:
    ```bash
    curl -X POST -H "Content-Type: application/json" -d '{"text":"Buy milk"}' http://localhost:5000/todos
    ```

- PUT /todos/:id

  - Body: partial todo updates. Supported keys: `text` (string), `completed` (boolean)
  - Returns: updated todo object
  - Example:
    ```bash
    curl -X PUT -H "Content-Type: application/json" -d '{"completed":true}' http://localhost:5000/todos/1630428490000
    ```

- DELETE /todos/:id
  - Removes the todo and returns the deleted item
  - Example:
    ```bash
    curl -X DELETE http://localhost:5000/todos/1630428490000
    ```

## File structure

```
package.json
backend/
  server.js          # Express API and persistence logic
  todos.json         # JSON file used for storage
frontend/
  index.html         # Static frontend
  app.js             # Frontend app logic
  styles.css         # Modern card-style UI
```

## Implementation notes

- The server keeps an in-memory copy of todos and serializes writes using a promise-based write queue. This reduces disk reads and avoids blocking the event loop.
- Writes are performed atomically by writing to a temporary file and renaming it into place.
- This setup is intentionally simple and works well for local demos. For production or multi-user scenarios, move to a proper database (SQLite, Postgres, etc.).

## Next improvements (ideas)

- Add keyboard accessibility to inline editor (Enter to save, Esc to cancel)
- Add user-friendly timestamp and sorting
- Add tests and CI
- Migrate persistence to `lowdb`/SQLite
- Add build system / serve static frontend from Express

## Contributing

Contributions are welcome — fork the repo and open a PR. Keep changes focused and include tests where possible.

## License

MIT (feel free to change)
