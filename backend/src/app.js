import cors from "cors";
import express from "express";
import multer from "multer";
import path from "node:path";
import { fileURLToPath } from "node:url";
import config from "./config.js";
import { pool } from "./db.js";
import {
  deleteImage,
  getImageUrl,
  imageMiddleware,
  saveImage,
} from "./storage.js";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (request, file, callback) => {
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)) {
      const error = new Error("Only JPG, PNG, WEBP allowed");
      error.status = 400;
      callback(error);
      return;
    }
    callback(null, true);
  },
});
const asyncHandler = (handler) => (request, response, next) => {
  Promise.resolve(handler(request, response, next)).catch(next);
};

app.set("trust proxy", 1);
app.use(cors({ origin: config.corsOrigin }));
app.use("/uploads", imageMiddleware);

app.get("/health", (request, response) => {
  response.status(200).json({ status: "ok" });
});

app.get(
  "/api/posts",
  asyncHandler(async (request, response) => {
    const result = await pool.query(
      "SELECT id, caption, image_key, created_at FROM posts ORDER BY created_at DESC, id DESC",
    );
    response.json(
      result.rows.map((post) => ({
        ...post,
        imageUrl: getImageUrl(post.image_key),
      })),
    );
  }),
);

app.post(
  "/api/posts",
  upload.single("image"),
  asyncHandler(async (request, response) => {
    if (!request.file) {
      response.status(400).json({ error: "Please choose an image" });
      return;
    }

    const caption = (request.body.caption || "").trim();
    if (caption.length > 200) {
      response
        .status(400)
        .json({ error: "Caption must be 200 characters or fewer" });
      return;
    }

    const imageKey = await saveImage(request.file);
    try {
      const result = await pool.query(
        "INSERT INTO posts (caption, image_key) VALUES ($1, $2) RETURNING id, caption, image_key, created_at",
        [caption || null, imageKey],
      );
      const post = result.rows[0];
      response
        .status(201)
        .json({ ...post, imageUrl: getImageUrl(post.image_key) });
    } catch (error) {
      await deleteImage(imageKey);
      throw error;
    }
  }),
);

app.delete(
  "/api/posts/:id",
  asyncHandler(async (request, response) => {
    if (!/^\d+$/.test(request.params.id)) {
      response.status(400).json({ error: "Post ID must be a number" });
      return;
    }

    const result = await pool.query(
      "DELETE FROM posts WHERE id = $1 RETURNING image_key",
      [request.params.id],
    );
    if (result.rowCount === 0) {
      response.status(404).json({ error: "Image not found" });
      return;
    }

    await deleteImage(result.rows[0].image_key);
    response.status(200).json({ status: "deleted" });
  }),
);

app.use("/api", (request, response) => {
  response.status(404).json({ error: "Not found" });
});

if (config.nodeEnv === "production") {
  const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
  const frontendDirectory = path.resolve(
    currentDirectory,
    "../../frontend/dist",
  );
  app.use(express.static(frontendDirectory));
  app.get("/{*path}", (request, response) => {
    response.sendFile(path.join(frontendDirectory, "index.html"));
  });
}

app.use((error, request, response, next) => {
  console.log(error.message);
  if (response.headersSent) {
    next(error);
    return;
  }

  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE"
        ? "Image must be 5 MB or smaller"
        : error.message;
    response.status(400).json({ error: message });
    return;
  }

  const status = error.status === 400 ? 400 : 500;
  response.status(status).json({
    error: status === 400 ? error.message : "Something went wrong",
  });
});

export default app;
