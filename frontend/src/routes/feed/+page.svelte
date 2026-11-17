<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { api, CAMPUS_ZONES, CATEGORIES } from "$lib/api";
  import { auth } from "$lib/auth.svelte";
  import { toasts } from "$lib/toast.svelte";
  import type { Item, ItemCategory, ItemStatus } from "$lib/types";
  import Navbar from "$lib/components/Navbar.svelte";
  import ItemCard from "$lib/components/ItemCard.svelte";
  import CreateReportModal from "$lib/components/CreateReportModal.svelte";
  import EditReportModal from "$lib/components/EditReportModal.svelte";
  import ItemDetailModal from "$lib/components/ItemDetailModal.svelte";
  import ConfirmDialog from "$lib/components/ConfirmDialog.svelte";

  let items = $state<Item[]>([]);
  let loading = $state(true);
  let search = $state("");
  let zona = $state("Todas las zonas");
  let categoria = $state("Todos");
  let createOpen = $state(false);
  let editOpen = $state(false);
  let detailOpen = $state(false);
  let editingItem = $state<Item | null>(null);
  let detailItem = $state<Item | null>(null);
  let confirmDelete = $state<{ open: boolean; item: Item | null }>({ open: false, item: null });
  let confirmReturn = $state<{ open: boolean; item: Item | null }>({ open: false, item: null });


  const tabs: { label: string; value: ItemStatus }[] = [
    { label: "Perdidos", value: "perdido" },
    { label: "Encontrados", value: "encontrado" },
    { label: "Devueltos", value: "entregado" },
  ];

  let activeTab = $state<ItemStatus>("perdido");

  let lastEditId = "";
  let lastDetailId = "";

  $effect(() => {
    const tab = $page.url.searchParams.get("tab") as ItemStatus | null;
    activeTab = tab === "encontrado" || tab === "entregado" ? tab : "perdido";
    if ($page.url.searchParams.get("create") === "1") createOpen = true;

    const editId = $page.url.searchParams.get("editId");
    if (editId && editId !== lastEditId) {
      lastEditId = editId;
      api.getItem(editId)
        .then(({ item }) => { editingItem = item; editOpen = true; })
        .catch((err: any) => toasts.add(err?.message ?? "No se pudo cargar el reporte.", "error"));
    }

    const detailId = $page.url.searchParams.get("detailId");
    if (detailId && detailId !== lastDetailId) {
      lastDetailId = detailId;
      api.getItem(detailId)
        .then(({ item }) => { detailItem = item; detailOpen = true; })
        .catch((err: any) => toasts.add(err?.message ?? "No se pudo cargar el detalle.", "error"));
    }
  });

  async function load(): Promise<void> {
    loading = true;
    try {
      const { items: data } = await api.listItems({
        estado: activeTab,
        categoria: categoria !== "Todos" ? categoria : undefined,
        ubicacion: zona !== "Todas las zonas" ? zona : undefined,
        search: search.trim() || undefined,
      });
      items = data;
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudieron cargar los reportes.", "error");
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    load();
  });

  async function handleDelete(item: Item): Promise<void> {
    try {
      await api.deleteItem(item.id);
      toasts.add("Reporte eliminado.", "success");
      await load();
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo eliminar.", "error");
    } finally {
      confirmDelete = { open: false, item: null };
    }
  }

  async function handleMarkReturned(item: Item): Promise<void> {
    try {
      await api.markReturned(item.id);
      toasts.add("Pertenencia marcada como devuelta.", "success");
      await load();
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo marcar como devuelto.", "error");
    } finally {
      confirmReturn = { open: false, item: null };
    }
  }



  const heroCopy = {
    perdido: { title: "Lo que perdiste, puede estar aquí.", sub: "Un pequeño hallazgo. Un gran alivio. Reconecta con tus pertenencias en Upemor.", label: "EN EL CAMPUS" },
    encontrado: { title: "Objetos hallados en el campus.", sub: "Objetos hallados en el campus esperando regresar con su dueño.", label: "ENCONTRADOS EN CAMPUS" },
    entregado: { title: "Reencuentros en campus.", sub: "Historial de pertenencias recuperadas exitosamente por la comunidad.", label: "REENCUENTROS EN CAMPUS" },
  };

  const copy = $derived(heroCopy[activeTab]);
