<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { api, statusLabels } from "$lib/api";
  import { auth } from "$lib/auth.svelte";
  import { toasts } from "$lib/toast.svelte";
  import type { Item } from "$lib/types";
  import Navbar from "$lib/components/Navbar.svelte";
  import StatusBadge from "$lib/components/StatusBadge.svelte";
  import LiquidSideWaves from "$lib/components/LiquidSideWaves.svelte";
  import { spotlight, reveal } from "$lib/actions/motion";

  let me = $state<{ nombre_completo: string; correo: string; rol: string; activo: boolean; foto_url: string | null } | null>(null);
  let myReports = $state<Item[]>([]);
  let loading = $state(true);
  let filter = $state<"all" | "active" | "delivered">("all");
  let photoInput: HTMLInputElement | null = $state(null);

  async function load(): Promise<void> {
    loading = true;
    try {
      const { user } = await api.me();
      me = user;
      const { items } = await api.listItems({ mine: true });
      myReports = items;
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudieron cargar tus reportes.", "error");
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    if (auth.isAuthenticated) {
      load();
    } else {
      goto("/login", { replaceState: true });
    }
  });

  const filteredReports = $derived.by(() => {
    if (filter === "delivered") return myReports.filter((r) => r.estado === "entregado");
    if (filter === "active") return myReports.filter((r) => r.estado !== "entregado");
    return myReports;
  });

  const totalReports = $derived(myReports.length);
  const totalDelivered = $derived(myReports.filter((r) => r.estado === "entregado").length);

  function handleView(item: Item): void {
    goto(`/feed?detailId=${item.id}`);
  }

  function handleEdit(item: Item): void {
    goto(`/feed?editId=${item.id}`);
  }

  async function handleLogout(): Promise<void> {
    await auth.logout();
    goto("/login", { replaceState: true });
  }

  async function handlePhotoChange(e: Event): Promise<void> {
    const target = e.currentTarget as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;
    try {
      await auth.updateProfilePhoto(file);
      await load();
    } catch {
      // handled in auth store
    }
  }

  function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
  }
</script>

<svelte:head>
  <title>Tu espacio en la comunidad · Lost &amp; Found</title>
</svelte:head>

