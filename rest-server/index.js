/**
 * REST Server — wraps dummyjson.com endpoints
 * Port: 3001
 */
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const BASE = "https://dummyjson.com";

// ── Middleware: track timing & payload size ──────────────────────────────────
app.use((req, res, next) => {
  req._startTime = Date.now();
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    const elapsed = Date.now() - req._startTime;
    const payload = JSON.stringify(body);
    res.setHeader("X-Response-Time-Ms", elapsed);
    res.setHeader("X-Payload-Bytes", Buffer.byteLength(payload, "utf8"));
    return originalJson(body);
  };
  next();
});

// ── Routes ───────────────────────────────────────────────────────────────────

/** GET /users  — list users (with skip/limit) */
app.get("/users", async (req, res) => {
  const { limit = 10, skip = 0 } = req.query;
  const { data } = await axios.get(`${BASE}/users?limit=${limit}&skip=${skip}`);
  res.json(data);
});

/** GET /users/:id  — single user */
app.get("/users/:id", async (req, res) => {
  const { data } = await axios.get(`${BASE}/users/${req.params.id}`);
  res.json(data);
});

/** GET /users/:id/posts  — posts by user (EXTRA round-trip) */
app.get("/users/:id/posts", async (req, res) => {
  const { data } = await axios.get(`${BASE}/posts/user/${req.params.id}`);
  res.json(data);
});

/** GET /users/:id/todos  — todos by user (EXTRA round-trip) */
app.get("/users/:id/todos", async (req, res) => {
  const { data } = await axios.get(`${BASE}/todos/user/${req.params.id}`);
  res.json(data);
});

/**
 * GET /users/:id/full  — nested view: user + posts + todos
 * Requires 3 sequential HTTP calls → classic under-fetching demo
 */
app.get("/users/:id/full", async (req, res) => {
  const id = req.params.id;
  const [userRes, postsRes, todosRes] = await Promise.all([
    axios.get(`${BASE}/users/${id}`),
    axios.get(`${BASE}/posts/user/${id}`),
    axios.get(`${BASE}/todos/user/${id}`),
  ]);
  res.json({
    user: userRes.data,
    posts: postsRes.data.posts,
    todos: todosRes.data.todos,
  });
});

/** GET /products  — list products */
app.get("/products", async (req, res) => {
  const { limit = 10, skip = 0 } = req.query;
  const { data } = await axios.get(
    `${BASE}/products?limit=${limit}&skip=${skip}`
  );
  res.json(data);
});

/** GET /products/:id  — single product */
app.get("/products/:id", async (req, res) => {
  const { data } = await axios.get(`${BASE}/products/${req.params.id}`);
  res.json(data);
});

/** GET /posts  — list posts */
app.get("/posts", async (req, res) => {
  const { limit = 10, skip = 0 } = req.query;
  const { data } = await axios.get(`${BASE}/posts?limit=${limit}&skip=${skip}`);
  res.json(data);
});

/** GET /posts/:id  — single post */
app.get("/posts/:id", async (req, res) => {
  const { data } = await axios.get(`${BASE}/posts/${req.params.id}`);
  res.json(data);
});

/** GET /health */
app.get("/health", (_req, res) =>
  res.json({ status: "ok", server: "REST", port: 3001 })
);

// ── Start ────────────────────────────────────────────────────────────────────
const PORT = 3001;
app.listen(PORT, () =>
  console.log(`✅  REST server running at http://localhost:${PORT}`)
);
