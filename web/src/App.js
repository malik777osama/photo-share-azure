import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:5000";

function App() {
  const [mode, setMode] = useState("consumer"); // consumer | creator

  const [posts, setPosts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [comments, setComments] = useState([]);

  const [author, setAuthor] = useState("ConsumerUser");
  const [text, setText] = useState("");
  const [ratingResult, setRatingResult] = useState(null);

  // Creator form
  const [creatorKey, setCreatorKey] = useState("secret123");
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [people, setPeople] = useState("");
  const [file, setFile] = useState(null);
  const [uploadMsg, setUploadMsg] = useState("");

  async function loadPosts() {
    const data = await fetch(`${API}/api/posts`).then((r) => r.json());
    setPosts(data);
  }

  async function openPost(post) {
    setSelected(post);

    const list = await fetch(`${API}/api/posts/${post.id}/comments`).then((r) =>
      r.json()
    );
    setComments(list);

    setRatingResult(null);
  }

  async function addComment() {
    if (!selected) return;
    if (!text.trim()) return alert("Write a comment first");

    const res = await fetch(`${API}/api/posts/${selected.id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ author, text }),
    });

    const out = await res.json();
    if (!res.ok) return alert(JSON.stringify(out));

    setText("");
    await openPost(selected);
  }

  async function submitRating(value) {
    if (!selected) return;

    const res = await fetch(`${API}/api/posts/${selected.id}/rating`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating: value }),
    });

    const out = await res.json();
    if (!res.ok) return alert(JSON.stringify(out));

    setRatingResult(out);
  }

  // ✅ Creator: upload file to Blob via API, then create post in Cosmos
  async function creatorUpload() {
    try {
      setUploadMsg("");
      if (!file) return alert("Choose an image file first");
      if (!title.trim()) return alert("Title is required");

      setUploadMsg("Uploading image to Azure Blob...");

      const form = new FormData();
      form.append("file", file);

      const uploadRes = await fetch(`${API}/api/uploads`, {
        method: "POST",
        headers: { "x-creator-key": creatorKey },
        body: form,
      });

      const uploadOut = await uploadRes.json();
      if (!uploadRes.ok) return alert(JSON.stringify(uploadOut));

      const imageUrl = uploadOut.url;

      setUploadMsg("Saving post to Cosmos DB...");

      const postRes = await fetch(`${API}/api/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-creator-key": creatorKey,
        },
        body: JSON.stringify({
          title,
          caption,
          location,
          people,
          imageUrl,
        }),
      });

      const postOut = await postRes.json();
      if (!postRes.ok) return alert(JSON.stringify(postOut));

      setUploadMsg("✅ Uploaded & saved!");

      // reset form
      setTitle("");
      setCaption("");
      setLocation("");
      setPeople("");
      setFile(null);

      await loadPosts();
      setMode("consumer");
    } catch (e) {
      console.error(e);
      alert("Upload failed. Check API terminal logs.");
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  return (
    <div className="container">
      <div className="header">
        <h1>PhotoShare</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setMode("consumer")}>Consumer</button>
          <button onClick={() => setMode("creator")}>Creator</button>
        </div>
      </div>

      {mode === "creator" && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h2 style={{ marginTop: 0 }}>Creator Upload</h2>

          <div style={{ display: "grid", gap: 8, maxWidth: 520 }}>
            <input
              value={creatorKey}
              onChange={(e) => setCreatorKey(e.target.value)}
              placeholder="Creator Key"
            />
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" />
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Caption"
            />
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Location"
            />
            <input
              value={people}
              onChange={(e) => setPeople(e.target.value)}
              placeholder="People present"
            />
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0])} />
            <button onClick={creatorUpload}>Upload</button>
            {uploadMsg && <div style={{ fontSize: 13, color: "#444" }}>{uploadMsg}</div>}
          </div>

          <p style={{ fontSize: 12, color: "#666" }}>
            Creator uploads go to Azure Blob Storage. Metadata is saved in Cosmos DB.
          </p>
        </div>
      )}

      {mode === "consumer" && !selected && (
        <>
          <h2>Feed (Consumer)</h2>
          <button onClick={loadPosts}>Refresh Feed</button>

          {posts.length === 0 ? (
            <p>No posts yet.</p>
          ) : (
            <div className="grid">
              {posts.map((p) => (
                <div className="card" key={p.id} onClick={() => openPost(p)} style={{ cursor: "pointer" }}>
                  <img className="thumb" src={p.imageUrl} alt={p.title} />
                  <div className="cardBody">
                    <div className="title">{p.title}</div>
                    <div className="meta">{p.location || ""}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {mode === "consumer" && selected && (
        <>
          <button onClick={() => setSelected(null)}>← Back to feed</button>

          <h2 style={{ marginTop: 10 }}>{selected.title}</h2>
          <img
            src={selected.imageUrl}
            alt={selected.title}
            style={{
              width: "100%",
              maxWidth: 800,
              height: 360,
              objectFit: "cover",
              borderRadius: 12,
              border: "1px solid #e6e6e6",
            }}
          />

          <p>{selected.caption}</p>
          <p>
            <b>Location:</b> {selected.location || "-"}
          </p>
          <p>
            <b>People:</b> {selected.people || "-"}
          </p>

          <hr />

          <h3>Rate this photo</h3>
          <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => submitRating(n)}>
                {n}
              </button>
            ))}
          </div>
          {ratingResult && (
            <p>
              ⭐ Average rating: <b>{ratingResult.avg}</b> ({ratingResult.count} votes)
            </p>
          )}

          <hr />

          <h3>Comments</h3>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              style={{ padding: 8, width: 180 }}
            />
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a comment…"
              style={{ padding: 8, flex: 1 }}
            />
            <button onClick={addComment}>Post</button>
          </div>

          {comments.length === 0 ? (
            <p>No comments yet.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} style={{ borderTop: "1px solid #eee", padding: "10px 0" }}>
                <b>{c.author}</b>{" "}
                <span style={{ color: "#666", fontSize: 12 }}>({c.createdAt})</span>
                <div>{c.text}</div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}

export default App;
