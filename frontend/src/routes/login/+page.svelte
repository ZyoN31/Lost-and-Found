<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { auth } from "$lib/auth.svelte";
  import { UPEMOR_EMAIL_REGEX } from "$lib/api";

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

  onMount(() => {
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
  <title>Lost &amp; Found · Acceso UPEMOR</title>
</svelte:head>

<div class="flex min-h-screen flex-col bg-white lg:flex-row">
  <!-- Form panel -->
  <div class="relative z-10 flex w-full items-center justify-center px-6 py-12 sm:px-10 lg:w-[46%] lg:px-16">
    <div class="w-full max-w-sm">
      <div class="flex items-baseline gap-1 font-brand text-[3.2rem] font-medium leading-[0.95] tracking-tight text-black">
        <span>Lost</span><span class="font-semibold text-[#330085]">&amp;</span><span>Found</span>
      </div>
      <p class="mt-4 max-w-[26ch] text-sm leading-relaxed text-[#666666]">
        Reencuentra tus pertenencias en el campus UPEMOR con tu correo institucional.
      </p>

      <div class="mt-8 inline-flex w-full items-center gap-1 rounded-full bg-[#F5F5F7] p-1" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "login"}
          class={`flex-1 rounded-full px-4 py-2.5 font-display text-sm font-semibold transition-all ${mode === "login" ? "bg-[#000000] text-white shadow-sm" : "text-[#555555] hover:text-black"}`}
          onclick={() => switchMode("login")}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "register"}
          class={`flex-1 rounded-full px-4 py-2.5 font-display text-sm font-semibold transition-all ${mode === "register" ? "bg-[#000000] text-white shadow-sm" : "text-[#555555] hover:text-black"}`}
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
          class="w-full rounded-full bg-[#000000] px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-[#330085] focus-porple disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
        >
          {submitting ? "Procesando…" : mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
        </button>
      </form>

      <p class="mt-6 text-center text-[11px] leading-relaxed text-[#999999]">
        Plataforma exclusiva de la comunidad UPEMOR. Solo correos <span class="text-[#330085]">@upemor.edu.mx</span>.
      </p>
    </div>
  </div>

  <!-- Visual panel -->
  <div class="relative flex-1 overflow-hidden bg-white">
    <svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <path d="M100 0 C 78 8, 74 24, 84 38 C 92 50, 84 66, 68 72 C 52 78, 46 90, 58 100 L 100 100 Z" fill="#000000" />
    </svg>
    <div class="relative z-10 mx-auto grid h-full max-w-xl grid-cols-3 content-center gap-3 px-6 py-16 sm:gap-4 sm:px-10">
      {#each icons as icon (icon.file)}
        <div class="flex aspect-square items-center justify-center rounded-2xl border-2 border-black bg-white shadow-[4px_4px_0_#000] transition-transform duration-200 hover:-translate-y-0.5">
          <img src={`/icons/${icon.file}`} alt={icon.label} class="h-[52%] w-[52%] object-contain" />
        </div>
      {/each}
      <div class="flex aspect-square items-center justify-center rounded-2xl border-2 border-transparent">
        <a href="/feed" class="font-display text-[10px] font-semibold uppercase tracking-widest text-[#666666] hover:text-[#330085]">Explorar</a>
      </div>
    </div>
  </div>
</div>
