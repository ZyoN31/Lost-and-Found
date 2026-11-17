import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError, isMongoDuplicateKeyError } from "../utils/errors.js";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: "Ruta no encontrada",
  });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    const firstIssue = err.issues[0];
    res.status(400).json({
      error: firstIssue?.message ?? "Datos de entrada inválidos",
      details: err.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      })),
    });
    return;
  }

  if (isMongoDuplicateKeyError(err)) {
    res.status(409).json({
      error: "Ya existe un registro con este correo institucional",
    });
    return;
  }

  console.error("[error]", err);
  res.status(500).json({
    error: "Error interno del servidor. Inténtalo de nuevo más tarde.",
  });
}
