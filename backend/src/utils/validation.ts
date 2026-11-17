import { z } from "zod";

export const UPEMOR_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@upemor\.edu\.mx$/i;

export const ITEM_CATEGORIES = [
  "Electrónica",
  "Documentos",
  "Ropa",
  "Accesorios",
  "Otros",
] as const;

export const CAMPUS_ZONES = [
  "UD1",
  "UD2",
  "UD3",
  "LT1",
  "LT2",
  "Biblioteca",
  "Café UD1",
  "Café UD2",
] as const;

export const registerSchema = z.object({
  nombre_completo: z
    .string()
    .trim()
    .min(3, "El nombre completo debe tener al menos 3 caracteres")
    .max(100, "El nombre completo no puede exceder los 100 caracteres"),
  correo: z
    .string()
    .trim()
    .regex(UPEMOR_EMAIL_REGEX, "Debes usar un correo institucional válido (@upemor.edu.mx)"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(72, "La contraseña no puede exceder los 72 caracteres"),
});

export const loginSchema = z.object({
  correo: z
    .string()
    .trim()
    .regex(UPEMOR_EMAIL_REGEX, "Debes ingresar un correo institucional @upemor.edu.mx"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export const createItemSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(120, "El título no puede exceder los 120 caracteres"),
  estado: z.enum(["perdido", "encontrado"], {
    errorMap: () => ({ message: "El tipo de reporte debe ser perdido o encontrado" }),
  }),
  categoria: z.enum(ITEM_CATEGORIES, {
    errorMap: () => ({ message: "Selecciona una categoría válida" }),
  }),
  ubicacion: z.enum(CAMPUS_ZONES, {
    errorMap: () => ({ message: "Selecciona una ubicación válida del campus" }),
  }),
  descripcion_publica: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(800, "La descripción no puede exceder los 800 caracteres"),
});

export const updateItemSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(120, "El título no puede exceder los 120 caracteres"),
  categoria: z.enum(ITEM_CATEGORIES, {
    errorMap: () => ({ message: "Selecciona una categoría válida" }),
  }),
  ubicacion: z.enum(CAMPUS_ZONES, {
    errorMap: () => ({ message: "Selecciona una ubicación válida del campus" }),
  }),
  descripcion_publica: z
    .string()
    .trim()
    .min(10, "La descripción debe tener al menos 10 caracteres")
    .max(800, "La descripción no puede exceder los 800 caracteres"),
});

export const commentSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(1, "El comentario no puede estar vacío")
    .max(500, "El comentario no puede exceder los 500 caracteres"),
});
