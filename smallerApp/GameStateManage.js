
export class GameStateManager {
    static #instance = null;

    constructor(name) {
        if (GameStateManager.#instance) {
            throw new Error("Use getInstance")
        }
        this.name = name
        GameStateManager.#instance = this;

        this.gameState = new Map();

        this.selected = null

    }

    static getInstance(name = "Default Instance") {
        if (!GameStateManager.#instance) {

            GameStateManager.#instance = new GameStateManager(name);
        }
        return GameStateManager.#instance;
    }
}