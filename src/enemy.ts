import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  ParticleSystem,
  PhysicsAggregate,
  PhysicsShapeType,
  DynamicTexture,
  HighlightLayer,
  type AbstractMesh,
} from "@babylonjs/core";

export class Enemy {
  private mesh: AbstractMesh;
  private scene: Scene;
  private health = 100;
  private maxHealth = 100;
  private aggregate: PhysicsAggregate;
  private isDead = false;
  private hpBarPlane: AbstractMesh;
  private hpBarTexture: DynamicTexture;
  private highlightLayer: HighlightLayer | null = null;

  constructor(scene: Scene, position: Vector3) {
    this.scene = scene;

    // Create enemy mesh (red capsule)
    this.mesh = MeshBuilder.CreateCapsule(
      "enemy",
      { height: 1.8, radius: 0.4 },
      scene
    );
    this.mesh.position.copyFrom(position);

    // Material
    const mat = new StandardMaterial("enemyMat", scene);
    mat.diffuseColor = new Color3(0.8, 0.1, 0.1); // Red
    mat.emissiveColor = new Color3(0.3, 0, 0);
    this.mesh.material = mat;

    // Physics
    this.aggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.CAPSULE,
      { mass: 80, friction: 0.5, restitution: 0 },
      scene
    );
    this.aggregate.body.setAngularDamping(1);

    // Create HP bar
    this.createHPBar();
  }

  private createHPBar(): void {
    // Create plane for HP bar
    this.hpBarPlane = MeshBuilder.CreatePlane(
      "hpBar",
      { width: 1, height: 0.15 },
      this.scene
    );
    this.hpBarPlane.parent = this.mesh;
    this.hpBarPlane.position.set(0, 1.2, 0);
    this.hpBarPlane.billboardMode = 7; // Billboard all axes

    // Create texture for HP bar
    this.hpBarTexture = new DynamicTexture("hpBarTexture", 256, this.scene, true);
    const mat = new StandardMaterial("hpBarMat", this.scene);
    mat.diffuseTexture = this.hpBarTexture;
    mat.emissiveTexture = this.hpBarTexture;
    mat.opacityTexture = this.hpBarTexture;
    mat.backFaceCulling = false;
    this.hpBarPlane.material = mat;

    this.updateHPBar();
  }

  private updateHPBar(): void {
    const ctx = this.hpBarTexture.getContext();
    ctx.clearRect(0, 0, 256, 256);

    // Background (red)
    ctx.fillStyle = "#550000";
    ctx.fillRect(10, 100, 236, 56);

    // Health bar (green)
    const healthPercent = this.health / this.maxHealth;
    ctx.fillStyle = healthPercent > 0.5 ? "#00ff00" : healthPercent > 0.25 ? "#ffaa00" : "#ff0000";
    ctx.fillRect(12, 102, 232 * healthPercent, 52);

    // Border
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 100, 236, 56);

    this.hpBarTexture.update();
  }

  takeDamage(amount: number): void {
    if (this.isDead) return;

    this.health -= amount;
    this.updateHPBar();

    // Flash effect when hit
    const mat = this.mesh.material as StandardMaterial;
    mat.emissiveColor = new Color3(1, 1, 1);
    setTimeout(() => {
      if (!this.isDead) {
        mat.emissiveColor = new Color3(0.3, 0, 0);
      }
    }, 100);

    if (this.health <= 0) {
      this.die();
    }
  }

  private die(): void {
    this.isDead = true;

    // Death particle effect
    this.createDeathEffect();

    // Remove after effect plays
    setTimeout(() => {
      this.dispose();
    }, 1000);
  }

  private createDeathEffect(): void {
    const particles = new ParticleSystem("deathParticles", 500, this.scene);

    particles.particleTexture = null;
    particles.emitter = this.mesh.position;
    particles.minEmitBox = new Vector3(-0.5, 0, -0.5);
    particles.maxEmitBox = new Vector3(0.5, 2, 0.5);

    // Colors - red and orange
    particles.color1 = new Color3(1, 0, 0);
    particles.color2 = new Color3(1, 0.5, 0);
    particles.colorDead = new Color3(0.1, 0.1, 0.1);

    particles.minSize = 0.1;
    particles.maxSize = 0.4;

    particles.minLifeTime = 0.3;
    particles.maxLifeTime = 0.8;

    particles.emitRate = 500;
    particles.minEmitPower = 2;
    particles.maxEmitPower = 5;
    particles.updateSpeed = 0.01;

    particles.gravity = new Vector3(0, -9.8, 0);

    particles.start();

    // Burst then stop
    setTimeout(() => {
      particles.stop();
      setTimeout(() => particles.dispose(), 1000);
    }, 100);

    // Make mesh invisible
    this.mesh.isVisible = false;
  }

  getMesh(): AbstractMesh {
    return this.mesh;
  }

  getPosition(): Vector3 {
    return this.mesh.position;
  }

  isAlive(): boolean {
    return !this.isDead;
  }

  setSelected(selected: boolean): void {
    if (!this.highlightLayer) {
      this.highlightLayer = this.scene.getHighlightLayerByName("highlight") as HighlightLayer;
      if (!this.highlightLayer) {
        this.highlightLayer = new HighlightLayer("highlight", this.scene);
      }
    }

    if (selected) {
      // Add yellow outline
      this.highlightLayer.addMesh(this.mesh, Color3.Yellow());
    } else {
      // Remove outline
      this.highlightLayer.removeMesh(this.mesh);
    }
  }

  dispose(): void {
    if (this.hpBarTexture) {
      this.hpBarTexture.dispose();
    }
    if (this.hpBarPlane) {
      this.hpBarPlane.dispose();
    }
    if (this.aggregate) {
      this.aggregate.dispose();
    }
    if (this.mesh) {
      this.mesh.dispose();
    }
  }
}
