export const CONFIG = {
  GRAVITY: -15,

  PLAYER: {
    HEIGHT: 1.8,
    RADIUS: 0.4,
    JUMP_HEIGHT: 3.0,
    WALK_SPEED: 3,
    RUN_SPEED: 6,
    ROTATION_SPEED: 0.15,
    ACCELERATION: 20, // Speed gain per second
    DECELERATION: 15, // Speed loss per second
    GROUND_FRICTION: 0.9, // Multiplier to slow down horizontal movement
    MASS: 80,
    FRICTION: 100.0,
    RESTITUTION: 0.0,
    LINEAR_DAMPING: 0.0,
    ANGULAR_DAMPING: 10.0,
  },

  CAMERA: {
    INITIAL_ALPHA: -Math.PI / 2,
    INITIAL_BETA: Math.PI / 2.5,
    INITIAL_RADIUS: 8,
    MIN_RADIUS: 2,
    MAX_RADIUS: 15,
    WHEEL_DELTA: 0.01,
    FOLLOW_SPEED: 0.1,
    OFFSET_Y: 1.5,
  },

  ANIMATION: {
    BLEND_SPEED: 0.15,
  },

  GROUND_CHECK: {
    RAY_OFFSET: 0.05,
    RAY_LENGTH: 0.15,
    RADIUS_MULTIPLIER: 0.7,
    NUM_RAYS: 5, // Number of rays for better detection
  },

  WORLD: {
    DUNGEON_SCALE: 0.005,
    DUNGEON_POSITION: { x: 13, y: 0, z: -39 },
    STATIC_FRICTION: 0.5,
    STATIC_RESTITUTION: 0,
  },

  DEBUG: {
    SHOW_RAYS: false,
    SHOW_PHYSICS: false,
  },
} as const;

// Derived constants
export const JUMP_VELOCITY = Math.sqrt(
  2 * Math.abs(CONFIG.GRAVITY) * CONFIG.PLAYER.JUMP_HEIGHT
);
