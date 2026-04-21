import { calculateKingMoves, calculateKnightMoves, calculatePawnMoves, calculateQueenMoves, calculateRookMoves, calculateBishopPath } from "./MoveHandler.js";
import { Square } from "./Square.js";
import { Piece } from "./Piece.js";
import { PGNParserUtil } from "./Util/PGNParserUtil.js";
import { ClaudePGNParser } from "./Util/claudePgnParser.js";
import { createPGNTracker } from "./Util/PGNWriter.js";
import { createStockfish } from "./Repository/StockfishApi.js";

/**
 * BoardUIManager is responsible for managing the visual representation of the chessboard and pieces.
 * it is responsible for setting the inital gameState. 
 */

// TODO: Update GameStateManager to use BoardUIManager for setting up the board and pieces.
export class BoardUIManager {

    constructor(gameState) {
        this.TAG = "BoardUIManager: ";
        this.#gameState = gameState;
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
                this.#gameState.set(
                    squareName,
                    squareObj
                );
            }
        }
    }

    setPieces = () => {
        if (this.#gameState.size === 0) {
            console.error(this.TAG + "Game state is empty. Cannot set pieces.");
            return;
        }

        // Set Pawns: Rank 2
        let rank = 2;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('P', 'w', this);
            const square = this.#gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        rank = 7;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('p', 'b', this);
            const square = this.#gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        let rookPositions = ['a1', 'h1']
        for (let pos of rookPositions) {
            const piece = new Piece('R', 'w', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        rookPositions = ['a8', 'h8']
        for (let pos of rookPositions) {
            const piece = new Piece('r', 'b', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        let knightPositions = ['b1', 'g1']
        for (let pos of knightPositions) {
            const piece = new Piece('N', 'w', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        knightPositions = ['b8', 'g8']
        for (let pos of knightPositions) {
            const piece = new Piece('n', 'b', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        let bishopPositions = ['c1', 'f1']
        for (let pos of bishopPositions) {
            const piece = new Piece('B', 'w', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }
        bishopPositions = ['c8', 'f8']
        for (let pos of bishopPositions) {
            const piece = new Piece('b', 'b', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        let queenPosition = 'd1';
        let piece = new Piece('Q', 'w', this);
        let square = this.#gameState.get(queenPosition);
        square.setPiece(piece);
        queenPosition = 'd8';

        piece = new Piece('q', 'b', this);
        square = this.#gameState.get(queenPosition);
        square.setPiece(piece);

        let kingPosition = 'e1';
        piece = new Piece('K', 'w', this);
        square = this.#gameState.get(kingPosition);
        square.setPiece(piece);

        kingPosition = 'e8';
        piece = new Piece('k', 'b', this);
        square = this.#gameState.get(kingPosition);
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

    clearPieces() {
        this.#gameState.forEach((square) => {
            if (square.piece) {
                square.removePiece();
            }
        });

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

    resetBoard() {
        this.clearPieces();
        this.setPieces();
        // clear fen and pgn
        this.whiteKingMoves = [];
        this.whiteKingPos = 'e1';
        this.blackKingMoves = [];
        this.blackKingPos = 'e8';
        this.checked = null;
        this.PGNTracker.reset({ White: "Player 1", Black: "Player 2" });

        this.#turn = 'white';
        this.updateStatus(this.#turn);
        this.updateAnalysis("");


    }

    updateStatus(currentPlayer) {
        const statusDisplay = document.getElementById("status");
        statusDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} to move.`;
    }

    updateAnalysis(analysisText) {
        // console.log(this.TAG + `Updating analysis output:`, analysisText);
        const analysisOutput = document.getElementById("analysis");
        let str = analysisText.split(']').slice(-1)[0].trim(); // Get the last part after the last ']'


        // console.log(this.TAG + `Extracted analysis text:`, str);
        analysisOutput.textContent = str;
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
}
