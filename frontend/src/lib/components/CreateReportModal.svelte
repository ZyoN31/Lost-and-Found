<script lang="ts">
  import { CATEGORIES, CAMPUS_ZONES } from "$lib/api";
  import { toasts } from "$lib/toast.svelte";
  import { createEventDispatcher } from "svelte";
  import { api } from "$lib/api";
  import CustomSelect from "./CustomSelect.svelte";

  const dispatch = createEventDispatcher<{ close: void; created: { item: any } }>();

  let { open = $bindable(false) } = $props();

  const ZONE_OPTIONS = CAMPUS_ZONES.slice(1);

  let tipo = $state<"perdido" | "encontrado">("perdido");
  let titulo = $state("");
  let categoria = $state<string>(CATEGORIES[0]);
  let ubicacion = $state<string>(CAMPUS_ZONES[1]); // Zona UD1 by default
  let descripcion = $state("");
  let file = $state<File | null>(null);
  let previewUrl = $state("");
  let isDragging = $state(false);
  let isSubmitting = $state(false);
  let errors = $state<Record<string, string>>({});

  function reset(): void {
    tipo = "perdido";
    titulo = "";
    categoria = CATEGORIES[0];
    ubicacion = CAMPUS_ZONES[1];
    descripcion = "";
    file = null;
    previewUrl = "";
    errors = {};
    isSubmitting = false;
    isDragging = false;
  }

  $effect(() => {
    if (!open) reset();
  });

  function validate(): boolean {
    const errs: Record<string, string> = {};
    const t = titulo.trim();
    const d = descripcion.trim();
    if (t.length < 3) errs.titulo = "El título debe tener al menos 3 caracteres";
    if (d.length < 10) errs.descripcion = "La descripción debe tener al menos 10 caracteres";
    if (file) {
      if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
        errs.foto = "Formato no permitido. Usa JPG, PNG o WEBP";
      } else if (file.size > 5 * 1024 * 1024) {
        errs.foto = "La imagen supera los 5 MB";
      }
    }
    errors = errs;
    return Object.keys(errs).length === 0;
  }

  function handleFile(incoming: File | null): void {
    if (!incoming) return;
    previewUrl = URL.createObjectURL(incoming);
    file = incoming;
  }

  function handleDrop(e: DragEvent): void {
    e.preventDefault();
    isDragging = false;
    const dropped = e.dataTransfer?.files?.[0];
    if (dropped) handleFile(dropped);
  }

  function handleDragEnter(e: DragEvent): void {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragOver(e: DragEvent): void {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent): void {
    // Only reset when the pointer truly exits the dropzone
    if (e.currentTarget === e.target) isDragging = false;
  }

  function handleInputChange(e: Event): void {
    const target = e.currentTarget as HTMLInputElement;
    const selected = target.files?.[0];
    if (selected) handleFile(selected);
  }

  async function handleSubmit(): Promise<void> {
    if (!validate()) return;
    isSubmitting = true;
    try {
      const fd = new FormData();
      fd.append("titulo", titulo.trim());
      fd.append("estado", tipo);
      fd.append("categoria", categoria);
      fd.append("ubicacion", ubicacion);
      fd.append("descripcion_publica", descripcion.trim());
      if (file) fd.append("foto", file);
      const { item } = await api.createItem(fd);
      toasts.add(item ? "Reporte publicado." : "Reporte creado.", "success");
      dispatch("created", { item });
      close();
    } catch (err: any) {
      toasts.add(err?.message ?? "No se pudo publicar el reporte.", "error");
    } finally {
      isSubmitting = false;
    }
  }

  function close(): void {
    open = false;
    dispatch("close");
  }

  function handleWindowKeydown(event: KeyboardEvent): void {
    if (open && event.key === "Escape") close();
  }

  // Lock body scroll while the modal is open
  $effect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  });
</script>

<svelte:window onkeydown={handleWindowKeydown} />

