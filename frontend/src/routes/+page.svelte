<script lang="ts">
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { auth } from "$lib/auth.svelte";

  onMount(() => {
    if (auth.isAuthenticated) {
      goto("/feed", { replaceState: true });
    } else {
      goto("/login", { replaceState: true });
    }
  });
</script>
