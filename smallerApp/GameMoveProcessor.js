import { KingLogicHandler } from "./Handlers/KingLogicHandler.js";

const TAG = "GameMoveProcessor: ";

/**
 * Move a piece from one square to another without validation (navigator / replay).
 * @param {*} fromSquare
 * @param {*} toSquare
 */
export function transferPiece(fromSquare, toSquare) {
    console.log(TAG + `transferPiece: ${fromSquare.position} -> ${toSquare.position}`);
    const piece = fromSquare.piece;
    toSquare.setPiece(piece);
    fromSquare.removePiece();
}

/**
 * Full apply-move pipeline (legality, castling, PGN, board, turn, UI hooks).
 * Expects a GameStateManager-like object with public API used below (no GameStateManage import).
 */
export function executePlayerMove(manager, fromCoord, toCoord) {
    if (fromCoord === toCoord) {
        return;
    }

    const gameState = manager.GameState;
    const fromSquare = gameState.get(fromCoord);
    let toSquare = gameState.get(toCoord);
    console.log(manager.TAG + `Moving piece from ${fromCoord} to ${toCoord}`);

    if (!fromSquare || !toSquare) {
        console.error(manager.TAG + `Invalid move from ${fromSquare} to ${toSquare}`);
        return;
    }

    const piece = fromSquare.piece;

    if (piece.canMoveTo(fromSquare, toSquare, manager) && piece.color === manager.currentTurn) {
        if (KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare) && piece.type.toLowerCase() === "k") {
            const kingCastleSqr = KingLogicHandler.getInstance().getCorrectKingSquare(fromSquare, toSquare);
            console.log(manager.TAG + `King Castle Square : ${kingCastleSqr.position}`);
            toSquare = kingCastleSqr;
        }
    } else {
        return;
    }

    fromSquare.render();
    toSquare.render();

    manager.PGNTracker.push(fromCoord, toCoord);

    manager.moveObj = {
        fromSquare,
        toSquare,
    };
    const moveNum = manager.PGNTracker.moveCount();
    console.log(manager.TAG + `Setting Move History object. MoveCount: ${moveNum}`, manager.moveObj);

    manager.moveList.set(moveNum, manager.moveObj);

    gameState.get(fromSquare.position).removePiece();
    gameState.get(toSquare.position).setPiece(piece);

    manager.deselect();

    manager.currentTurn = manager.currentTurn === "white" ? "black" : "white";

    manager.updateStatus(manager.currentTurn);
    manager.updatePGN(manager.PGNTracker.pgn());

    if (manager.playComputer && manager.currentTurn !== manager.player) {
        manager.computerMove();
    }

    manager.nav.loadPgn(manager.PGNTracker.pgn());
    manager.currentMoveNumber += 1;
}

/**
 * Apply board step for navigator "back" from a nav result (piece leaves to-square toward from-square).
 */
export function applyNavigatorUndo(manager, result) {
    const gameState = manager.GameState;
    const fromCoord = result.fromSquare;
    const toCoord = result.toSquare;
    const toSquare = gameState.get(toCoord);
    const fromSquare = gameState.get(fromCoord);
    transferPiece(toSquare, fromSquare);

    if (result.capturedPiece) {
        // if there is a capture we need to put the piece back!
    }
    manager.currentMoveNumber -= 1;
}

/**
 * Apply board step for navigator "next" from a nav result.
 */
export function applyNavigatorRedo(manager, result) {
    const gameState = manager.GameState;
    const fromCoord = result.toSquare;
    const toCoord = result.fromSquare;
    const toSquare = gameState.get(toCoord);
    const fromSquare = gameState.get(fromCoord);
    transferPiece(toSquare, fromSquare);
    manager.currentMoveNumber += 1;
}
