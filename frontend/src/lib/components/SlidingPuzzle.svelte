<script lang="ts">
  /**
   * SlidingPuzzle — self-solving 8-puzzle (3×3 grid) for the /login showcase.
   *
   * Renders 8 original custom icon tiles plus one genuinely empty slot. A
   * wandering loop slides a random tile orthogonally adjacent to the empty
   * slot into it (never immediately reversing the previous move), animated
   * with svelte/animate `flip`. Pauses under prefers-reduced-motion and while
   * the user hovers the board.
   *
   * The tiles and icons use the original black-stroked SVG assets, inverted
   * to pure white via CSS (`invert`), so `mix-blend-difference` on the grid
   * auto-inverts them against the white canvas and the black liquid contour:
   * solid black on white, solid white on black liquid.
   */
  import { onMount } from "svelte";
  import { flip } from "svelte/animate";
  import { cubicOut } from "svelte/easing";

  interface Tile {
    icon: string;
    label: string;
  }

  const EMPTY = 8;
  const STEP_MS = 1200;

  // Original custom icon assets from /static/icons/.
  const TILES: Tile[] = [
    { icon: "/icons/icon-id-badge.svg", label: "Credencial" },
    { icon: "/icons/icon-umbrella.svg", label: "Paraguas" },
    { icon: "/icons/icon-wallet.svg", label: "Cartera" },
    { icon: "/icons/icon-keys.svg", label: "Llaves" },
    { icon: "/icons/icon-book.svg", label: "Libro" },
    { icon: "/icons/icon-sweater.svg", label: "Suéter" },
    { icon: "/icons/icon-headphones.svg", label: "Audífonos" },
    { icon: "/icons/icon-mouse.svg", label: "Mouse" },
  ];

  // Board holds 9 cells; values 0..7 are tile indices, EMPTY marks the slot.
  let board = $state<number[]>([0, 1, 2, 3, 4, 5, 6, 7, EMPTY]);
  // Direction of the most recent slide; used to avoid immediate reversals.
  let lastDir = $state<string | null>(null);
  // True while the pointer hovers the board — the loop pauses.
  let hovered = $state(false);
  // Whether the user prefers reduced motion.
  let reduced = $state(false);
  // Interval handle.
  let timer: ReturnType<typeof setInterval> | null = null;

  const emptyIndex = $derived(board.indexOf(EMPTY));

  /** Orthogonal neighbours of the empty slot, with slide direction. */
  function neighbours(idx: number): Array<{ dir: string; index: number }> {
    const row = Math.floor(idx / 3);
    const col = idx % 3;
    const out: Array<{ dir: string; index: number }> = [];
    if (row > 0) out.push({ dir: "up", index: idx - 3 });
    if (row < 2) out.push({ dir: "down", index: idx + 3 });
    if (col > 0) out.push({ dir: "left", index: idx - 1 });
    if (col < 2) out.push({ dir: "right", index: idx + 1 });
    return out;
  }

  function wouldReverse(dir: string): boolean {
    if (!lastDir) return false;
    return (
      (lastDir === "up" && dir === "down") ||
      (lastDir === "down" && dir === "up") ||
      (lastDir === "left" && dir === "right") ||
      (lastDir === "right" && dir === "left")
    );
  }

  /** Perform one random, non-reversing slide into the empty slot. */
  function step(): void {
    const empty = emptyIndex;
    const options = neighbours(empty);
    const forward = options.filter((option) => !wouldReverse(option.dir));
    const pool = forward.length > 0 ? forward : options;
    if (pool.length === 0) return;
    const chosen = pool[Math.floor(Math.random() * pool.length)];
    lastDir = chosen.dir;
    const tileValue = board[chosen.index];
    board[chosen.index] = EMPTY;
    board[empty] = tileValue;
  }

  function startLoop(): void {
    if (timer !== null || reduced || hovered) return;
    timer = setInterval(() => {
      if (!hovered) step();
    }, STEP_MS);
  }

  function stopLoop(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  onMount(() => {
    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    startLoop();
    return stopLoop;
  });

  // Hover pauses the loop; re-entry resumes it.
  function onEnter(): void {
    hovered = true;
    stopLoop();
  }

  function onLeave(): void {
    hovered = false;
    if (!reduced) startLoop();
  }
</script>

<div
  class="select-none"
  onmouseenter={onEnter}
  onmouseleave={onLeave}
  role="presentation"
>
  <!-- 3×3 board; white strokes auto-invert via mix-blend-difference.
       No backdrop-blur, no opacity<1, no isolation inside this layer. -->
  <div class="grid grid-cols-3 gap-3 w-[330px] sm:w-[380px] xl:w-[420px]">
    {#each board as value (value)}
      <div
        animate:flip={{ duration: 320, easing: cubicOut }}
        class="aspect-square rounded-2xl"
      >
        {#if value === EMPTY}
          <div
            class="h-full w-full rounded-2xl"
            aria-hidden="true"
          ></div>
        {:else}
          {@const tile = TILES[value]}
          <div
            class="relative flex h-full w-full items-center justify-center rounded-2xl border-[2.5px] border-[#FFFFFF] bg-transparent shadow-none"
            aria-label={tile.label}
            role="img"
          >
            <img
              src={tile.icon}
              alt=""
              class="h-14 w-14 sm:h-16 sm:w-16 object-contain invert brightness-200 contrast-200 select-none pointer-events-none"
              draggable="false"
            />
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
