import { useEffect, useState } from "react";
import "./App.css";

async function readError(response) {
  const body = await response.json().catch(() => ({}));
  return body.error || "Something went wrong";
}

function App() {
  const [posts, setPosts] = useState([]);
  const [image, setImage] = useState(null);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function loadPosts() {
    const response = await fetch("/api/posts");
    if (!response.ok) throw new Error(await readError(response));
    setPosts(await response.json());
  }

  useEffect(() => {
    loadPosts().catch((loadError) => setError(loadError.message));
  }, []);

  useEffect(() => {
    if (!image) {
      setPreviewUrl("");
      return undefined;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  async function handleUpload(event) {
    event.preventDefault();
    if (!image) {
      setError("Please choose an image");
      return;
    }

    setUploading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", image);
    formData.append("caption", caption);

    try {
      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error(await readError(response));
      setImage(null);
      setCaption("");
      event.target.reset();
      await loadPosts();
    } catch (uploadError) {
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id) {
    setError("");
    try {
      const response = await fetch(`/api/posts/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(await readError(response));
      await loadPosts();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  }

  function handleImageChange(event) {
    setImage(event.target.files[0] || null);
    setError("");
  }

  return (
    <main className="page">
      <header className="page-header">
        <h1>Image Gallery</h1>
      </header>

      <section className="upload-section" aria-labelledby="upload-heading">
        <h2 id="upload-heading">Upload an image</h2>
        <form className="upload-form" onSubmit={handleUpload}>
          <label className="field-label" htmlFor="image">
            Image
          </label>
          <input
            id="image"
            name="image"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
          />
          {previewUrl && (
            <img
              className="preview"
              src={previewUrl}
              alt="Selected image preview"
            />
          )}

          <label className="field-label" htmlFor="caption">
            Caption (optional)
          </label>
          <input
            id="caption"
            name="caption"
            type="text"
            maxLength="200"
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
          <button className="upload-button" type="submit" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
        {error && (
          <p className="error-message" role="alert">
            {error}
          </p>
        )}
      </section>

      <section className="gallery-section" aria-labelledby="gallery-heading">
        <h2 id="gallery-heading">Gallery</h2>
        {posts.length === 0 ? (
          <p className="empty-message">No images yet</p>
        ) : (
          <div className="gallery-grid">
            {posts.map((post) => (
              <article className="image-card" key={post.id}>
                <img
                  src={post.imageUrl}
                  alt={post.caption || "Uploaded image"}
                  loading="lazy"
                />
                <div className="image-card-footer">
                  <p>{post.caption || ""}</p>
                  <button type="button" onClick={() => handleDelete(post.id)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
