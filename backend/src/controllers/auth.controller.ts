import bcrypt from "bcryptjs";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { deleteImageByUrl, uploadImageBuffer } from "../config/cloudinary.js";
import { database } from "../config/db.js";
import { env } from "../config/env.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type { AuthenticatedUser } from "../types/models.js";
import { AppError, isMongoDuplicateKeyError } from "../utils/errors.js";
import { toPublicUserDto } from "../utils/mappers.js";
import { loginSchema, registerSchema } from "../utils/validation.js";

const SALT_ROUNDS = 10;
const TOKEN_EXPIRATION = "7d";
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function signAuthToken(payload: AuthenticatedUser): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: TOKEN_EXPIRATION });
}

function setAuthCookie(res: Response, token: string): void {
  res.cookie("token", token, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE_MS,
  });
}

export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = registerSchema.parse(req.body);
    const normalizedEmail = parsed.correo.toLowerCase();
    const users = database.getUsersCollection();

    const passwordHash = await bcrypt.hash(parsed.password, SALT_ROUNDS);
    const now = new Date();

    const newUser = {
      nombre_completo: parsed.nombre_completo,
      correo: normalizedEmail,
      password_hash: passwordHash,
      rol: "estudiante" as const,
      activo: true,
      foto_url: null,
      fecha_registro: now,
    };

    const result = await users.insertOne(newUser);
    const createdDoc = await users.findOne(
      { _id: result.insertedId },
      { projection: { password_hash: 0 } }
    );

    if (!createdDoc) {
      throw new AppError(500, "No se pudo recuperar el usuario recién registrado.");
    }

    const tokenPayload: AuthenticatedUser = {
      id: createdDoc._id.toString(),
      correo: createdDoc.correo,
      rol: createdDoc.rol,
      nombre_completo: createdDoc.nombre_completo,
    };

    const token = signAuthToken(tokenPayload);
    setAuthCookie(res, token);

    res.status(201).json({
      token,
      user: toPublicUserDto(createdDoc),
    });
  } catch (error) {
    if (isMongoDuplicateKeyError(error)) {
      next(new AppError(409, "Ya existe una cuenta registrada con este correo institucional"));
      return;
    }
    next(error);
  }
}

export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = loginSchema.parse(req.body);
    const normalizedEmail = parsed.correo.toLowerCase();
    const users = database.getUsersCollection();

    const userDoc = await users.findOne({ correo: normalizedEmail });
    if (!userDoc) {
      throw new AppError(401, "Correo institucional o contraseña incorrectos");
    }

    const isPasswordValid = await bcrypt.compare(parsed.password, userDoc.password_hash);
    if (!isPasswordValid) {
      throw new AppError(401, "Correo institucional o contraseña incorrectos");
    }

    if (userDoc.activo !== true) {
      throw new AppError(
        403,
        "Cuenta suspendida por infringir las normas de la comunidad"
      );
    }

    const tokenPayload: AuthenticatedUser = {
      id: userDoc._id.toString(),
      correo: userDoc.correo,
      rol: userDoc.rol,
      nombre_completo: userDoc.nombre_completo,
    };

    const token = signAuthToken(tokenPayload);
    setAuthCookie(res, token);

    res.status(200).json({
      token,
      user: toPublicUserDto(userDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie("token", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "none" : "lax",
  });
  res.status(200).json({ message: "Sesión cerrada correctamente" });
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Sesión no iniciada");
    }

    const users = database.getUsersCollection();
    const userDoc = await users.findOne(
      { _id: new ObjectId(req.user.id) },
      { projection: { password_hash: 0 } }
    );

    if (!userDoc) {
      throw new AppError(404, "Usuario no encontrado");
    }

    res.status(200).json({ user: toPublicUserDto(userDoc) });
  } catch (error) {
    next(error);
  }
}

export async function updateProfilePhoto(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    if (!req.file) {
      throw new AppError(400, "Debes seleccionar una imagen válida (JPG, PNG o WEBP)");
    }

    const userId = new ObjectId(req.user.id);
    const users = database.getUsersCollection();
    const existing = await users.findOne(
      { _id: userId },
      { projection: { password_hash: 0 } }
    );

    if (!existing) {
      throw new AppError(404, "Usuario no encontrado");
    }

    const newPhotoUrl = await uploadImageBuffer(
      req.file.buffer,
      "upemor-lost-found/avatars"
    );

    if (existing.foto_url) {
      await deleteImageByUrl(existing.foto_url);
    }

    await users.updateOne({ _id: userId }, { $set: { foto_url: newPhotoUrl } });

    const updated = await users.findOne(
      { _id: userId },
      { projection: { password_hash: 0 } }
    );

    res.status(200).json({
      user: updated ? toPublicUserDto(updated) : null,
    });
  } catch (error) {
    next(error);
  }
}
