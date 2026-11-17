<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { auth } from "$lib/auth.svelte";
  import { onMount } from "svelte";

  let { children }: { children?: Snippet } = $props();
  let booting = $state(true);

  onMount(async () => {
    try {
      await auth.loadMe();
    } catch {
      // loadMe clears the session itself only on a real 401;
      // transient failures keep the token for the next reload.
    } finally {
      booting = false;
    }
  });
</script>

<div class="min-h-screen bg-white text-black antialiased">
  {#if booting}
    <div class="flex min-h-screen items-center justify-center bg-white">
      <img
        src="/images/logo-01.svg"
        alt="Lost & Found"
        class="w-50 animate-ping select-none md:w-40"
        draggable="false"
      />
    </div>
  {:else}
    {@render children?.()}
  {/if}
  <Toast />
</div>
