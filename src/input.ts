import { Scene, KeyboardEventTypes } from "@babylonjs/core";
import type { InputState } from "./types";

export class InputManager {
  private inputMap: Record<string, boolean> = {};
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
    this.setupKeyboardListeners();
  }

  private setupKeyboardListeners(): void {
    this.scene.onKeyboardObservable.add((kbInfo) => {
      const key = kbInfo.event.key.toLowerCase();
      this.inputMap[key] = kbInfo.type === KeyboardEventTypes.KEYDOWN;
    });
  }

  getInputState(): InputState {
    return {
      forward: this.inputMap["w"] || false,
      backward: this.inputMap["s"] || false,
      left: this.inputMap["a"] || false,
      right: this.inputMap["d"] || false,
      jump: this.inputMap[" "] || false,
      run: this.inputMap["shift"] || false,
    };
  }

  isKeyPressed(key: string): boolean {
    return this.inputMap[key.toLowerCase()] || false;
  }

  dispose(): void {
    this.inputMap = {};
  }
}
