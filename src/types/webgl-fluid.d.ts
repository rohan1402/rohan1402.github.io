declare module "webgl-fluid" {
  /**
   * PavelDoGreat/WebGL-Fluid-Simulation (MIT), ESM wrapper.
   * Sets up the simulation on the given canvas and binds its own pointer
   * listeners to that canvas.
   */
  const WebGLFluid: (
    canvas: HTMLCanvasElement,
    config?: Record<string, unknown>
  ) => void;
  export default WebGLFluid;
}
