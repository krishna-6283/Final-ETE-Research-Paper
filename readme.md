# REST vs GraphQL — Live Comparison

Two Node.js servers hitting the same [dummyjson.com](https://dummyjson.com) data.
Open `dashboard.html` to run live benchmarks side-by-side.

---

## Setup

```bash
npm install
```

## Run

**Terminal 1 — REST server (port 3001)**
```bash
node rest-server/index.js
```

**Terminal 2 — GraphQL server (port 3002)**
```bash
node graphql-server/index.js
```

**Then open** `dashboard.html` in your browser.

---

## REST Endpoints (port 3001)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/users` | List users (`?limit=&skip=`) |
| GET | `/users/:id` | Single user |
| GET | `/users/:id/posts` | Posts by user |
| GET | `/users/:id/todos` | Todos by user |
| GET | `/users/:id/full` | User + posts + todos (**3 upstream calls**) |
| GET | `/products` | List products |
| GET | `/products/:id` | Single product |
| GET | `/posts` | List posts |
| GET | `/posts/:id` | Single post |

Every response includes:
- `X-Response-Time-Ms` — server-measured latency
- `X-Payload-Bytes` — response body size

---

## GraphQL Schema (port 3002)

Endpoint: `POST http://localhost:3002/graphql`

### Example queries

```graphql
# Shallow — only 3 fields (avoids over-fetching)
query {
  user(id: 1) {
    id
    firstName
    email
  }
}

# Nested — user + posts + todos in ONE round-trip
query {
  user(id: 1) {
    id firstName email
    posts { id title views }
    todos { id todo completed }
  }
}

# Products list — card fields only
query {
  products(limit: 10) {
    products { id title price rating category thumbnail }
    total
  }
}
```

---

## What the dashboard shows

| Query type | Key insight |
|-----------|-------------|
| User shallow | GraphQL sends only 3 fields; REST sends the entire ~2.4 KB object |
| User full | Both equivalent — REST wins on raw speed |
| User + Posts + Todos | REST makes **3 HTTP calls**; GraphQL makes **1** |
| Products list | GraphQL payload can be ~82% smaller for list views |
| Posts list | GraphQL payload savings on tag/reaction data |

---

## Architecture

```
Browser / Dashboard
       │
       ├── GET  http://localhost:3001/*   ──► Express REST Server
       │                                          │
       └── POST http://localhost:3002/graphql ──► Apollo GraphQL Server
                                                  │
                                         Both proxy to dummyjson.com
```

Both servers are intentionally thin proxies — no local DB — so the
benchmark captures **paradigm overhead**, not data-access differences.