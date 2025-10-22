import type { DialogueLine } from "./npc";

export class DialogueUI {
  private container: HTMLElement;
  private textElement: HTMLElement;
  private speakerElement: HTMLElement;
  private promptElement: HTMLElement;
  private closeButton: HTMLElement;
  private isVisible = false;
  private closeCallback: (() => void) | null = null;

  constructor() {
    this.container = document.getElementById("dialogue-container")!;
    this.textElement = document.getElementById("dialogue-text")!;
    this.speakerElement = document.getElementById("dialogue-speaker")!;
    this.promptElement = document.getElementById("interaction-prompt")!;
    this.closeButton = document.getElementById("dialogue-close-btn")!;

    // Add click handler for close button
    this.closeButton.addEventListener("click", () => {
      this.hide();
      if (this.closeCallback) {
        this.closeCallback();
      }
    });
  }

  setCloseCallback(callback: () => void): void {
    this.closeCallback = callback;
  }

  show(dialogue: DialogueLine): void {
    this.speakerElement.textContent = dialogue.speaker;
    this.textElement.textContent = dialogue.text;
    this.container.classList.remove("hidden");
    this.container.classList.add("flex");
    this.isVisible = true;
  }

  hide(): void {
    this.container.classList.add("hidden");
    this.container.classList.remove("flex");
    this.isVisible = false;
  }

  showPrompt(npcName: string): void {
    this.promptElement.textContent = `Press E to talk to ${npcName}`;
    this.promptElement.classList.remove("hidden");
  }

  hidePrompt(): void {
    this.promptElement.classList.add("hidden");
  }

  isShowing(): boolean {
    return this.isVisible;
  }

  dispose(): void {
    this.hide();
    this.hidePrompt();
  }
}
