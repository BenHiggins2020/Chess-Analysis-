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

    if (fromCoord === undefined) {
        console.warn(TAG + `Coordinate is passed not square. fromCoord: `, fromCoord);

        fromSquare = manager.getSquare(fromCoord);
        toSquare = manager.getSquare(toCoord);
    } else {
        fromSquare = fromCoord;
        toSquare = toCoord;
    }

    console.log(TAG + `transferPiece: ${fromSquare.position} -> ${toSquare.position} of`, fromSquare.piece);

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



/**
 * Full apply-move pipeline (legality, castling, PGN, board, turn, UI hooks).
 * Expects a GameStateManager-like object with public API used below (no GameStateManage import).
 */
export function executePlayerMove(manager, _fromCoord, _toCoord) {
    let toCoord = _toCoord;
    let fromCoord = _fromCoord;

    console.log(TAG + `executing player move`);
    if (fromCoord === toCoord) {
        return;
    }

    const gameState = manager.GameState;
    const fromSquare = gameState.get(fromCoord);
    let toSquare = gameState.get(toCoord);
    console.log(TAG + `Moving piece from ${fromCoord} to ${toCoord}`);

    if (!fromSquare || !toSquare) {
        console.error(manager.TAG + `Invalid move from ${fromSquare} to ${toSquare}`);
        return;
    }

    const piece = fromSquare.piece;
    const pieceCanMove = piece.canMoveTo(fromSquare, toSquare, manager);
    const isCorrectTurn = piece.color === manager.currentTurn;
    let isCastleMove = false;
    let canCastle = false;
    if (piece.type.toLowerCase() === "k") {
        isCastleMove = KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare) && piece.type.toLowerCase() === "k";
        canCastle = KingLogicHandler.getInstance().canCastle(piece.color);
    }


    console.warn(TAG + `legal move criteria: \n pieceCanMove (${pieceCanMove})\n its your turn ${isCorrectTurn},\n this is a castle move: ${isCastleMove} ,\n is castling even legal rn: ${canCastle} : `);


    if ((pieceCanMove || (isCastleMove && canCastle && piece.type.toLowerCase() === "k")) && isCorrectTurn) {
        if (KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare) && piece.type.toLowerCase() === "k") {
            const kingCastleSqr = KingLogicHandler.getInstance().getCorrectKingSquare(fromSquare, toSquare);
            console.log(manager.TAG + `King Castle Square : ${kingCastleSqr.position}`);
            toSquare = kingCastleSqr;
            toCoord = toSquare.position;
        }
    } else {
        console.error(manager.TAG + `Invalid move from ${fromSquare.position} to ${toSquare.position}
            \n because: Piece can move to square: ${pieceCanMove} or its not your turn: ${isCorrectTurn} (its ${manager.currentTurn}'s turn)`);
        return;
    }

    fromSquare.render();
    toSquare.render();

    //
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


export function onMove(fromSquare, toSquare, _manager) {
    let manager = _manager;
    if (manager === undefined) {
        manager = GameStateManager.getInstance();
    }
    const fromCoord = fromSquare.position;
    const toCoord = toSquare.position;

    console.log(TAG + `onMove: ${fromCoord} ${toCoord} `);

    manager.PGNTracker.push(fromCoord, toCoord);

    manager.moveObj = {
        fromSquare,
        toSquare,
    };


    const moveNum = manager.PGNTracker.moveCount();
    console.log(manager.TAG + `Setting Move History object. MoveCount: ${moveNum}`, manager.moveObj);

    manager.moveList.set(moveNum, manager.moveObj);

    const piece = fromSquare.piece;
    manager.getSquare(fromSquare.position).removePiece();
    manager.getSquare(toSquare.position).setPiece(piece);

    manager.deselect();

    manager.currentTurn = manager.currentTurn === "white" ? "black" : "white";

    manager.updateStatus(manager.currentTurn);
    manager.updatePGN(manager.PGNTracker.pgn().trim());

    if (manager.playComputer && manager.currentTurn !== manager.player) {
        manager.computerMove();
    }

    manager.nav.loadPgn(manager.PGNTracker.pgn()); // this is only needed for player moves? 
    // console.error(TAG + `updating move number... `)
    // manager.currentMoveNumber += 1;
    this.onEndTurn();
}
/**
 * Apply board step for navigator "back" from a nav result (piece leaves to-square toward from-square).
 */
