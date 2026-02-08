// the api
const API = "http://localhost:5000/todos";

const state = {
  todos: [],
  filter: "all",
  loading: false,
};

const elements = {
  list: document.getElementById("todoList"),
  input: document.getElementById("todoInput"),
  addButton: document.getElementById("addButton"),
  statusText: document.getElementById("statusText"),
  statTotal: document.getElementById("statTotal"),
  statActive: document.getElementById("statActive"),
  statCompleted: document.getElementById("statCompleted"),
  progressBar: document.getElementById("progressBar"),
  emptyState: document.getElementById("emptyState"),
  clearCompleted: document.getElementById("clearCompleted"),
  filterButtons: Array.from(document.querySelectorAll(".filter-btn")),
};

function setStatus(text, tone = "muted") {
  elements.statusText.textContent = text;
  elements.statusText.className = `status ${tone}`;
}

function setBusy(isBusy) {
  state.loading = isBusy;
  elements.addButton.disabled = isBusy;
  elements.clearCompleted.disabled = isBusy;
}

async function request(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload && payload.error ? payload.error : res.statusText;
    throw new Error(message || "Request failed");
  }
  if (res.status === 204) return null;
  return res.json();
}

async function fetchTodos() {
  return request(API);
}

function clearList() {
  elements.list.innerHTML = "";
}

function createCheckbox(todo) {
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = !!todo.completed;
  chk.className = "todo-checkbox";
  chk.setAttribute("aria-label", `Mark ${todo.text} as done`);
  chk.onchange = () => toggleTodo(todo.id, chk.checked);
  return chk;
}

function createTextSpan(todo) {
  const span = document.createElement("span");
  span.textContent = todo.text;
  span.className = "todo-text" + (todo.completed ? " completed" : "");
  return span;
}

function createEditButton(todo, li) {
  const editBtn = document.createElement("button");
  editBtn.textContent = "Edit";
  editBtn.className = "btn btn-small btn-edit";
  editBtn.onclick = () => startEdit(todo, li);
  return editBtn;
}

function createDeleteButton(todo) {
  const del = document.createElement("button");
  del.textContent = "Delete";
  del.className = "btn btn-small btn-delete";
  del.onclick = () => deleteTodo(todo.id);
  return del;
}

function createTodoListItem(todo) {
  const li = document.createElement("li");
  li.className = "todo-item";

  const left = document.createElement("div");
  left.className = "todo-left";
  left.appendChild(createCheckbox(todo));
  left.appendChild(createTextSpan(todo));

  const actions = document.createElement("div");
  actions.className = "todo-actions";
  actions.appendChild(createEditButton(todo, li));
  actions.appendChild(createDeleteButton(todo));

  li.appendChild(left);
  li.appendChild(actions);
  return li;
}

function filterTodos(list) {
  if (state.filter === "active") {
    return list.filter((todo) => !todo.completed);
  }
  if (state.filter === "completed") {
    return list.filter((todo) => todo.completed);
  }
  return list;
}

function sortTodos(list) {
  return [...list].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return b.id - a.id;
  });
}

function updateStats() {
  const total = state.todos.length;
  const completed = state.todos.filter((todo) => todo.completed).length;
  const active = total - completed;

  elements.statTotal.textContent = total;
  elements.statActive.textContent = active;
  elements.statCompleted.textContent = completed;

  const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
  elements.progressBar.style.width = `${progress}%`;
  elements.progressBar.setAttribute("aria-valuenow", String(progress));
}

function renderTodos() {
  clearList();
  const filtered = filterTodos(sortTodos(state.todos));
  filtered.forEach((todo) => elements.list.appendChild(createTodoListItem(todo)));

  const showEmpty = filtered.length === 0;
  elements.emptyState.classList.toggle("hidden", !showEmpty);
}

function render() {
  updateStats();
  renderTodos();
}

async function loadTodos() {
  setBusy(true);
  setStatus("Syncing your tasks...", "muted");
  try {
    const todos = await fetchTodos();
    state.todos = Array.isArray(todos) ? todos : [];
    render();
    setStatus("Up to date.", "success");
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function addTodo() {
  const text = elements.input.value.trim();
  if (!text) {
    setStatus("Type something first.", "error");
    return;
  }

  setBusy(true);
  setStatus("Adding task...", "muted");
  try {
    await request(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    elements.input.value = "";
    await loadTodos();
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function deleteTodo(id, refresh = true) {
  setBusy(true);
  setStatus("Removing task...", "muted");
  try {
    await request(`${API}/${id}`, { method: "DELETE" });
    if (refresh) await loadTodos();
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function toggleTodo(id, completed) {
  setBusy(true);
  setStatus("Updating task...", "muted");
  try {
    await request(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    await loadTodos();
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function editTodo(id, text) {
  const newText = (text || "").toString().trim();
  if (!newText) {
    setStatus("Text cannot be empty.", "error");
    return;
  }

  setBusy(true);
  setStatus("Saving changes...", "muted");
  try {
    await request(`${API}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: newText }),
    });
    await loadTodos();
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

async function clearCompleted() {
  const completed = state.todos.filter((todo) => todo.completed);
  if (completed.length === 0) {
    setStatus("No completed tasks to clear.", "muted");
    return;
  }

  setBusy(true);
  setStatus("Clearing completed tasks...", "muted");
  try {
    await Promise.all(completed.map((todo) => request(`${API}/${todo.id}`, { method: "DELETE" })));
    await loadTodos();
  } catch (err) {
    setStatus(`Error: ${err.message}`, "error");
  } finally {
    setBusy(false);
  }
}

function startEdit(todo, li) {
  li.innerHTML = "";
  li.className = "todo-item editing";

  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = !!todo.completed;
  chk.className = "todo-checkbox";
  chk.onchange = () => toggleTodo(todo.id, chk.checked);

  const input = document.createElement("input");
  input.type = "text";
  input.value = todo.text;
  input.className = "todo-editor-input";
  input.setAttribute("aria-label", "Edit task text");

  const save = document.createElement("button");
  save.textContent = "Save";
  save.className = "btn btn-small btn-primary";
  save.onclick = async () => {
    const newText = input.value.trim();
    if (!newText) return;
    await editTodo(todo.id, newText);
  };

  const cancel = document.createElement("button");
  cancel.textContent = "Cancel";
  cancel.className = "btn btn-small btn-ghost";
  cancel.onclick = () => loadTodos();

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") save.click();
    if (event.key === "Escape") cancel.click();
  });

  const left = document.createElement("div");
  left.className = "todo-left";
  left.appendChild(chk);
  left.appendChild(input);

  const actions = document.createElement("div");
  actions.className = "todo-actions";
  actions.appendChild(save);
  actions.appendChild(cancel);

  li.appendChild(left);
  li.appendChild(actions);
  input.focus();
}

function setupFilters() {
  elements.filterButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      elements.filterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.filter = btn.dataset.filter || "all";
      renderTodos();
    });
  });
}

function setupActions() {
  elements.addButton.addEventListener("click", addTodo);
  elements.input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") addTodo();
  });
  elements.clearCompleted.addEventListener("click", clearCompleted);
}

setupFilters();
setupActions();
loadTodos();
