<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { api } from "$lib/api";
  import { auth } from "$lib/auth.svelte";
  import { toasts } from "$lib/toast.svelte";
  import Navbar from "$lib/components/Navbar.svelte";
  import LiquidSideWaves from "$lib/components/LiquidSideWaves.svelte";
  import { spotlight, reveal } from "$lib/actions/motion";

  interface DashboardUser {
    id: string;
    nombre_completo: string;
    correo: string;
    rol: string;
    activo: boolean;
    foto_url: string | null;
    fecha_registro: string;
  }
  interface AuditEntry {
    id: string;
    admin_nombre: string;
    accion: string;
    objetivo_nombre?: string;
    motivo: string;
    fecha: string;
  }

  let kpis = $state({ activeReports: 0, returnedItems: 0, auditCount: 0 });
  let users = $state<DashboardUser[]>([]);
  let auditLogs = $state<AuditEntry[]>([]);
  let loading = $state(true);
  let togglingId = $state<string | null>(null);

  async function load(): Promise<void> {
    loading = true;
    try {
      const data = await api.adminDashboard();
      kpis = data.kpis;
      users = data.users;
      auditLogs = data.auditLogs;
    } catch (err: any) {
      if (err?.status === 403) {
        toasts.add("No tienes permisos de moderación.", "error");
        goto("/feed", { replaceState: true });
        return;
      }
      toasts.add(err?.message ?? "No se pudo cargar el panel.", "error");
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (!auth.isAuthenticated) {
      goto("/login", { replaceState: true });
      return;
    }
    if (auth.user?.rol !== "admin") {
      toasts.add("Acceso restringido a administradores.", "error");
      goto("/feed", { replaceState: true });
      return;
    }
    load();
  });

  async function toggleStatus(user: DashboardUser): Promise<void> {
    togglingId = user.id;
    try {
      const { user: updated } = await api.toggleUserStatus(user.id, {});
      users = users.map((u) => (u.id === updated.id ? updated : u));
      toasts.add(updated.activo ? "Cuenta reactivada." : "Cuenta suspendida.", "success");
      const data = await api.adminDashboard();
      auditLogs = data.auditLogs;
      kpis = data.kpis;
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo cambiar el estado de la cuenta.", "error");
    } finally {
      togglingId = null;
    }
  }

  function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  }
</script>

<svelte:head>
  <title>Moderación · Lost &amp; Found</title>
</svelte:head>