export function applyNavigatorUndo(manager, result) {
    console.log(TAG + `Undo move: `, result.san);


    const gameState = manager.GameState;

    const fromCoord = result.fromSquare;
    const toCoord = result.toSquare;

    const toSquare = gameState.get(toCoord);
    const fromSquare = gameState.get(fromCoord);


    const klh = KingLogicHandler.getInstance()
    manager.currentMoveNumber -= 1;
    if (result.san === "O-O-O") {
        console.log(TAG + `castling LONG. handle!`);
        const kingCastleSqr = klh.getCorrectKingSquare(toSquare, fromSquare);

        console.log(manager.TAG + `King Castle Square : ${kingCastleSqr.position}`);

        switch (fromSquare.piece.color) {
            case "white":
                klh.castleLongWhite();
                break;
            case "black":
                klh.castleLongBlack();
                break;
        }
        return;

    } else if (result.san === "O-O") {
        console.log(TAG + `castling short. handle!`);
        switch (fromSquare.piece.color) {
            case "white":
                klh.castleShortWhite();
                break;
            case "black":
                klh.castleShortBlack();
                break;
        }
        return;
    }





    transferPiece(toSquare, fromSquare);

    if (result.san.includes('x')) {
        // this is a capture, we need to handle it and extract the piece
        onCaptureReset(fromSquare, toSquare, result.moveIndex);
    }
    console.log(TAG + `Undo move finished. `);

}

/**
 * Apply board step for navigator "next" from a nav result.
 */
export function applyNavigatorRedo(manager, result) {
    console.warn(TAG + `Redo move: `, result);

    const gameState = manager.GameState;

    const fromCoord = result.toSquare;
    const toCoord = result.fromSquare;

    const toSquare = gameState.get(toCoord);
    const fromSquare = gameState.get(fromCoord);

    if (result.san.includes('x')) {

        console.log(TAG + `capture on ${fromSquare.position}.
            w/ ${toSquare.piece.color}'s  ${toSquare.position} ${toSquare.piece.type}
            capturing ${fromSquare.piece.color}'s ${fromSquare.piece.type}`);

        const capturedSqr = fromSquare;
        onCaptureRemove(capturedSqr, result.moveIndex);
        // this is a capture, we need to handle it and extract the piece
        // onCaptureRemove(toSquare, fromSquare, result.moveIndex);
    }
    manager.currentMoveNumber += 1;

    const klh = KingLogicHandler.getInstance();
    if (result.san === "O-O-O") {
        console.log(TAG + `castling LONG. handle!`);
        const kingCastleSqr = klh.getCorrectKingSquare(toSquare, fromSquare);

        console.log(manager.TAG + `King Castle Square : ${kingCastleSqr.position}`);

        switch (toSquare.piece.color) {
            case "white":
                klh.castleLongWhite(true);
                break;
            case "black":
                klh.castleLongBlack(true);
                break;
        }
        return;

    } else if (result.san === "O-O") {
        console.log(TAG + `castling short. handle!`, fromSquare);
        switch (toSquare.piece.color) {
            case "white":
                klh.castleShortWhite(true);
                break;
            case "black":
                klh.castleShortBlack(true);
                break;
        }
        return;
    }

    transferPiece(toSquare, fromSquare);

    console.error(TAG + `applyNavRedo, updating currentMoveNumber ${manager.currentMoveNumber}`);

    console.warn(TAG + `Redo move finished. `);

}

export function onEndTurn() {
    manager.currentTurn = manager.currentTurn === "black" ? "white" : "black"
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

// Map for saving pieces captured and their move.
const CapturedPieceRepo = new Map();

/**
 *  Saves a piece that is about to be captured. 
 *  Removes that piece from the square. 
 * @param {*} fromSquare 
 * @param {*} toSquare 
 * @param {*} moveIndex 
 */
export function onCaptureRemove(capturedSqr, moveIndex) {
    const piece = capturedSqr.piece;

    CapturedPieceRepo.set(moveIndex, piece);

    console.warn(TAG + `onCaptureRemove: piece of type ${piece.type} on ${capturedSqr.position} was captured. on move ${moveIndex} `);
    console.log(TAG + `onCaptureRemove:checking piece capture repo:  `, CapturedPieceRepo);

    capturedSqr.removePiece();
}

/**
 * This should be called on an undo move (going backwards in time)
 *  This must be called after the piece is moved from the square, such that the piece is not overwritten.
 * @param {*} fromSquare 
 * @param {*} toSquare 
 * @param {*} moveIndex 
 */
export function onCaptureReset(fromSquare, toSquare, moveIndex) {
    const piece = CapturedPieceRepo.get(moveIndex);

    console.log(TAG + `Pulling piece from repo. via ${moveIndex} `, piece);

    //fromSquare captures piece on toSquare ... 
    console.warn(TAG + `onCaptureReset: piece of type ${piece.type} to ${toSquare.position} was placed. `);

    toSquare.setPiece(piece);


}


export function handleCastling(fromSquare, toSquare) {

}