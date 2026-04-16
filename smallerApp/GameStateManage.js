
export class GameStateManager {
    static #instance = null;
    #selected = null

    constructor(name) {
        if (GameStateManager.#instance) {
            throw new Error("Use getInstance")
        }
        this.name = name
        GameStateManager.#instance = this;

        this.gameState = new Map();
    }

    setSelected(piece) {
        if (this.#selected !== null) {
            this.#selected.onDeselected();
        }

        // Deselect on second selection. 
        if (this.#selected === piece) {
            this.#selected.onDeselected();
            this.#selected = null;

            return;
        }
        this.#selected = piece
        this.#selected.onSelected();
    }

    deselect() {
        if (this.#selected !== null) {
            this.#selected.onDeselected();
        }
    }

    static getInstance(name = "Default Instance") {
        if (!GameStateManager.#instance) {

            GameStateManager.#instance = new GameStateManager(name);
        }
        return GameStateManager.#instance;
    }
}