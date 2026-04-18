/**
 * Chessboard class just manages the UI state. 
 * 
 */

import { GameStateManager } from "./GameStateManage.js";
import { tryMoveUci, syncBoardTo } from "./chessEngine.js";
import { Square } from "./Square.js";
import { scheduleComputerMove } from "./autoPlay.js";

export class Chessboard {

    // 8 files, 8 ranks
    constructor() {
        this.TAG = "Chessboard.js -> "
        this.gameStateManager = GameStateManager.getInstance();
        this.gameState = this.gameStateManager.gameState;

        this.generateChessboard();
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

    /**
     * @param {string} fromCoord
     * @param {string} toCoord
     * @param {string} [promotionPiece] q|r|b|n when promoting
     */
    /**
     * @returns {boolean} true if the move was applied
     */
    handleMove = (fromCoord, toCoord, promotionPiece = "q") => {
        if (fromCoord === toCoord) {
            console.error(this.TAG + "Cannot move to the same square: " + fromCoord);
            return false;
        }

        const fromSquare = this.gameState.get(fromCoord);
        const toSquare = this.gameState.get(toCoord);

        if (!fromSquare || !toSquare) {
            console.error(this.TAG + `Invalid move from ${fromCoord} to ${toCoord}`);
            return false;
        }

        const result = tryMoveUci(fromCoord, toCoord, promotionPiece);
        if (!result.ok) {
            const msg =
                result.reason === "line"
                    ? `Expected opening move: ${result.expected}`
                    : "Illegal move.";
            document.dispatchEvent(
                new CustomEvent("chessStatus", {
                    detail: { message: msg, kind: "error" },
                }),
            );
            return false;
        }

        syncBoardTo(this);
        GameStateManager.getInstance().deselect();
        document.dispatchEvent(
            new CustomEvent("chessStatus", {
                detail: { message: "", kind: "clear" },
            }),
        );
        scheduleComputerMove(this);
        return true;
    };
}



