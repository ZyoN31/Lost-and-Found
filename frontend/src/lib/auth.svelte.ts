import type { User } from "$lib/types";
import { api } from "$lib/api";
import { toasts } from "./toast.svelte";
import { browser } from "$app/environment";

const TOKEN_KEY = "upemor_lf_token";

class AuthStore {
  user = $state<User | null>(null);
  token = $state<string | null>(null);
  loading = $state(false);
  error = $state<string | null>(null);

  constructor() {
    this.restoreFromStorage();
  }

  get isAuthenticated(): boolean {
    return !!this.token && !!this.user;
  }

  private restoreFromStorage(): void {
    if (!browser) return;
    try {
      const raw = localStorage.getItem(TOKEN_KEY);
      if (raw) {
        this.token = raw;
        api.setToken(raw);
        this.loadMe().catch(() => {
          // token stale
          this.clear();
        });
      }
    } catch {
      // ignore storage errors
    }
  }

  private saveToken(token: string): void {
    if (browser) localStorage.setItem(TOKEN_KEY, token);
    this.token = token;
    api.setToken(token);
  }

  private clearStorage(): void {
    if (browser) localStorage.removeItem(TOKEN_KEY);
    this.token = null;
    this.user = null;
    api.setToken(null);
  }

  async loadMe(): Promise<void> {
    if (!this.token) return;
    this.loading = true;
    this.error = null;
    try {
      const { user } = await api.me();
      this.user = user;
    } catch (err: any) {
      this.clearStorage();
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async register(payload: {
    nombre_completo: string;
    correo: string;
    password: string;
  }): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const { token, user } = await api.register(payload);
      this.saveToken(token);
      this.user = user;
      toasts.add("Cuenta creada. ¡Bienvenido a Lost & Found!", "success");
    } catch (err: any) {
      this.error = err?.message ?? "No se pudo crear la cuenta.";
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async login(correo: string, password: string): Promise<void> {
    this.loading = true;
    this.error = null;
    try {
      const { token, user } = await api.login({ correo, password });
      this.saveToken(token);
      this.user = user;
      toasts.add(`Bienvenido, ${user.nombre_completo}.`, "success");
    } catch (err: any) {
      this.error = err?.message ?? "Correo institucional o contraseña incorrectos.";
      throw err;
    } finally {
      this.loading = false;
    }
  }

  async logout(): Promise<void> {
    try {
      await api.logout();
    } catch {
      // ignore network errors during logout
    } finally {
      this.clearStorage();
      toasts.add("Sesión cerrada.", "info");
    }
  }

  async updateProfilePhoto(file: File): Promise<void> {
    try {
      const { user } = await api.updateProfilePhoto(file);
      this.user = user;
      toasts.add("Foto de perfil actualizada.", "success");
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo actualizar la foto.", "error");
      throw err;
    }
  }

  clear(): void {
    this.clearStorage();
  }
}

export const auth = new AuthStore();
