// API helper
// VITE_API_URL sets the path to backend API. For local it is VITE_API_URL=http://localhost:3001
// In prod (GitHub Pages) it is set to our Azure cloud (adding soon)
const API = import.meta.env.VITE_API_URL || "";

export async function getItems() {
  const res = await fetch(`${API}/api/items`);
  if (!res.ok) throw new Error(`GET /api/items ${res.status}`);
  return res.json();
}

export async function createItem(body) {
  const res = await fetch(`${API}/api/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`POST /api/items ${res.status}`);
  return res.json();
}

export async function updateItem(id, body) {
  const res = await fetch(`${API}/api/items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PUT /api/items/${id} ${res.status}`);
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${API}/api/items/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /api/items/${id} ${res.status}`);
  return res.json();
}
