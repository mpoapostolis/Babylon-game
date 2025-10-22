import { Scene, Vector3 } from "@babylonjs/core";
import { Fireball } from "./fireball";
import { Enemy } from "./enemy";
import type { PlayerController } from "./player";

export class CombatSystem {
  private scene: Scene;
  private fireballs: Fireball[] = [];
  private enemies: Enemy[] = [];
  private player: PlayerController;
  private selectedEnemy: Enemy | null = null;

  constructor(scene: Scene, player: PlayerController) {
    this.scene = scene;
    this.player = player;
  }

  setSelectedEnemy(enemy: Enemy | null): void {
    // Deselect previous enemy
    if (this.selectedEnemy) {
      this.selectedEnemy.setSelected(false);
    }

    // Select new enemy
    this.selectedEnemy = enemy;
    if (this.selectedEnemy) {
      this.selectedEnemy.setSelected(true);
    }
  }

  shootFireball(position: Vector3, direction: Vector3): void {
    // Offset spawn position forward so it doesn't hit player
    const spawnPos = position.add(direction.scale(1));
    const fireball = new Fireball(this.scene, spawnPos, direction);
    this.fireballs.push(fireball);
  }

  spawnEnemy(position: Vector3): Enemy {
    const enemy = new Enemy(this.scene, position);
    this.enemies.push(enemy);
    return enemy;
  }

  update(deltaTime: number): void {
    // Update fireballs and remove expired ones
    this.fireballs = this.fireballs.filter((fireball) => {
      const alive = fireball.update(deltaTime);
      if (!alive) {
        fireball.dispose();
      }
      return alive;
    });

    // Check collisions
    this.checkCollisions();

    // Remove dead enemies
    this.enemies = this.enemies.filter((enemy) => enemy.isAlive());
  }

  private checkCollisions(): void {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fireball = this.fireballs[i];
      const fireballPos = fireball.getPosition();

      for (const enemy of this.enemies) {
        if (!enemy.isAlive()) continue;

        const enemyPos = enemy.getPosition();
        const distance = Vector3.Distance(fireballPos, enemyPos);

        // Hit detection (within 0.5 units)
        if (distance < 0.5) {
          // Deal damage
          enemy.takeDamage(50);

          // Create impact explosion
          fireball.createImpactExplosion();

          // Remove fireball
          fireball.dispose();
          this.fireballs.splice(i, 1);
          break;
        }
      }
    }
  }

  getEnemies(): Enemy[] {
    return this.enemies;
  }

  dispose(): void {
    this.fireballs.forEach((f) => f.dispose());
    this.enemies.forEach((e) => e.dispose());
    this.fireballs = [];
    this.enemies = [];
  }
}
