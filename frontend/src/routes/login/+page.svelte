<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { auth } from "$lib/auth.svelte";
  import { UPEMOR_EMAIL_REGEX } from "$lib/api";
  import { magnetic } from "$lib/actions/motion";
  import LiquidInk from "$lib/components/LiquidInk.svelte";
  import SlidingPuzzle from "$lib/components/SlidingPuzzle.svelte";

  let mode = $state<"login" | "register">("login");
  let nombre_completo = $state("");
  let correo = $state("");
  let password = $state("");
  let confirm_password = $state("");

  let emailError = $state<string | null>(null);
  let passError = $state<string | null>(null);
  let confirmError = $state<string | null>(null);
  let nameError = $state<string | null>(null);
  let formError = $state<string | null>(null);
  let submitting = $state(false);

  const icons = [
    { file: "icon-id-badge.svg", label: "Credencial" },
    { file: "icon-umbrella.svg", label: "Paraguas" },
    { file: "icon-wallet.svg", label: "Cartera" },
    { file: "icon-keys.svg", label: "Llaves" },
    { file: "icon-book.svg", label: "Libro" },
    { file: "icon-sweater.svg", label: "Suéter" },
    { file: "icon-headphones.svg", label: "Audífonos" },
    { file: "icon-mouse.svg", label: "Mouse" },
  ];

  // Compact banner on small screens: one icon per quadrant of campus life.
  const mobileIcons = [icons[0], icons[2], icons[6], icons[7]];

  onMount(() => {
    const m = $page.url.searchParams.get("mode");
    if (m === "register" || m === "login") mode = m;
  });

  // Signed-in users are always bounced to the feed — never see login/register.
  $effect(() => {
    if (auth.isAuthenticated) goto("/feed", { replaceState: true });
  });

  function switchMode(next: "login" | "register"): void {
    mode = next;
    emailError = passError = confirmError = nameError = formError = null;
    password = "";
    confirm_password = "";
  }

  function validate(): boolean {
    let ok = true;
    formError = null;
    nameError = null;
    emailError = null;
    passError = null;
    confirmError = null;

    if (mode === "register" && nombre_completo.trim().length < 3) {
      nameError = "Ingresa tu nombre completo";
      ok = false;
    }
    if (!correo.trim()) {
      emailError = "Ingresa tu correo institucional";
      ok = false;
    } else if (!UPEMOR_EMAIL_REGEX.test(correo.trim())) {
      emailError = "Usa un correo institucional válido (@upemor.edu.mx)";
      ok = false;
    }
    if (!password) {
      passError = "Ingresa tu contraseña";
      ok = false;
    } else if (password.length < 6) {
      passError = "La contraseña debe tener al menos 6 caracteres";
      ok = false;
    }
    if (mode === "register" && confirm_password !== password) {
      confirmError = "Las contraseñas no coinciden";
      ok = false;
    }
    return ok;
  }

  async function handleSubmit(e: SubmitEvent): Promise<void> {
    e.preventDefault();
    if (!validate()) return;

    submitting = true;
    try {
      if (mode === "login") {
        await auth.login(correo.trim(), password);
      } else {
        await auth.register({
          nombre_completo: nombre_completo.trim(),
          correo: correo.trim(),
          password,
        });
      }
      await goto("/feed", { replaceState: true });
    } catch (err: any) {
      formError = err?.message ?? "No se pudo completar la acción. Inténtalo de nuevo.";
    } finally {
      submitting = false;
    }
  }
</script>

