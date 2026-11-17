import dotenv from "dotenv";

dotenv.config({ override: true });

interface CloudinaryCredentials {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
}

// Trim whitespace and strip accidental surrounding quotes from env values.
function cleanEnvValue(raw: string | undefined): string {
  if (!raw) return "";
  let value = raw.trim();
  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

// Parse the "API environment variable" shown in the Cloudinary dashboard:
//   CLOUDINARY_URL=cloudinary://<api_key>:<api_secret>@<cloud_name>
// Only used as a fallback when the three individual variables are not set.
function parseCloudinaryUrl(): CloudinaryCredentials | null {
  const raw = process.env.CLOUDINARY_URL?.trim();
  if (!raw) return null;
  const match = /^cloudinary:\/\/([^:/\s]+):([^@\s]+)@([^/\s]+)$/.exec(raw);
  if (!match) {
    console.warn(
      "[env] CLOUDINARY_URL is set but does not match cloudinary://<key>:<secret>@<cloud_name> — ignoring it."
    );
    return null;
  }
  return { cloudName: match[3], apiKey: match[1], apiSecret: match[2] };
}

// Primary source of truth: the three individual variables.
const directCloudName = cleanEnvValue(process.env.CLOUDINARY_CLOUD_NAME);
const directApiKey = cleanEnvValue(process.env.CLOUDINARY_API_KEY);
const directApiSecret = cleanEnvValue(process.env.CLOUDINARY_API_SECRET);

const hasDirectCredentials = Boolean(directCloudName && directApiKey && directApiSecret);
const cloudinaryFromUrl = hasDirectCredentials ? null : parseCloudinaryUrl();

const cloudinaryCloudName = hasDirectCredentials
  ? directCloudName
  : (cloudinaryFromUrl?.cloudName ?? "");
const cloudinaryApiKey = hasDirectCredentials
  ? directApiKey
  : (cloudinaryFromUrl?.apiKey ?? "");
const cloudinaryApiSecret = hasDirectCredentials
  ? directApiSecret
  : (cloudinaryFromUrl?.apiSecret ?? "");

// Connection URL built dynamically in code from the resolved credentials.
const cloudinaryUrl =
  cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret
    ? `cloudinary://${cloudinaryApiKey}:${cloudinaryApiSecret}@${cloudinaryCloudName}`
    : "";

// The Cloudinary v2 SDK auto-reads process.env.CLOUDINARY_URL at import time.
// If the three explicit variables are set but CLOUDINARY_URL is empty or
// malformed, drop it so the SDK never overrides our explicit config.
const rawCloudinaryUrl = process.env.CLOUDINARY_URL?.trim() ?? "";
const urlIsValid = /^cloudinary:\/\/[^:/\s]+:[^@\s]+@[^/\s]+$/.test(rawCloudinaryUrl);
if (hasDirectCredentials && !urlIsValid && process.env.CLOUDINARY_URL !== undefined) {
  delete process.env.CLOUDINARY_URL;
}

interface EnvConfig {
  port: number;
  mongodbUri: string;
  jwtSecret: string;
  cloudinaryCloudName: string;
  cloudinaryApiKey: string;
  cloudinaryApiSecret: string;
  cloudinaryUrl: string;
  frontendUrl: string;
  nodeEnv: string;
}

export const env: EnvConfig = {
  port: Number(process.env.PORT) || 4000,
  mongodbUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-fallback-secret-change-in-production",
  cloudinaryCloudName,
  cloudinaryApiKey,
  cloudinaryApiSecret,
  cloudinaryUrl,
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
};

export function validateEnv(): void {
  const missing: string[] = [];

  if (!env.mongodbUri) missing.push("MONGODB_URI");
  if (!process.env.JWT_SECRET) missing.push("JWT_SECRET");
  if (!env.cloudinaryCloudName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
    missing.push("CLOUDINARY_URL (or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)");
  }

  if (missing.length > 0) {
    console.warn(
      `[env] Missing environment variables: ${missing.join(", ")}. Check backend/.env before running in production.`
    );
  }
}
