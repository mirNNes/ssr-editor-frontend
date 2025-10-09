import { useEffect, useState } from "react";
import "./editor.css";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
  getComments,
  createComment,
  deleteComment,
} from "./api";
import { socket } from "./socket";

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [comments, setComments] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [newComment, setNewComment] = useState("");

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

    const handleDoc = (data) => {
      if (data._id === editingId) {
        if (data.title !== undefined) {
          setEditTitle(data.title);
        }
        if (data.description !== undefined) {
          setEditDescription(data.description);
        }
      }

      setItems((currentItems) => {
        return currentItems.map((item) => {
          if (item._id === data._id) {
            return {
              ...item,
              title: data.title !== undefined ? data.title : item.title,
              description:
                data.description !== undefined ? data.description : item.description,
            };
          }
          return item;
        });
      });
    };

    const handleUpdate = () => {
      load();
    };

    const handleNewComment = (comment) => {
      if (!comment) return;
      if (!comment.documentId || comment.documentId === editingId) {
        setComments((prev) => {
          const exists = prev.some((c) => c._id === comment._id);
          if (exists) {
            return prev;
          }
          return [...prev, comment];
        });
      }
    };

    const handleRemovedComment = (commentId) => {
      if (!commentId) return;
      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
    };

    // lyssna på ändringar från servern
    socket.on("doc", handleDoc);
    socket.on("update", handleUpdate);
    socket.on("comment:new", handleNewComment);
    socket.on("comment:removed", handleRemovedComment);

    return () => {
      socket.off("doc", handleDoc);
      socket.off("update", handleUpdate);
      socket.off("comment:new", handleNewComment);
      socket.off("comment:removed", handleRemovedComment);
    };
  }, [editingId]);

  useEffect(() => {
    if (!editingId) {
      setComments([]);
      return;
    }

    async function loadDocComments() {
      try {
        const data = await getComments(editingId);
        setComments(data);
      } catch (e) {
        console.error("Fel vid hämtning av kommentarer:", e);
      }
    }

    loadDocComments();
  }, [editingId]);

  useEffect(() => {
    const totalLines = editDescription ? editDescription.split("\n").length : 0;
    if (selectedLine && selectedLine > totalLines) {
      setSelectedLine(null);
    }
  }, [editDescription, selectedLine]);

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
    setSelectedLine(null);
    setNewComment("");
    socket.emit("create", item._id);
  }

  //  avbryt redigering
  function cancelEdit() {
    load();
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setComments([]);
    setSelectedLine(null);
    setNewComment("");
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

  async function onSubmitComment(e) {
    e.preventDefault();
    if (!editingId || !selectedLine || !newComment.trim()) {
      return;
    }

    try {
      const savedComment = await createComment(editingId, {
        line: selectedLine,
        text: newComment.trim(),
      });
      setComments((prev) => [...prev, savedComment]);
      setNewComment("");
      socket.emit("comment:create", { roomId: editingId, comment: savedComment });
    } catch (e) {
      console.error("Fel vid skapande av kommentar:", e);
    }
  }

  async function onDeleteComment(commentId) {
    if (!editingId) return;
    try {
      await deleteComment(editingId, commentId);
      setComments((prev) => prev.filter((comment) => comment._id !== commentId));
      socket.emit("comment:delete", { roomId: editingId, commentId });
    } catch (e) {
      console.error("Fel vid borttagning av kommentar:", e);
    }
  }

  const descriptionLines = editDescription ? editDescription.split("\n") : [];
  const sortedComments = [...comments].sort((a, b) => {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

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
                  rows={5}
                />
                <div className="editor-lines">
                  <h4>Rader</h4>
                  <div className="line-list">
                    {descriptionLines.map((line, index) => (
                      <button
                        type="button"
                        key={`${item._id}-line-${index + 1}`}
                        className={`line-item ${
                          selectedLine === index + 1 ? "active" : ""
                        }`}
                        onClick={() => setSelectedLine(index + 1)}
                      >
                        <span className="line-number">{index + 1}.</span>
                        <span>{line || "\u00A0"}</span>
                      </button>
                    ))}
                    {descriptionLines.length === 0 && (
                      <p className="line-placeholder">Inga rader ännu.</p>
                    )}
                  </div>
                </div>
                <div className="comment-section">
                  <h4>Kommentarer</h4>
                  {selectedLine && (
                    <form onSubmit={onSubmitComment} className="comment-form">
                      <p>Kommenterar rad {selectedLine}</p>
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Skriv din kommentar"
                      />
                      <button type="submit">Spara kommentar</button>
                    </form>
                  )}
                  {!selectedLine && (
                    <p className="comment-hint">
                      Välj en rad ovanför för att lägga till en kommentar.
                    </p>
                  )}
                  <ul className="comment-list">
                    {sortedComments.length === 0 && (
                      <li className="comment-empty">Inga kommentarer i dokumentet.</li>
                    )}
                    {sortedComments.map((comment) => (
                      <li key={comment._id} className="comment-item">
                        <div className="comment-meta">
                          <span className="comment-line">Rad {comment.line}</span>
                          {comment.authorEmail && (
                            <span className="comment-author">{comment.authorEmail}</span>
                          )}
                          {comment.createdAt && (
                            <span className="comment-date">
                              {new Date(comment.createdAt).toLocaleString()}
                            </span>
                          )}
                        </div>
                        <p>{comment.text}</p>
                        <button
                          type="button"
                          className="comment-delete"
                          onClick={() => onDeleteComment(comment._id)}
                        >
                          Ta bort
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
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
