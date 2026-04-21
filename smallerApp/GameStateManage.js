import { getChess } from "./chessEngine.js";

export class GameStateManager {
    static #instance = null;
    #selectedSquare = null;

    constructor(name) {
        this.TAG = "GameStateManager: ";
        if (GameStateManager.#instance) {
            throw new Error("Use getInstance");
        }
        this.name = name;
        GameStateManager.#instance = this;

        this.gameState = new Map();
    }

    setSelected(square) {
        const piece = square.piece;
        if (!piece) {
            return;
        }

        if (this.#selectedSquare === square) {
            this.deselect();
            return;
        }

        this.deselect();

        this.#selectedSquare = square;
        this.calculateMovesForPieceOnSquare(square);
        if (!piece.moves.length) {
            this.#selectedSquare = null;
            return;
        }
        square.UI_ref.classList.add("square--selected");
        piece.onSelected();
    }

    deselect() {
        if (this.#selectedSquare?.piece) {
            this.#selectedSquare.piece.onDeselected();
        }
        if (this.#selectedSquare) {
            this.#selectedSquare.UI_ref.classList.remove("square--selected");
            this.#selectedSquare = null;
        }
    }

    static getInstance(name = "Default Instance") {
        if (!GameStateManager.#instance) {
            GameStateManager.#instance = new GameStateManager(name);
        }
        return GameStateManager.#instance;
    }

    calculateMovesForPieceOnSquare(square) {
        const piece = square.piece;
        if (!piece) {
            return [];
        }
        const chess = getChess();
        const side = piece.color === "white" ? "w" : "b";
        if (chess.turn() !== side) {
            piece.moves = [];
            return [];
        }
        const raw = chess.moves({ square: square.position, verbose: true });
        const moves = raw.map((m) => this.gameState.get(m.to));
        piece.moves = moves;
        return moves;
    }
}