<div class="min-h-screen bg-white">
  <Navbar active="profile" />
  <LiquidSideWaves />

  <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <header class="mb-8">
      <p class="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[#330085]">MI PERFIL / COMUNIDAD</p>
      <h1 class="mt-2 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl">Tu espacio en la comunidad.</h1>
      <p class="mt-2 max-w-[50ch] text-sm leading-relaxed text-[#666666]">Tus reportes, tus hallazgos y cada reencuentro.</p>
    </header>

    <div class="grid grid-cols-1 gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <!-- Profile card with liquid-dark banner -->
      <aside use:reveal={{ y: 18 }} class="overflow-hidden rounded-3xl border border-[#ECECEC] bg-white text-center shadow-sm">
        <div class="relative h-28 overflow-hidden bg-black">
          <div class="animate-liquid-morph absolute -left-5 top-1 h-24 w-24 bg-[#330085]/80 blur-xl"></div>
          <div class="animate-liquid-morph absolute right-0 top-5 h-20 w-28 bg-[#4F1F91]/70 blur-lg [animation-delay:-6s]"></div>
          <div class="absolute inset-0 bg-[radial-gradient(120%_130%_at_50%_0%,transparent_25%,rgba(0,0,0,0.6)_100%)]"></div>
          <p class="absolute left-5 top-4 font-display text-[9px] font-semibold uppercase tracking-[0.3em] text-white/55">Comunidad Upemor</p>
        </div>

        <div class="px-6 pb-6">
        <div class="relative mx-auto -mt-12 h-24 w-24">
          {#if me?.foto_url}
            <img src={me.foto_url} alt={me.nombre_completo} class="h-24 w-24 rounded-full object-cover shadow-[0_0_0_4px_#ffffff,0_0_40px_rgba(79,31,145,0.6)]" />
          {:else}
            <div class="flex h-24 w-24 items-center justify-center rounded-full bg-[radial-gradient(circle_at_35%_30%,#4F1F91,#330085_62%,#000000)] font-brand text-3xl text-white shadow-[0_0_0_4px_#ffffff,0_0_40px_rgba(79,31,145,0.6)]">
              {(me?.nombre_completo ?? "?").charAt(0).toUpperCase()}
            </div>
          {/if}
          <button
            type="button"
            class="absolute -bottom-1 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-[#ECECEC] bg-white text-[#333333] shadow-sm transition-colors hover:border-[#4F1F91] hover:text-[#330085] focus-porple"
            aria-label="Cambiar foto"
            onclick={() => photoInput?.click()}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h3l2-2h6l2 2h3v12H4z" /><circle cx="12" cy="13" r="3" /></svg>
          </button>
          <input bind:this={photoInput} type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange={handlePhotoChange} />
        </div>

        <h2 class="mt-4 font-display text-xl font-bold leading-tight text-black">{me?.nombre_completo ?? "—"}</h2>
        <p class="mt-1 truncate font-display text-xs text-[#666666]">{me?.correo ?? ""}</p>

        <span class="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] px-3 py-0.5 font-display text-[11px] font-semibold text-[#059669]">
          <span class="h-1.5 w-1.5 rounded-full bg-[#059669]"></span>
          {me?.rol === "admin" ? "Administrador" : "Estudiante"} · {me?.activo ? "Activo" : "Suspendido"}
        </span>

        <div class="mt-6 grid grid-cols-2 divide-x divide-[#ECECEC] rounded-2xl border border-[#ECECEC] py-4">
          <div>
            <p class="font-display text-3xl font-black text-black">{totalReports}</p>
            <p class="mt-1 font-display text-[11px] text-[#666666]">Reportes creados</p>
          </div>
          <div>
            <p class="font-display text-3xl font-black text-black">{totalDelivered}</p>
            <p class="mt-1 font-display text-[11px] text-[#666666]">Devueltos</p>
          </div>
        </div>

        <button
          type="button"
          class="mt-5 w-full rounded-full bg-[#F5F5F7] px-4 py-2.5 font-display text-sm font-semibold text-[#333333] transition-all hover:bg-[#ECECEC] focus-porple active:scale-[0.98]"
          onclick={handleLogout}
        >
          Cerrar sesión
        </button>
        </div>
      </aside>

      <!-- Reports -->
      <section class="rounded-3xl border border-[#ECECEC] bg-white p-6 shadow-sm">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="font-display text-xl font-bold text-black">Mis Reportes</h2>
            <p class="mt-1 text-xs text-[#666666]">Consulta y administra tus publicaciones en Lost & Found.</p>
          </div>
          <div class="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
            {#each [{ v: "all", l: "Todos" }, { v: "active", l: "Activos" }, { v: "delivered", l: "Devueltos" }] as opt (opt.v)}
              <button
                type="button"
                class={`rounded-full px-4 py-1.5 font-display text-xs font-semibold transition-all ${filter === opt.v ? "bg-[#000000] text-white" : "text-[#555555] hover:text-black"}`}
                onclick={() => (filter = opt.v as typeof filter)}
              >
                {opt.l}
              </button>
            {/each}
          </div>
        </div>

        <div class="mt-5 space-y-3">
          {#if loading}
            {#each [0, 1, 2] as skeleton (skeleton)}
              <div class="h-24 animate-pulse rounded-2xl bg-[#F5F5F7]"></div>
            {/each}
          {:else if filteredReports.length === 0}
            <div class="rounded-2xl border border-dashed border-[#ECECEC] py-12 text-center">
              <p class="font-display text-sm font-semibold text-black">Aún no hay reportes aquí</p>
              <p class="mt-1 text-xs text-[#666666]">Crea tu primer reporte desde el feed.</p>
              <a href="/feed?create=1" class="mt-4 inline-flex rounded-full bg-[#000000] px-4 py-2 font-display text-xs font-semibold text-white hover:bg-[#330085] transition-colors">+ Crear Reporte</a>
            </div>
          {:else}
            {#each filteredReports as item, i (item.id)}
              <div
                use:reveal={{ delay: Math.min(i * 70, 420), y: 20 }}
                class="spotlight-card flex items-center gap-4 rounded-2xl border border-[#ECECEC] bg-white p-3 transition-shadow duration-200 hover:shadow-md"
              >
                <div class="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#F5F5F7]">
                  {#if item.foto_url}
                    <img src={item.foto_url} alt="" class="h-full w-full object-cover" />
                  {:else}
                    <div class="flex h-full w-full items-center justify-center text-[#CCCCCC]">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="4" /><circle cx="9" cy="9" r="1.5" /></svg>
                    </div>
                  {/if}
                </div>
                <div class="min-w-0 flex-1">
                  <p class="truncate font-display text-sm font-bold text-black">{item.titulo}</p>
                  <div class="mt-1 flex flex-wrap items-center gap-2">
                    <span class="inline-flex rounded-full px-2 py-0.5 font-display text-[10px] font-semibold {item.estado === 'perdido' ? 'bg-[#FEF2F2] text-[#DC2626]' : item.estado === 'encontrado' ? 'bg-[#FFFBEB] text-[#D97706]' : 'bg-[#ECFDF5] text-[#059669]'}">
                      {statusLabels(item.estado).label}
                    </span>
                    <span class="font-display text-[11px] text-[#666666]">{item.ubicacion} · {formatDate(item.fecha_registro)}</span>
                  </div>
                  <div class="mt-2 flex flex-wrap gap-2">
                    <button type="button" class="rounded-full bg-[#F5F5F7] px-3 py-1 font-display text-[11px] font-semibold text-[#333333] hover:bg-[#ECECEC] transition-colors" onclick={() => handleEdit(item)}>Editar</button>
                    <button type="button" class="rounded-full bg-[#000000] px-3 py-1 font-display text-[11px] font-semibold text-white hover:bg-[#330085] transition-colors" onclick={() => handleView(item)}>Ver detalle</button>
                  </div>
                </div>
              </div>
            {/each}
          {/if}
        </div>
      </section>
    </div>
  </main>
</div>
