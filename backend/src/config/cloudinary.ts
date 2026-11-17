import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";
import { AppError } from "../utils/errors.js";

let isConfigured = false;

function ensureCloudinaryConfigured(): void {
  if (isConfigured) return;

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new AppError(
      502,
      "La subida de fotografías no está configurada. Avisa al administrador."
    );
  }

  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });

  isConfigured = true;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder = "upemor-lost-found/items"
): Promise<string> {
  ensureCloudinaryConfigured();

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        transformation: [{ width: 1400, height: 1400, crop: "limit" }, { quality: "auto" }],
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          console.error("[cloudinary] Upload failed:", error ?? "missing secure_url in response");
          reject(
            error instanceof Error
              ? new AppError(502, "No se pudo subir la fotografía. Intenta de nuevo más tarde.")
              : new AppError(502, "No se pudo subir la fotografía. Intenta de nuevo más tarde.")
          );
          return;
        }
        resolve(result.secure_url);
      }
    );

    uploadStream.end(buffer);
  });
}

export async function deleteImageByUrl(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || !env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    return;
  }

  ensureCloudinaryConfigured();

  try {
    const match = imageUrl.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
    if (!match?.[1]) return;
    await cloudinary.uploader.destroy(match[1]);
  } catch (error) {
    console.warn("[cloudinary] Could not delete old image:", error);
  }
}
