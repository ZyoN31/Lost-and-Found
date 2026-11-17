import type { WithId } from "mongodb";
import type {
  AuditLogDocument,
  AuditLogDto,
  CommentDto,
  EmbeddedCommentDocument,
  ItemDocument,
  ItemDto,
  PublicUserDto,
  UserDocument,
} from "../types/models.js";

export function toPublicUserDto(doc: WithId<UserDocument>): PublicUserDto {
  return {
    id: doc._id.toString(),
    nombre_completo: doc.nombre_completo,
    correo: doc.correo,
    rol: doc.rol,
    activo: doc.activo,
    foto_url: doc.foto_url ?? null,
    fecha_registro: doc.fecha_registro.toISOString(),
  };
}

export function toCommentDto(comment: EmbeddedCommentDocument): CommentDto {
  return {
    comentario_id: comment.comentario_id.toString(),
    usuario_id: comment.usuario_id.toString(),
    autor_nombre: comment.autor_nombre,
    texto: comment.texto,
    fecha: comment.fecha.toISOString(),
  };
}

export function toItemDto(doc: WithId<ItemDocument>): ItemDto {
  return {
    id: doc._id.toString(),
    usuario_id: doc.usuario_id.toString(),
    autor_nombre: doc.autor_nombre,
    titulo: doc.titulo,
    categoria: doc.categoria,
    ubicacion: doc.ubicacion,
    estado: doc.estado,
    descripcion_publica: doc.descripcion_publica,
    foto_url: doc.foto_url ?? null,
    comentarios: (doc.comentarios ?? []).map(toCommentDto),
    fecha_registro: doc.fecha_registro.toISOString(),
    fecha_actualizacion: doc.fecha_actualizacion.toISOString(),
    fecha_entrega: doc.fecha_entrega ? doc.fecha_entrega.toISOString() : null,
  };
}

export function toAuditLogDto(doc: WithId<AuditLogDocument>): AuditLogDto {
  return {
    id: doc._id.toString(),
    admin_id: doc.admin_id.toString(),
    admin_nombre: doc.admin_nombre,
    accion: doc.accion,
    objetivo_id: doc.objetivo_id.toString(),
    objetivo_nombre: doc.objetivo_nombre,
    motivo: doc.motivo,
    fecha: doc.fecha.toISOString(),
  };
}
