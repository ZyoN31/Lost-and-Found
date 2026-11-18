<script lang="ts">
  import { api } from "$lib/api";
  import { toasts } from "$lib/toast.svelte";
  import type { Comment, Item } from "$lib/types";
  import ConfirmDialog from "./ConfirmDialog.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{
    close: void;
    updated: { item: Item };
    deleted: void;
    edit: { item: Item };
  }>();

  let {
    open = $bindable(false),
    item = null as Item | null,
    currentUserId = "",
    isAdmin = false,
  } = $props();

  let comments = $state<Comment[]>([]);
  let newComment = $state("");
  let submitting = $state(false);
  let confirmReturnOpen = $state(false);
  let confirmDeleteOpen = $state(false);
  let pendingComment = $state<Comment | null>(null);

  $effect(() => {
    if (item) comments = item.comentarios ?? [];
  });

  const isOwner = $derived(!!item && item.usuario_id === currentUserId);
  const isClosed = $derived(item?.estado === "entregado");

  async function handleAddComment(): Promise<void> {
    if (!item || !newComment.trim()) return;
    submitting = true;
    try {
      const { item: updated } = await api.addComment(item.id, newComment.trim());
      comments = updated.comentarios;
      newComment = "";
      dispatch("updated", { item: updated });
      toasts.add("Comentario publicado.", "success");
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo publicar el comentario.", "error");
    } finally {
      submitting = false;
    }
  }

  async function handleDeleteComment(): Promise<void> {
    if (!item || !pendingComment) return;
    try {
      const { item: updated } = await api.deleteComment(item.id, pendingComment.comentario_id);
      comments = updated.comentarios;
      dispatch("updated", { item: updated });
      toasts.add("Comentario eliminado.", "success");
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo eliminar el comentario.", "error");
    } finally {
      pendingComment = null;
    }
  }

  async function handleMarkReturned(): Promise<void> {
    if (!item) return;
    try {
      const { item: updated } = await api.markReturned(item.id);
      dispatch("updated", { item: updated });
      toasts.add("Pertenencia marcada como devuelta.", "success");
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo marcar como devuelto.", "error");
    } finally {
      confirmReturnOpen = false;
    }
  }

  async function handleDeleteItem(): Promise<void> {
    if (!item) return;
    try {
      await api.deleteItem(item.id);
      toasts.add("Reporte eliminado.", "success");
      dispatch("deleted");
      close();
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo eliminar el reporte.", "error");
    } finally {
      confirmDeleteOpen = false;
    }
  }

  function canDeleteComment(comment: Comment): boolean {
    return comment.usuario_id === currentUserId || isOwner || isAdmin;
  }

  function formatDate(iso: string, withTime = false): string {
    return new Date(iso).toLocaleString("es-MX", {
      day: "numeric",
      month: "short",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : { year: "numeric" }),
    });
  }

  function close(): void {
    open = false;
    dispatch("close");
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (!open || event.key !== "Escape") return;
    // Let the inline confirmation dialogs take precedence on Escape
    if (confirmReturnOpen || confirmDeleteOpen || pendingComment) return;
    close();
  }

  // Lock body scroll while the modal is open
  $effect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open && item}
  <div class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="detail-title">
    <button
      type="button"
      aria-label="Cerrar"
      class="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm animate-overlay-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4F1F91]"
      onclick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    ></button>

    <div class="relative mx-3 mb-3 w-full max-w-3xl animate-modal-in overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-2xl sm:mx-4 sm:mb-0">
      <div class="grid max-h-[92vh] grid-cols-1 overflow-y-auto sm:max-h-[86vh] sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] thin-scroll">
        <!-- Left column: image + meta -->
        <div class="bg-[#F5F5F7] sm:flex sm:flex-col">
          <div class="aspect-[4/3] w-full overflow-hidden bg-[#ECECEC]">
            {#if item.foto_url}
              <img src={item.foto_url} alt={item.titulo} class="h-full w-full object-cover" />
            {:else}
              <div class="flex h-full w-full items-center justify-center text-[#CCCCCC]">
                <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4" /><path d="M8.5 14l3.5-3.5 4 4 2-3 1 2" /><circle cx="9" cy="8" r="1.2" /></svg>
              </div>
            {/if}
          </div>
          <div class="space-y-2 p-5">
            <div class="flex flex-wrap items-center gap-2">
              <StatusBadge status={item.estado} size="sm" />
              <span class="rounded-full border border-[#ECECEC] bg-white px-2.5 py-0.5 font-display text-[11px] text-[#555555]">{item.ubicacion}</span>
              <span class="rounded-full border border-[#ECECEC] bg-white px-2.5 py-0.5 font-display text-[11px] text-[#555555]">{item.categoria}</span>
            </div>
            <p class="font-display text-xs text-[#666666]">Publicado el {formatDate(item.fecha_registro)}</p>
            <p class="max-w-[28ch] font-brand text-sm italic leading-snug text-[#333333]">Un hallazgo que puede hacer la diferencia para alguien.</p>
          </div>
        </div>

        <!-- Right column: header, description, comments -->
        <div class="flex min-h-0 flex-col">
          <div class="flex items-start justify-between gap-3 px-6 pb-3 pt-5">
            <div class="min-w-0">
              <p class="font-display text-[10px] font-semibold uppercase tracking-[0.18em] text-[#330085]">
                {item.estado === "perdido" ? "Reporte perdido" : item.estado === "encontrado" ? "Reporte encontrado" : "Reporte devuelto"}
              </p>
              <h2 id="detail-title" class="mt-1 font-display text-2xl font-bold leading-tight text-black">{item.titulo}</h2>
            </div>
            <button type="button" aria-label="Cerrar" class="rounded-full bg-[#F5F5F7] p-2 text-[#666666] hover:bg-[#ECECEC] hover:text-black focus-porple transition-colors" onclick={close}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>

          <div class="px-6 pb-4">
            <p class="whitespace-pre-line text-sm leading-relaxed text-[#333333]">{item.descripcion_publica}</p>
          </div>

          <div class="flex items-center gap-3 border-t border-[#ECECEC] px-6 py-4">
            <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[#ECECEC] font-display text-[12px] font-bold text-[#330085]">
              {item.autor_nombre.charAt(0).toUpperCase()}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate font-display text-sm font-semibold text-black">{item.autor_nombre}</p>
              <p class="font-display text-[11px] text-[#666666]">Autor del reporte</p>
            </div>
          </div>

          {#if isOwner || isAdmin}
            <div class="flex flex-wrap gap-2 px-6 pb-4">
              <button type="button" class="rounded-full bg-[#F5F5F7] px-4 py-2 font-display text-xs font-semibold text-[#333333] transition-all duration-150 hover:bg-[#ECECEC] focus-porple active:scale-95" onclick={() => dispatch("edit", { item })}>Editar</button>
              <button type="button" class="rounded-full bg-[#FEF2F2] px-4 py-2 font-display text-xs font-semibold text-[#DC2626] transition-all duration-150 hover:bg-[#FEE2E2] focus-porple active:scale-95" onclick={() => (confirmDeleteOpen = true)}>Eliminar</button>
              {#if item.estado !== "entregado"}
                <button type="button" class="rounded-full bg-[#000000] px-4 py-2 font-display text-xs font-semibold text-white transition-all duration-150 hover:bg-[#330085] focus-porple active:scale-95" onclick={() => (confirmReturnOpen = true)}>Marcar como Devuelto</button>
              {/if}
            </div>
          {/if}

          <div class="flex items-center justify-between border-t border-[#ECECEC] px-6 pt-4">
            <h3 class="font-display text-sm font-bold text-black">Comentarios</h3>
            <span class="font-display text-[11px] text-[#666666]">{comments.length} {comments.length === 1 ? "comentario" : "comentarios"}</span>
          </div>

          <div class="min-h-0 flex-1 space-y-3 overflow-y-auto px-6 py-4 thin-scroll">
            {#if comments.length === 0}
              <p class="font-display text-sm text-[#999999]">Aún no hay comentarios. Sé el primero en preguntar.</p>
            {:else}
              {#each comments as comment (comment.comentario_id)}
                <div class="rounded-2xl bg-[#F5F5F7] px-3.5 py-3">
                  <div class="flex items-start justify-between gap-2">
                    <span class="font-display text-xs font-semibold text-black">{comment.autor_nombre}</span>
                    <div class="flex items-center gap-2">
                      <span class="font-display text-[10px] text-[#999999]">{formatDate(comment.fecha, true)}</span>
                      {#if canDeleteComment(comment) && !isClosed}
                        <button
                          type="button"
                          aria-label="Eliminar comentario"
                          class="rounded-full p-0.5 text-[#999999] hover:text-[#DC2626] focus-porple"
                          onclick={() => (pendingComment = comment)}
                        >
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
                        </button>
                      {/if}
                    </div>
                  </div>
                  <p class="mt-1 text-sm leading-snug text-[#333333]">{comment.texto}</p>
                </div>
              {/each}
            {/if}
          </div>

          <div class="border-t border-[#ECECEC] p-4">
            {#if isClosed}
              <div class="flex items-center justify-center gap-2 rounded-xl bg-[#ECFDF5] px-3 py-2.5 text-[#059669]">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
                <p class="font-display text-xs font-semibold">Comentarios cerrados · Objeto devuelto a su dueño</p>
              </div>
            {:else if !currentUserId}
              <div class="flex items-center justify-between gap-3 rounded-2xl bg-[#F5F5F7] px-4 py-3">
                <p class="font-display text-xs text-[#555555]">Inicia sesión para comentar este reporte.</p>
                <a
                  href="/login"
                  class="shrink-0 rounded-full bg-[#000000] px-4 py-2 font-display text-[11px] font-semibold text-white no-underline transition-colors hover:bg-[#330085]"
                >
                  Iniciar sesión
                </a>
              </div>
            {:else}
              <form
                class="flex items-center gap-2"
                onsubmit={(e) => { e.preventDefault(); handleAddComment(); }}
              >
                <input
                  type="text"
                  placeholder="Escribe un comentario…"
                  maxlength="500"
                  class="min-w-0 flex-1 rounded-full border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none placeholder:text-[#999999] focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
                  bind:value={newComment}
                />
                <button
                  type="submit"
                  class="shrink-0 rounded-full bg-[#000000] px-5 py-2.5 font-display text-xs font-semibold text-white transition-all duration-150 hover:bg-[#330085] focus-porple active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={submitting || !newComment.trim()}
                >
                  Enviar
                </button>
              </form>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>

  <ConfirmDialog
    open={confirmReturnOpen}
    tone="success"
    title="Confirmar entrega"
    description="¿Confirmas que la pertenencia ha sido entregada a su dueño legítimo?"
    confirmLabel="Confirmar entrega"
    on:confirm={handleMarkReturned}
    on:dismiss={() => (confirmReturnOpen = false)}
  />

  <ConfirmDialog
    open={confirmDeleteOpen}
    tone="danger"
    title="¿Eliminar este reporte?"
    description="Esta acción eliminará permanentemente la publicación y su fotografía de la nube."
    confirmLabel="Sí, eliminar"
    on:confirm={handleDeleteItem}
    on:dismiss={() => (confirmDeleteOpen = false)}
  />

  <ConfirmDialog
    open={!!pendingComment}
    tone="danger"
    title="¿Eliminar este comentario?"
    description="Esta acción no se puede deshacer."
    confirmLabel="Sí, eliminar"
    on:confirm={handleDeleteComment}
    on:dismiss={() => (pendingComment = null)}
  />
{/if}
