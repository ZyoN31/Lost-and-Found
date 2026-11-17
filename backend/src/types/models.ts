import { ObjectId, type Document } from "mongodb";

export type UserRole = "estudiante" | "admin";
export type ItemStatus = "perdido" | "encontrado" | "entregado";
export type ItemCategory = "Electrónica" | "Documentos" | "Ropa" | "Accesorios" | "Otros";
export type CampusZone =
  | "UD1"
  | "UD2"
  | "UD3"
  | "LT1"
  | "LT2"
  | "Biblioteca"
  | "Café UD1"
  | "Café UD2";

export type AuditAction =
  | "ELIMINAR_PUBLICACION"
  | "DESACTIVAR_USUARIO"
  | "ACTIVAR_USUARIO";

export interface UserDocument extends Document {
  _id?: ObjectId;
  nombre_completo: string;
  correo: string;
  password_hash: string;
  rol: UserRole;
  activo: boolean;
  foto_url?: string | null;
  fecha_registro: Date;
}

export interface EmbeddedCommentDocument {
  comentario_id: ObjectId;
  usuario_id: ObjectId;
  autor_nombre: string;
  texto: string;
  fecha: Date;
}

export interface ItemDocument extends Document {
  _id?: ObjectId;
  usuario_id: ObjectId;
  autor_nombre: string;
  titulo: string;
  categoria: ItemCategory;
  ubicacion: CampusZone;
  estado: ItemStatus;
  descripcion_publica: string;
  foto_url: string | null;
  comentarios: EmbeddedCommentDocument[];
  fecha_registro: Date;
  fecha_actualizacion: Date;
  fecha_entrega?: Date | null;
}

export interface AuditLogDocument extends Document {
  _id?: ObjectId;
  admin_id: ObjectId;
  admin_nombre: string;
  accion: AuditAction;
  objetivo_id: ObjectId;
  objetivo_nombre?: string;
  motivo: string;
  fecha: Date;
}

export interface AuthenticatedUser {
  id: string;
  correo: string;
  rol: UserRole;
  nombre_completo: string;
}

export interface PublicUserDto {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: UserRole;
  activo: boolean;
  foto_url: string | null;
  fecha_registro: string;
}

export interface CommentDto {
  comentario_id: string;
  usuario_id: string;
  autor_nombre: string;
  texto: string;
  fecha: string;
}

export interface ItemDto {
  id: string;
  usuario_id: string;
  autor_nombre: string;
  titulo: string;
  categoria: ItemCategory;
  ubicacion: CampusZone;
  estado: ItemStatus;
  descripcion_publica: string;
  foto_url: string | null;
  comentarios: CommentDto[];
  fecha_registro: string;
  fecha_actualizacion: string;
  fecha_entrega: string | null;
}

export interface AuditLogDto {
  id: string;
  admin_id: string;
  admin_nombre: string;
  accion: AuditAction;
  objetivo_id: string;
  objetivo_nombre?: string;
  motivo: string;
  fecha: string;
}
