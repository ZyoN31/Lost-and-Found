<script lang="ts">
  import { page } from "$app/stores";
  import { auth } from "$lib/auth.svelte";
  import type { ItemStatus } from "$lib/types";

  let { active = "feed" as "feed" | "profile" | "admin" } = $props();

  const tabs: { label: string; value: ItemStatus; href: string }[] = [
    { label: "Perdidos", value: "perdido", href: "/feed" },
    { label: "Encontrados", value: "encontrado", href: "/feed?tab=encontrado" },
    { label: "Devueltos", value: "entregado", href: "/feed?tab=entregado" },
  ];

  const currentTab = $derived(
    ($page.url.searchParams.get("tab") as ItemStatus | null) ?? "perdido"
  );
</script>

<nav
  class="sticky top-0 z-50 w-full border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-3xl backdrop-saturate-150"
>
  <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
    <a href="/feed" class="shrink-0 font-brand text-xl leading-none tracking-tight text-black sm:text-2xl">
      <span>Lost</span><span class="font-semibold text-[#330085]">&amp;</span><span>Found</span>
    </a>

    <div class="min-w-0 flex-1 overflow-x-auto sm:flex sm:justify-center">
      <div class="inline-flex min-w-max items-center gap-1 rounded-full bg-[#F5F5F7] p-1">
        {#each tabs as tab (tab.value)}
          <a
            href={tab.href}
            class={`whitespace-nowrap rounded-full px-3 py-1.5 no-underline transition-all sm:px-5 ${
              active === "feed" && currentTab === tab.value
                ? "bg-[#000000] text-white shadow-sm"
                : "text-[#555555] hover:text-[#000000]"
            } font-display text-xs font-semibold sm:text-sm`}
          >
            {tab.label}
          </a>
        {/each}
      </div>
    </div>

    <div class="flex shrink-0 items-center gap-2">
      {#if active !== "feed"}
        <a
          href="/feed"
          class="hidden rounded-full border border-[#ECECEC] bg-white px-3 py-1.5 font-display text-xs font-semibold text-[#555555] no-underline transition-colors hover:border-[#4F1F91] hover:text-[#330085] md:inline-flex"
        >
          Volver al feed
        </a>
      {/if}
      {#if auth.user}
        <a
          href="/feed?create=1"
          class="hidden rounded-full bg-[#000000] px-4 py-2 font-display text-xs font-semibold text-white no-underline transition-colors hover:bg-[#330085] focus-porple sm:inline-flex"
        >
          + Crear Reporte
        </a>
        {#if auth.user.rol === "admin" && active !== "admin"}
          <a
            href="/admin"
            class="hidden rounded-full border border-[#ECECEC] bg-white px-3 py-1.5 font-display text-xs font-semibold text-[#333333] no-underline transition-colors hover:border-[#4F1F91] hover:text-[#330085] md:inline-flex focus-porple"
          >
            Moderación
          </a>
        {/if}
        <a
          href="/profile"
          class={`flex items-center gap-2 rounded-full border no-underline transition-all hover:border-[#4F1F91] hover:shadow-sm ${
            active === "profile"
              ? "border-[#330085] bg-[#F5F5F7]"
              : "border-[#ECECEC] bg-white"
          } px-2 py-1`}
        >
          {#if auth.user.foto_url}
            <img src={auth.user.foto_url} alt="" class="h-7 w-7 rounded-full object-cover" />
          {:else}
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECECEC] font-display text-[11px] font-bold text-[#330085]">
              {auth.user.nombre_completo.charAt(0).toUpperCase()}
            </span>
          {/if}
          <span class="hidden max-w-[9rem] truncate font-display text-[11px] font-medium text-[#333333] sm:inline">
            {auth.user.nombre_completo}
          </span>
        </a>
      {:else}
        <a
          href="/login"
          class="rounded-full border border-[#ECECEC] bg-white px-3 py-2 font-display text-xs font-semibold text-[#333333] no-underline transition-colors hover:border-[#4F1F91] hover:text-[#330085] sm:px-4"
        >
          Iniciar sesión
        </a>
        <a
          href="/login?mode=register"
          class="rounded-full bg-[#000000] px-3 py-2 font-display text-xs font-semibold text-white no-underline transition-colors hover:bg-[#330085] sm:px-4"
        >
          Crear cuenta
        </a>
      {/if}
    </div>
  </div>
</nav>
