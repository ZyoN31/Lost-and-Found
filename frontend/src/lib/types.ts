export type UserRole = "estudiante" | "admin";

export type ItemStatus = "perdido" | "encontrado" | "entregado";

export type ItemCategory =
  | "Electrónica"
  | "Documentos"
  | "Ropa"
  | "Accesorios"
  | "Otros";

export interface User {
  id: string;
  nombre_completo: string;
  correo: string;
  rol: UserRole;
  activo: boolean;
  foto_url: string | null;
  fecha_registro: string;
}

export interface Comment {
  comentario_id: string;
  usuario_id: string;
  autor_nombre: string;
  texto: string;
  fecha: string;
}

export interface Item {
  id: string;
  usuario_id: string;
  autor_nombre: string;
  titulo: string;
  categoria: ItemCategory;
  ubicacion: string;
  estado: ItemStatus;
  descripcion_publica: string;
  foto_url: string | null;
  comentarios: Comment[];
  fecha_registro: string;
  fecha_actualizacion: string;
  fecha_entrega: string | null;
}

export interface KpiDashboard {
  activeReports: number;
  returnedItems: number;
  auditCount: number;
}

export interface AdminDashboard {
  kpis: KpiDashboard;
  users: User[];
  auditLogs: AuditLogEntry[];
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_nombre: string;
  accion: string;
  objetivo_id: string;
  objetivo_nombre?: string;
  motivo: string;
  fecha: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export type ApiErrorBody = { error: string; details?: any };
