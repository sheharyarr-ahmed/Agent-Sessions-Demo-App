// the api
const API = "http://localhost:5000/todos";

async function fetchTodos() {
  const res = await fetch(API);
  return res.json();
}

function clearList() {
  const list = document.getElementById("todoList");
  list.innerHTML = "";
  return list;
}

function createCheckbox(todo) {
  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = !!todo.completed;
  chk.onchange = () => toggleTodo(todo.id, chk.checked);
  chk.className = "todo-checkbox";
  return chk;
}

function createTextSpan(todo) {
  const span = document.createElement("span");
  span.textContent = todo.text;
  span.style.margin = "0 8px";
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
  li.appendChild(createCheckbox(todo));
  li.appendChild(createTextSpan(todo));
  li.appendChild(createEditButton(todo, li));
  li.appendChild(createDeleteButton(todo));
  return li;
}

async function loadTodos() {
  const todos = await fetchTodos();
  const list = clearList();
  todos.forEach((todo) => list.appendChild(createTodoListItem(todo)));
}

async function addTodo() {
  const input = document.getElementById("todoInput");
  const text = input.value.trim();
  if (!text) return;

  await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  input.value = "";
  loadTodos();
}

async function deleteTodo(id) {
  await fetch(`${API}/${id}`, { method: "DELETE" });
  loadTodos();
}

async function toggleTodo(id, completed) {
  await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ completed }),
  });
  loadTodos();
}

async function editTodo(id, text) {
  const newText = (text || "").toString().trim();
  if (!newText) return;

  await fetch(`${API}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: newText }),
  });
  loadTodos();
}

function startEdit(todo, li) {
  // replace li contents with an inline editor
  li.innerHTML = "";

  const chk = document.createElement("input");
  chk.type = "checkbox";
  chk.checked = !!todo.completed;
  chk.onchange = () => toggleTodo(todo.id, chk.checked);

  chk.className = "todo-checkbox";

  const input = document.createElement("input");
  input.type = "text";
  input.value = todo.text;
  input.className = "todo-editor-input";
  input.size = Math.max(20, todo.text.length + 5);

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
  cancel.className = "btn btn-small btn-plain";
  cancel.onclick = () => loadTodos();

  li.appendChild(chk);
  li.appendChild(input);
  li.appendChild(save);
  li.appendChild(cancel);
}

loadTodos();
