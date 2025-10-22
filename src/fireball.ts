import {
  Scene,
  Vector3,
  MeshBuilder,
  StandardMaterial,
  Color3,
  Color4,
  ParticleSystem,
  PhysicsAggregate,
  PhysicsShapeType,
  DynamicTexture,
  type AbstractMesh,
} from "@babylonjs/core";

export class Fireball {
  private mesh: AbstractMesh;
  private scene: Scene;
  private fireParticles: ParticleSystem;
  private trailParticles: ParticleSystem;
  private velocity: Vector3;
  private lifetime = 5;
  private age = 0;
  private aggregate: PhysicsAggregate;

  constructor(scene: Scene, startPosition: Vector3, direction: Vector3, speed = 25) {
    this.scene = scene;
    this.velocity = direction.normalize().scale(speed);

    // Create small fireball mesh - NO GLOW
    this.mesh = MeshBuilder.CreateSphere(
      "fireball",
      { diameter: 0.25, segments: 12 },
      scene
    );
    this.mesh.position.copyFrom(startPosition);

    // Simple material - NO GLOW
    const mat = new StandardMaterial("fireballMat", scene);
    mat.emissiveColor = new Color3(0.6, 0.3, 0); // Subtle orange
    mat.diffuseColor = new Color3(1, 0.4, 0);
    this.mesh.material = mat;

    // NO PHYSICS - just manual movement
    this.aggregate = new PhysicsAggregate(
      this.mesh,
      PhysicsShapeType.SPHERE,
      { mass: 0, restitution: 0 }, // mass 0 = kinematic
      scene
    );
    this.aggregate.body.disablePreStep = false;

    // Create particle systems
    this.createFireParticles();
    this.createTrailParticles();
  }

  private createFireParticles(): void {
    this.fireParticles = new ParticleSystem("fireParticles", 300, this.scene);

    const flareTexture = this.createFlareTexture();
    this.fireParticles.particleTexture = flareTexture;

    this.fireParticles.emitter = this.mesh;
    this.fireParticles.minEmitBox = new Vector3(-0.05, -0.05, -0.05);
    this.fireParticles.maxEmitBox = new Vector3(0.05, 0.05, 0.05);

    // Fire colors
    this.fireParticles.color1 = new Color4(1, 0.9, 0.5, 1); // Yellow
    this.fireParticles.color2 = new Color4(1, 0.5, 0, 1); // Orange
    this.fireParticles.colorDead = new Color4(0.6, 0, 0, 0); // Red fade

    // Smaller particles
    this.fireParticles.minSize = 0.15;
    this.fireParticles.maxSize = 0.3;

    this.fireParticles.minLifeTime = 0.15;
    this.fireParticles.maxLifeTime = 0.3;

    this.fireParticles.emitRate = 200;

    this.fireParticles.minEmitPower = 1;
    this.fireParticles.maxEmitPower = 2;
    this.fireParticles.updateSpeed = 0.015;

    this.fireParticles.direction1 = new Vector3(-1, -1, -1);
    this.fireParticles.direction2 = new Vector3(1, 1, 1);

    this.fireParticles.blendMode = ParticleSystem.BLENDMODE_ADD;
    this.fireParticles.isBillboardBased = true;

    this.fireParticles.start();
  }