<svelte:head>
  <title>Lost &amp; Found</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-[#FFFFFF] isolate lg:flex-row">
  <!-- Compact liquid banner (mobile only) -->
  <div class="relative overflow-hidden bg-black lg:hidden">
    <div class="absolute -left-12 top-1/2 h-44 w-44 -translate-y-1/2 rounded-full bg-[#330085]/40 blur-3xl"></div>
    <div class="absolute right-8 top-1 h-20 w-20 rounded-full bg-[#4F1F91]/45 blur-2xl"></div>
    <div class="relative z-10 flex flex-col items-center gap-2.5 px-6 pb-6 pt-5">
      <p class="font-display text-[9px] font-semibold uppercase tracking-[0.34em] text-white/45">Upemor · Objetos perdidos</p>
      <p class="font-brand text-2xl text-white">Lost <span class="italic text-white/50">&amp;</span> Found</p>
      <div class="mt-1 flex items-center gap-3">
        {#each mobileIcons as icon, i (icon.file)}
          <div
            class="animate-float-levitate flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/[0.06] backdrop-blur-md"
            style={`animation-delay: ${-i * 0.9}s`}
          >
            <img src={`/icons/${icon.file}`} alt={icon.label} class="h-7 w-7 object-contain invert" draggable="false" />
          </div>
        {/each}
      </div>
    </div>
    <svg class="pointer-events-none absolute bottom-0 left-0 h-5 w-[200%] animate-wave-drift" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M0 12 Q 12.5 4 25 12 T 50 12 T 75 12 T 100 12 T 125 12 T 150 12 T 175 12 T 200 12" fill="none" stroke="#4F1F91" stroke-width="2" stroke-opacity="0.9" />
    </svg>
  </div>

  <!-- Form panel -->
  <div class="relative z-10 flex w-full items-center justify-center px-6 py-10 sm:px-10 lg:w-[46%] lg:px-16 lg:py-12">
    <div class="w-full max-w-sm">
      <!-- Brand Logo Size -->
      <div class="flex items-center justify-center">
        <img src="/images/logo-01.svg" alt="Lost & Found UPEMOR" class="h-80 w-80 sm:h-80 sm:w-80 " />
      </div>
      <p class="flex items-center justify-center text-sm leading-relaxed text-[#666666]">
        Página oficial de objetos perdidos Upemor.
      </p>

      <div class="relative mt-7 grid w-full grid-cols-2 rounded-full bg-[#F5F5F7] p-1" role="tablist" aria-label="Acceso a la cuenta">
        <span
          aria-hidden="true"
          class={`absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full bg-[#000000] shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${mode === "register" ? "translate-x-full" : "translate-x-0"}`}
        ></span>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          class={`relative z-10 rounded-full px-4 py-2.5 font-display text-sm font-semibold transition-colors duration-300 focus-porple ${mode === "login" ? "text-white" : "text-[#555555] hover:text-black"}`}
          onclick={() => switchMode("login")}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          class={`relative z-10 rounded-full px-4 py-2.5 font-display text-sm font-semibold transition-colors duration-300 focus-porple ${mode === "register" ? "text-white" : "text-[#555555] hover:text-black"}`}
          onclick={() => switchMode("register")}
        >
          Crear Cuenta
        </button>
      </div>

      <form class="mt-6 space-y-4" onsubmit={handleSubmit} novalidate>
        {#if mode === "register"}
          <div>
            <label for="nombre" class="mb-1 block font-display text-xs font-semibold text-[#333333]">Nombre completo</label>
            <input
              id="nombre"
              type="text"
              autocomplete="name"
              placeholder="María Isabel Rojas"
              class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-5 py-3 text-sm text-black outline-none placeholder:text-[#A0A0A0] transition-colors focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
              bind:value={nombre_completo}
            />
            {#if nameError}<p class="mt-1 pl-2 text-xs text-[#DC2626]">{nameError}</p>{/if}
          </div>
        {/if}

        <div>
          <label for="correo" class="mb-1 block font-display text-xs font-semibold text-[#333333]">Correo institucional</label>
          <input
            id="correo"
            type="email"
            autocomplete="email"
            placeholder="nombre@upemor.edu.mx"
            class={`w-full rounded-full border bg-[#F5F5F7] px-5 py-3 text-sm text-black outline-none placeholder:text-[#A0A0A0] transition-colors focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30 ${emailError ? "border-[#DC2626]" : "border-transparent"}`}
            bind:value={correo}
            oninput={() => {
              if (correo.trim()) {
                emailError = UPEMOR_EMAIL_REGEX.test(correo.trim()) ? null : "Usa un correo institucional válido (@upemor.edu.mx)";
              } else {
                emailError = null;
              }
            }}
          />
          {#if emailError}<p class="mt-1 pl-2 text-xs text-[#DC2626]">{emailError}</p>{/if}
        </div>

        <div>
          <label for="password" class="mb-1 block font-display text-xs font-semibold text-[#333333]">Contraseña</label>
          <input
            id="password"
            type="password"
            autocomplete={mode === "login" ? "current-password" : "new-password"}
            placeholder="••••••••"
            class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-5 py-3 text-sm text-black outline-none placeholder:text-[#A0A0A0] transition-colors focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
            bind:value={password}
          />
          {#if passError}<p class="mt-1 pl-2 text-xs text-[#DC2626]">{passError}</p>{/if}
        </div>

        {#if mode === "register"}
          <div>
            <label for="confirm" class="mb-1 block font-display text-xs font-semibold text-[#333333]">Confirmar contraseña</label>
            <input
              id="confirm"
              type="password"
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-5 py-3 text-sm text-black outline-none placeholder:text-[#A0A0A0] transition-colors focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
              bind:value={confirm_password}
            />
            {#if confirmError}<p class="mt-1 pl-2 text-xs text-[#DC2626]">{confirmError}</p>{/if}
          </div>
        {/if}

        {#if formError}
          <div class="rounded-2xl border border-[#FEE2E2] bg-[#FEF2F2] px-4 py-2.5 text-xs text-[#DC2626]" role="alert">
            {formError}
          </div>
        {/if}

        <button
          type="submit"
          use:magnetic={{ strength: 0.4 }}
          class="mt-1 w-full rounded-full bg-[#000000] px-6 py-3 font-display text-sm font-semibold text-white shadow-[0_16px_38px_-18px_rgba(79,31,145,0.75)] transition-colors hover:bg-[#330085] focus-porple disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      <div class="flex justify-center">
        <a
          href="/feed"
          class="mt-4 inline-flex items-center justify-center gap-2 rounded-full border border-[#ECECEC] bg-[#F5F5F7] px-5 py-2 font-display text-xs font-semibold text-[#333333] transition-colors hover:border-[#4F1F91] hover:text-[#330085] focus-porple active:scale-95"
        >
          Explorar objetos sin iniciar sesión →
        </a>
      </div>

      <p class="mt-6 text-center text-[11px] leading-relaxed text-[#999999]">
        Plataforma exclusiva de la comunidad UPEMOR. Solo correos <span class="text-[#330085]">@upemor.edu.mx</span>.
      </p>
    </div>
  </div>

  <!-- Visual panel (desktop): white canvas + organic black liquid contour -->
  <div class="relative hidden flex-1 overflow-hidden bg-[#FFFFFF] isolate lg:block">
    <LiquidInk />
    <div class="relative flex h-full flex-col items-center justify-center gap-6 px-6 py-8">
      <header class="relative z-10 text-center">
        <p class="font-display text-[10px] font-semibold uppercase tracking-[0.34em] text-[#330085]/80">UPEMOR · COMUNIDAD</p>
        <p class="mt-3 font-brand text-3xl leading-[1.15] text-black xl:text-[2.6rem]">Todo vuelve<br /><span class="italic text-[#330085]">a quien lo perdió.</span></p>
      </header>

      <div class="flex w-full flex-1 items-center justify-center">
        <!-- mix-blend-difference on a static, non-transformed parent wrapper directly above LiquidInk.
             This container has NO z-index/isolation so it never isolates the blend;
             the wrapper below has NO transform/isolation/opacity. The blend therefore
             reaches LiquidInk (white canvas + black wave) exactly like the caption below. -->
        <div class="relative mix-blend-difference">
          <SlidingPuzzle />
        </div>
      </div>

      <p class="relative z-10 font-display text-[10px] font-medium uppercase tracking-[0.28em] text-white mix-blend-difference">
        LOST &amp; FOUND · OBJETOS PERDIDOS UPEMOR
      </p>
    </div>
  </div>
</div>
