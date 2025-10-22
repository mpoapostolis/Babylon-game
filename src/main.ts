import { Engine, WebGPUEngine, Vector3 } from "@babylonjs/core";
import "@babylonjs/loaders";
import { createScene, createCamera, loadPlayerModel } from "./scene";
import { PlayerController } from "./player";
import { InputManager } from "./input";
import { CombatSystem } from "./combat";
import { HUD } from "./hud";
import { NPC } from "./npc";
import { DialogueUI } from "./dialogue";

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

  // Initialize combat system
  const combatSystem = new CombatSystem(scene, playerController);

  // Initialize HUD
  const hud = new HUD();

  // Initialize Dialogue UI
  const dialogueUI = new DialogueUI();

  // Create NPC with dialogue
  const merchantNPC = new NPC(
    scene,
    new Vector3(5, 0, 0),
    "Solaire",
    [
      {
        speaker: "Solaire",
        text: "Ah, hello there! I am Solaire of Astora, an adherent of the Lord of Sunlight.",
      },
      {
        speaker: "Solaire",
        text: "If only I could be so grossly incandescent! The sun is a wondrous body, like a magnificent father.",
      },
      {
        speaker: "Solaire",
        text: "We are amidst strange beings, in a strange land. The flow of time itself is convoluted, with heroes centuries old phasing in and out.",
      },
      {
        speaker: "Solaire",
        text: "Well then, take care. Neither of us want to see you go Hollow.",
      },
      {
        speaker: "Solaire",
        text: "If I didn't know better, I'd think you had feelings for me! Oh, no, dear me. Pretend you didn't hear that!",
      },
    ]
  );

  // Set up close callback for dialogue
  dialogueUI.setCloseCallback(() => {
    merchantNPC.resetDialogue();
  });

  // Connect player attacks to combat system
  playerController.setAttackCallback((position, direction) => {
    combatSystem.shootFireball(position, direction);
  });

  // Spawn enemies in a circle pattern
  const enemyCount = 12;
  const radius = 15;
  for (let i = 0; i < enemyCount; i++) {
    const angle = (i / enemyCount) * Math.PI * 2;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    combatSystem.spawnEnemy(new Vector3(x, 1, z));
  }

  // Spawn some closer enemies
  combatSystem.spawnEnemy(new Vector3(5, 1, 5));
  combatSystem.spawnEnemy(new Vector3(-5, 1, 5));
  combatSystem.spawnEnemy(new Vector3(0, 1, 8));
  combatSystem.spawnEnemy(new Vector3(8, 1, -3));
  combatSystem.spawnEnemy(new Vector3(-8, 1, -3));
  combatSystem.spawnEnemy(new Vector3(4, 1, -6));

  // Click to target enemies
  scene.onPointerDown = (evt, pickResult) => {
    if (pickResult.hit && pickResult.pickedMesh) {
      // Check if clicked on enemy
      const enemies = combatSystem.getEnemies();
      for (const enemy of enemies) {
        if (pickResult.pickedMesh === enemy.getMesh() || pickResult.pickedMesh.parent === enemy.getMesh()) {
          // Set target to enemy position
          playerController.setTarget(enemy.getPosition());
          // Highlight selected enemy
          combatSystem.setSelectedEnemy(enemy);
          console.log("Target set to enemy");
          break;
        }
      }
    }
  };

  // Track interaction state
  let interactPressed = false;
  let cancelPressed = false;

  // Main game loop
  scene.onBeforeRenderObservable.add(() => {
    const deltaTime = engine.getDeltaTime() / 1000;
    const input = inputManager.getInputState();
    playerController.update(deltaTime, input);
    combatSystem.update(deltaTime);

    // Check NPC interaction
    const playerPos = playerController.getCapsule().position;
    const isNearNPC = merchantNPC.checkPlayerDistance(playerPos);

    // Handle ESC key to close dialogue
    if (input.cancel && !cancelPressed && dialogueUI.isShowing()) {
      dialogueUI.hide();
      merchantNPC.resetDialogue();
      cancelPressed = true;
    } else if (!input.cancel) {
      cancelPressed = false;
    }

    // Show/hide interaction prompt
    if (merchantNPC.isPlayerInRange() && !dialogueUI.isShowing()) {
      dialogueUI.showPrompt(merchantNPC.getName());
    } else if (!merchantNPC.isPlayerInRange()) {
      dialogueUI.hidePrompt();
    }

    // Handle interaction input (F key)
    if (input.interact && !interactPressed && merchantNPC.isPlayerInRange()) {
      if (dialogueUI.isShowing()) {
        // Continue dialogue
        const nextLine = merchantNPC.interact();
        if (nextLine) {
          dialogueUI.show(nextLine);
        } else {
          dialogueUI.hide();
          merchantNPC.resetDialogue();
        }
      } else {
        // Start dialogue
        const firstLine = merchantNPC.interact();
        if (firstLine) {
          dialogueUI.show(firstLine);
          dialogueUI.hidePrompt();
        }
      }
      interactPressed = true;
    } else if (!input.interact) {
      interactPressed = false;
    }

    // Update HUD
    hud.updateHealth(playerController.getHealth(), playerController.getMaxHealth());
    hud.updateCooldown(
      playerController.getAttackCooldown(),
      playerController.getMaxAttackCooldown()
    );
    hud.updateTarget(combatSystem.getSelectedEnemy());
    hud.updateEnemyCount(combatSystem.getEnemies().length);
  });

  // Start render loop
  engine.runRenderLoop(() => scene.render());

  // Handle window resize
  window.addEventListener("resize", () => engine.resize());

  console.log("🎮 Game initialized successfully");
  console.log("💥 Press E to shoot fireballs!");
}

// Start the application
init().catch((error) => {
  console.error("❌ Failed to initialize game:", error);
});
