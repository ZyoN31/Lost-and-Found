type ToastKind = "success" | "error" | "info";

interface Toast {
  id: string;
  kind: ToastKind;
  title: string;
  detail?: string;
  autoDismissMs?: number;
}

class ToastStore {
  toasts = $state<Toast[]>([]);

  add(
    title: string,
    kind: ToastKind = "info",
    detail?: string,
    autoDismissMs = 5000
  ): void {
    // Never stack duplicate toasts with the same message and kind
    if (this.toasts.some((t) => t.title === title && t.kind === kind)) return;
    const id = crypto.randomUUID();
    this.toasts.push({ id, kind, title, detail, autoDismissMs });
    if (autoDismissMs > 0) {
      setTimeout(() => this.remove(id), autoDismissMs);
    }
  }

  remove(id: string): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  clear(): void {
    this.toasts = [];
  }

  success(title: string, detail?: string): void {
    this.add(title, "success", detail);
  }

  error(title: string, detail?: string): void {
    this.add(title, "error", detail);
  }

  info(title: string, detail?: string): void {
    this.add(title, "info", detail);
  }
}

export const toasts = new ToastStore();

export type { Toast, ToastKind };
