<script lang="ts">
  import { CATEGORIES, CAMPUS_ZONES, api } from "$lib/api";
  import { toasts } from "$lib/toast.svelte";
  import type { Item } from "$lib/types";
  import ConfirmDialog from "./ConfirmDialog.svelte";

  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ close: void; updated: { item: Item }; deleted: void }>();

  let { open = $bindable(false), item = null as Item | null } = $props();

  let titulo = $state("");
  let categoria = $state(CATEGORIES[0]);
  let ubicacion = $state(CAMPUS_ZONES[1]);
  let descripcion = $state("");
  let newFile = $state<File | null>(null);
  let previewUrl = $state("");
  let isSubmitting = $state(false);
  let errors = $state<Record<string, string>>({});
  let confirmOpen = $state(false);

  $effect(() => {
    if (item && open) {
      titulo = item.titulo;
      categoria = item.categoria;
      ubicacion = item.ubicacion as (typeof CAMPUS_ZONES)[number];
      descripcion = item.descripcion_publica;
      previewUrl = item.foto_url ?? "";
      newFile = null;
      errors = {};
      isSubmitting = false;
    }
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (titulo.trim().length < 3) errs.titulo = "El título debe tener al menos 3 caracteres";
    if (descripcion.trim().length < 10) errs.descripcion = "La descripción debe tener al menos 10 caracteres";
    if (newFile) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(newFile.type)) {
        errs.foto = "Formato no permitido. Usa JPG, PNG o WEBP";
      } else if (newFile.size > 5 * 1024 * 1024) {
        errs.foto = "La imagen supera los 5 MB";
      }
    }
    errors = errs;
    return Object.keys(errs).length === 0;
  }

  function handleFileInput(e: Event): void {
    const target = e.currentTarget as HTMLInputElement;
    const selected = target.files?.[0];
    if (selected) {
      newFile = selected;
      previewUrl = URL.createObjectURL(selected);
    }
  }

  async function handleSave(): Promise<void> {
    if (!item || !validate()) return;
    isSubmitting = true;
    try {
      const fd = new FormData();
      fd.append("titulo", titulo.trim());
      fd.append("categoria", categoria);
      fd.append("ubicacion", ubicacion);
      fd.append("descripcion_publica", descripcion.trim());
      if (newFile) fd.append("foto", newFile);
      const { item: updated } = await api.updateItem(item.id, fd);
      toasts.add("Reporte actualizado.", "success");
      dispatch("updated", { item: updated });
      dispatch("close");
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo actualizar el reporte.", "error");
    } finally {
      isSubmitting = false;
    }
  }

  async function handleDelete(): Promise<void> {
    if (!item) return;
    isSubmitting = true;
    try {
      await api.deleteItem(item.id);
      toasts.add("Reporte eliminado.", "success");
      dispatch("deleted");
      dispatch("close");
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo eliminar el reporte.", "error");
    } finally {
      isSubmitting = false;
      confirmOpen = false;
    }
  }
</script>

{#if open && item}
  <div class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-labelledby="edit-title">
    <div class="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlay-in" onclick={() => dispatch("close")}></div>
    <div class="relative mx-4 mb-4 w-full max-w-lg animate-modal-in overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-2xl sm:mb-0">
      <div class="flex items-center justify-between border-b border-[#ECECEC] px-6 py-4">
        <h2 id="edit-title" class="font-display text-xl font-bold text-black">Editar Reporte</h2>
        <button
          type="button"
          aria-label="Cerrar"
          class="rounded-full p-1.5 text-[#666666] hover:bg-[#F5F5F7] hover:text-black focus-porple transition-colors"
          onclick={() => dispatch("close")}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSave(); }} class="max-h-[85vh] overflow-y-auto px-6 py-5">
        <p class="mb-4 text-sm text-[#666666]">Actualiza los detalles de tu publicación.</p>

        <div class="space-y-3">
          <div>
            <label for="edit-titulo" class="block font-display text-xs font-semibold text-[#333333] mb-1">Título del objeto</label>
            <input
              id="edit-titulo"
              type="text"
              class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
              bind:value={titulo}
            />
            {#if errors.titulo}<p class="mt-1 text-xs text-[#DC2626]">{errors.titulo}</p>{/if}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="edit-categoria" class="block font-display text-xs font-semibold text-[#333333] mb-1">Categoría</label>
              <select id="edit-categoria" bind:value={categoria} class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30">
                {#each CATEGORIES as c (c)}<option value={c}>{c}</option>{/each}
              </select>
            </div>
            <div>
              <label for="edit-ubicacion" class="block font-display text-xs font-semibold text-[#333333] mb-1">Ubicación en Campus</label>
              <select id="edit-ubicacion" bind:value={ubicacion} class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30">
                {#each CAMPUS_ZONES.slice(1) as z (z)}<option value={z}>{z}</option>{/each}
              </select>
            </div>
          </div>

          <div>
            <label for="edit-descripcion" class="block font-display text-xs font-semibold text-[#333333] mb-1">Descripción pública</label>
            <textarea
              id="edit-descripcion"
              rows="3"
              class="w-full resize-none rounded-2xl border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
              bind:value={descripcion}
            ></textarea>
            {#if errors.descripcion}<p class="mt-1 text-xs text-[#DC2626]">{errors.descripcion}</p>{/if}
          </div>

          <div>
            <p class="mb-1 font-display text-xs font-semibold text-[#333333]">Fotografía del objeto</p>
            <div class="flex items-center gap-3 rounded-2xl border border-[#ECECEC] bg-[#F5F5F7] p-3">
              {#if previewUrl}
                <img src={previewUrl} alt="" class="h-14 w-14 shrink-0 rounded-lg object-cover" />
              {/if}
              <div class="min-w-0 flex-1">
                <p class="truncate font-display text-xs text-[#333333]">{newFile?.name ?? "Fotografía actual del reporte"}</p>
                <label class="mt-1 inline-flex cursor-pointer rounded-full bg-white px-3 py-1 font-display text-[11px] font-semibold text-[#333333] hover:bg-[#ECECEC] transition-colors">
                  Cambiar imagen
                  <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange={handleFileInput} />
                </label>
              </div>
            </div>
            {#if errors.foto}<p class="mt-1 text-xs text-[#DC2626]">{errors.foto}</p>{/if}
          </div>
        </div>

        <div class="sticky bottom-0 mt-4 flex flex-col-reverse gap-2 border-t border-[#ECECEC] bg-white/95 backdrop-blur pt-3 sm:flex-row sm:items-center">
          <button
            type="button"
            class="rounded-full bg-[#F5F5F7] px-5 py-2.5 font-display text-sm font-semibold text-[#555555] hover:bg-[#ECECEC] transition-colors"
            onclick={() => dispatch("close")}
          >
            Cancelar
          </button>
          <div class="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              class="rounded-full bg-[#FEF2F2] px-5 py-2.5 font-display text-sm font-semibold text-[#DC2626] hover:bg-[#FEE2E2] transition-colors"
              onclick={() => (confirmOpen = true)}
            >
              Eliminar
            </button>
            <button
              type="submit"
              class="rounded-full bg-[#000000] px-5 py-2.5 font-display text-sm font-semibold text-white hover:bg-[#330085] transition-colors disabled:opacity-60"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>

  <ConfirmDialog
    open={confirmOpen}
    tone="danger"
    title="¿Eliminar este reporte?"
    description="Esta acción eliminará permanentemente la publicación y su fotografía de la nube."
    confirmLabel="Sí, eliminar"
    on:confirm={handleDelete}
    on:dismiss={() => (confirmOpen = false)}
  />
{/if}
