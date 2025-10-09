// API helper
// VITE_API_URL sets the path to backend API. For local it is VITE_API_URL=http://localhost:3001
// In prod (GitHub Pages) it is set to our Azure cloud (adding soon)
const API = import.meta.env.VITE_API_URL || "";

function authHeaders(token, extra = {}) {
  const headers = { ...extra };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

export async function getItems(token) {
  const res = await fetch(`${API}/api/items`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`GET /api/items ${res.status}`);
  return res.json();
}

export async function createItem(body, token) {
  const res = await fetch(`${API}/api/items`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /api/items ${res.status}`);
  return res.json();
}

export async function updateItem(id, body, token) {
  const res = await fetch(`${API}/api/items/${id}`, {
    method: "PUT",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT /api/items/${id} ${res.status}`);
  return res.json();
}

export async function deleteItem(id, token) {
  const res = await fetch(`${API}/api/items/${id}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`DELETE /api/items/${id} ${res.status}`);
  return res.json();
}

export async function getComments(itemId, token) {
  const res = await fetch(`${API}/api/items/${itemId}/comments`, {
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`GET /api/items/${itemId}/comments ${res.status}`);
  return res.json();
}

export async function createComment(itemId, body, token) {
  const res = await fetch(`${API}/api/items/${itemId}/comments`, {
    method: "POST",
    headers: authHeaders(token, { "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /api/items/${itemId}/comments ${res.status}`);
  return res.json();
}

export async function deleteComment(itemId, commentId, token) {
  const res = await fetch(`${API}/api/items/${itemId}/comments/${commentId}`, {
    method: "DELETE",
    headers: authHeaders(token),
  });
  if (!res.ok) throw new Error(`DELETE /api/items/${itemId}/comments/${commentId} ${res.status}`);
  return res.json();
}

export async function registerUser(body) {
  const res = await fetch(`${API}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /api/auth/register ${res.status}`);
  return res.json();
}

export async function loginUser(body) {
  const res = await fetch(`${API}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /api/auth/login ${res.status}`);
  return res.json();
}
