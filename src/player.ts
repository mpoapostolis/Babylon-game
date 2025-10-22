import {
  Scene,
  Vector3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  Scalar,
  Axis,
  type AbstractMesh,
  type ArcRotateCamera,
  type AnimationGroup,
} from "@babylonjs/core";
import { CONFIG, JUMP_VELOCITY } from "./config";
import { PlayerState, type PlayerData, type InputState } from "./types";

export class PlayerController {
  private player: PlayerData;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private currentAnim: AnimationGroup | null = null;
  private attackCallback:
    | ((position: Vector3, direction: Vector3) => void)
    | null = null;
  private attackCooldown = 0;
  private maxAttackCooldown = 0.5;
  private targetPosition: Vector3 | null = null;
  private health = 100;
  private maxHealth = 100;

  // Reusable vectors for performance
  private readonly cameraForward = Vector3.Zero();
  private readonly cameraRight = Vector3.Zero();
  private readonly moveDirection = Vector3.Zero();
  private readonly tempVec = Vector3.Zero();

  constructor(
    scene: Scene,
    camera: ArcRotateCamera,
    playerMesh: AbstractMesh,
    animations: AnimationGroup[]
  ) {
    this.scene = scene;
    this.camera = camera;
    this.player = this.initializePlayer(playerMesh, animations);
  }

  setAttackCallback(
    callback: (position: Vector3, direction: Vector3) => void
  ): void {
    this.attackCallback = callback;
  }

  setTarget(targetPosition: Vector3 | null): void {
    this.targetPosition = targetPosition;
  }

  private initializePlayer(
    playerMesh: AbstractMesh,
    animations: AnimationGroup[]
  ): PlayerData {
    const capsule = MeshBuilder.CreateCapsule(
      "playerCollider",
      {
        height: CONFIG.PLAYER.HEIGHT,
        radius: CONFIG.PLAYER.RADIUS,
      },
      this.scene
    );
    capsule.position.set(0, 5, 0);
    capsule.isVisible = false;

    const aggregate = new PhysicsAggregate(
      capsule,
      PhysicsShapeType.CAPSULE,
      {
        mass: CONFIG.PLAYER.MASS,
        friction: CONFIG.PLAYER.FRICTION,
        restitution: CONFIG.PLAYER.RESTITUTION,
      },
      this.scene
    );

    const body = aggregate.body;
    body.setMassProperties({ inertia: Vector3.ZeroReadOnly });
    body.setAngularDamping(CONFIG.PLAYER.ANGULAR_DAMPING);
    body.setLinearDamping(CONFIG.PLAYER.LINEAR_DAMPING);

    playerMesh.parent = capsule;
    playerMesh.position.set(0, -CONFIG.PLAYER.HEIGHT / 2, 0);

    const animMap = new Map<string, AnimationGroup>();
    animations.forEach((group) => {
      group.stop();
      group.enableBlending = true;
      group.blendingSpeed = CONFIG.ANIMATION.BLEND_SPEED;
      animMap.set(group.name.toLowerCase(), group);
    });

    this.currentAnim = animMap.get("idle") || null;
    this.currentAnim?.start(true);

    return {
      capsule,
      mesh: playerMesh,
      body,
      animations: animMap,
      state: PlayerState.IDLE,
      targetRotation: 0,
      isGrounded: true,
      jumpLatch: false,
      currentSpeed: 0,
    };
  }

  update(deltaTime: number, input: InputState): void {
    const currentVel = this.player.body.getLinearVelocity() || Vector3.Zero();
    const yVel = currentVel.y;

    // Update cooldowns
    if (this.attackCooldown > 0) {
      this.attackCooldown -= deltaTime;
    }

    // Grounded = Y velocity near zero (simple and accurate)
    const isGrounded = Math.abs(yVel) < 0.5;
    this.player.isGrounded = isGrounded;

    // Update camera direction vectors
    this.updateCameraDirections();

    // Handle attack
    if (input.attack && this.attackCooldown <= 0 && this.player.isGrounded) {
      this.attack();
    }

    // Calculate movement
    this.calculateMovementDirection(input);
    const isMoving = this.moveDirection.lengthSquared() > 0.001;

    // Animations
    this.updateAnimations(yVel, isMoving, input.run);

    // Apply movement
    this.applyMovement(input, isMoving, currentVel);

    // Camera
    this.updateCamera();
  }

  private attack(): void {
    // No target selected
    if (!this.targetPosition) return;

    this.attackCooldown = this.maxAttackCooldown;

    // Shoot position from chest height
    const shootPos = this.player.capsule.position.add(new Vector3(0, 0.8, 0));

    // Calculate direction to target
    const direction = this.targetPosition.subtract(shootPos).normalize();

    // Play attack animation if available
    const attackAnim = this.player.animations.get("attack");
    if (attackAnim) {
      attackAnim.stop();
      attackAnim.start(false); // Play once
      setTimeout(() => {
        if (this.attackCallback) {
          this.attackCallback(shootPos, direction);
        }
      }, 500);
    } else {
      // No animation, shoot immediately
      if (this.attackCallback) {
        this.attackCallback(shootPos, direction);
      }
    }
  }

  private updateCameraDirections(): void {
    // Get camera forward and right vectors
    this.camera
      .getDirection(Vector3.Forward())
      .normalizeToRef(this.cameraForward);
    this.cameraForward.y = 0;
    this.cameraForward.normalize();

    Vector3.CrossToRef(Axis.Y, this.cameraForward, this.cameraRight);
    this.cameraRight.normalize();
  }

