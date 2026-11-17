<script lang="ts">
  import "../app.css";
  import Toast from "$lib/components/Toast.svelte";
  import { auth } from "$lib/auth.svelte";
  import { onMount } from "svelte";

  onMount(() => {
    auth.loadMe().catch(() => auth.clear());
  });
</script>

<div class="min-h-screen bg-white text-black antialiased">
  <slot />
  <Toast />
</div>
