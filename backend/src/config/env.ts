import dotenv from "dotenv";

dotenv.config();

interface EnvConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  frontendUrl: string;
  nodeEnv: string;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-fallback-secret-change-in-production",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY ?? "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

export function validateEnv(): void {
  const missing: string[] = [];

  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!env.cloudinaryCloudName) missing.push("CLOUDINARY_CLOUD_NAME");
  if (!env.cloudinaryApiKey) missing.push("CLOUDINARY_API_KEY");
  if (!env.cloudinaryApiSecret) missing.push("CLOUDINARY_API_SECRET");

  if (missing.length > 0) {
    console.warn(
      `[env] Missing environment variables: ${missing.join(", ")}. Check backend/.env before running in production.`
    );
  }
}