<div class="min-h-screen bg-white">
  <Navbar active="admin" />
  <LiquidSideWaves />

  <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <header class="mb-8">
      <p class="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[#330085]">ADMINISTRACIÓN / MODERACIÓN</p>
      <h1 class="mt-2 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Una comunidad en buenas manos.</h1>
      <p class="mt-2 max-w-[50ch] text-sm leading-relaxed text-[#666666]">Supervisa reportes, gestiona accesos y consulta cada acción.</p>
    </header>

    <!-- KPI cards -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div use:reveal={{ delay: 0, y: 22 }} use:spotlight class="spotlight-card rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <h2 class="font-display text-sm font-bold text-black">Reportes Activos</h2>
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#330085]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4h6v3H9z" /><rect x="4" y="7" width="16" height="14" rx="2" /><path d="M8 12h8M8 16h5" /></svg>
          </span>
        </div>
        <p class="mt-3 font-display text-4xl font-black text-black">{kpis.activeReports}</p>
        <p class="mt-1 text-[11px] text-[#666666]">Publicaciones que esperan su reencuentro</p>
      </div>
      <div use:reveal={{ delay: 110, y: 22 }} use:spotlight class="spotlight-card rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <h2 class="font-display text-sm font-bold text-black">Objetos Devueltos</h2>
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#330085]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></svg>
          </span>
        </div>
        <p class="mt-3 font-display text-4xl font-black text-black">{kpis.returnedItems}</p>
        <p class="mt-1 text-[11px] text-[#666666]">Historias con un final feliz</p>
      </div>
      <div use:reveal={{ delay: 220, y: 22 }} use:spotlight class="spotlight-card rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div class="flex items-start justify-between">
          <h2 class="font-display text-sm font-bold text-black">Acciones en Bitácora</h2>
          <span class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F5F7] text-[#330085]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h4" /></svg>
          </span>
        </div>
        <p class="mt-3 font-display text-4xl font-black text-black">{kpis.auditCount}</p>
        <p class="mt-1 text-[11px] text-[#666666]">Registro transparente de moderación</p>
      </div>
    </section>

    <!-- Users -->
    <section class="mt-6 overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-[#ECECEC] px-6 py-4">
        <h2 class="font-display text-lg font-bold text-black">Gestión de Usuarios</h2>
        <span class="font-display text-[11px] text-[#666666]">Solo cuentas @upemor.edu.mx</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[560px] text-left">
          <thead>
            <tr class="bg-[#F5F5F7] font-display text-[11px] uppercase tracking-wider text-[#666666]">
              <th class="px-4 py-3 sm:px-6 font-semibold">Estudiante</th>
              <th class="px-4 py-3 sm:px-6 font-semibold">Correo institucional</th>
              <th class="px-4 py-3 sm:px-6 font-semibold">Estado</th>
              <th class="px-4 py-3 sm:px-6 font-semibold">Acceso al campus</th>
            </tr>
          </thead>
          <tbody>
            {#if loading}
              <tr><td colspan="4" class="px-6 py-8 text-center text-sm text-[#999999]">Cargando usuarios…</td></tr>
            {:else if users.length === 0}
              <tr><td colspan="4" class="px-6 py-8 text-center text-sm text-[#999999]">Sin usuarios registrados.</td></tr>
            {:else}
              {#each users as user (user.id)}
                <tr class="border-t border-[#ECECEC] text-xs sm:text-sm">
                  <td class="px-4 py-3 sm:px-6">
                    <div class="flex items-center gap-3">
                      <span class="flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F5F7] font-display text-[11px] font-bold text-[#330085]">
                        {user.nombre_completo.charAt(0).toUpperCase()}
                      </span>
                      <span class="font-display font-medium text-[#333333]">{user.nombre_completo}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 sm:px-6 text-[#555555]">{user.correo}</td>
                  <td class="px-4 py-3 sm:px-6">
                    <span class={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 font-display text-[11px] font-semibold ${user.activo ? "bg-[#ECFDF5] text-[#059669]" : "bg-[#FEF2F2] text-[#DC2626]"}`}>
                      <span class={`h-1.5 w-1.5 rounded-full bg-current ${user.activo ? "status-pulse" : ""}`}></span>
                      {user.activo ? "Activo" : "Suspendido"}
                    </span>
                  </td>
                  <td class="px-4 py-3 sm:px-6">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={user.activo}
                      aria-label={`Cambiar acceso de ${user.nombre_completo}`}
                      class={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-porple disabled:opacity-50 ${user.activo ? "bg-[#000000]" : "bg-[#D4D4D8]"}`}
                      disabled={togglingId === user.id}
                      onclick={() => toggleStatus(user)}
                    >
                      <span class={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${user.activo ? "translate-x-6" : "translate-x-1"}`}></span>
                    </button>
                  </td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </section>

    <!-- Audit log -->
    <section class="mt-6 overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-sm">
      <div class="flex items-center justify-between border-b border-[#ECECEC] px-6 py-4">
        <h2 class="font-display text-lg font-bold text-black">Bitácora de Auditoría</h2>
        <span class="font-display text-[11px] text-[#666666]">Últimas acciones · {auditLogs.length} de {kpis.auditCount}</span>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[640px] text-left">
          <thead>
            <tr class="bg-[#F5F5F7] font-display text-[11px] uppercase tracking-wider text-[#666666]">
              <th class="px-4 py-3 sm:px-6 font-semibold">Admin</th>
              <th class="px-4 py-3 sm:px-6 font-semibold">Acción</th>
              <th class="px-4 py-3 sm:px-6 font-semibold">Motivo</th>
              <th class="px-4 py-3 sm:px-6 font-semibold">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {#if loading}
              <tr><td colspan="4" class="px-6 py-8 text-center text-sm text-[#999999]">Cargando bitácora…</td></tr>
            {:else if auditLogs.length === 0}
              <tr><td colspan="4" class="px-6 py-8 text-center text-sm text-[#999999]">Todavía no hay acciones registradas.</td></tr>
            {:else}
              {#each auditLogs as entry (entry.id)}
                <tr class="border-t border-[#ECECEC] text-xs sm:text-sm">
                  <td class="px-4 py-3 sm:px-6 font-display text-[#333333]">{entry.admin_nombre}</td>
                  <td class="px-4 py-3 sm:px-6">
                    <span class="rounded-full bg-[#F5F5F7] px-2.5 py-0.5 font-display text-[11px] font-semibold text-[#330085]">{entry.accion}</span>
                  </td>
                  <td class="px-4 py-3 sm:px-6 text-[#555555]">{entry.motivo}</td>
                  <td class="px-4 py-3 sm:px-6 font-display text-[11px] text-[#666666]">{formatDateTime(entry.fecha)}</td>
                </tr>
              {/each}
            {/if}
          </tbody>
        </table>
      </div>
    </section>
  </main>
</div>
