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
  registerUser,
  loginUser,
} from "./api";
import { socket } from "./socket";

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token") || "");
  const [currentUser, setCurrentUser] = useState(
    () => localStorage.getItem("userEmail") || ""
  );
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [comments, setComments] = useState([]);
  const [commentNumber, setCommentNumber] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [authMode, setAuthMode] = useState("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);

  // hämta alla dokument
  async function load() {
    if (!token) return;
    try {
      const data = await getItems(token);
      setItems(data);
    } catch (e) {
      console.error("Fel vid hämtning:", e);
      if (e.message?.includes("401") || e.message?.includes("403")) {
        setAuthMessage("Din session är ogiltig, logga in igen.");
        handleLogout();
      }
    }
  }

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("userEmail", currentUser);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!token) return;
    load();
  }, [token]);

  useEffect(() => {
    if (!token) return;

    const handleDoc = (data) => {
      if (data._id === editingId) {
        if (data.title !== undefined) {
          setEditTitle(data.title);
        }
        if (data.description !== undefined) {
          setEditDescription(data.description);
        }
      }

      setItems((currentItems) =>
        currentItems.map((item) => {
          if (item._id === data._id) {
            return {
              ...item,
              title: data.title !== undefined ? data.title : item.title,
              description:
                data.description !== undefined ? data.description : item.description,
            };
          }
          return item;
        })
      );
    };

    const handleUpdate = () => {
      load();
    };

    const handleNewComment = (comment) => {
      if (!comment) return;
      setItems((prev) =>
        prev.map((item) => {
          if (item._id === comment.documentId) {
            const nextComments = item.comments || [];
            const exists = nextComments.some((c) => c._id === comment._id);
            if (exists) return item;
            return { ...item, comments: [...nextComments, comment] };
          }
          return item;
        })
      );
      if (comment.documentId === editingId) {
        setComments((prev) => {
          const exists = prev.some((c) => c._id === comment._id);
          return exists ? prev : [...prev, comment];
        });
      }
    };

    const handleRemovedComment = (commentId) => {
      if (!commentId) return;
      setItems((prev) =>
        prev.map((item) => {
          if (!item.comments) return item;
          return {
            ...item,
            comments: item.comments.filter((comment) => comment._id !== commentId),
          };
        })
      );
      setComments((prev) => {
        const filtered = prev.filter((comment) => comment._id !== commentId);
        if (filtered.length === 0) {
          setCommentNumber(null);
          setIsAddingComment(false);
        } else if (commentNumber && commentNumber > filtered.length) {
          setCommentNumber(filtered.length);
        }
        return filtered;
      });
    };

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
  }, [token, editingId, commentNumber, isAddingComment]);

  useEffect(() => {
    if (!token || !editingId) {
      setComments([]);
      return;
    }

    async function loadDocComments() {
      try {
        const data = await getComments(editingId, token);
        setComments(data);
      } catch (e) {
        console.error("Fel vid hämtning av kommentarer:", e);
      }
    }

    loadDocComments();
  }, [token, editingId]);

  // skapa ny dokument
  async function onCreate(e) {
    e.preventDefault();
    if (!token) return;
    try {
      await createItem({ title, description }, token);
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
    setCommentNumber(null);
    setNewComment("");
    setIsAddingComment(false);
    socket.emit("create", item._id);
  }

  //  avbryt redigering
  function cancelEdit() {
    load();
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setComments([]);
    setCommentNumber(null);
    setNewComment("");
    setIsAddingComment(false);
  }

  // spara redigering
  async function saveEdit(id) {
    if (!token) return;
    try {
      await updateItem(id, { title: editTitle, description: editDescription }, token);
      cancelEdit();
    } catch (e) {
      console.error("Fel vid sparning:", e);
    }
  }

  // ta bort dokument
  async function remove(id) {
    if (!token) return;
    try {
      await deleteItem(id, token);
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
    if (!editingId || !newComment.trim() || !token) {
      return;
    }

    try {
      const savedComment = await createComment(
        editingId,
        {
          line: commentNumber || sortedComments.length + 1,
          text: newComment.trim(),
        },
        token
      );
      setComments((prev) => [...prev, savedComment]);
      setNewComment("");
      setCommentNumber(null);
      setIsAddingComment(false);
      socket.emit("comment:create", { roomId: editingId, comment: savedComment });
    } catch (e) {
      console.error("Fel vid skapande av kommentar:", e);
    }
  }

  async function onDeleteComment(commentId) {
    if (!editingId || !token) return;
    try {
      await deleteComment(editingId, commentId, token);
      setComments((prev) => {
        const filtered = prev.filter((comment) => comment._id !== commentId);
        if (filtered.length === 0) {
          setCommentNumber(null);
          setIsAddingComment(false);
        } else if (commentNumber && commentNumber > filtered.length) {
          setCommentNumber(filtered.length);
        }
        return filtered;
      });
      socket.emit("comment:delete", { roomId: editingId, commentId });
    } catch (e) {
      console.error("Fel vid borttagning av kommentar:", e);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setAuthMessage("");
    try {
      await registerUser({ email: authEmail, password: authPassword });
      setAuthMessage("Registrering lyckades! Logga in för att fortsätta.");
      setAuthMode("login");
      setAuthPassword("");
    } catch (err) {
      console.error("Registrering misslyckades:", err);
      setAuthMessage("Registrering misslyckades, kontrollera uppgifterna.");
    }
  }

  async function handleLogin(e) {
    e.preventDefault();
    setAuthMessage("");
    try {
      const { token: receivedToken } = await loginUser({
        email: authEmail,
        password: authPassword,
      });
      if (receivedToken) {
        setToken(receivedToken);
        setCurrentUser(authEmail);
        setAuthPassword("");
        setAuthMessage("Inloggad!");
        await load();
      }
    } catch (err) {
      console.error("Login misslyckades:", err);
      setAuthMessage("Fel inloggningsuppgifter.");
    }
  }

  function handleLogout() {
    setToken("");
    setItems([]);
    setEditingId(null);
    setComments([]);
    setCurrentUser("");
    setAuthMessage("Du är utloggad.");
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
  }

  const sortedComments = [...comments].sort((a, b) => {
    if (a.line !== b.line) {
      return a.line - b.line;
    }
    return new Date(a.createdAt) - new Date(b.createdAt);
  });

  const getItemComments = (itemId) => {
    if (editingId === itemId) {
      return sortedComments;
    }
    const item = items.find((doc) => doc._id === itemId);
    if (!item || !item.comments) {
      return [];
    }
    return [...item.comments].sort((a, b) => {
      if (a.line !== b.line) {
        return a.line - b.line;
      }
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  };

  if (!token) {
    return (
      <main className="container auth-container">
        <h1>SSR-Editor av rosa24 och mimr24</h1>
        <div className="auth-panel">
          <div className="auth-tabs">
            <button
              type="button"
              className={authMode === "login" ? "active" : ""}
              onClick={() => setAuthMode("login")}
            >
              Logga in
            </button>
            <button
              type="button"
              className={authMode === "register" ? "active" : ""}
              onClick={() => setAuthMode("register")}
            >
              Registrera
            </button>
          </div>
          <form
            onSubmit={authMode === "login" ? handleLogin : handleRegister}
            className="auth-form"
          >
            <input
              type="email"
              placeholder="E-post"
              value={authEmail}
              onChange={(e) => setAuthEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Lösenord"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
            <button type="submit">
              {authMode === "login" ? "Logga in" : "Registrera"}
            </button>
          </form>
          {authMessage && <p className="auth-message">{authMessage}</p>}
        </div>
      </main>
    );
  }

  return (
    <main className="container">
      <div className="header">
        <h1>SSR-Editor av rosa24 och mimr24</h1>
        <div className="user-info">
          {currentUser && <span>Inloggad som {currentUser}</span>}
          <button type="button" onClick={handleLogout}>
            Logga ut
          </button>
        </div>
      </div>

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
                <input value={editTitle} onChange={onEditTitleChange} />
                <textarea
                  value={editDescription}
                  onChange={onEditDescriptionChange}
                  rows={5}
                />
                <div className="comment-section">
                  <h4>Kommentarer</h4>
                  {!isAddingComment && (
                    <button
                      type="button"
                      className="comment-add"
                      onClick={() => {
                        const nextNumber = sortedComments.length + 1;
                        setCommentNumber(nextNumber);
                        setIsAddingComment(true);
                      }}
                    >
                      Skapa kommentar
                    </button>
                  )}
                  {isAddingComment && (
                    <form onSubmit={onSubmitComment} className="comment-form">
                      <p>Kommenterar kommentar {commentNumber}</p>
                      <textarea
                        rows={3}
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Skriv din kommentar"
                      />
                      <div className="comment-form-actions">
                        <button type="submit">Spara kommentar</button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingComment(false);
                            setCommentNumber(null);
                            setNewComment("");
                          }}
                        >
                          Avbryt
                        </button>
                      </div>
                    </form>
                  )}
                  <ul className="comment-list">
                    {sortedComments.length === 0 && (
                      <li className="comment-empty">Inga kommentarer i dokumentet.</li>
                    )}
                    {sortedComments.map((comment, index) => (
                      <li key={comment._id} className="comment-item">
                        <div className="comment-meta">
                          <span className="comment-line">
                            Kommentar {comment.line ?? index + 1}
                          </span>
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
                <CommentPreview comments={getItemComments(item._id)} />
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

function CommentPreview({ comments }) {
  if (!comments || comments.length === 0) {
    return (
      <div className="comment-preview">
        <strong>Kommentarer</strong>
        <p className="comment-empty">Inga kommentarer.</p>
      </div>
    );
  }

  return (
    <div className="comment-preview">
      <strong>Kommentarer</strong>
      <ul className="comment-list preview">
        {comments.map((comment, index) => (
          <li key={comment._id} className="comment-item">
            <div className="comment-meta">
              <span className="comment-line">
                Kommentar {comment.line ?? index + 1}
              </span>
              {comment.authorEmail && (
                <span className="comment-author">{comment.authorEmail}</span>
              )}
              {comment.createdAt && (
                <span className="comment-date">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              )}
            </div>
            <p className="comment-text">{comment.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
