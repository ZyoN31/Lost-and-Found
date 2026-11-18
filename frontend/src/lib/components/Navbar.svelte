<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { auth } from "$lib/auth.svelte";
  import { magnetic } from "$lib/actions/motion";
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

  const activeIndex = $derived(Math.max(0, tabs.findIndex((tab) => tab.value === currentTab)));

  let scrolled = $state(false);
  let menuOpen = $state(false);

  onMount(() => {
    const onScroll = (): void => {
      scrolled = window.scrollY > 12;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  });

  // Close the mobile action menu whenever the route changes.
  $effect(() => {
    void $page.url.pathname;
    menuOpen = false;
  });

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (event.key === "Escape") menuOpen = false;
  }
</script>

<svelte:window onkeydown={handleWindowKeydown} />

<nav
  class={`sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl backdrop-saturate-150 transition-[box-shadow,border-color] duration-300 ${
    scrolled ? "border-[#ECECEC] shadow-[0_18px_44px_-26px_rgba(51,0,133,0.5)]" : "border-white/60 shadow-none"
  }`}
>
  <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-8">
    <a href="/feed" class="shrink-0 font-brand text-xl leading-none tracking-tight text-black no-underline sm:text-2xl">
      <span>Lost</span><span class="font-semibold text-[#330085]">&amp;</span><span>Found</span>
    </a>

    <!-- Tabs with sliding active pill -->
    <div class="min-w-0 flex-1 overflow-x-auto sm:flex sm:justify-center">
      <div class="relative inline-flex min-w-max items-center rounded-full bg-[#F5F5F7] p-1">
        {#if active === "feed"}
          <span
            aria-hidden="true"
            class="absolute bottom-1 left-1 top-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-[#000000] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={`transform: translateX(${activeIndex * 100}%)`}
          ></span>
        {/if}
        {#each tabs as tab (tab.value)}
          <a
            href={tab.href}
            aria-current={active === "feed" && currentTab === tab.value ? "page" : undefined}
            class={`relative z-10 w-20 whitespace-nowrap rounded-full px-2 py-1.5 text-center font-display text-[11px] font-semibold no-underline transition-colors duration-300 sm:w-28 sm:text-sm ${
              active === "feed" && currentTab === tab.value ? "text-white" : "text-[#555555] hover:text-black"
            }`}
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
          class="hidden rounded-full border border-[#ECECEC] bg-white px-3 py-1.5 font-display text-xs font-semibold text-[#555555] no-underline transition-colors hover:border-[#4F1F91] hover:text-[#330085] md:inline-flex focus-porple"
        >
          Volver al feed
        </a>
      {/if}

      {#if auth.user}
        <a
          href="/feed?create=1"
          use:magnetic={{ strength: 0.32 }}
          class="hidden rounded-full bg-[#000000] px-4 py-2 font-display text-xs font-semibold text-white no-underline transition-colors hover:bg-[#330085] focus-porple sm:inline-flex"
        >
          + Crear Reporte
        </a>
        {#if auth.user.rol === "admin" && active !== "admin"}
          <a
            href="/admin"
            class="hidden rounded-full border border-[#ECECEC] bg-white px-3 py-1.5 font-display text-xs font-semibold text-[#333333] no-underline transition-colors hover:border-[#4F1F91] hover:text-[#330085] focus-porple lg:inline-flex"
          >
            Moderación
          </a>
        {/if}
        <a
          href="/profile"
          aria-label="Ir a tu perfil"
          class={`flex items-center gap-2 rounded-full border no-underline transition-all hover:border-[#4F1F91] hover:shadow-sm ${
            active === "profile" ? "border-[#330085] bg-[#F5F5F7]" : "border-[#ECECEC] bg-white"
          } px-2 py-1`}
        >
          {#if auth.user.foto_url}
            <img src={auth.user.foto_url} alt="" class="h-7 w-7 rounded-full object-cover" />
          {:else}
            <span class="flex h-7 w-7 items-center justify-center rounded-full bg-[#ECECEC] font-display text-[11px] font-bold text-[#330085]">
              {auth.user.nombre_completo.charAt(0).toUpperCase()}
            </span>
          {/if}
          <span class="hidden max-w-[9rem] truncate font-display text-[11px] font-medium text-[#333333] md:inline">
            {auth.user.nombre_completo}
          </span>
        </a>
        <!-- Compact action menu for small screens -->
        <button
          type="button"
          class="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#ECECEC] bg-white text-[#333333] transition-colors hover:border-[#4F1F91] hover:text-[#330085] focus-porple sm:hidden"
          aria-label={menuOpen ? "Cerrar menú de acciones" : "Abrir menú de acciones"}
          aria-expanded={menuOpen}
          onclick={() => (menuOpen = !menuOpen)}
        >
          {#if menuOpen}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
          {:else}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
          {/if}
        </button>
      {:else}
        <a
          href="/login"
          class="rounded-full border border-[#ECECEC] bg-white px-3 py-2 font-display text-[11px] font-semibold text-[#333333] no-underline transition-colors hover:border-[#4F1F91] hover:text-[#330085] sm:text-xs"
        >
          Iniciar sesión
        </a>
        <a
          href="/login?mode=register"
          class="rounded-full bg-[#000000] px-3 py-2 font-display text-[11px] font-semibold text-white no-underline transition-colors hover:bg-[#330085] sm:px-4 sm:text-xs"
        >
          Crear cuenta
        </a>
      {/if}
    </div>
  </div>

  <!-- Mobile action menu: keeps + Crear Reporte & Moderación reachable on small screens -->
  {#if menuOpen && auth.user}
    <div class="absolute inset-x-0 top-full border-b border-[#ECECEC] bg-white/95 shadow-[0_24px_48px_-30px_rgba(51,0,133,0.55)] backdrop-blur-xl sm:hidden">
      <div class="mx-auto max-w-6xl space-y-2 px-4 py-3">
        <a
          href="/feed?create=1"
          onclick={() => (menuOpen = false)}
          class="flex items-center justify-between rounded-2xl bg-[#000000] px-4 py-3 no-underline transition-colors hover:bg-[#330085]"
        >
          <span class="font-display text-sm font-semibold text-white">+ Crear Reporte</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></svg>
        </a>
        {#if auth.user.rol === "admin" && active !== "admin"}
          <a
            href="/admin"
            onclick={() => (menuOpen = false)}
            class="flex items-center justify-between rounded-2xl border border-[#ECECEC] bg-white px-4 py-3 no-underline transition-colors hover:border-[#4F1F91]"
          >
            <span class="font-display text-sm font-semibold text-[#333333]">Moderación</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#330085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3 4 9v11h16V9z" /><path d="M9 20v-6h6v6" /></svg>
          </a>
        {/if}
        <a
          href="/profile"
          onclick={() => (menuOpen = false)}
          class="flex items-center justify-between rounded-2xl border border-[#ECECEC] bg-white px-4 py-3 no-underline transition-colors hover:border-[#4F1F91]"
        >
          <span class="font-display text-sm font-semibold text-[#333333]">Mi perfil</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#330085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 5-6 8-6s6.5 2 8 6" /></svg>
        </a>
      </div>
    </div>
  {/if}
</nav>

<!-- Click-away layer for the mobile action menu -->
{#if menuOpen && auth.user}
  <button
    type="button"
    class="fixed inset-x-0 bottom-0 top-16 z-40 cursor-default bg-black/20 backdrop-blur-[2px] sm:hidden"
    aria-label="Cerrar menú"
    onclick={() => (menuOpen = false)}
  ></button>
{/if}
