import type { NextFunction, Response } from "express";
import { ObjectId, type Filter } from "mongodb";
import { deleteImageByUrl, uploadImageBuffer } from "../config/cloudinary.js";
import { database } from "../config/db.js";
import type { AuthenticatedRequest } from "../middleware/auth.middleware.js";
import type {
  ItemCategory,
  ItemDocument,
  ItemStatus,
  CampusZone,
} from "../types/models.js";
import { AppError } from "../utils/errors.js";
import { toItemDto } from "../utils/mappers.js";
import {
  CAMPUS_ZONES,
  ITEM_CATEGORIES,
  commentSchema,
  createItemSchema,
  updateItemSchema,
} from "../utils/validation.js";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function assertValidObjectId(id: string, label = "ID"): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new AppError(400, `${label} inválido`);
  }
  return new ObjectId(id);
}

export async function getItems(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { estado, categoria, ubicacion, search, mine } = req.query;
    const filter: Filter<ItemDocument> = {};

    if (
      typeof estado === "string" &&
      ["perdido", "encontrado", "entregado"].includes(estado)
    ) {
      filter.estado = estado as ItemStatus;
    }

    if (
      typeof categoria === "string" &&
      categoria !== "Todos" &&
      (ITEM_CATEGORIES as readonly string[]).includes(categoria)
    ) {
      filter.categoria = categoria as ItemCategory;
    }

    if (
      typeof ubicacion === "string" &&
      ubicacion !== "Todas las zonas" &&
      (CAMPUS_ZONES as readonly string[]).includes(ubicacion)
    ) {
      filter.ubicacion = ubicacion as CampusZone;
    }

    if (mine === "true" && req.user) {
      filter.usuario_id = new ObjectId(req.user.id);
    }

    if (typeof search === "string" && search.trim().length > 0) {
      const safePattern = escapeRegExp(search.trim());
      const regex = new RegExp(safePattern, "i");
      filter.$or = [{ titulo: regex }, { descripcion_publica: regex }];
    }

    const itemsCollection = database.getItemsCollection();
    const docs = await itemsCollection
      .find(filter)
      .sort({ fecha_registro: -1 })
      .toArray();

    res.status(200).json({
      items: docs.map(toItemDto),
    });
  } catch (error) {
    next(error);
  }
}

export async function getItemById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemId = assertValidObjectId(String(req.params.id), "ID del reporte");
    const itemsCollection = database.getItemsCollection();
    const doc = await itemsCollection.findOne({ _id: itemId });

    if (!doc) {
      throw new AppError(404, "Reporte no encontrado");
    }

    res.status(200).json({ item: toItemDto(doc) });
  } catch (error) {
    next(error);
  }
}

export async function createItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const parsed = createItemSchema.parse(req.body);
    let photoUrl: string | null = null;

    if (req.file) {
      photoUrl = await uploadImageBuffer(req.file.buffer, "upemor-lost-found/items");
    }

    const now = new Date();
    const newItem: ItemDocument = {
      usuario_id: new ObjectId(req.user.id),
      autor_nombre: req.user.nombre_completo,
      titulo: parsed.titulo,
      categoria: parsed.categoria,
      ubicacion: parsed.ubicacion,
      estado: parsed.estado,
      descripcion_publica: parsed.descripcion_publica,
      foto_url: photoUrl,
      comentarios: [],
      fecha_registro: now,
      fecha_actualizacion: now,
      fecha_entrega: null,
    };

    const itemsCollection = database.getItemsCollection();
    const result = await itemsCollection.insertOne(newItem);
    const createdDoc = await itemsCollection.findOne({ _id: result.insertedId });

    if (!createdDoc) {
      throw new AppError(500, "No se pudo crear el reporte");
    }

    res.status(201).json({
      item: toItemDto(createdDoc),
    });
  } catch (error) {
    next(error);
  }
}

