import { Engine, WebGPUEngine, Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { createScene, createCamera, loadPlayerModel } from "./scene";
import { PlayerController } from "./player";
import { InputManager } from "./input";

async function createEngine(canvas: HTMLCanvasElement): Promise<Engine> {
  try {
    const webgpu = new WebGPUEngine(canvas);
    await webgpu.initAsync();
    console.log("✅ Using WebGPU Engine");
    return webgpu;
  } catch {
    console.warn("⚠️ WebGPU unavailable, falling back to WebGL2");
    return new Engine(canvas);
  }
}

async function init() {
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  if (!canvas) {
    throw new Error("Canvas element not found");
  }

  // Initialize engine and scene
  const engine = await createEngine(canvas);
  const scene = await createScene(engine);

  // Load player model
  const playerData = await loadPlayerModel(scene);

  // Setup camera
  const camera = createCamera(scene, new Vector3(0, 5, 0));
  playerData.mesh.rotation.y = camera.alpha;

  // Initialize systems
  const inputManager = new InputManager(scene);
  const playerController = new PlayerController(
    scene,
    camera,
    playerData.mesh,
    playerData.animations
  );

  // Main game loop
  scene.onBeforeRenderObservable.add(() => {
    const deltaTime = engine.getDeltaTime() / 1000;
    const input = inputManager.getInputState();
    playerController.update(deltaTime, input);
  });

  // Start render loop
  engine.runRenderLoop(() => scene.render());

  // Handle window resize
  window.addEventListener("resize", () => engine.resize());

  console.log("🎮 Game initialized successfully");
}

// Start the application
init().catch((error) => {
  console.error("❌ Failed to initialize game:", error);
});
