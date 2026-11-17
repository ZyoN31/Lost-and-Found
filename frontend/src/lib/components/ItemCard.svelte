<script lang="ts">
  import type { Item } from "$lib/types";
  import { statusLabels } from "$lib/api";
  import { toasts } from "$lib/toast.svelte";

  interface Props {
    item: Item;
    onEdit?: () => void;
    onDelete?: () => void;
    onView?: () => void;
    onMarkReturned?: () => void;
  }

  let { item, onEdit, onDelete, onView, onMarkReturned }: Props = $props();

  const status = $derived(statusLabels(item.estado));
</script>

<article class="group overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-sm transition-shadow duration-200 hover:shadow-md hover:border-[#4F1F91]/40 focus-within:border-[#4F1F91]">
  <div class="relative aspect-[4/3] overflow-hidden bg-[#F5F5F7]">
    {#if item.foto_url}
      <img
        src={item.foto_url}
        alt={item.titulo}
        class="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
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
      {status.label}
    </span>
  </div>

  <div class="px-4 pb-4 pt-3">
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

    <div class="mt-3 flex items-center gap-2">
      <button
        type="button"
        class="rounded-full px-3 py-1.5 font-display text-[11px] font-semibold text-[#333333] bg-[#F5F5F7] hover:bg-[#ECECEC] focus-porple transition-colors"
        onclick={() => onView?.()}
      >
        Ver detalle
      </button>
      {#if onEdit}
        <button
          type="button"
          class="rounded-full px-3 py-1.5 font-display text-[11px] font-semibold text-white bg-[#000000] hover:bg-[#330085] focus-porple transition-colors"
          onclick={() => onEdit?.()}
        >
          Editar
        </button>
      {/if}
      {#if item.estado !== "entregado" && onMarkReturned}
        <button
          type="button"
          class="rounded-full px-3 py-1.5 font-display text-[11px] font-semibold text-[#059669] bg-[#ECFDF5] hover:bg-[#D1FAE5] focus-porple transition-colors"
          onclick={() => onMarkReturned?.()}
        >
          Devuelto
        </button>
      {/if}
      {#if onDelete}
        <button
          type="button"
          class="ml-auto rounded-full px-3 py-1.5 font-display text-[11px] font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] focus-porple transition-colors"
          onclick={() => onDelete?.()}
        >
          Eliminar
        </button>
      {/if}
    </div>
  </div>
</article>
