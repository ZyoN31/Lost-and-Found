<script lang="ts">
  interface Props {
    id?: string;
    ariaLabel: string;
    placeholder?: string;
    options: string[];
    value: string;
    onValueChange?: (value: string) => void;
  }

  let {
    id = `select-${crypto.randomUUID()}`,
    ariaLabel,
    placeholder = "Selecciona una opción",
    options = [] as string[],
    value = $bindable(""),
    onValueChange,
  }: Props = $props();

  let open = $state(false);
  let rootRef = $state<HTMLDivElement | null>(null);

  const selectedLabel = $derived(options.includes(value) ? value : placeholder);

  function toggle(): void {
    open = !open;
  }

  function selectOption(option: string): void {
    value = option;
    open = false;
    onValueChange?.(option);
  }

  function handleWindowClick(event: MouseEvent): void {
    if (open && rootRef && !rootRef.contains(event.target as Node)) {
      open = false;
    }
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (open && event.key === "Escape") {
      open = false;
    }
  }
</script>

<svelte:window onclick={handleWindowClick} onkeydown={handleWindowKeydown} />

<div bind:this={rootRef} class="relative" data-custom-select>
  <button
    type="button"
    id={id}
    aria-label={ariaLabel}
    aria-haspopup="listbox"
    aria-expanded={open}
    onclick={toggle}
    class={`flex w-full items-center justify-between gap-3 rounded-full bg-[#F5F5F7] px-4 py-2.5 text-left font-display text-sm text-black outline-none transition-colors focus-porple ${
      open ? "ring-2 ring-[#4F1F91]/40" : ""
    }`}
  >
    <span class="truncate">{selectedLabel}</span>
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      class={`shrink-0 text-[#666666] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden="true"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>

  {#if open}
    <ul
      role="listbox"
      aria-labelledby={id}
      class="animate-dropdown-in absolute left-0 right-0 top-full z-50 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-[#E5E5EA] bg-white p-1.5 shadow-xl thin-scroll"
    >
      {#each options as option (option)}
        <li role="option" aria-selected={option === value}>
          <button
            type="button"
            onclick={() => selectOption(option)}
            class={`flex w-full items-center justify-between gap-2 rounded-xl px-3.5 py-2 text-left font-display text-sm transition-colors ${
              option === value
                ? "bg-[#4F1F91]/10 font-semibold text-[#330085]"
                : "text-[#333333] hover:bg-[#4F1F91]/10 hover:text-[#330085]"
            }`}
          >
            <span class="truncate">{option}</span>
            {#if option === value}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</div>
