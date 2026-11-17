import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { database } from "../config/db.js";
import { env } from "../config/env.js";
import type { AuthenticatedUser } from "../types/models.js";
import { AppError } from "../utils/errors.js";

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    const cookieToken = req.cookies?.token as string | undefined;
    const token = bearerToken || cookieToken;

    if (!token) {
      throw new AppError(401, "Sesión no iniciada. Inicia sesión para continuar.");
    }

    const decoded = jwt.verify(token, env.jwtSecret) as AuthenticatedUser;

    if (!decoded?.id || !ObjectId.isValid(decoded.id)) {
      throw new AppError(401, "Token de autenticación inválido.");
    }

    const users = database.getUsersCollection();
    const userDoc = await users.findOne(
      { _id: new ObjectId(decoded.id) },
      { projection: { password_hash: 0 } }
    );

    if (!userDoc) {
      throw new AppError(401, "Usuario no encontrado.");
    }

    if (!userDoc.activo) {
      throw new AppError(
        403,
        "Cuenta suspendida por infringir las normas de la comunidad"
      );
    }

    req.user = {
      id: userDoc._id.toString(),
      correo: userDoc.correo,
      rol: userDoc.rol,
      nombre_completo: userDoc.nombre_completo,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, "Tu sesión ha expirado. Inicia sesión nuevamente."));
      return;
    }
    next(error);
  }
}

export function requireAdmin(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    next(new AppError(401, "Autenticación requerida."));
    return;
  }

  if (req.user.rol !== "admin") {
    next(new AppError(403, "Acceso denegado. Se requieren permisos de administrador."));
    return;
  }

  next();
}
