<script lang="ts">
  import "../app.css";
  import type { Snippet } from "svelte";
  import Toast from "$lib/components/Toast.svelte";
  import { auth } from "$lib/auth.svelte";
  import { onMount } from "svelte";

  let { children }: { children?: Snippet } = $props();
  let booting = $state(true);

  onMount(async () => {
    // Hard failsafe: even if loadMe hangs (offline backend), the splash
    // screen can never block rendering forever.
    const failsafe = setTimeout(() => {
      booting = false;
    }, 3500);

    try {
      await auth.loadMe();
    } catch {
      auth.clear();
    } finally {
      clearTimeout(failsafe);
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
