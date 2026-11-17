import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../utils/errors.js";

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
  },
  fileFilter: (_req, file, callback) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      callback(
        new AppError(400, "Formato de imagen no permitido. Usa JPG, PNG o WEBP.")
      );
      return;
    }
    callback(null, true);
  },
});

export function handleSingleImageUpload(fieldName = "foto") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const middleware = upload.single(fieldName);
    middleware(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }

      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          next(new AppError(400, "La imagen no debe superar los 5 MB."));
          return;
        }
        next(new AppError(400, `Error al procesar la imagen: ${err.message}`));
        return;
      }

      next(err);
    });
  };
}