</script>

<svelte:head>
  <title>Lost & Found · Feed UPEMOR</title>
</svelte:head>

<div class="min-h-screen bg-white">
  <Navbar active="feed" />

  <main class="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
    <!-- Hero -->
    <section class="grid grid-cols-1 items-center gap-6 border-b border-[#ECECEC] pb-10 md:grid-cols-[1fr_auto]">
      <div>
        <p class="font-display text-[10px] font-semibold uppercase tracking-[0.2em] text-[#330085]">CONECTA · ENCUENTRA · RECUPERA</p>
        <h1 class="mt-2 font-display text-3xl font-extrabold tracking-tight text-black sm:text-4xl lg:text-5xl">
          {copy.title}
        </h1>
        <p class="mt-3 max-w-[46ch] text-sm leading-relaxed text-[#666666]">{copy.sub}</p>
      </div>
      <div class="hidden md:block">
        <img src="/images/empty-box.svg" alt="" class="h-32 w-32 lg:h-40 lg:w-40" />
      </div>
    </section>

    <div class="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)]">
      <!-- Sidebar -->
      <aside class="space-y-6">
        <div>
          <h2 class="font-display text-base font-bold text-black">Ubicación en Campus</h2>
          <p class="mt-1 text-xs text-[#666666]">Encuentra más cerca de ti</p>
          <ul class="mt-4 space-y-1">
            {#each CAMPUS_ZONES as zone (zone)}
              <li>
                <button
                  type="button"
                  class={`flex w-full items-center gap-2 rounded-full px-4 py-2 text-left font-display text-xs font-medium transition-colors ${zona === zone ? "bg-[#F5F5F7] text-[#330085]" : "text-[#333333] hover:bg-[#F5F5F7]"}`}
                  onclick={() => (zona = zone)}
                >
                  <span class="h-1.5 w-1.5 rounded-full {zona === zone ? 'bg-[#330085]' : 'bg-[#D4D4D8]'}"></span>
                  {zone}
                </button>
              </li>
            {/each}
          </ul>
        </div>

        <div>
          <h2 class="font-display text-base font-bold text-black">Categoría</h2>
          <div class="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              class={`rounded-full border px-3 py-1 font-display text-xs font-medium transition-colors ${categoria === "Todos" ? "border-[#000000] bg-[#000000] text-white" : "border-[#ECECEC] bg-white text-[#333333] hover:border-[#4F1F91]"}`}
              onclick={() => (categoria = "Todos")}
            >
              Todos
            </button>
            {#each CATEGORIES as cat (cat)}
              <button
                type="button"
                class={`rounded-full border px-3 py-1 font-display text-xs font-medium transition-colors ${categoria === cat ? "border-[#000000] bg-[#000000] text-white" : "border-[#ECECEC] bg-white text-[#333333] hover:border-[#4F1F91]"}`}
                onclick={() => (categoria = cat)}
              >
                {cat}
              </button>
            {/each}
          </div>
        </div>
      </aside>

      <!-- Feed -->
      <section>
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div class="inline-flex items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
            {#each tabs as tab (tab.value)}
              <button
                type="button"
                class={`rounded-full px-4 py-1.5 font-display text-xs font-semibold transition-all ${activeTab === tab.value ? "bg-[#000000] text-white" : "text-[#555555] hover:text-black"}`}
                onclick={() => {
                  activeTab = tab.value;
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", tab.value === "perdido" ? "perdido" : tab.value);
                  goto(url.toString(), { replaceState: true });
                }}
              >
                {tab.label}
              </button>
            {/each}
          </div>
          <button
            type="button"
            class="inline-flex items-center gap-2 rounded-full bg-[#000000] px-5 py-2 font-display text-xs font-semibold text-white hover:bg-[#330085] focus-porple transition-colors"
            onclick={() => (createOpen = true)}
          >
            <span>+</span> Crear Reporte
          </button>
        </div>

        <div class="mt-4 flex items-center gap-3 rounded-full border border-[#ECECEC] bg-white px-4 py-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#999999" stroke-width="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
          <input
            type="text"
            placeholder="Buscar pertenencia…"
            class="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#A0A0A0]"
            bind:value={search}
            oninput={() => load()}
          />
        </div>

        <p class="mt-4 font-display text-xs font-semibold uppercase tracking-widest text-[#330085]">{copy.label}</p>

        {#if loading}
          <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {#each Array.from({ length: 6 }) as _ (crypto.randomUUID())}
              <div class="h-72 animate-pulse rounded-3xl bg-[#F5F5F7]"></div>
            {/each}
          </div>
        {:else if items.length === 0}
          <div class="mt-6 flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#ECECEC] bg-white py-16 text-center">
            <img src="/images/empty-box.svg" alt="" class="h-24 w-24 opacity-40" />
            <p class="mt-4 font-display text-base font-semibold text-black">No hay reportes en esta vista</p>
            <p class="mt-1 text-sm text-[#666666]">Ajusta los filtros o crea el primero con el botón «+ Crear Reporte».</p>
          </div>
        {:else}
          <div class="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {#each items as item (item.id)}
              <ItemCard
                item={item}
                onEdit={() => { editingItem = item; editOpen = true; }}
                onDelete={() => (confirmDelete = { open: true, item })}
                onMarkReturned={() => (confirmReturn = { open: true, item })}
                onView={() => { detailItem = item; detailOpen = true; }}
              />
            {/each}
          </div>
        {/if}
      </section>
    </div>
  </main>

  <footer class="mt-12 border-t border-[#ECECEC] py-6">
    <div class="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6 lg:px-8">
      <span class="font-brand text-lg text-black">Lost &amp; Found</span>
      <p class="text-xs text-[#666666]">Cada objeto tiene una historia. Ayudemos a que vuelva.</p>
      <span class="font-display text-[10px] uppercase tracking-widest text-[#999999]">Comunidad UPEMOR</span>
    </div>
  </footer>

  <CreateReportModal bind:open={createOpen} on:created={() => load()} />
  <EditReportModal bind:open={editOpen} item={editingItem} on:updated={() => load()} />
  <ItemDetailModal
    bind:open={detailOpen}
    item={detailItem}
    currentUserId={auth.user?.id ?? ""}
    isAdmin={auth.user?.rol === "admin"}
    on:updated={() => load()}
    on:deleted={() => load()}
    on:edit={(e) => { editingItem = e.detail.item; editOpen = true; detailOpen = false; }}
  />
  <ConfirmDialog
    open={confirmDelete.open}
    tone="danger"
    title="¿Eliminar este reporte?"
    description="Esta acción eliminará permanentemente la publicación y su fotografía de la nube."
    confirmLabel="Sí, eliminar"
    on:confirm={() => confirmDelete.item && handleDelete(confirmDelete.item)}
    on:dismiss={() => (confirmDelete = { open: false, item: null })}
  />
  <ConfirmDialog
    open={confirmReturn.open}
    tone="success"
    title="Confirmar entrega"
    description="¿Confirmas que la pertenencia ha sido entregada a su dueño legítimo?"
    confirmLabel="Confirmar entrega"
    on:confirm={() => confirmReturn.item && handleMarkReturned(confirmReturn.item)}
    on:dismiss={() => (confirmReturn = { open: false, item: null })}
  />
</div>
