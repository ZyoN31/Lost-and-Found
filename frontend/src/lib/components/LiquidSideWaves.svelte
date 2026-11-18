<script lang="ts">
  /**
   * LiquidSideWaves — purely decorative black liquid tendrils hugging the
   * extreme left / right viewport edges. Slow harmonic morphing driven by
   * requestAnimationFrame; renders a static frame under reduced motion.
   *
   * Never intercepts pointer events and never overlaps the content frame.
   */
  import { onMount } from "svelte";

  interface Wave {
    amp: number;
    k: number;
    speed: number;
    phase: number;
  }

  // Harmonic stack shaping the tendril boundary.
  const WAVES: Wave[] = [
    { amp: 4.6, k: 0.075, speed: 0.32, phase: 0 },
    { amp: 2.3, k: 0.148, speed: 0.52, phase: 1.9 },
    { amp: 1.15, k: 0.262, speed: 0.78, phase: 4.3 },
  ];

  const STEP = 2.2;
  const Y_MIN = -4;
  const Y_MAX = 104;
  const WIDTH = 30;

  let leftPath: SVGPathElement | null = null;
  let rightPath: SVGPathElement | null = null;
  let leftRim: SVGPathElement | null = null;
  let rightRim: SVGPathElement | null = null;
  let leftFilament: SVGPathElement | null = null;
  let rightFilament: SVGPathElement | null = null;

  function boundaryX(y: number, t: number, mirror: boolean): number {
    let x = 0;
    for (const wave of WAVES) {
      x += wave.amp * Math.sin(wave.k * y + t * wave.speed + wave.phase);
    }
    // Offset the base position inward so the tendril reads as a sliver.
    const base = WIDTH * 0.42 + 3.2;
    return mirror ? WIDTH - (base + x) : base + x;
  }

  // Catmull-Rom spline converted to cubic Bézier segments.
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

  function sample(t: number, mirror: boolean): [number, number][] {
    const pts: [number, number][] = [];
    for (let y = Y_MIN; y <= Y_MAX; y += STEP) {
      pts.push([boundaryX(y, t, mirror), y]);
    }
    return pts;
  }

  function fillPath(t: number, mirror: boolean): string {
    const pts = sample(t, mirror);
    let d = mirror
      ? `M ${WIDTH} ${Y_MIN} L ${pts[0][0].toFixed(2)} ${Y_MIN} `
      : `M 0 ${Y_MIN} L ${pts[0][0].toFixed(2)} ${Y_MIN} `;
    d = splineThrough(pts, d);
    d += mirror ? `L ${WIDTH} ${Y_MAX} Z` : `L 0 ${Y_MAX} Z`;
    return d;
  }

  function openPath(t: number, mirror: boolean): string {
    const pts = sample(t, mirror);
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} `;
    return splineThrough(pts, d);
  }

  function filamentPath(t: number, mirror: boolean): string {
    const pts = sample(t, mirror).map(([x, y]) => [x + (mirror ? -5.4 : 5.4), y] as [number, number]);
    let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)} `;
    return splineThrough(pts, d);
  }

  function draw(t: number): void {
    leftPath?.setAttribute("d", fillPath(t, false));
    rightPath?.setAttribute("d", fillPath(t, true));
    leftRim?.setAttribute("d", openPath(t, false));
    rightRim?.setAttribute("d", openPath(t, true));
    leftFilament?.setAttribute("d", filamentPath(t, false));
    rightFilament?.setAttribute("d", filamentPath(t, true));
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

  // Rising ink droplets along the left edge: [top %, size px, delay s, duration s].
  const leftDroplets: Array<[number, number, number, number]> = [
    [8, 44, -2, 14], [22, 56, -5, 16], [38, 36, -3, 12], [52, 48, -7, 15],
    [64, 40, -4, 13], [78, 32, -1, 11], [90, 28, -6, 9],
  ];
  // Rising ink droplets along the right edge.
  const rightDroplets: Array<[number, number, number, number]> = [
    [12, 48, -3, 15], [26, 52, -4, 17], [40, 40, -2, 13], [55, 36, -5, 12],
    [68, 44, -7, 11], [80, 30, -8, 10], [92, 36, -1, 12],
  ];
</script>

<!-- Left / right liquid tendrils: always decorative, always behind content. -->
<svg
  class="pointer-events-none fixed inset-y-0 left-0 z-51 h-full w-24 xl:w-40 lg:block"
  viewBox={`0 0 ${WIDTH} 100`}
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="side-rim-left" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#330085" stop-opacity="0.95" />
      <stop offset="0.42" stop-color="#4F1F91" stop-opacity="0.35" />
      <stop offset="1" stop-color="#4F1F91" stop-opacity="0" />
    </linearGradient>
  </defs>
  <path bind:this={leftPath} fill="#000000" d="M 0 -4 L 12 -4 L 0 104 Z" />
  <path
    bind:this={leftRim}
    fill="none"
    stroke="url(#side-rim-left)"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-opacity="0.9"
    vector-effect="non-scaling-stroke"
    d="M 12 -4 L 12 104"
  />
  <path
    bind:this={leftFilament}
    fill="none"
    stroke="#4F1F91"
    stroke-opacity="0.55"
    stroke-width="0.9"
    stroke-linecap="round"
    vector-effect="non-scaling-stroke"
    d="M 17 -4 L 17 104"
  />
</svg>

<!-- Rising ink droplets over the left tendril (HTML overlay, not SVG children). -->
<div class="pointer-events-none fixed inset-y-0 left-0 z-51 h-full w-24 xl:w-40 overflow-hidden" aria-hidden="true">
  {#each leftDroplets as d (d[0])}
    <div
      class="ink-droplet absolute animate-droplet-drift"
      style={`top: ${d[0]}%; left: 30%; width: ${d[1]}px; height: ${d[1]}px; animation-delay: ${d[2]}s; animation-duration: ${d[3]}s;`}
    ></div>
  {/each}
</div>

<svg
  class="pointer-events-none fixed inset-y-0 right-0 z-51 h-full w-24 xl:w-40 lg:block"
  viewBox={`0 0 ${WIDTH} 100`}
  preserveAspectRatio="none"
  aria-hidden="true"
>
  <defs>
    <linearGradient id="side-rim-right" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#330085" stop-opacity="0.95" />
      <stop offset="0.42" stop-color="#4F1F91" stop-opacity="0.35" />
      <stop offset="1" stop-color="#4F1F91" stop-opacity="0" />
    </linearGradient>
  </defs>
  <path bind:this={rightPath} fill="#000000" d="M 30 -4 L 18 -4 L 30 104 Z" />
  <path
    bind:this={rightRim}
    fill="none"
    stroke="url(#side-rim-right)"
    stroke-width="1.6"
    stroke-linecap="round"
    stroke-opacity="0.9"
    vector-effect="non-scaling-stroke"
    d="M 18 -4 L 18 104"
  />
  <path
    bind:this={rightFilament}
    fill="none"
    stroke="#4F1F91"
    stroke-opacity="0.55"
    stroke-width="0.9"
    stroke-linecap="round"
    vector-effect="non-scaling-stroke"
    d="M 13 -4 L 13 104"
  />
</svg>

<!-- Rising ink droplets over the right tendril (HTML overlay, not SVG children). -->
<div class="pointer-events-none fixed inset-y-0 right-0 z-51 h-full w-24 xl:w-40 overflow-hidden" aria-hidden="true">
  {#each rightDroplets as d (d[0])}
    <div
      class="ink-droplet absolute animate-droplet-drift"
      style={`top: ${d[0]}%; left: 30%; width: ${d[1]}px; height: ${d[1]}px; animation-delay: ${d[2]}s; animation-duration: ${d[3]}s;`}
    ></div>
  {/each}
</div>
