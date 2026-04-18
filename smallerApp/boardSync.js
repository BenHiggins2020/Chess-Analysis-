import { Piece } from "./Piece.js";

/**
 * Clears the UI board and mirrors the chess.js position onto Square/Piece nodes.
 */
export function syncBoardFromChess(chess, chessboard) {
    const gameState = chessboard.gameState;
    gameState.forEach((sq) => {
        sq.UI_ref.classList.remove("square--hint", "square--selected");
        sq.removePiece();
    });

    const grid = chess.board();
    for (let r = 0; r < 8; r++) {
        for (let f = 0; f < 8; f++) {
            const cell = grid[r][f];
            if (!cell) continue;
            const letter =
                cell.color === "w"
                    ? cell.type.toUpperCase()
                    : cell.type.toLowerCase();
            const square = gameState.get(cell.square);
            square.setPiece(new Piece(letter, chessboard));
        }
    }
}
