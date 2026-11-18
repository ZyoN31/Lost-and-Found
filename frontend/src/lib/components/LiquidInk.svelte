<script lang="ts">
  /**
   * LiquidInk — organic black liquid contour on the white /login showcase.
   * Multi-harmonic rAF morphing + Spring cursor parallax. Black mass hugs the
   * right edge, sweeps across the bottom-right and bottom-center beneath the
   * puzzle, with a wavy left edge that curves diagonally up to a narrow top-right
   * tip. Purple rim and rising droplets complete the living-ink illusion.
   * Renders one static frame under reduced motion.
   */
  import { onMount } from "svelte";
  import { Spring } from "svelte/motion";

  interface Wave {
    amp: number;
    k: number;
    speed: number;
    phase: number;
  }

  const WAVES: Wave[] = [
    { amp: 12.5, k: 0.055, speed: 0.32, phase: 0 },
    { amp: 6.4, k: 0.14, speed: 0.55, phase: 1.4 },
    { amp: 2.9, k: 0.27, speed: 0.82, phase: 4.1 },
  ];

  const DRIFT = 2.8;
  const STEP = 2.3;
  const Y_MIN = -4;
  const Y_MAX = 104;

  let wrapper: HTMLDivElement | null = null;
  let pathMain: SVGPathElement | null = null;
  let pathRim: SVGPathElement | null = null;
  let pathGlow: SVGPathElement | null = null;
  let gRim: SVGGElement | null = null;
  let dropletLayer: HTMLDivElement | null = null;

  // Cursor parallax, heavily damped so the ink drifts, not snaps.
  const px = new Spring(0, { stiffness: 0.05, damping: 0.4 });
  const py = new Spring(0, { stiffness: 0.05, damping: 0.4 });

  /** Boundary curve: hugs the right edge, sweeps wide across bottom, curves
   * diagonally up to a narrow top-right tip. Base curve from ~97% at top
   * to ~40% at bottom, overlaid with harmonic undulation. */
  function boundaryX(y: number, t: number): number {
    // Base diagonal: top-right (~97%) to bottom-left (~40%)
    const p = y / 100; // 0 at top, 1 at bottom
    let x = 93 - p * 53; // 93 at top, 40 at bottom
    x += DRIFT * Math.sin(t * 0.19 + 1.2);
    for (const wave of WAVES) {
      x += wave.amp * Math.sin(wave.k * y + t * wave.speed + wave.phase);
    }
    return x;
  }

  /** Sample points along Y axis for the boundary curve. */
  function samplePoints(t: number): [number, number][] {
    const pts: [number, number][] = [];
    for (let y = Y_MIN; y <= Y_MAX; y += STEP) {
      pts.push([boundaryX(y, t), y]);
    }
    return pts;
  }

  /** Spline through points into a path string. */
  function splineThrough(pts: [number, number][], into: string): string {
    let d = into;
    const p = (i: number): [number, number] =>
      pts[Math.max(0, Math.min(pts.length - 1, i))];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = p(i - 1);
      const p1 = p(i);
      const p2 = p(i + 1);
      const p3 = p(i + 2);
      const c1x = p1[0] + (p2[0] - p0[0]) / 6;
      const c1y = p1[1] + (p2[1] - p0[1]) / 6;
      const c2x = p2[0] - (p3[0] - p1[0]) / 6;
      const c2y = p2[1] - (p3[1] - p1[1]) / 6;
      d += `C ${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)} `;
    }
    return d;
  }

  /** Main black mass path: starts at top-right, down right edge, sweeps
   * across bottom, then curves up along the left boundary. */
  function mainPath(t: number): string {
    const pts = samplePoints(t);
    // Start at top-right corner (100,0), down right edge to bottom-right (100,100)
    let d = `M 100 0 L 100 100 L ${pts[pts.length - 1][0].toFixed(2)} 100 `;
    // Curve up from bottom-left to top-right using points in reverse order
    const up = [...pts].reverse();
    d = splineThrough(up, d);
    d += `L 100 0 Z`;
    return d;
  }

  /** Purple edge glow path: follows the wavy left boundary only. */
  function openPath(t: number): string {
    const pts = samplePoints(t);
    const up = [...pts].reverse(); // bottom to top
    let d = `M ${up[0][0].toFixed(2)} ${up[0][1].toFixed(2)} `;
    return splineThrough(up, d);
  }

  function draw(t: number): void {
    pathMain?.setAttribute("d", mainPath(t));
    pathRim?.setAttribute("d", openPath(t));
    pathGlow?.setAttribute("d", openPath(t));
  }

  function handlePointerMove(event: PointerEvent): void {
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();
    px.target = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    py.target = ((event.clientY - rect.top) / rect.height) * 2 - 1;
  }

  function handlePointerLeave(): void {
    px.target = 0;
    py.target = 0;
  }

  onMount(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      draw(0);
      return;
    }
    let raf = 0;
    const loop = (now: number): void => {
      draw(now / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });

  // Rising ink droplets along the right/black liquid contour (6 droplets).
  const droplets: Array<[number, number, number, number, number]> = [
    [84, 35, 28, -2, 13],
    [92, 75, 22, -5, 15],
    [78, 115, 16, -1, 11],
    [88, 145, 14, -7, 14],
    [66, 55, 12, -3, 10],
    [96, 95, 20, -4, 16],
  ];
</script>

<div
  bind:this={wrapper}
  class="absolute inset-0 overflow-hidden"
  aria-hidden="true"
  onpointermove={handlePointerMove}
  onpointerleave={handlePointerLeave}
>

  <svg class="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
    <defs>
      <linearGradient id="ink-depth" x1="0" y1="0" x2="1" y2="0.35">
        <stop offset="0" stop-color="#000000" />
        <stop offset="0.72" stop-color="#000000" />
        <stop offset="1" stop-color="#330085" stop-opacity="0.92" />
      </linearGradient>
      <linearGradient id="ink-rim" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#4F1F91" stop-opacity="0.95" />
        <stop offset="0.45" stop-color="#4F1F91" stop-opacity="0.3" />
        <stop offset="1" stop-color="#4F1F91" stop-opacity="0" />
      </linearGradient>
    </defs>

    <!-- Main black mass: hugs the right edge, sweeps the bottom -->
    <path bind:this={pathMain} fill="url(#ink-depth)" d={mainPath(0)} />

    <!-- Purple edge glow inside the liquid -->
    <g bind:this={gRim}>
      <path
        bind:this={pathGlow}
        fill="none"
        stroke="#4F1F91"
        stroke-opacity="0.35"
        stroke-width="6"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
        d={openPath(0)}
      />
      <path
        bind:this={pathRim}
        fill="none"
        stroke="url(#ink-rim)"
        stroke-width="2.4"
        stroke-linecap="round"
        vector-effect="non-scaling-stroke"
        opacity="0.95"
        d={openPath(0)}
      />
    </g>
  </svg>

  <!-- Rising black / purple ink droplets -->
  <div bind:this={dropletLayer} class="absolute inset-0 will-change-transform">
    {#each droplets as d, i (i)}
      <div
        class="ink-droplet absolute"
        style={`left: ${d[0]}%; bottom: ${d[1]}px; width: ${d[2]}px; height: ${d[2]}px; animation-delay: ${d[3]}s; animation-duration: ${d[4]}s;`}
      ></div>
    {/each}
  </div>
</div>