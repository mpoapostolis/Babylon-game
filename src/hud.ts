import type { Enemy } from "./enemy";

export class HUD {
  private hpBar: HTMLElement;
  private hpText: HTMLElement;
  private limitBar: HTMLElement;
  private limitText: HTMLElement;
  private cooldownContainer: HTMLElement;
  private targetPanel: HTMLElement;
  private targetHpBar: HTMLElement;
  private targetHpText: HTMLElement;
  private enemyCount: HTMLElement;

  constructor() {
    // Get DOM elements
    this.hpBar = document.getElementById("hp-bar")!;
    this.hpText = document.getElementById("hp-text")!;
    this.limitBar = document.getElementById("limit-bar")!;
    this.limitText = document.getElementById("limit-text")!;
    this.cooldownContainer = document.getElementById("cooldown-container")!;
    this.targetPanel = document.getElementById("target-panel")!;
    this.targetHpBar = document.getElementById("target-hp-bar")!;
    this.targetHpText = document.getElementById("target-hp-text")!;
    this.enemyCount = document.getElementById("enemy-count")!;
  }

  updateHealth(current: number, max: number): void {
    const percent = (current / max) * 100;
    this.hpBar.style.width = `${percent}%`;
    this.hpText.textContent = `${Math.ceil(current)}`;

    // Clean color transitions like Elden Ring
    if (percent > 50) {
      this.hpBar.style.background = "linear-gradient(to right, #dc2626 0%, #b91c1c 100%)";
    } else if (percent > 25) {
      this.hpBar.style.background = "linear-gradient(to right, #f59e0b 0%, #d97706 100%)";
    } else {
      this.hpBar.style.background = "linear-gradient(to right, #dc2626 0%, #7f1d1d 100%)";
    }
  }

  updateCooldown(current: number, max: number): void {
    if (current > 0) {
      const percent = ((max - current) / max) * 100;
      this.cooldownContainer.style.opacity = "1";
      this.limitBar.style.width = `${percent}%`;
      this.limitText.textContent = `${current.toFixed(1)}s`;
    } else {
      this.cooldownContainer.style.opacity = "0";
      this.limitBar.style.width = "100%";
      this.limitText.textContent = "Ready";
    }
  }

  updateTarget(enemy: Enemy | null): void {
    if (enemy && enemy.isAlive()) {
      this.targetPanel.classList.remove("hidden");

      const health = enemy.getHealth();
      const maxHealth = enemy.getMaxHealth();
      const percent = (health / maxHealth) * 100;

      this.targetHpBar.style.width = `${percent}%`;
      this.targetHpText.textContent = `${Math.ceil(health)}`;

      // Clean enemy health bar colors
      if (percent > 50) {
        this.targetHpBar.style.background = "linear-gradient(to right, #dc2626 0%, #b91c1c 100%)";
      } else if (percent > 25) {
        this.targetHpBar.style.background = "linear-gradient(to right, #f59e0b 0%, #d97706 100%)";
      } else {
        this.targetHpBar.style.background = "linear-gradient(to right, #dc2626 0%, #7f1d1d 100%)";
      }
    } else {
      this.targetPanel.classList.add("hidden");
    }
  }

  updateEnemyCount(count: number): void {
    this.enemyCount.textContent = count.toString();
  }

  dispose(): void {
    // Nothing to dispose with DOM elements
  }
}
