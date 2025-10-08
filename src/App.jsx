import { useEffect, useState } from "react";
import "./editor.css";
import { getItems, createItem, updateItem, deleteItem } from "./api";
import { socket } from "./socket";

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  // hämta alla dokument
  async function load() {
    try {
      const data = await getItems();
      setItems(data);
    } catch (e) {
      console.error("Fel vid hämtning:", e);
    }
  }

  useEffect(() => {
    load();

    // lyssna på ändringar från servern
    socket.on("doc", (data) => {
      if (data._id === editingId) {
        setEditTitle(data.title);
        setEditDescription(data.description);
      }
      
      setItems(currentItems => {
        return currentItems.map(item => {
          if (item._id === data._id) {
            return {
              ...item,
              title: data.title !== undefined ? data.title : item.title,
              description: data.description !== undefined ? data.description : item.description,
            };
          }
          return item;
        });
      });
    });

    socket.on("update", () => {
      load();
    });

    return () => {
      socket.off("doc");
      socket.off("update");
    };
  }, [editingId]); 

  // skapa ny dokument
  async function onCreate(e) {
    e.preventDefault();
    try {
      await createItem({ title, description });
      setTitle("");
      setDescription("");
      await load();
      socket.emit("update");
    } catch (e) {
      console.error("Fel vid skapande:", e);
    }
  }

  // starta redigering
  function startEdit(item) {
    setEditingId(item._id);
    setEditTitle(item.title || "");
    setEditDescription(item.description || "");
    socket.emit("create", item._id);
  }

  //  avbryt redigering
  function cancelEdit() {
    load();
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
  }

  // spara redigering
  async function saveEdit(id) {
    try {
      await updateItem(id, { title: editTitle, description: editDescription });
      cancelEdit();
    } catch (e) {
      console.error("Fel vid sparning:", e);
    }
  }

  // ta bort dokument
  async function remove(id) {
    try {
      await deleteItem(id);
      await load();
      socket.emit("update");
    } catch (e) {
      console.error("Fel vid borttagning:", e);
    }
  }

  // ändring av titel
  function onEditTitleChange(e) {
    const value = e.target.value;
    setEditTitle(value);
    if (editingId) {
      socket.emit("doc", { _id: editingId, title: value });
    }
  }

  // ändring av beskrivning
  function onEditDescriptionChange(e) {
    const value = e.target.value;
    setEditDescription(value);
    if (editingId) {
      socket.emit("doc", { _id: editingId, description: value });
    }
  }

  return (
    <main className="container">
      <h1>SSR-Editor av rosa24 och mimr24</h1>

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
            placeholder="Fritext"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <button type="submit">Skapa</button>
      </form>

      <ul className="list">
        {items.map((item) => (
          <li key={item._id} className="card">
            {editingId === item._id ? (
              <div>
                <input
                  value={editTitle}
                  onChange={onEditTitleChange}
                />
                <textarea
                  value={editDescription}
                  onChange={onEditDescriptionChange}
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
