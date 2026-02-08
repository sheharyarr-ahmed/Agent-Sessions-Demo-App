const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");

const app = express();
const allowedOrigins = new Set([
  "http://localhost:5500",
  "http://localhost:5501",
  "http://127.0.0.1:5500",
  "http://127.0.0.1:5501",
]);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error("CORS blocked for origin: " + origin));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json());

const FILE = path.join(__dirname, "todos.json");

// In-memory cache for performance
let todos = [];

// Write queue to serialize disk writes and avoid races
let writeChain = Promise.resolve();

async function atomicWrite(filePath, data) {
  const tmp = filePath + ".tmp";
  await fs.writeFile(tmp, data, "utf8");
  await fs.rename(tmp, filePath);
}

function queueWrite() {
  // Append write to chain; return the new promise so callers can await it
  writeChain = writeChain.then(() =>
    atomicWrite(FILE, JSON.stringify(todos, null, 2))
  );
  // Catch errors to prevent unhandled rejections from breaking the chain
  writeChain = writeChain.catch((err) => {
    console.error("Write error:", err);
  });
  return writeChain;
}

async function loadFromDisk() {
  try {
    const raw = await fs.readFile(FILE, "utf8");
    todos = JSON.parse(raw || "[]");
  } catch (err) {
    if (err.code === "ENOENT") {
      todos = [];
      await queueWrite();
    } else {
      throw err;
    }
  }
}

// Initialize cache
loadFromDisk().catch((err) => console.error("Failed to load todos.json:", err));

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.post("/todos", async (req, res) => {
  const text = (req.body.text || "").toString().trim();
  if (!text) return res.status(400).json({ error: "text is required" });

  const newTodo = { id: Date.now(), text, completed: false };
  todos.push(newTodo);
  await queueWrite();
  res.status(201).json(newTodo);
});

app.delete("/todos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  const [deleted] = todos.splice(idx, 1);
  await queueWrite();
  res.json(deleted);
});

// Update todo (toggle completed or edit text)
app.put("/todos/:id", async (req, res) => {
  const id = Number(req.params.id);
  const idx = todos.findIndex((t) => t.id === id);
  if (idx === -1) return res.status(404).json({ error: "not found" });

  const todo = todos[idx];
  if (typeof req.body.completed === "boolean") {
    todo.completed = req.body.completed;
  }
  if (typeof req.body.text === "string") {
    const text = req.body.text.trim();
    if (text) todo.text = text;
  }

  todos[idx] = todo;
  await queueWrite();
  res.json(todo);
});

process.on("SIGINT", async () => {
  try {
    await writeChain; // wait for pending writes
    process.exit(0);
  } catch (err) {
    console.error("Error finishing writes on shutdown:", err);
    process.exit(1);
  }
});

app.listen(5000, () => console.log("API running at http://localhost:5000"));