  private calculateMovementDirection(input: InputState): void {
    this.moveDirection.set(0, 0, 0);

    if (input.forward) this.moveDirection.addInPlace(this.cameraForward);
    if (input.backward) this.moveDirection.subtractInPlace(this.cameraForward);
    if (input.left) this.moveDirection.subtractInPlace(this.cameraRight);
    if (input.right) this.moveDirection.addInPlace(this.cameraRight);
  }

  private updateAnimations(
    yVel: number,
    isMoving: boolean,
    isRunning: boolean
  ): void {
    let newState: PlayerState;

    // NOT GROUNDED = AIR ANIMATIONS ONLY
    if (!this.player.isGrounded) {
      if (yVel > 0) {
        newState = PlayerState.JUMPING;
      } else {
        newState = PlayerState.FALLING;
      }
    }
    // GROUNDED = GROUND ANIMATIONS
    else {
      if (isMoving) {
        this.player.mesh.rotation.y = -this.camera.alpha - Math.PI / 2;

        newState = isRunning ? PlayerState.RUNNING : PlayerState.WALKING;
      } else {
        newState = PlayerState.IDLE;
      }
    }

    if (this.player.state !== newState) {
      this.changeAnimation(newState);
    }
  }

  private changeAnimation(newState: PlayerState): void {
    const animConfig: Record<PlayerState, { name: string; loop: boolean }> = {
      [PlayerState.IDLE]: { name: "idle", loop: true },
      [PlayerState.WALKING]: { name: "walk", loop: true },
      [PlayerState.RUNNING]: { name: "run", loop: true },
      [PlayerState.JUMPING]: { name: "jump", loop: false },
      [PlayerState.FALLING]: { name: "fall", loop: true },
      [PlayerState.LANDING]: { name: "land", loop: false },
      [PlayerState.ATTACKING]: { name: "attack", loop: false },
    };

    const config = animConfig[newState];
    const newAnim = this.player.animations.get(config.name);

    if (newAnim && newAnim !== this.currentAnim) {
      this.currentAnim?.stop();
      newAnim.start(config.loop);
      this.currentAnim = newAnim;
      this.player.state = newState;
    }
  }

  private applyMovement(
    input: InputState,
    isMoving: boolean,
    currentVel: Vector3
  ): void {
    let yVel = currentVel.y;

    // Jump
    if (input.jump && !this.player.jumpLatch && this.player.isGrounded) {
      yVel = JUMP_VELOCITY;
      this.player.jumpLatch = true;
    } else if (!input.jump) {
      this.player.jumpLatch = false;
    }

    // Horizontal movement with smooth acceleration
    const targetSpeed = input.run
      ? CONFIG.PLAYER.RUN_SPEED
      : CONFIG.PLAYER.WALK_SPEED;

    if (isMoving) {
      // Accelerate
      this.player.currentSpeed = Math.min(
        this.player.currentSpeed + CONFIG.PLAYER.ACCELERATION * (1 / 60),
        targetSpeed
      );

      // Normalize and scale movement direction
      this.moveDirection.normalize();
      this.moveDirection.scaleToRef(this.player.currentSpeed, this.tempVec);

      // Smooth lerp for butter-smooth movement
      const smoothX = Scalar.Lerp(currentVel.x, this.tempVec.x, 0.2);
      const smoothZ = Scalar.Lerp(currentVel.z, this.tempVec.z, 0.2);
      // Set velocity
      this.player.body.setLinearVelocity(new Vector3(smoothX, yVel, smoothZ));
    } else {
      // Decelerate
      this.player.currentSpeed = Math.max(
        this.player.currentSpeed - CONFIG.PLAYER.DECELERATION * (1 / 60),
        0
      );

      // Apply friction
      if (this.player.isGrounded) {
        this.player.currentSpeed *= CONFIG.PLAYER.GROUND_FRICTION;
        if (this.player.currentSpeed < 0.1) {
          this.player.currentSpeed = 0;
        }
      }

      // Smooth deceleration
      const newX = currentVel.x * 0.85;
      const newZ = currentVel.z * 0.85;
      this.player.body.setLinearVelocity(new Vector3(newX, yVel, newZ));

      // Face camera direction when idle (like reference code)
      // camera.alpha is the horizontal rotation angle
    }
  }

  private updateCamera(): void {
    const targetPos = this.player.capsule.position.add(
      new Vector3(0, CONFIG.CAMERA.OFFSET_Y, 0)
    );

    this.camera.target = Vector3.Lerp(
      this.camera.target,
      targetPos,
      CONFIG.CAMERA.FOLLOW_SPEED
    );
  }

  getCapsule(): AbstractMesh {
    return this.player.capsule;
  }

  getHealth(): number {
    return this.health;
  }

  getMaxHealth(): number {
    return this.maxHealth;
  }

  getAttackCooldown(): number {
    return this.attackCooldown;
  }

  getMaxAttackCooldown(): number {
    return this.maxAttackCooldown;
  }

  takeDamage(amount: number): void {
    this.health = Math.max(0, this.health - amount);
  }

  dispose(): void {
    this.player.animations.forEach((anim) => anim.dispose());
    this.player.capsule.dispose();
  }
}
