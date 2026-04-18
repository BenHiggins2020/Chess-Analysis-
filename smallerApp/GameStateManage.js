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

        //Handle King stuff: 
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

        // Check if the piece on this square threatens the opposite king? 
        // Threatens means, that the piece can move to a square that the king can also move (or is on). 
        // Take moves away from the king. 
        // Check if the king is in Check. 

        const moves = this.calculateMovesForPieceOnSquare(square); // attacking piece moves from square... 
        // console.log(this.TAG + `moves =  `, moves);

        switch (square.piece.color) {
            case 'black':
                console.log(this.TAG + ` Black's ${square.piece.type} on ${square.position} `)

                const kingSquare = this.gameState.get(this.whiteKingPos)
                if (moves.includes(
                    (kingSquare)
                )) {
                    console.warn(this.TAG + ` CHECK!!! `)
                    this.setChecked('white');
                    // Check!!
                }

                // Calculate the moves for king. 
                this.whiteKingMoves = calculateKingMoves(this.gameState.get(this.whiteKingPos));
                const initialWhiteKingMovesCount = this.whiteKingMoves.length;

                this.whiteKingMoves.forEach((sqr) => {

                    console.log(this.TAG + `checking white king move: ${sqr.position} against list of Checking piece moves: ${moves.includes(sqr)}`)

                    if (moves.includes(sqr)) {
                        console.log(this.TAG + `removing white king move: ${sqr.position} from legal moves, because it is threatened by piece on ${square.position}`)
                        this.whiteKingMoves = this.whiteKingMoves.filter((value, index, moves) => {
                            !moves.includes(value)
                        })
                    }
                })

                this.gameState.get(this.whiteKingPos).piece.moves = this.whiteKingMoves; // update the king moves in the piece object.
                console.log(this.TAG + `filtered white king moves: ${this.whiteKingMoves.length} of ${initialWhiteKingMovesCount}`)

                // check for threats 
                break;
            case 'white':
                console.log(this.TAG + ` White's ${square.piece.type} on ${square.position} `)
                if (moves.includes((this.gameState.get(this.blackKingMoves)))) {
                    // Check!!
                    console.warn(this.TAG + ` CHECK!!! `)
                    this.setChecked('black');
                }
                this.blackKingMoves = calculateKingMoves(this.gameState.get(this.blackKingPos));
                const initialBlackKingMovesCount = this.blackKingMoves.length;
                this.blackKingMoves.forEach((sqr) => {

                    console.log(this.TAG + `checking black king move: ${sqr.position} against list of Checking piece moves: ${moves.includes(sqr)}`)

                    if (moves.includes(sqr)) {
                        this.blackKingMoves = this.blackKingMoves.filter((value, index, moves) => {
                            !moves.includes(value)
                        })

                        console.log(this.TAG + `filtered blackKingMoves moves: ${this.blackKingMoves.length} of 8`)

                        this.blackKingMoves.forEach((move) => {
                            console.log(this.TAG + `black king moves: ${move.position}`)
                        })
                    }
                })
                this.gameState.get(this.blackKingPos).piece.moves = this.blackKingMoves; // update the king moves in the piece object.
                console.log(this.TAG + `filtered black king moves: ${this.blackKingMoves.length} of ${initialBlackKingMovesCount}`)
                // check for threats on black... 
                break;
        }
    }

    calculateMovesForPieceOnSquare(square) {
        let moves = []
        switch (square.piece.type.toString().toUpperCase()) {
            case "P":
                moves = calculatePawnMoves(square);
                // console.log(this.TAG + `moves: ${moves} `, result)
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
        // console.log(this.TAG + `calculated moves: ${moves.length}`)
        return moves;
    }

    setChecked(color) {
        // set the king of this color to checked.
        this.checked = color;
        //Disable all moves that do not get the king out of check.

        // King gets out of check by, moving to a square that is not threatened,
        //  blocking the check with another piece,
        //  or capturing the checking piece.


    }
}