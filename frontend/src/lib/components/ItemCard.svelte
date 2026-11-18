<script lang="ts">
  import type { Item } from "$lib/types";
  import { statusLabels } from "$lib/api";
  import { spotlight, reveal } from "$lib/actions/motion";

  interface Props {
    item: Item;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    onMarkReturned?: () => void;
  }

  let { item, onEdit, onDelete, onView, onMarkReturned }: Props = $props();

  const status = $derived(statusLabels(item.estado));
  const isActive = $derived(item.estado !== "entregado");

  // Progressive enhancement: with JS disabled, ?detailId= opens the same modal.
  const detailHref = $derived(`/feed?detailId=${item.id}`);

  // Clicking anywhere on the card (image, badge, title, metadata, body) is
  // captured by the stretched link below. Editar / Devuelto / Eliminar call
  // event.stopPropagation() so they never open the detail modal.
  function handleCardClick(event: MouseEvent): void {
    event.preventDefault();
    onView?.();
  }
</script>

<article
  use:spotlight
  use:reveal={{ y: 24 }}
  class="spotlight-card group relative overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-sm transition-[box-shadow,border-color,transform] duration-300 hover:-translate-y-1 hover:border-[#4F1F91]/40 hover:shadow-[0_24px_48px_-30px_rgba(51,0,133,0.55)] focus-within:border-[#4F1F91] cursor-pointer"
>
  <!-- Stretched link: the whole card is one interactive surface; anchors as a fallback without JS. -->
  <a
    href={detailHref}
    tabindex="0"
    onclick={handleCardClick}
    class="absolute inset-0 z-10 rounded-3xl focus-porple cursor-pointer"
    onkeydown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onView?.();
      }
    }}
    aria-label={`Ver detalle de ${item.titulo}`}
  ></a>

  <div class="relative aspect-[4/3] overflow-hidden bg-[#F5F5F7]">
    {#if item.foto_url}
      <img
        src={item.foto_url}
        alt={item.titulo}
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        loading="lazy"
      />
    {:else}
      <div class="flex h-full w-full items-center justify-center text-[#CCCCCC]">
        <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M8.5 14l3.5-3.5 4 4 2-3 1 2" />
          <circle cx="9" cy="8" r="1.2" />
        </svg>
      </div>
    {/if}
    <span
      class={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-display text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md ${status.bg} ${status.fg}`}
    >
      {#if isActive}
        <span class="status-pulse h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true"></span>
      {:else}
        <span class="h-1.5 w-1.5 rounded-full bg-current opacity-60" aria-hidden="true"></span>
      {/if}
      {status.label}
    </span>
  </div>

  <div class="relative px-4 pb-4 pt-3">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <h3 class="truncate font-display text-sm font-semibold leading-tight text-black">
          {item.titulo}
        </h3>
        <p class="mt-0.5 truncate text-[11px] text-[#666666]">
          {item.categoria} · {item.ubicacion}
        </p>
      </div>
      <p class="shrink-0 font-display text-[10px] font-medium text-[#999999]">
        {new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(item.fecha_registro))}
      </p>
    </div>

    <div class="mt-3 flex flex-wrap items-center justify-end gap-1.5 border-t border-[#F5F5F7] pt-3 relative z-20">
      {#if onEdit}
        <button
          type="button"
          class="rounded-full bg-[#000000] px-3 py-1.5 font-display text-[11px] font-semibold text-white transition-all duration-150 hover:bg-[#330085] focus-porple active:scale-95"
          onclick={(event) => { event.preventDefault(); event.stopPropagation(); onEdit?.(); }}
        >
          Editar
        </button>
      {/if}
      {#if item.estado !== "entregado" && onMarkReturned}
        <button
          type="button"
          class="rounded-full bg-[#ECFDF5] px-3 py-1.5 font-display text-[11px] font-semibold text-[#059669] transition-all duration-150 hover:bg-[#D1FAE5] focus-porple active:scale-95"
          onclick={(event) => { event.preventDefault(); event.stopPropagation(); onMarkReturned?.(); }}
        >
          Devuelto
        </button>
      {/if}
      {#if onDelete}
        <button
          type="button"
          class="rounded-full bg-[#FEF2F2] px-3 py-1.5 font-display text-[11px] font-semibold text-[#DC2626] transition-all duration-150 hover:bg-[#FEE2E2] focus-porple active:scale-95"
          onclick={(event) => { event.preventDefault(); event.stopPropagation(); onDelete?.(); }}
        >
          Eliminar
        </button>
      {/if}
    </div>
  </div>
</article>
