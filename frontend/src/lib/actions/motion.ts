/**
 * Motion primitives for the Lost & Found frontend.
 *
 * Native Svelte 5 actions backed by `svelte/motion` `Spring` physics.
 * Everything degrades gracefully: with `prefers-reduced-motion: reduce`,
 * magnetic/tilt/reveal become instant no-ops and spotlight is skipped.
 */
import type { Action } from "svelte/action";
import { Spring } from "svelte/motion";
import { browser } from "$app/environment";

const SPRING_SOFT = { stiffness: 0.16, damping: 0.58, precision: 0.05 };
const SPRING_GLIDE = { stiffness: 0.22, damping: 0.62, precision: 0.05 };

function prefersReducedMotion(): boolean {
  return browser && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Runs `render` on animation frames while any spring is still moving.
 * The Spring itself animates internally; this rig simply mirrors
 * `spring.current` into the DOM and goes quiet once settled.
 */
function createSpringRig<T extends Record<string, Spring<number>>>(
  springs: T,
  render: () => void
): { kick: () => void; stop: () => void } {
  let raf = 0;
  const settled = (): boolean =>
    Object.values(springs).every((spring) => Math.abs(spring.current - spring.target) < 0.05);

  const tick = (): void => {
    render();
    if (settled()) {
      raf = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  return {
    kick() {
      if (!raf) raf = requestAnimationFrame(tick);
    },
    stop() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}

export interface MagneticOptions {
  /** Pull strength as a fraction of cursor travel (0–1). Default 0.32. */
  strength?: number;
}

/** Subtle magnetic pull toward the cursor for primary CTA pills. */
export const magnetic: Action<HTMLElement, MagneticOptions | undefined> = (node, options) => {
  let strength = options?.strength ?? 0.32;

  if (!browser || prefersReducedMotion()) {
    return { update(next?: MagneticOptions) { strength = next?.strength ?? 0.32; } };
  }

  const x = new Spring(0, SPRING_GLIDE);
  const y = new Spring(0, SPRING_GLIDE);
  const rig = createSpringRig({ x, y }, () => {
    node.style.transform = `translate3d(${x.current.toFixed(2)}px, ${y.current.toFixed(2)}px, 0)`;
  });

  const onPointerMove = (event: PointerEvent): void => {
    const rect = node.getBoundingClientRect();
    const pullX = (event.clientX - (rect.left + rect.width / 2)) * strength;
    const pullY = (event.clientY - (rect.top + rect.height / 2)) * strength;
    x.target = Math.max(-16, Math.min(16, pullX));
    y.target = Math.max(-16, Math.min(16, pullY));
    rig.kick();
  };

  const onPointerLeave = (): void => {
    x.target = 0;
    y.target = 0;
    rig.kick();
  };

  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerleave", onPointerLeave);

  return {
    update(next?: MagneticOptions) {
      strength = next?.strength ?? 0.32;
    },
    destroy() {
      rig.stop();
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerleave", onPointerLeave);
      node.style.transform = "";
    },
  };
};

/** Tracks the pointer and exposes `--mx` / `--my` for spotlight glows. */
export const spotlight: Action<HTMLElement, undefined> = (node) => {
  if (!browser || prefersReducedMotion()) return {};

  const onPointerMove = (event: PointerEvent): void => {
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--mx", `${(event.clientX - rect.left).toFixed(1)}px`);
    node.style.setProperty("--my", `${(event.clientY - rect.top).toFixed(1)}px`);
  };

  const onPointerLeave = (): void => {
    node.style.setProperty("--mx", "50%");
    node.style.setProperty("--my", "50%");
  };

  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerleave", onPointerLeave);

  return {
    destroy() {
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerleave", onPointerLeave);
      node.style.removeProperty("--mx");
      node.style.removeProperty("--my");
    },
  };
};

export interface TiltOptions {
  /** Maximum rotation in degrees on either axis. Default 9. */
  maxDeg?: number;
}

/** Subtle 3D perspective tilt for featured visual tiles and cards. */
export const tilt3d: Action<HTMLElement, TiltOptions | undefined> = (node, options) => {
  let maxDeg = options?.maxDeg ?? 9;

  if (!browser || prefersReducedMotion()) {
    return { update(next?: TiltOptions) { maxDeg = next?.maxDeg ?? 9; } };
  }

  const rx = new Spring(0, SPRING_SOFT);
  const ry = new Spring(0, SPRING_SOFT);
  const rig = createSpringRig({ rx, ry }, () => {
    node.style.transform =
      `perspective(900px) rotateX(${rx.current.toFixed(3)}deg) rotateY(${ry.current.toFixed(3)}deg)`;
  });

  const onPointerMove = (event: PointerEvent): void => {
    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rx.target = -py * maxDeg * 2;
    ry.target = px * maxDeg * 2;
    rig.kick();
  };

  const onPointerLeave = (): void => {
    rx.target = 0;
    ry.target = 0;
    rig.kick();
  };

  node.addEventListener("pointermove", onPointerMove);
  node.addEventListener("pointerleave", onPointerLeave);

  return {
    update(next?: TiltOptions) {
      maxDeg = next?.maxDeg ?? 9;
    },
    destroy() {
      rig.stop();
      node.removeEventListener("pointermove", onPointerMove);
      node.removeEventListener("pointerleave", onPointerLeave);
      node.style.transform = "";
    },
  };
};

export interface RevealOptions {
  /** Stagger delay in milliseconds before the entrance starts. Default 0. */
  delay?: number;
  /** Vertical offset in pixels the element rises from. Default 26. */
  y?: number;
}

/** IntersectionObserver-driven staggered entrance. */
export const reveal: Action<HTMLElement, RevealOptions | undefined> = (node, options) => {
  const delay = options?.delay ?? 0;
  const y = options?.y ?? 26;

  if (!browser || prefersReducedMotion() || !("IntersectionObserver" in window)) {
    node.style.opacity = "1";
    node.style.transform = "none";
    return {};
  }

  node.style.opacity = "0";
  node.style.transform = `translateY(${y}px)`;
  node.style.transition =
    `opacity 0.7s ease ${delay}ms, transform 0.85s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`;
  node.style.willChange = "opacity, transform";

  const clearWillChange = (): void => {
    node.style.willChange = "auto";
    node.removeEventListener("transitionend", clearWillChange);
  };
  node.addEventListener("transitionend", clearWillChange);

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          node.style.opacity = "1";
          node.style.transform = "translateY(0px)";
          io.disconnect();
        }
      }
    },
    { threshold: 0.12, rootMargin: "0px 0px -48px 0px" }
  );
  io.observe(node);

  return {
    destroy() {
      io.disconnect();
      node.removeEventListener("transitionend", clearWillChange);
      node.style.opacity = "";
      node.style.transform = "";
      node.style.transition = "";
      node.style.willChange = "";
    },
  };
};
