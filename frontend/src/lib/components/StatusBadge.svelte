<script lang="ts">
  import type { ItemStatus, Item } from "$lib/types";
  import { statusLabels } from "$lib/api";

  let { status, size = "sm" }: { status?: ItemStatus; size?: "xs" | "sm" } = $props();

  const cfg = $derived(statusLabels(status));
</script>

<span
  class={`inline-flex items-center gap-1.5 rounded-full font-display font-medium tracking-wide ${cfg.bg} ${cfg.fg} ${
    size === "xs" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-xs"
  }`}
>
  <span class="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true"></span>
  {cfg.label}
</span>
