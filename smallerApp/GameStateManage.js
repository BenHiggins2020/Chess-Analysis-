import { calculateKingMoves, calculateKnightMoves, calculatePawnMoves, calculateQueenMoves, calculateRookMoves, calculateBishopPath } from "./MoveHandler.js";

export class GameStateManager {
    static #instance = null;
    #selected = null

    constructor(name) {
        this.TAG = "GameStateManager: "
        if (GameStateManager.#instance) {
            throw new Error("Use getInstance")
        }
        this.name = name
        GameStateManager.#instance = this;
        this.blackKingMoves = [];
        this.blackKingPos = 'e8';
        this.whiteKingMoves = [];
        this.whiteKingPos = 'e1';
        this.gameState = new Map();
    }


    setSelected(square) {
        console.log(this.TAG + `square: `, square);

        const piece = square.piece;

        // selecting a new piece, deselect. 
        if (this.#selected !== null) {
            this.#selected.onDeselected();
        }

        // Deselect on second selection. 
        if (this.#selected === piece) {
            this.deselect();
            return;
        }

        console.log(this.TAG + `selecting: ${piece.type} on ${square.position}`)
        this.#selected = piece
        this.#selected.onSelected();
    }

    deselect() {
        if (this.#selected !== null) {
            console.log(this.TAG + `deselecting: ${this.#selected.type}`)
            this.#selected.onDeselected();
            this.#selected = null;
        }
    }

    static getInstance(name = "Default Instance") {
        if (!GameStateManager.#instance) {

            GameStateManager.#instance = new GameStateManager(name);
        }
        return GameStateManager.#instance;
    }

    updateKingSquares(square) {
        //square is the new square the king is on... 
        const kingMoves = []
        calculateKingMoves(square).forEach((sqr) => {
            kingMoves.push(sqr.position)
        });

        switch (square.piece.color) {
            case "white":
                this.whiteKingPos = square.position;
                this.whiteKingMoves = kingMoves;
                break;
            case "black":
                this.blackKingPos = square.position;
                this.blackKingMoves = kingMoves;
                break;
        }


    }

    // After a move, check if it threatens king.
    // the square paramter should be for a new piece...  
    checkForThreats(square) {

        let moves = calculateMovesForPiece(square.piece);

        switch (square.piece.color) {
            case 'white':
                if (moves.includes((this.gameState.get(this.whiteKingPos)))) {
                    // Check!!
                }
                this.whiteKingMoves.forEach((pos) => {
                    if (moves.includes(this.gameState.get(pos))) {
                        this.whiteKingMoves.filter((value, index, moves) => {
                            !moves.includes(value)
                        })

                        console.log(TAG + `filtered whiteking moves: ${this.whiteKingMoves}`)

                        this.whiteKingMoves.forEach((move) => {

                        })

                    }
                })

                // check for threats 
                break;
            case ' black':

                if (moves.includes((this.gameState.get(this.blackKingMoves)))) {
                    // Check!!
                }
                this.blackKingMoves.forEach((pos) => {
                    if (moves.includes(this.gameState.get(pos))) {
                        this.blackKingMoves.filter((value, index, moves) => {
                            !moves.includes(value)
                        })

                        console.log(TAG + `filtered blackKingMoves moves: ${this.blackKingMoves.length} of 8`)

                        this.blackKingMoves.forEach((move) => {
                            console.log(TAG + `black king moves: ${move.position}`)
                        })

                    }
                })
                // check for threats on white... 
                break;
        }
    }

    calculateMovesForPieceOnSquare(square) {
        let moves = []
        switch (square.piece.type.toString().toUpperCase()) {
            case "P":
                moves = calculatePawnMoves(square);
                break;
            case "K":
                moves = calculateKingMoves(square);
                break;
            case "B":
                moves = calculateBishopPath(square);
                break;
            case "Q":
                moves = calculateQueenMoves(square);
                break;
            case "R":
                moves = calculateRookMoves(square);
                break;
            case "N":
                moves = calculateKnightMoves(square);
                break;
        }

        return moves;
    }
}