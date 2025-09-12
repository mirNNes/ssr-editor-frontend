import { useEffect, useState } from "react";
import "./editor.css";
import { getItems, createItem, updateItem, deleteItem } from "./api";

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function load() {
    try {
      const data = await getItems();
      setItems(data);
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    try {
      await createItem({ title: title, description });
      setTitle("");
      setDescription("");
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  function startEdit(it) {
    setEditingId(it._id);
    setEditTitle(it.title || "");
    setEditDescription(it.description || "");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  async function saveEdit(id) {
    try {
      await updateItem(id, {
        title: editTitle,
        description: editDescription,
      });
      cancelEdit();
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  async function remove(id) {
    try {
      await deleteItem(id);
      await load();
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <main className="container">
      <h1>SSR‑Editor av rosa24 och mimr24</h1>

      {/* Creating a new item */}
      <form onSubmit={onCreate} className="new-item">
        <div className="row">
          <input
            placeholder="Titel"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div className="row">
          <textarea
            placeholder="fritext"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <button type="submit">Skapa</button>
      </form>

      {/* List of existing items if any */}
      <ul className="list">
        {items.map((item) => (
          <li key={item._id} className="card">
            {editingId === item._id ? (
              <div>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                />
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  rows={3}
                />
                <div className="actions">
                  <button type="button" onClick={() => saveEdit(item._id)}>
                    Spara
                  </button>
                  <button type="button" onClick={cancelEdit}>
                    Avbryt
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <h3>{item.title}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="actions">
                  <button type="button" onClick={() => startEdit(item)}>
                    Redigera
                  </button>
                  <button type="button" onClick={() => remove(item._id)}>
                    Ta bort
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}

export default App;
