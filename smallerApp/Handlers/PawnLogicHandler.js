import { GameStateManager } from "../GameStateManage.js";
import { Square } from "../Square.js"
import { BoardLogicHandler } from "./BoardLogicHandler.js";

export class PawnLogicHandler {
    static #instance;

    constructor(name) {
        this.name = name;
        this.TAG = "PawnLogicHandler: "
        if (PawnLogicHandler.#instance) {
            //Throw error? 
            throw new Error("Error: Instantiation failed: Use KingLogicHandler.getInstance() instead of new.");
            return PawnLogicHandler.#instance;
        }
    }

    static getInstance(name = "Default Instance") {
        if (!PawnLogicHandler.#instance) {
            PawnLogicHandler.#instance = new PawnLogicHandler(name);
        }

        return PawnLogicHandler.#instance;
    }


    /**
     * Determines whether attmepted move is legal
     * @param {Square} fromSquare 
     * @param {Square} toSquare 
     * @returns true/false
     */
    handlePawnMove(fromSquare, toSquare) {

        console.log(this.TAG + `handling pawn move from ${fromSquare.position} to ${toSquare.position}`);

        let piece = fromSquare.piece;

        // console.log(this.TAG + `extracting piece:  `, piece);

        const fileCode = fromSquare.file.charCodeAt(0);
        const allowedFiles = [String.fromCharCode(fileCode - 1), fromSquare.file, String.fromCharCode(fileCode + 1)];

        const allowedRank = piece.color === "white" ? fromSquare.rank + 1 : fromSquare.rank - 1;

        const moves = this.getLegalPawnMoves(fromSquare, toSquare);

        fromSquare.piece.moves = moves;
        if (!moves.includes(toSquare)) {
            let moveCoords = moves.map((sqr) => sqr.position);
            console.log(this.TAG + `attempted move (${toSquare.position}) is not included in legal moves: `, moveCoords);
            return false;
        }

        return true;
    }

    /**
     *  Gets a list of all the legal pawn moves.
     *  Checks for empty squares and whether or not the pawn may double move. 
     * @param {Square} fromSquare 
     * @param {Square} toSquare 
     * @returns {Array<Square>}
     */
    getLegalPawnMoves(fromSquare, toSquare) {
        const piece = fromSquare.piece;
        const moves = [];

        let file = fromSquare.file

        // Single forward move: 
        let rank1 = piece.color === "white" ? fromSquare.rank + 1 : fromSquare.rank - 1

        let sqr1 = GameStateManager.getInstance().getSquare(file + rank1);

        if (BoardLogicHandler.isSquareEmpty(sqr1)) {
            moves.push(sqr1);
        }

        // Double forward move : 
        if (!piece.hasMoved) {
            const rank2 = piece.color === "white" ? fromSquare.rank + 2 : fromSquare.rank - 2
            const sqr2 = GameStateManager.getInstance().getSquare(file + rank2);

            if (BoardLogicHandler.isSquareEmpty(sqr2)) {
                moves.push(sqr2);
            }
        }


        const controlledSqrs = this.getControlledSquares(fromSquare);
        //TODO: handle undefined 

        if (this.canCapture(fromSquare, toSquare)) {
            // Checks if there is a piece on the square and if the piece is a different color. 
            moves.push(toSquare);
        }

        console.log(this.TAG + `finished handling Pawn move request. Got legal moves: `, moves);

        return moves;
    }

    setPawnMoves(fromSquare) {

    }

    /**
     * getControlledSquares, calculates squares that are controlled by the pawn. 
     * (squares that it could attack if there is a piece on)
     * This also validates the controlled square to make sure they are on the board.
     * @param {Square} fromSquare 
     */
    getControlledSquares(fromSquare) {
        const piece = fromSquare.piece;
        const file = fromSquare.file;
        const rank = piece.color === "white" ? fromSquare.rank + 1 : fromSquare.rank - 1;
        const controlledSqrs = [];

        if (!BoardLogicHandler.validateRank(rank)) {
            // For no valid ranks it would mean that it is promoting... 
            // TODO: add Promotion
            return [];
        }
        const fileCode = file.charCodeAt(0);

        if (BoardLogicHandler.validateFile(fileCode + 1)) {
            const controlledSqr1 = String.fromCharCode(fileCode + 1) + rank
            controlledSqrs.push(controlledSqr1);

        }

        if (BoardLogicHandler.validateFile(fileCode - 1)) {
            const controlledSqr2 = String.fromCharCode(fileCode - 1) + rank
            controlledSqrs.push(controlledSqr1);
        }

        return controlledSqrs;

    }

    /**
     * Checks if there is a piece on the target Square,
     * and if it is the piece is on the opposite team (color)
     * 
     * @param {Square} fromSquare 
     * @param {Square} toSquare 
     * @returns 
     */
    canCapture(fromSquare, toSquare) {
        if (toSquare === null) return false;
        const piece = fromSquare.piece;

        if (BoardLogicHandler.isSquareEmpty(toSquare)) {
            // No piece on this square. 
            return false;
        } else { // square has piece.

            if (toSquare.piece.color === piece.color) {
                // Same color piece, cannot capture. 
                return false;
            }
            const attackedSquares = this.getControlledSquares(fromSquare);

            if (attackedSquares.includes(toSquare)) {

            }

        }

        return true;
    }


    calculateEnPassant(fromSquare, toSquare) {

    }


}