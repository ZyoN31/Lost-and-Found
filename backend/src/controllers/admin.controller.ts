import type { NextFunction, Response } from "express";
import { ObjectId } from "mongodb";
import { database } from "../config/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import { AppError } from "../utils/errors.js";
import { toAuditLogDto, toPublicUserDto } from "../utils/mappers.js";

export async function getDashboard(
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemsCollection = database.getItemsCollection();
    const usersCollection = database.getUsersCollection();
    const auditCollection = database.getAuditCollection();

    const [activeReports, returnedItems, auditCount, usersDocs, auditDocs] =
      await Promise.all([
        itemsCollection.countDocuments({ estado: { $in: ["perdido", "encontrado"] } }),
        itemsCollection.countDocuments({ estado: "entregado" }),
        auditCollection.countDocuments(),
        usersCollection
          .find({}, { projection: { password_hash: 0 } })
          .sort({ fecha_registro: -1 })
          .toArray(),
        auditCollection.find({}).sort({ fecha: -1 }).limit(100).toArray(),
      ]);

    res.status(200).json({
      kpis: {
        activeReports,
        returnedItems,
        auditCount,
      },
      users: usersDocs.map(toPublicUserDto),
      auditLogs: auditDocs.map(toAuditLogDto),
    });
  } catch (error) {
    next(error);
  }
}

export async function toggleUserStatus(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const { id } = req.params;
    const targetIdString = String(id);
    if (!ObjectId.isValid(targetIdString)) {
      throw new AppError(400, "ID de usuario inválido");
    }

    if (targetIdString === req.user.id) {
      throw new AppError(400, "No puedes suspender tu propia cuenta de administrador");
    }

    const targetId = new ObjectId(targetIdString);
    const usersCollection = database.getUsersCollection();
    const targetUser = await usersCollection.findOne(
      { _id: targetId },
      { projection: { password_hash: 0 } }
    );

    if (!targetUser) {
      throw new AppError(404, "Usuario no encontrado");
    }

    const nextActiveStatus = !targetUser.activo;
    await usersCollection.updateOne(
      { _id: targetId },
      { $set: { activo: nextActiveStatus } }
    );

    const reason =
      typeof req.body?.motivo === "string" && req.body.motivo.trim().length > 0
        ? req.body.motivo.trim()
        : nextActiveStatus
          ? `Reactivación de acceso para ${targetUser.nombre_completo}`
          : `Suspensión administrativa de ${targetUser.nombre_completo}`;

    const auditCollection = database.getAuditCollection();
    const auditEntry = {
      admin_id: new ObjectId(req.user.id),
      admin_nombre: req.user.nombre_completo,
      accion: nextActiveStatus
        ? ("ACTIVAR_USUARIO" as const)
        : ("DESACTIVAR_USUARIO" as const),
      objetivo_id: targetId,
      objetivo_nombre: targetUser.nombre_completo,
      motivo: reason,
      fecha: new Date(),
    };

    const auditResult = await auditCollection.insertOne(auditEntry);
    const createdAudit = await auditCollection.findOne({ _id: auditResult.insertedId });
    const updatedUser = await usersCollection.findOne(
      { _id: targetId },
      { projection: { password_hash: 0 } }
    );

    res.status(200).json({
      user: updatedUser ? toPublicUserDto(updatedUser) : null,
      auditLog: createdAudit ? toAuditLogDto(createdAudit) : null,
    });
  } catch (error) {
    next(error);
  }
}
