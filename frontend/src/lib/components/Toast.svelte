<script lang="ts">
  import { toasts } from "$lib/toast.svelte";
</script>

{#if toasts.toasts.length > 0}
  <div
    class="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-full max-w-md -translate-x-1/2 flex-col gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:translate-x-0"
    aria-live="polite"
  >
    {#each toasts.toasts as toast (toast.id)}
      {@const accent =
        toast.kind === "success"
          ? "border-[#ECFDF5] bg-[#ECFDF5] text-[#059669]"
          : toast.kind === "error"
            ? "border-[#FEF2F2] bg-[#FEF2F2] text-[#DC2626]"
            : "border-[#F5F5F7] bg-white text-[#330085]"}
      <div
        role="status"
        class={`pointer-events-auto flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg transition-shadow ${accent}`}
      >
        <div class="mt-0.5 shrink-0" aria-hidden="true">
          {#if toast.kind === "success"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
          {:else if toast.kind === "error"}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01" /></svg>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4m0-4h.01" /></svg>
          {/if}
        </div>
        <div class="min-w-0 flex-1">
          <p class="font-display text-sm leading-snug text-[#000000]">
            {toast.title}
          </p>
          {#if toast.detail}
            <p class="mt-0.5 text-xs leading-snug text-[#666666]">
              {toast.detail}
            </p>
          {/if}
        </div>
        <button
          aria-label="Cerrar notificación"
          class="ml-1 shrink-0 rounded-lg p-1 text-[#999999] transition-colors hover:bg-black/5 hover:text-[#333333] focus-porple"
          onclick={() => toasts.remove(toast.id)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
    {/each}
  </div>
{/if}