{#if open}
  <div
    class="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
    role="dialog"
    aria-modal="true"
    aria-labelledby="create-title"
  >
    <button
      type="button"
      aria-label="Cerrar"
      class="absolute inset-0 cursor-default bg-black/60 backdrop-blur-sm animate-overlay-in outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#4F1F91]"
      onclick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    ></button>
    <div
      class="relative mx-4 mb-4 w-full max-w-lg animate-modal-in overflow-hidden rounded-3xl border border-[#ECECEC] bg-[#FFFFFF] shadow-2xl sm:mb-0"
    >
      <div class="flex items-center justify-between border-b border-[#ECECEC] px-6 py-4">
        <div>
          <h2 id="create-title" class="font-display text-xl font-bold text-black">
            Nuevo Reporte
          </h2>
          <p class="mt-0.5 text-xs text-[#666666]">Cada detalle ayuda a encontrar a su dueño.</p>
        </div>
        <button
          type="button"
          aria-label="Cerrar"
          class="rounded-full bg-[#F5F5F7] p-2 text-[#666666] hover:bg-[#ECECEC] hover:text-black focus-porple transition-colors"
          onclick={close}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="max-h-[85vh] overflow-y-auto px-6 py-5">
        <div class="mb-5 grid grid-cols-2 gap-1.5 rounded-full bg-[#F5F5F7] p-1.5">
          <button
            type="button"
            class={`flex items-center justify-center rounded-full px-4 py-2 text-center font-display text-sm font-semibold transition-all ${tipo === "perdido" ? "bg-[#000000] text-white shadow-sm" : "text-[#555555] hover:text-black"}`}
            onclick={() => (tipo = "perdido")}
          >
            Perdí una pertenencia
          </button>
          <button
            type="button"
            class={`flex items-center justify-center rounded-full px-4 py-2 text-center font-display text-sm font-semibold transition-all ${tipo === "encontrado" ? "bg-[#000000] text-white shadow-sm" : "text-[#555555] hover:text-black"}`}
            onclick={() => (tipo = "encontrado")}
          >
            Encontré un objeto
          </button>
        </div>

        <div class="space-y-3">
          <div>
            <label for="titulo" class="block font-display text-xs font-semibold text-[#333333] mb-1">
              Título del objeto
            </label>
            <input
              id="titulo"
              type="text"
              class="w-full rounded-full border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none placeholder:text-[#999999] transition-colors focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
              placeholder="Ej. Cargador de laptop"
              bind:value={titulo}
              aria-describedby={errors.titulo ? "titulo-error" : undefined}
            />
            {#if errors.titulo}
              <p id="titulo-error" class="mt-1 text-xs text-[#DC2626]">{errors.titulo}</p>
            {/if}
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label for="categoria" class="block font-display text-xs font-semibold text-[#333333] mb-1">
                Categoría
              </label>
              <CustomSelect id="categoria" ariaLabel="Categoría" options={[...CATEGORIES]} bind:value={categoria} />
            </div>
            <div>
              <label for="ubicacion" class="block font-display text-xs font-semibold text-[#333333] mb-1">
                Ubicación en Campus
              </label>
              <CustomSelect id="ubicacion" ariaLabel="Ubicación en Campus" options={ZONE_OPTIONS} bind:value={ubicacion} />
            </div>
          </div>

          <div>
            <label for="descripcion" class="block font-display text-xs font-semibold text-[#333333] mb-1">
              Descripción pública
            </label>
            <textarea
              id="descripcion"
              rows="3"
              class="w-full resize-none rounded-2xl border border-transparent bg-[#F5F5F7] px-4 py-2.5 text-sm text-black outline-none placeholder:text-[#999999] transition-colors focus:border-[#4F1F91] focus:ring-2 focus:ring-[#4F1F91]/30"
              placeholder="¿Dónde lo viste por última vez? Añade detalles que ayuden a reconocerlo."
              bind:value={descripcion}
              aria-describedby={errors.descripcion ? "descripcion-error" : undefined}
            ></textarea>
            {#if errors.descripcion}
              <p id="descripcion-error" class="mt-1 text-xs text-[#DC2626]">{errors.descripcion}</p>
            {/if}
          </div>

          <div>
            <p class="mb-1 font-display text-xs font-semibold text-[#333333]">Fotografía del objeto</p>
            <div
              class={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed p-3 transition-all duration-200 ${
                isDragging
                  ? "shimmer-border scale-[1.015] bg-white"
                  : previewUrl
                    ? "border-[#4F1F91] bg-white"
                    : "border-[#ECECEC] bg-[#F5F5F7]"
              }`}
              role="region"
              aria-label="Zona para subir la fotografía del objeto"
              ondragenter={handleDragEnter}
              ondragover={handleDragOver}
              ondragleave={handleDragLeave}
              ondrop={handleDrop}
            >
              {#if previewUrl}
                <img src={previewUrl} alt="Vista previa" class="animate-preview-in max-h-44 w-full rounded-xl object-contain shadow-sm" />
                <div class="flex items-center gap-2">
                  <span class="truncate max-w-[12rem] font-display text-xs text-[#333333]">{file?.name ?? "Imagen"}</span>
                  <button type="button" class="text-xs text-[#330085] hover:underline" onclick={() => { file = null; previewUrl = ""; }}>Cambiar</button>
                </div>
              {:else}
                <img src="/icons/icon-upload.png" alt="" class="h-10 w-10 opacity-15"/>
                <div class="text-center">
                  <p class="font-display text-sm font-medium text-[#333333]">Arrastra una imagen o haz clic para subir</p>
                  <p class="mt-1 text-xs text-[#999999]">JPG, PNG o WEBP · Máx. 5 MB</p>
                </div>
                <label class="mt-1 inline-flex cursor-pointer rounded-full bg-[#000000] px-4 py-1.5 font-display text-xs font-semibold text-white transition-all duration-150 hover:bg-[#330085] focus-within:ring-2 focus-within:ring-[#4F1F91] active:scale-95">
                  Subir foto
                  <input type="file" accept="image/jpeg,image/png,image/webp" class="sr-only" onchange={handleInputChange} />
                </label>
              {/if}
            </div>
            {#if errors.foto}
              <p class="mt-1 text-xs text-[#DC2626]">{errors.foto}</p>
            {/if}
          </div>
        </div>

        <div class="sticky bottom-0 mt-4 flex flex-col-reverse gap-2 border-t border-[#ECECEC] bg-[#FFFFFF]/95 backdrop-blur pt-3 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            class="rounded-full border border-transparent bg-[#F5F5F7] px-5 py-2.5 font-display text-sm font-semibold text-[#555555] hover:bg-[#ECECEC] focus-porple transition-all duration-150 active:scale-[0.98]"
            onclick={close}
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="inline-flex items-center justify-center gap-2 rounded-full bg-[#000000] px-6 py-2.5 font-display text-sm font-semibold text-white hover:bg-[#330085] focus-porple transition-all duration-150 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isSubmitting}
          >
            {#if isSubmitting}<span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>{/if}
            Publicar reporte
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}
