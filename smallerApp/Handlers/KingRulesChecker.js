
/**
 * Setting out rules for King Castling to check. 
 * 1. Has King moved. 
 * 2. Has Rook Moved (this should be handled in the rook @file{Piece.js}@file)
 * 3. Are the squares between rook and king empty? 
 * 4. Can king move safely throught those squares? 
 *         -> TODO: Create a threat check... 
 */

import { GameStateManager } from "../GameStateManage";

const manager = GameStateManager.getInstance();

let whiteKingHasMoved = false;
let blackKingHasMoved = false;

// File which must be checked for pieces to allow castling
const emptySquare_short_black = [
    "f8", "g8"
];

// File which must be checked for pieces to allow castling
const emptySquare_long_black = [
    "d8", "c8", "b8",
];

// File which must be checked for pieces to allow castling
const emptySquare_short_white = [
    "f1", "g1"
];

// File which must be checked for pieces to allow castling
const emptySquare_long_white = [
    "d1", "c1", "b1",
];

//File which (color) can try to move to (as a player-move)
const attemptToCastleFiles_White = [
    "g1", "h1", // Castle short (include rook position)
    "a1", "b1", "c1" // castle long (includes rook)
];

//File which (color) can try to move to (as a player-move)
const attemptToCastleFiles_Black = [
    "g8", "h8", // Castle short (include rook position)
    "a8", "b8", "c8" // castle long (includes rook)
];


function checkEmptySquare(listOfCoords) {
    const manager = GameStateManager.getInstance();

    let areAllSquaresEmpty = true;
    listOfCoords.forEach((coord) => {
        const sqr = manager.getSquare(coord);
        if (sqr.piece) {
            console.error(this.TAG + `checking for empty square: ${coord}`, sqr.piece);
            areAllSquaresEmpty = false;
            return areAllSquaresEmpty;
        }
    });

    return areAllSquaresEmpty;
}

function setWhiteKingMoved() {
    whiteKingHasMoved = true;
}

function setBlackKingMoved() {
    blackKingHasMoved = true;
}