  private createTrailParticles(): void {
    this.trailParticles = new ParticleSystem("trailParticles", 200, this.scene);

    const smokeTexture = this.createSmokeTexture();
    this.trailParticles.particleTexture = smokeTexture;

    this.trailParticles.emitter = this.mesh;
    this.trailParticles.minEmitBox = new Vector3(-0.02, -0.02, -0.02);
    this.trailParticles.maxEmitBox = new Vector3(0.02, 0.02, 0.02);

    // Subtle smoke trail
    this.trailParticles.color1 = new Color4(1, 0.4, 0, 0.6);
    this.trailParticles.color2 = new Color4(0.5, 0.2, 0, 0.4);
    this.trailParticles.colorDead = new Color4(0.1, 0, 0, 0);

    this.trailParticles.minSize = 0.2;
    this.trailParticles.maxSize = 0.5;

    this.trailParticles.minLifeTime = 0.3;
    this.trailParticles.maxLifeTime = 0.6;

    this.trailParticles.emitRate = 100;

    this.trailParticles.minEmitPower = 0.1;
    this.trailParticles.maxEmitPower = 0.3;
    this.trailParticles.updateSpeed = 0.01;

    this.trailParticles.gravity = new Vector3(0, -0.5, 0);
    this.trailParticles.blendMode = ParticleSystem.BLENDMODE_ADD;

    this.trailParticles.minAngularSpeed = -1;
    this.trailParticles.maxAngularSpeed = 1;

    this.trailParticles.start();
  }

  private createFlareTexture(): DynamicTexture {
    const texture = new DynamicTexture("flare", 256, this.scene, false);
    const ctx = texture.getContext();

    // Radial gradient - bright center fading out
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, "rgba(255, 255, 255, 1)");
    gradient.addColorStop(0.3, "rgba(255, 200, 100, 0.8)");
    gradient.addColorStop(0.6, "rgba(255, 100, 0, 0.4)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    texture.update();

    return texture;
  }

  private createSmokeTexture(): DynamicTexture {
    const texture = new DynamicTexture("smoke", 256, this.scene, false);
    const ctx = texture.getContext();

    // Soft smoke gradient
    const gradient = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
    gradient.addColorStop(0, "rgba(200, 200, 200, 0.8)");
    gradient.addColorStop(0.5, "rgba(100, 100, 100, 0.4)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
    texture.update();

    return texture;
  }

  update(deltaTime: number): boolean {
    this.age += deltaTime;

    // Manual movement (no physics)
    this.mesh.position.addInPlace(this.velocity.scale(deltaTime));

    // Return false when lifetime expired (tells system to destroy this)
    if (this.age >= this.lifetime) {
      this.dispose();
      return false;
    }

    return true;
  }

  getPosition(): Vector3 {
    return this.mesh.position;
  }

  getMesh(): AbstractMesh {
    return this.mesh;
  }

  createImpactExplosion(): void {
    const explosion = new ParticleSystem("explosion", 500, this.scene);

    const explosionTexture = this.createFlareTexture();
    explosion.particleTexture = explosionTexture;

    explosion.emitter = this.mesh.position.clone();
    explosion.minEmitBox = new Vector3(-0.1, -0.1, -0.1);
    explosion.maxEmitBox = new Vector3(0.1, 0.1, 0.1);

    // Small explosion
    explosion.color1 = new Color4(1, 1, 0.8, 1); // Bright
    explosion.color2 = new Color4(1, 0.5, 0, 1); // Orange
    explosion.colorDead = new Color4(0.3, 0, 0, 0);

    explosion.minSize = 0.2;
    explosion.maxSize = 0.6;

    explosion.minLifeTime = 0.2;
    explosion.maxLifeTime = 0.5;

    explosion.emitRate = 500;
    explosion.minEmitPower = 3;
    explosion.maxEmitPower = 8;
    explosion.updateSpeed = 0.02;

    explosion.gravity = new Vector3(0, -2, 0);
    explosion.blendMode = ParticleSystem.BLENDMODE_ADD;

    explosion.minAngularSpeed = -3;
    explosion.maxAngularSpeed = 3;

    explosion.start();

    setTimeout(() => {
      explosion.stop();
      setTimeout(() => explosion.dispose(), 800);
    }, 60);
  }

  dispose(): void {
    this.fireParticles.stop();
    this.fireParticles.dispose();
    this.trailParticles.stop();
    this.trailParticles.dispose();
    this.aggregate.dispose();
    this.mesh.dispose();
  }
}
