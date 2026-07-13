"use client";

/**
 * FluidCursor: a WebGL fluid-simulation background for the landing hero.
 *
 * Built on PavelDoGreat/WebGL-Fluid-Simulation (MIT License, Copyright (c)
 * 2017 Pavel Dobryakov), via the `webgl-fluid` ESM wrapper.
 *
 * Integration notes:
 * - Rendered only on non-touch devices without prefers-reduced-motion, and
 *   lazy-mounted after first paint (see ChatApp).
 * - The canvas is fixed, behind the app, and pointer-events:none so it never
 *   blocks the chat. The sim's own listeners get no real events, so we forward
 *   the window cursor via synthetic events (armed with a mousedown so hover
 *   produces splats, re-armed after any real mouseup).
 * - Everything is wrapped defensively: if the simulation cannot initialize
 *   (unsupported GPU, missing extension, sandboxed browser) it degrades to an
 *   empty transparent canvas rather than crashing the app.
 * - On unmount we drop the WebGL context to free GPU memory.
 */

import { useEffect, useRef } from "react";
import WebGLFluid from "webgl-fluid";

export default function FluidCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
    };
    resize();
    window.addEventListener("resize", resize);

    let started = false;
    try {
      WebGLFluid(canvas, {
        TRANSPARENT: true,
        SIM_RESOLUTION: 128,
        DYE_RESOLUTION: 1024,
        DENSITY_DISSIPATION: 1.4,
        VELOCITY_DISSIPATION: 1.6,
        PRESSURE: 0.8,
        CURL: 24,
        SPLAT_RADIUS: 0.2,
        SPLAT_FORCE: 6200,
        SHADING: true,
        COLORFUL: true,
        COLOR_UPDATE_SPEED: 8,
        BACK_COLOR: { r: 0, g: 0, b: 0 },
        // Bloom + sunrays make the dye glow, so it reads clearly over the dark
        // background instead of the sim's default dim colors.
        BLOOM: true,
        BLOOM_INTENSITY: 0.8,
        BLOOM_ITERATIONS: 8,
        SUNRAYS: true,
        SUNRAYS_WEIGHT: 1.0,
      });
      started = true;
    } catch (err) {
      console.warn("FluidCursor: simulation init failed, skipping.", err);
    }

    if (!started) {
      window.removeEventListener("resize", resize);
      return;
    }

    let raf = 0;
    let pending: { x: number; y: number } | null = null;
    const fire = (type: string, x: number, y: number) =>
      canvas.dispatchEvent(
        new MouseEvent(type, { clientX: x, clientY: y, bubbles: false })
      );
    const arm = (x: number, y: number) => fire("mousedown", x, y);

    const onMove = (e: MouseEvent) => {
      pending = { x: e.clientX, y: e.clientY };
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          if (pending) fire("mousemove", pending.x, pending.y);
        });
      }
    };
    const onUp = () => {
      if (pending) arm(pending.x, pending.y);
    };

    const armTimer = window.setTimeout(
      () => arm(window.innerWidth / 2, window.innerHeight / 2),
      600
    );

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.clearTimeout(armTimer);
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      const lose =
        gl &&
        (gl.getExtension("WEBGL_lose_context") as { loseContext(): void } | null);
      if (lose) lose.loseContext();
    };
  }, []);

  return <canvas ref={canvasRef} className="fluid-canvas" aria-hidden="true" />;
}
