import { v2 as cloudinary } from "cloudinary";
import { env } from "./env.js";

let isConfigured = false;

function ensureCloudinaryConfigured(): void {
  if (isConfigured) return;

  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    throw new Error(
      "Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) are missing."
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
          reject(error ?? new Error("Failed to upload image to Cloudinary."));
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
