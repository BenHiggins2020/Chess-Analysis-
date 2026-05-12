import { GameStateManager } from "./GameStateManage.js";
import { KingLogicHandler } from "./Handlers/KingLogicHandler.js";

const TAG = "GameMoveProcessor: ";

/**
 * Move a piece from one square to another without validation (navigator / replay).
 * @param {*} fromSquare
 * @param {*} toSquare
 */
export function transferPiece(fromCoord, toCoord) {
    const manager = GameStateManager.getInstance();
    let fromSquare = null;
    let toSquare = null;
    // console.warn(TAG + `Coordinate is passed not square. fromCoord: `, fromCoord);

    if (fromCoord === undefined) {
        fromSquare = manager.getSquare(fromCoord);
        toSquare = manager.getSquare(toCoord);
    } else {
        fromSquare = fromCoord;
        toSquare = toCoord;
    }

    console.log(TAG + `transferPiece: ${fromSquare.position} -> ${toSquare.position} of `, fromSquare.piece);

    const piece = fromSquare.piece;
    toSquare.setPiece(piece);
    fromSquare.removePiece();
}

function checkForCastle(san) {
    if (san.includes("O-O-O") || san.includes("O-O")) {
        return true;
    }
    return false;
}

function handleCastle(manager, fromSquare) {
    const piece = fromSquare.piece;
    const color = piece.color;

    KingLogicHandler.getInstance();

}


/**
 * Full apply-move pipeline (legality, castling, PGN, board, turn, UI hooks).
 * Expects a GameStateManager-like object with public API used below (no GameStateManage import).
 */
export function executePlayerMove(manager, fromCoord, toCoord) {
    console.log(TAG + `executing player move`);
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
    const pieceCanMove = piece.canMoveTo(fromSquare, toSquare, manager);
    const isCorrectTurn = piece.color === manager.currentTurn;

    const isCastleMove = KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare) && piece.type.toLowerCase() === "k";
    const canCastle = KingLogicHandler.getInstance().canCastle(piece.color);

    console.warn(TAG + `legal move criteria: \n pieceCanMove (${pieceCanMove})\n its your turn ${isCorrectTurn},\n this is a castle move: ${isCastleMove} ,\n is castling even legal rn: ${canCastle} : `);

    if ((pieceCanMove || (isCastleMove && canCastle)) && isCorrectTurn) {
        if (KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare) && piece.type.toLowerCase() === "k") {
            const kingCastleSqr = KingLogicHandler.getInstance().getCorrectKingSquare(fromSquare, toSquare);
            console.log(manager.TAG + `King Castle Square : ${kingCastleSqr.position}`);
            toSquare = kingCastleSqr;
        }
    } else {
        console.error(manager.TAG + `Invalid move from ${fromSquare.position} to ${toSquare.position}
            \n because: Piece can move to square: ${pieceCanMove} or its not your turn: ${isCorrectTurn} (its ${manager.currentTurn}'s turn)`);
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
    manager.updatePGN(manager.PGNTracker.pgn().trim());

    if (manager.playComputer && manager.currentTurn !== manager.player) {
        manager.computerMove();
    }

    manager.nav.loadPgn(manager.PGNTracker.pgn());
    console.error(TAG + `updating move number... `)
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
    if (result.san === "O-O-O" || result.san === "O-O") {

        const kingCastleSqr = KingLogicHandler.getInstance().getCorrectKingSquare(toSquare, fromSquare);
        console.log(manager.TAG + `King Castle Square : ${kingCastleSqr.position}`);
        toSquare = kingCastleSqr;
        if (result.capturedPiece) {
            // if there is a capture we need to put the piece back!
        }
        manager.currentMoveNumber -= 1;
    }

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
    console.error(TAG + `applyNavRedo, updating currentMoveNumber ${manager.currentMoveNumber}`);
}

/**
 *  used to make special moves like castling, en passant*, etc.
 *
 * @param {GameStateManager} manager 
 * @param {string} fromCoord 
 * @param {string} toCoord 
 */
export function forceMove(manager, fromCoord, toCoord) {
    const gameState = manager.GameState;
    const fromSquare = gameState.get(fromCoord);
    const toSquare = gameState.get(toCoord);
    const piece = fromSquare.piece;

    fromSquare.removePiece();
    toSquare.setPiece(piece);

}