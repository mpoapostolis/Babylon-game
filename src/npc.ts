import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  type AbstractMesh,
} from "@babylonjs/core";

export interface DialogueLine {
  text: string;
  speaker: string;
}

export class NPC {
  private mesh: AbstractMesh;
  private scene: Scene;
  private dialogue: DialogueLine[];
  private currentDialogueIndex = 0;
  private isInRange = false;
  private interactionRadius = 3;
  private nameTag: string;

  constructor(
    scene: Scene,
    position: Vector3,
    name: string,
    dialogue: DialogueLine[]
  ) {
    this.scene = scene;
    this.nameTag = name;
    this.dialogue = dialogue;
    this.mesh = this.createNPC(position, name);
  }

  private createNPC(position: Vector3, name: string): AbstractMesh {
    // Create a simple character-like mesh
    const body = MeshBuilder.CreateCylinder(
      `npc_${name}_body`,
      { height: 1.6, diameter: 0.6 },
      this.scene
    );
    body.position = position.add(new Vector3(0, 0.8, 0));

    // Create head
    const head = MeshBuilder.CreateSphere(
      `npc_${name}_head`,
      { diameter: 0.4 },
      this.scene
    );
    head.position = position.add(new Vector3(0, 1.8, 0));
    head.parent = body;

    // Material - golden/amber color for a mysterious NPC
    const material = new StandardMaterial(`npc_${name}_mat`, this.scene);
    material.diffuseColor = new Color3(0.8, 0.7, 0.5);
    material.emissiveColor = new Color3(0.2, 0.15, 0.1);
    body.material = material;
    head.material = material;

    // Create interaction indicator (floating ring above head)
    const indicator = MeshBuilder.CreateTorus(
      `npc_${name}_indicator`,
      { diameter: 0.6, thickness: 0.05 },
      this.scene
    );
    indicator.position = new Vector3(0, 1.2, 0);
    indicator.parent = body;

    const indicatorMat = new StandardMaterial(
      `npc_${name}_indicator_mat`,
      this.scene
    );
    indicatorMat.emissiveColor = new Color3(1, 0.8, 0.3);
    indicator.material = indicatorMat;

    // Animate the indicator
    this.scene.onBeforeRenderObservable.add(() => {
      indicator.rotation.y += 0.02;
      indicator.position.y = 1.2 + Math.sin(Date.now() * 0.003) * 0.1;
    });

    return body;
  }

  checkPlayerDistance(playerPosition: Vector3): boolean {
    const distance = Vector3.Distance(
      this.mesh.position,
      playerPosition.add(new Vector3(0, 0.8, 0))
    );
    const wasInRange = this.isInRange;
    this.isInRange = distance < this.interactionRadius;

    // Return true if player just entered range
    return this.isInRange && !wasInRange;
  }

  isPlayerInRange(): boolean {
    return this.isInRange;
  }

  interact(): DialogueLine | null {
    if (!this.isInRange) return null;

    const line = this.dialogue[this.currentDialogueIndex];
    this.currentDialogueIndex =
      (this.currentDialogueIndex + 1) % this.dialogue.length;
    return line;
  }

  getCurrentDialogue(): DialogueLine | null {
    if (this.dialogue.length === 0) return null;
    return this.dialogue[this.currentDialogueIndex];
  }

  resetDialogue(): void {
    this.currentDialogueIndex = 0;
  }

  getMesh(): AbstractMesh {
    return this.mesh;
  }

  getPosition(): Vector3 {
    return this.mesh.position;
  }

  getName(): string {
    return this.nameTag;
  }

  dispose(): void {
    this.mesh.dispose();
  }
}
