import { randomUUID } from "node:crypto";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import express from "express";
import config from "./config.js";

const extensionByType = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function saveImage(file) {
  const extension = extensionByType[file.mimetype];
  if (!extension) throw new Error("Only JPG, PNG, WEBP allowed");

  const date = new Date().toISOString().slice(0, 10);
  const key = `${date}-${randomUUID()}.${extension}`;
  await mkdir(config.uploadDir, { recursive: true });
  await writeFile(path.join(config.uploadDir, key), file.buffer, {
    flag: "wx",
  });
  return key;
}

export async function deleteImage(key) {
  if (path.basename(key) !== key) throw new Error("Invalid image key");
  await rm(path.join(config.uploadDir, key), { force: true });
}

export function getImageUrl(key) {
  return `${config.imageBaseUrl}/${encodeURIComponent(key)}`;
}

export const imageMiddleware = express.static(config.uploadDir);
