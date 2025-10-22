import type { AnimationGroup, Scene, AbstractMesh, PhysicsBody } from "@babylonjs/core";

export enum PlayerState {
  IDLE = "IDLE",
  WALKING = "WALKING",
  RUNNING = "RUNNING",
  JUMPING = "JUMPING",
  FALLING = "FALLING",
  LANDING = "LANDING",
  ATTACKING = "ATTACKING",
}

export interface PlayerData {
  capsule: AbstractMesh;
  mesh: AbstractMesh;
  body: PhysicsBody;
  animations: Map<string, AnimationGroup>;
  state: PlayerState;
  targetRotation: number;
  isGrounded: boolean;
  jumpLatch: boolean;
  currentSpeed: number; // Current horizontal speed
}

export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  run: boolean;
}

export interface MovementData {
  direction: { x: number; z: number };
  speed: number;
  yVelocity: number;
}
