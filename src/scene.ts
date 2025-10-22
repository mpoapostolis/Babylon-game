import {
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  ArcRotateCamera,
  PhysicsAggregate,
  PhysicsShapeType,
} from "@babylonjs/core";
import { HavokPlugin } from "@babylonjs/core/Physics";
import HavokPhysics from "@babylonjs/havok";
import { ImportMeshAsync } from "@babylonjs/core";
import { CONFIG } from "./config";

export async function createScene(engine: Engine): Promise<Scene> {
  const scene = new Scene(engine);

  // Initialize physics
  const havok = await HavokPhysics();
  const havokPlugin = new HavokPlugin(true, havok);
  scene.enablePhysics(new Vector3(0, CONFIG.GRAVITY, 0), havokPlugin);

  // Setup lighting
  const light = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
  light.intensity = 0.7;

  // Load environment
  await loadDungeon(scene);

  return scene;
}

async function loadDungeon(scene: Scene): Promise<void> {
  const result = await ImportMeshAsync("city.glb", scene);
  const rootMesh = result.meshes[0];

  // Apply transformations
  rootMesh.scaling.setAll(CONFIG.WORLD.DUNGEON_SCALE);
  rootMesh.position.set(
    CONFIG.WORLD.DUNGEON_POSITION.x,
    CONFIG.WORLD.DUNGEON_POSITION.y,
    CONFIG.WORLD.DUNGEON_POSITION.z
  );

  // Add physics to dungeon meshes
  result.meshes.forEach((mesh) => {
    if (mesh.getTotalVertices() > 0) {
      new PhysicsAggregate(
        mesh,
        PhysicsShapeType.MESH,
        {
          mass: 0,
          friction: CONFIG.WORLD.STATIC_FRICTION,
          restitution: CONFIG.WORLD.STATIC_RESTITUTION,
        },
        scene
      );
    }
  });
}

export function createCamera(scene: Scene, target: Vector3): ArcRotateCamera {
  const camera = new ArcRotateCamera(
    "PlayerCam",
    CONFIG.CAMERA.INITIAL_ALPHA,
    CONFIG.CAMERA.INITIAL_BETA,
    CONFIG.CAMERA.INITIAL_RADIUS,
    target,
    scene
  );

  camera.attachControl(true);
  camera.lowerRadiusLimit = CONFIG.CAMERA.MIN_RADIUS;
  camera.upperRadiusLimit = CONFIG.CAMERA.MAX_RADIUS;
  camera.wheelDeltaPercentage = CONFIG.CAMERA.WHEEL_DELTA;

  return camera;
}

export async function loadPlayerModel(scene: Scene) {
  const result = await ImportMeshAsync("player.glb", scene);
  const rootMesh = result.meshes[1];
  rootMesh.rotation.set(Math.PI / 2, 0, 0);

  return {
    mesh: rootMesh,
    animations: result.animationGroups,
  };
}
