/**
 * Chessboard class just manages the UI state. 
 * 
 */

import { handlePawnMove } from "./MoveHandler.js";
import { GameStateManager } from "./GameStateManage.js"
import { Square } from "./Square.js";
import { Piece } from "./Piece.js";

export class Chessboard {

    // 8 files, 8 ranks
    constructor() {
        this.TAG = "Chessboard.js -> "
        this.gameStateManager = GameStateManager.getInstance();
        this.gameState = this.gameStateManager.gameState;

        this.generateChessboard();
        this.setPieces();
    }

    generateChessboard = () => {
        console.log(this.TAG + "Generating chessboard...");
        // const chessboard = document.getElementById('chessboard-container');
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
        for (let rank of ranks) {
            for (let file of files) {
                const squareObj = new Square(file, rank, this);
                const squareName = squareObj.file + squareObj.rank;
                this.gameState.set(
                    squareName,
                    squareObj
                );
            }
        }
    }

    handleMove = (fromCoord, toCoord) => {
        if (fromCoord === toCoord) {
            console.error(this.TAG + "Cannot move to the same square: " + fromCoord);
            return;
        }

        console.log(this.TAG + `Moving piece from ${fromCoord} to ${toCoord}`);

        const fromSquare = this.gameState.get(fromCoord);
        const toSquare = this.gameState.get(toCoord);

        if (!fromSquare || !toSquare) {
            console.error(this.TAG + `Invalid move from ${fromSquare} to ${toSquare}`);
            return;
        }

        const piece = fromSquare.piece;

        try {

            if (piece.canMoveTo(fromSquare, toSquare, this)) {
                // Move the piece
                console.log(this.TAG + `can move, setting and removing... `);

            } else {
                console.error(this.TAG + `Invalid move for piece ${piece.type} from ${fromCoord} to ${toCoord}`);
                return; // Do nothing if the move is invalid
            }
        }
        catch (error) {
            console.error(this.TAG + `Error during move: ${error}`);
        }



        fromSquare.render();
        toSquare.render();

        //update gamestate: 
        // console.log(this.TAG + "Updating game state after move...");

        this.gameState.get(fromSquare.position).removePiece()
        this.gameState.get(toSquare.position).setPiece(piece); // Set the piece on the new square in the game state
        GameStateManager.getInstance().deselect();

        // this.gameState.get(fromSquare.position).piece = null; // Clear the piece from the original square in the game state
        // this.gameState.get(toSquare.position).piece = piece; // Set the piece on the new square in the game state
        // console.log(this.TAG + "Updated game state after move: ", ((fromSquare)));
        // console.log(this.TAG + "Updated game state after move: ", this.gameState.get((fromSquare.position)));

    }

    setPieces = () => {
        if (this.gameState.size === 0) {
            console.error(this.TAG + "Game state is empty. Cannot set pieces.");
            return;
        }

        // Set Pawns: Rank 2
        let rank = 2;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('P', 'w', this);
            const square = this.gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        rank = 7;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('p', 'b', this);
            const square = this.gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        let rookPositions = ['a1', 'h1']
        for (let pos of rookPositions) {
            const piece = new Piece('R', 'w', this);
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        rookPositions = ['a8', 'h8']
        for (let pos of rookPositions) {
            const piece = new Piece('r', 'b', this);
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        let knightPositions = ['b1', 'g1']
        for (let pos of knightPositions) {
            const piece = new Piece('N', 'w', this);
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        knightPositions = ['b8', 'g8']
        for (let pos of knightPositions) {
            const piece = new Piece('n', 'b', this);
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        let bishopPositions = ['c1', 'f1']
        for (let pos of bishopPositions) {
            const piece = new Piece('B', 'w', this);
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }
        bishopPositions = ['c8', 'f8']
        for (let pos of bishopPositions) {
            const piece = new Piece('b', 'b', this);
            const square = this.gameState.get(pos);
            square.setPiece(piece);
        }

        let queenPosition = 'd1';
        let piece = new Piece('Q', 'w', this);
        let square = this.gameState.get(queenPosition);
        square.setPiece(piece);
        queenPosition = 'd8';

        piece = new Piece('q', 'b', this);
        square = this.gameState.get(queenPosition);
        square.setPiece(piece);

        let kingPosition = 'e1';
        piece = new Piece('K', 'w', this);
        square = this.gameState.get(kingPosition);
        square.setPiece(piece);

        kingPosition = 'e8';
        piece = new Piece('k', 'b', this);
        square = this.gameState.get(kingPosition);
        square.setPiece(piece);

        // Now we need to place this piece on the correct square based on its type and color.
        // For example, for white pieces:
        // - Pawns (P) go on rank 2 (a2, b2, c2, d2, e2, f2, g2, h2)
        // - Rooks (R) go on a1 and h1
        // - Knights (N) go on b1 and g1
        // - Bishops (B) go on c1 and f1
        // - Queen (Q) goes on d1
        // - King (K) goes on e1
        // For black pieces, it's similar but on ranks 7 and 8.
    };
}



