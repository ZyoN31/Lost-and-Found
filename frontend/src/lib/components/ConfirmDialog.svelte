<script lang="ts">
  import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher<{ confirm: void; dismiss: void }>();

  let {
    open = false,
    title = "Confirmar acción",
    description = undefined as string | undefined,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancelar",
    tone = "primary" as "primary" | "danger" | "success",
    loading = false,
  } = $props();

  function handleConfirm(): void {
    if (loading) return;
    dispatch("confirm");
  }

  function handleDismiss() {
    if (loading) return;
    dispatch("dismiss");
  }

  const toneClass = {
    primary: "bg-[#330085] hover:bg-[#4F1F91] text-white",
    danger: "bg-[#DC2626] hover:bg-[#B91C1C] text-white",
    success: "bg-[#059669] hover:bg-[#047857] text-white",
  };
</script>

{#if open}
  <div
    class="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-overlay-in"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-title"
    onclick={handleDismiss}
  >
    <div
      class="relative w-full max-w-sm overflow-hidden rounded-3xl border border-[#ECECEC] bg-white shadow-2xl animate-modal-in"
      role="document"
      tabIndex={0}
      onclick={(e) => e.stopPropagation()}
      onkeydown={(e) => e.stopPropagation()}
    >
      <div class="px-6 py-5">
        <h2 id="confirm-title" class="font-display text-xl font-bold text-black">{title}</h2>
        {#if description}
          <p class="mt-2 text-sm leading-relaxed text-[#555555]">{description}</p>
        {/if}
      </div>
      <div class="px-6 py-4 pb-5 flex flex-col-reverse gap-2 border-t border-[#ECECEC] sm:flex-row sm:justify-end">
        <button
          type="button"
          class="rounded-full bg-[#F5F5F7] px-5 py-2.5 font-display text-sm font-semibold text-[#333333] hover:bg-[#ECECEC] transition-colors"
          onclick={handleDismiss}
          disabled={loading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          class={`rounded-full px-5 py-2.5 font-display text-sm font-semibold transition-colors disabled:opacity-60 ${toneClass[tone]}`}
          onclick={handleConfirm}
          disabled={loading}
        >
          {#if loading}<span class="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent align-[-2px]"></span>{/if}
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
{/if}