export async function updateItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const itemId = assertValidObjectId(String(req.params.id), "ID del reporte");
    const itemsCollection = database.getItemsCollection();
    const existing = await itemsCollection.findOne({ _id: itemId });

    if (!existing) {
      throw new AppError(404, "Reporte no encontrado");
    }

    const isOwner = existing.usuario_id.toString() === req.user.id;
    const isAdmin = req.user.rol === "admin";
    if (!isOwner && !isAdmin) {
      throw new AppError(403, "No tienes permiso para editar este reporte");
    }

    const parsed = updateItemSchema.parse(req.body);
    let updatedPhotoUrl = existing.foto_url;

    if (req.file) {
      const uploadedUrl = await uploadImageBuffer(
        req.file.buffer,
        "upemor-lost-found/items"
      );
      if (existing.foto_url) {
        await deleteImageByUrl(existing.foto_url);
      }
      updatedPhotoUrl = uploadedUrl;
    }

    await itemsCollection.updateOne(
      { _id: itemId },
      {
        $set: {
          titulo: parsed.titulo,
          categoria: parsed.categoria,
          ubicacion: parsed.ubicacion,
          descripcion_publica: parsed.descripcion_publica,
          foto_url: updatedPhotoUrl,
          fecha_actualizacion: new Date(),
        },
      }
    );

    const updatedDoc = await itemsCollection.findOne({ _id: itemId });
    res.status(200).json({
      item: updatedDoc ? toItemDto(updatedDoc) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function markItemReturned(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const itemId = assertValidObjectId(String(req.params.id), "ID del reporte");
    const itemsCollection = database.getItemsCollection();
    const existing = await itemsCollection.findOne({ _id: itemId });

    if (!existing) {
      throw new AppError(404, "Reporte no encontrado");
    }

    const isOwner = existing.usuario_id.toString() === req.user.id;
    const isAdmin = req.user.rol === "admin";
    if (!isOwner && !isAdmin) {
      throw new AppError(
        403,
        "Solo el autor del reporte o un administrador puede marcarlo como devuelto"
      );
    }

    if (existing.estado === "entregado") {
      res.status(200).json({ item: toItemDto(existing) });
      return;
    }

    const now = new Date();
    await itemsCollection.updateOne(
      { _id: itemId },
      {
        $set: {
          estado: "entregado",
          fecha_actualizacion: now,
          fecha_entrega: now,
        },
      }
    );

    const updatedDoc = await itemsCollection.findOne({ _id: itemId });
    res.status(200).json({
      item: updatedDoc ? toItemDto(updatedDoc) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const itemId = assertValidObjectId(String(req.params.id), "ID del reporte");
    const itemsCollection = database.getItemsCollection();
    const existing = await itemsCollection.findOne({ _id: itemId });

    if (!existing) {
      throw new AppError(404, "Reporte no encontrado");
    }

    const isOwner = existing.usuario_id.toString() === req.user.id;
    const isAdmin = req.user.rol === "admin";
    if (!isOwner && !isAdmin) {
      throw new AppError(403, "No tienes permiso para eliminar este reporte");
    }

    await itemsCollection.deleteOne({ _id: itemId });

    if (existing.foto_url) {
      await deleteImageByUrl(existing.foto_url);
    }

    if (isAdmin) {
      const auditCollection = database.getAuditCollection();
      const reason =
        typeof req.body?.motivo === "string" && req.body.motivo.trim().length > 0
          ? req.body.motivo.trim()
          : `Publicación "${existing.titulo}" eliminada por moderación`;

      await auditCollection.insertOne({
        admin_id: new ObjectId(req.user.id),
        admin_nombre: req.user.nombre_completo,
        accion: "ELIMINAR_PUBLICACION",
        objetivo_id: itemId,
        objetivo_nombre: existing.titulo,
        motivo: reason,
        fecha: new Date(),
      });
    }

    res.status(200).json({ message: "Reporte eliminado correctamente" });
  } catch (error) {
    next(error);
  }
}

export async function addComment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const itemId = assertValidObjectId(String(req.params.id), "ID del reporte");
    const parsed = commentSchema.parse(req.body);
    const itemsCollection = database.getItemsCollection();

    const existing = await itemsCollection.findOne({ _id: itemId });
    if (!existing) {
      throw new AppError(404, "Reporte no encontrado");
    }

    if (existing.estado === "entregado") {
      throw new AppError(
        400,
        "Los comentarios están cerrados porque el objeto ya fue devuelto"
      );
    }

    const newComment = {
      comentario_id: new ObjectId(),
      usuario_id: new ObjectId(req.user.id),
      autor_nombre: req.user.nombre_completo,
      texto: parsed.texto,
      fecha: new Date(),
    };

    await itemsCollection.updateOne(
      { _id: itemId },
      {
        $push: { comentarios: newComment },
        $set: { fecha_actualizacion: new Date() },
      } as any
    );

    const updatedDoc = await itemsCollection.findOne({ _id: itemId });
    res.status(201).json({
      item: updatedDoc ? toItemDto(updatedDoc) : null,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteComment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError(401, "Autenticación requerida");
    }

    const itemId = assertValidObjectId(String(req.params.id), "ID del reporte");
    const commentId = assertValidObjectId(String(req.params.commentId), "ID del comentario");
    const itemsCollection = database.getItemsCollection();

    const existing = await itemsCollection.findOne({ _id: itemId });
    if (!existing) {
      throw new AppError(404, "Reporte no encontrado");
    }

    const targetComment = existing.comentarios.find(
      (comment) => comment.comentario_id.toString() === commentId.toString()
    );

    if (!targetComment) {
      throw new AppError(404, "Comentario no encontrado");
    }

    const isCommentAuthor = targetComment.usuario_id.toString() === req.user.id;
    const isPostAuthor = existing.usuario_id.toString() === req.user.id;
    const isAdmin = req.user.rol === "admin";

    if (!isCommentAuthor && !isPostAuthor && !isAdmin) {
      throw new AppError(403, "No tienes permiso para eliminar este comentario");
    }

    await itemsCollection.updateOne(
      { _id: itemId },
      {
        $pull: { comentarios: { comentario_id: commentId } },
        $set: { fecha_actualizacion: new Date() },
      } as any
    );

    const updatedDoc = await itemsCollection.findOne({ _id: itemId });
    res.status(200).json({
      item: updatedDoc ? toItemDto(updatedDoc) : null,
    });
  } catch (error) {
    next(error);
  }
}
