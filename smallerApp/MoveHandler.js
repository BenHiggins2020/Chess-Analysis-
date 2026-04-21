import { GameStateManager } from "./GameStateManage.js";
import { KingLogicHandler } from "./Handlers/KingLogicHandler.js";
import { Square } from "./Square.js";

const TAG = "MoveHandler: ";

const validFiles = ["a", "b", "c", "d", "e", "f", "g", "h"]
const validRanks = ["1", "2", "3", "4", "5", "6", "7", "8"]

const validatePosition = (pos) => {
    const file = pos[0];
    const rank = pos[1];
    // console.log(TAG + `validating position: file = ${file} rank = ${rank}`);

    if (!validFiles.includes(file)) return false;
    if (!validRanks.includes(rank)) return false;
    return true;
}

const validateFile = (file) => {
    if (!(file instanceof String) || !(file instanceof Char)) {
        // console.log(TAG + ` File is not in file format, attempt to convert: ${file} to ${String.fromCharCode(file)}`);

        // return validateFile(String.fromCharCode(file))
    }

    if (validFiles.includes(file)) return true;
    return false;
}

const validateRank = (rank) => {
    if (!(rank instanceof String) || !(rank instanceof Char)) {
        rank.toString();
    }

    if (validRanks.includes(rank)) return true;
    return false;
}

export const handlePawnMove = (fromSquare, toSquare, piece, chessboard) => {

    // Pawns can Move Straight Forward or Capture Diagonally: 
    const isStraightMove = fromSquare.file === toSquare.file;
    const isForwardMove = (piece.color === 'white' && toSquare.rank > fromSquare.rank) || (piece.color === 'black' && toSquare.rank < fromSquare.rank);

    if (!isForwardMove) {
        // console.error(TAG + "Invalid move: Pawns can only move forward." + ` toSquare.rank > fromSquare.rank: ${piece.color} ${toSquare.rank > fromSquare.rank} for white, toSquare.rank < fromSquare.rank: ${toSquare.rank < fromSquare.rank} for black`);
        return false;
    }

    const isFirstMove = (piece.color === 'white' && fromSquare.rank === 2) || (piece.color === 'black' && fromSquare.rank === 7);
    // console.log(
    //     TAG + `isFirstMove: ${isFirstMove}, piece color = ${piece.color} \n
    //     white: fromSquare.rank === 2: (${(piece.color === 'white' && fromSquare.rank === 2)}) \n
    //  black: fromSquare.rank === 7: (${(piece.color === 'black' && fromSquare.rank === 7)})) | ${fromSquare.rank}`);

    const isToSquareEmpty = toSquare.piece === 'empty' || toSquare.piece === null;

    if (isStraightMove) {
        // Straight moves must be to an empty square
        if (!isToSquareEmpty) {
            console.error(TAG + "Invalid move: Pawns cannot move straight to an occupied square.");
            return false;
        }

        // is it a first move? 

        const isOneSquareForward = (piece.color === 'white' && toSquare.rank === fromSquare.rank + 1) || (piece.color === 'black' && toSquare.rank === fromSquare.rank - 1);
        const isTwoSquaresForward = (piece.color === 'white' && toSquare.rank === fromSquare.rank + 2) || (piece.color === 'black' && toSquare.rank === fromSquare.rank - 2);


        if (isFirstMove) {
            // Pawns can move two squares forward on their first move if both squares in front of them are empty.
            if (isTwoSquaresForward || isOneSquareForward) {
                return true;
            }
            console.error(TAG + "Invalid move: On the first move, pawns can only move one or two squares forward.");
            return false;
        } else { // If it is not a first move, Pawns can only move one square forward to an empty square for straight moves
            // .
            if (!isOneSquareForward) {
                console.error(TAG + "Invalid move: Pawns can only move one square forward on subsequent moves.");
                return false;
            }
        }
    }


    // To Capture pawns must move up one rank, and over one file (diagonally), and the target square must be occupied by an opponent's piece.
    const isDiagonalMove = fromSquare.file !== toSquare.file;
    const fileDiff = Math.abs(fromSquare.file.charCodeAt(0) - toSquare.file.charCodeAt(0));
    const rankDiff = Math.abs(fromSquare.rank - toSquare.rank);

    console.log(TAG + `Checking pawn move from ${fromSquare.file}${fromSquare.rank} to ${toSquare.file}${toSquare.rank} | fileDiff: ${fileDiff} rankDiff: ${rankDiff} isDiagonalMove: ${isDiagonalMove}`);
    if (isDiagonalMove) {
        if (fileDiff === 1 && rankDiff === 1) {
            console.error(TAG + "Invalid move: Pawns can only capture one square diagonally.");
            if (!isToSquareEmpty && toSquare.piece.color !== piece.color) { // Square is not empty, and has a different color piece (opponent's piece) on it, so the pawn can capture
                return true;
            } else {
                console.error(TAG + "Invalid move: Pawns cannot move diagonally to an empty square or capture their own piece.");
                return false;
            }

        }
    }

    // console.log(TAG + "Pawn move: from " + fromSquare.file + fromSquare.rank + " to " + toSquare.file + toSquare.rank
    //     + " | fileDiff: " + fileDiff + " rankDiff: " + rankDiff +
    //     " isDiagonalMove: " + isDiagonalMove + " isStraightMove: " + isStraightMove + " isToSquareEmpty: " + isToSquareEmpty
    // );

    const isCaptureMove = isDiagonalMove && toSquare.piece !== 'empty' && toSquare.piece !== null && toSquare.piece.color != this.color;

    if (isCaptureMove) {
        // console.log(TAG + "Pawn can capture on " + toSquare.file + toSquare.rank);
        return true;
    }

    //Pawns can move one square forward if the target square is empty. On their first move, they can move two squares forward if both squares in front of them are empty.
    const isOneSquareForward = toSquare.file === fromSquare.file && ((piece.color === 'white' && toSquare.rank === fromSquare.rank + 1) || (piece.color === 'black' && toSquare.rank === fromSquare.rank - 1)) && isToSquareEmpty;
    const isTwoSquaresForward = toSquare.file === fromSquare.file && ((piece.color === 'white' && toSquare.rank === fromSquare.rank + 2) || (piece.color === 'black' && toSquare.rank === fromSquare.rank - 2)) && isToSquareEmpty
        && ((piece.color === 'white' && fromSquare.rank === 2) || (piece.color === 'black' && fromSquare.rank === 7)) // Pawns can only move two squares from starting position (rank 2 for white, rank 7 for black)
        && GameStateManager.getInstance().GameState.get(fromSquare.file + (fromSquare.rank + (piece.color === 'white' ? 1 : -1))).piece === 'empty'; // is the square in front of the pawn empty?

    if (isOneSquareForward) {
        // console.log(TAG + "Pawn can move one square forward to " + toSquare.file + toSquare.rank);
        return true;
    }
    if (isTwoSquaresForward) {
        // console.log(TAG + "Pawn can move two squares forward to " + toSquare.file + toSquare.rank);
        return true;
    }

    return true; // Placeholder: allow all moves for now

};

export const calculatePawnMoves = (fromSquare) => {
    const piece = fromSquare.piece;
    const gameState = GameStateManager.getInstance().GameState;

    function canDoubleMove(fromSquare) {
        const piece = fromSquare.piece;
        if (piece.color == "white" && fromSquare.rank == 2) {
            return true;
        } else if (piece.color == "black" && fromSquare.rank == 7) {
            return true;
        } else {
            return false;
        }
    }

    function canCapture(fromSquare) {
        const file = (fromSquare.file).charCodeAt(0);

        const newRank = fromSquare.rank + 1;
        const newFileLeft = String.fromCharCode((file - 1));

        const validCaptures = [];

        if (validateFile(newFileLeft)) {
            const pos = newFileLeft + newRank;
            const targetSqr = gameState.get(pos);
            // console.log(TAG + `got valid file: checking sqr position: ${pos} `)
            if (targetSqr.piece !== null) {
                if (targetSqr.piece.color !== fromSquare.piece.color) {
                    // console.log(TAG + `got piece on sqr (${pos}) ${targetSqr.piece.type
                    // }`)
                    validCaptures.push(targetSqr);
                }
            }
        }

        const newFileRight = String.fromCharCode((file + 1));
        // console.log(TAG + `Right capture = ${newFileRight}`)
        if (validateFile(newFileRight)) {
            const pos = newFileRight + newRank;
            const targetSqr = gameState.get(pos);
            // console.log(TAG + `got valid file: checking sqr position: ${pos} `)

            if (targetSqr.piece !== null) {
                if (targetSqr.piece.color !== fromSquare.piece.color) {
                    // console.log(TAG + `got piece on sqr [right](${pos}) ${targetSqr.piece.type }`)
                    validCaptures.push(targetSqr);
                }
            }
        } else {
            console.warn(TAG + `Right capture move is on invalide file = ${newFileRight}`)

        }

        return validCaptures;
    }

    let moves = []
    let x = fromSquare.file.charCodeAt(0);
    let y = fromSquare.rank;

    // console.log(TAG + `GameState: `, gameState)
    if (canDoubleMove(fromSquare)) {
        const sqr2 = String.fromCharCode(x) + (y + 2);
        moves.push(gameState.get(sqr2));
    }

    const canCaptureOn = canCapture(fromSquare);
    if (canCaptureOn.length > 0) {
        moves.push(...canCaptureOn);
    }

    const sqr1 = String.fromCharCode(x) + (y + 1);
    const oneMoveSqr = gameState.get(sqr1);
    if (oneMoveSqr.piece === null) {
        moves.push(oneMoveSqr);
    }

    // console.log(TAG + ` pawn moves: `);
    moves.forEach((sqr) => {
        // console.log(TAG + `sqr: ${sqr.position}`)
    })

    piece.moves = moves;
    return moves;
}

export const handleBishopMove = (fromSquare, toSquare) => {
    try {
        calculateBishopPath(fromSquare, toSquare);

        const piece = fromSquare.piece;
        const chessboard = fromSquare.chessboard;
        const isNormalMove = toSquare.piece === null;

        const isLegalMove = piece.moves.includes(toSquare)
        const isCaptureMove = toSquare.piece !== null && toSquare.piece.color !== piece.color


        if (isNormalMove) { // no piece here
            if (isLegalMove) { // within bounds.
                return true;
            } else {
                console.warn(TAG + `This is not a legal move, because there is a friendly piece on the square.`)
            }
        }

        if (isCaptureMove) {
            return true;
        }
        // console.log(TAG + `Not a valid move ( ${fromSquare.position} -> ${toSquare.position}), violates one of these rules: 
        //     \n Is it a legal capture ${isCaptureMove}
        //     \n Is legal positional move: ${isLegalMove}`)
        return false;

    } catch (e) {
        console.error(TAG + `ERROR: ${e}`)
    }

}

export const calculateBishopPath = (fromSquare, toSquare) => {

    const chessboard = fromSquare.chessboard;
    const selectedPiece = fromSquare.piece;

    //x bounds
    let xMin = "a".charCodeAt(0) // x = 1 for file 'a'
    let xMax = "h".charCodeAt(0) // x = 8 for file 'h'

    //y bounds
    let yMin = 1; // y = 1 for rank 1
    let yMax = 8; // y = 8 for rank 8

    let x = fromSquare.file.charCodeAt(0);
    let y = fromSquare.rank;

    //slope between current position and left bounds (max move distance): m = (y2 - y1) / (x2 - x1)
    let mLeft = (yMax - y) / (xMin - x);

    //slope between current position and right bounds (max move distance): m = (y2 - y1) / (x2 - x1)
    let mRight = (yMax - y) / (xMax - x);

    let maxStepsUp = yMax - y; // max steps up the left side of the board
    let maxStepsDown = y - yMin; // max steps down the right side of the board

    let maxStepsRight = xMax - x // max steps made to the right
    let maxStepsLeft = x - xMin // max steps made to the left of the board


    // Moving left and up, decreasing file, increasing rank
    let squares = []
    let allSquares = [];
    let nxtX = x; // file as char code
    let nxtY = y; // rank

    let piecePinCounter = 0;
    const pinnedPieces = []
    //TODO: add function to repalce duplicate code. 
    function shouldBreak() {
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board`);
            return true; // stop if we go out of bounds
        }
        const sqr = GameStateManager.getInstance().GameState.get(pos)
        squares.push(sqr)
        if (sqr.piece !== null) {
            // There is a piece on the square, lets include this as the last one. 
            return true;
        }
    }

    // console.log(TAG + `calculate left + up `);
    for (let i = 0; i < maxStepsLeft; i++) {

        nxtX -= 1; // move left one file
        nxtY += 1; // move up according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY



        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board`);
            break; // stop if we go out of bounds
        }
        const sqr = GameStateManager.getInstance().GameState.get(pos)
        if (sqr.piece === null) {
            // There is a piece on the square, lets include this as the last one. 
            squares.push(sqr)
            // break;
        } else if (sqr.piece !== null && sqr.piece.color !== selectedPiece.color) {
            // Square contains a piece, check how many!
            piecePinCounter++;
            pinnedPieces.push(sqr)
        }
        allSquares.push(sqr);
    }

    // if (piecePinCounter !== 2) {
    //     console.log(`No pinned pieces. `)
    // } else {
    //     console.log(`Pieces are pinned!! `)
    // }

    nxtX = x; // file as char code
    nxtY = y; // rank
    // console.log(TAG + `calculate steps left + down`);
    piecePinCounter = 0;
    for (let i = 0; i < maxStepsLeft; i++) {

        nxtX -= 1; // move left one file
        nxtY -= 1; // move down according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY

        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board`);
            break; // stop if we go out of bounds
        }
        const sqr = GameStateManager.getInstance().GameState.get(pos)
        // squares.push(sqr)
        // if (sqr.piece !== null) {
        //     // There is a piece on the square, lets include this as the last one. 
        //     break;
        // }
        if (sqr.piece === null) {
            // There is a piece on the square, lets include this as the last one. 
            squares.push(sqr)
            // break;
        } else if (sqr.piece !== null && sqr.piece.color !== selectedPiece.color) {
            // Square contains a piece, check how many!
            piecePinCounter++;
            pinnedPieces.push(sqr)
        }
        allSquares.push(sqr);
    }

    // if (piecePinCounter !== 2) {
    //     console.log(`No pinned pieces. `)
    // } else {
    //     console.log(`Pieces are pinned!! `)
    // }


    // console.log(TAG + `Now checking right path... ${maxStepsRight}`);

    // Moving right and down, increasing file, decreasing rank
    nxtX = x;
    nxtY = y;

    // console.log(TAG + `calculate right + down`)
    piecePinCounter = 0;
    for (let i = 0; i < maxStepsRight; i++) {

        nxtX += 1; // move right one file
        nxtY -= 1; // move down according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board at ${file}${nxtY}, stopping right path calculation.`);
            break; // stop if we go out of bounds
        }

        const sqr = GameStateManager.getInstance().GameState.get(pos)
        // squares.push(sqr)
        // if (sqr.piece !== null) {
        //     // There is a piece on the square, lets include this as the last one. 
        //     break;
        // }
        if (sqr.piece === null) {
            // There is a piece on the square, lets include this as the last one. 
            squares.push(sqr)
            // break;
        } else if (sqr.piece !== null && sqr.piece.color !== selectedPiece.color) {
            // Square contains a piece, check how many!
            piecePinCounter++;
            pinnedPieces.push(sqr)
        }
        allSquares.push(sqr);
    }

    // if (piecePinCounter !== 2) {
    //     console.log(`No pinned pieces. `)
    // } else {
    //     console.log(`Pieces are pinned!! `)
    // }

    nxtX = x;
    nxtY = y;
    piecePinCounter = 0;

    // console.log(TAG + ` calculate right + up`);
    for (let i = 0; i < maxStepsRight; i++) {
        nxtX += 1; // move right one file
        nxtY += 1; // move up according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY
        // console.warn(TAG + `Checking square: ${pos}`)
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board at ${file}${nxtY}, stopping right path calculation.`);
            break; // stop if we go out of bounds
        }

        const sqr = GameStateManager.getInstance().GameState.get(pos)
        // squares.push(sqr)
        // if (sqr.piece !== null) {
        //     // There is a piece on the square, lets include this as the last one. 
        //     break;
        // }
        if (sqr.piece === null) {
            // There is a piece on the square, lets include this as the last one. 
            squares.push(sqr);
            // break;
        } else if (sqr.piece.color !== selectedPiece.color) {
            // Square contains a piece, check how many!
            piecePinCounter++;
            pinnedPieces.push(sqr)
        }
        allSquares.push(sqr);
    }

    // if (piecePinCounter !== 2) {
    //     console.log(`No pinned pieces. `)
    // } else {
    //     console.log(`Pieces are pinned!! `)
    // }
    selectedPiece.moves = squares;
    return allSquares;
}

// Returns a boolean if knight move is legal. 
export const handleKnightMove = (fromSquare, toSquare) => {
    console.log(TAG + `handle knight moves: called. `)

    const moves = calculateKnightMoves(fromSquare)
    fromSquare.piece.moves
    const piece = fromSquare.piece;


    if (moves.includes(toSquare)) { // is legal move,

        if (toSquare.piece !== null) {
            // to Square has a piece
            if (toSquare.piece.color !== fromSquare.piece.color) {

                return true;
            }
            else return false;
        } else {
            return true;
        }
    } else {
        console.log(TAG + `List of legal moves does not include selected square (${toSquare.position})`);
        return false;
    }
    return false;
    // fromSquare.piece.moves = moves;

}

export const calculateKnightMoves = (fromSquare) => {


    const chessboard = fromSquare.chessboard;
    const selectedPiece = fromSquare.piece;

    const movesCoordinates = []

    //x bounds
    let xMin = "a".charCodeAt(0) // x = 1 for file 'a'
    let xMax = "h".charCodeAt(0) // x = 8 for file 'h'

    //y bounds
    let yMin = 1; // y = 1 for rank 1
    let yMax = 8; // y = 8 for rank 8

    let x = fromSquare.file.charCodeAt(0);
    let y = fromSquare.rank;

    // Knight Slope: 
    // 1. (y) up 2 over + and - 1 (x)
    // 1. (y) up 2 over + and - 1 (x)
    const x1 = String.fromCharCode((x + 1))
    const y1 = (y + 2).toString()

    // validates that the board positions are real board coordinates. 
    const validatePosition = (pos) => {
        let file = pos[0];
        let rank = pos[1];
        // console.log(TAG + `validating position: file = ${file} rank = ${rank}`);

        if (!validFiles.includes(file)) return false;
        if (!validRanks.includes(rank)) return false;
        return true;
    }

    const sqr1Pos = String.fromCharCode((x + 1)) + (y + 2).toString()
    if (validatePosition(sqr1Pos)) movesCoordinates.push(sqr1Pos);

    const x2 = String.fromCharCode(x - 1)
    const y2 = (y + 2).toString()
    const sqr2Pos = String.fromCharCode(x - 1) + (y + 2).toString()
    if (validatePosition(sqr2Pos)) movesCoordinates.push(sqr2Pos);

    // 2. (y) up 1 over + and - 2 (x)
    const x3 = String.fromCharCode(x + 2)
    const y3 = (y + 1).toString()
    const sqr3Pos = String.fromCharCode(x + 2) + (y + 1).toString()
    if (validatePosition(sqr3Pos)) movesCoordinates.push(sqr3Pos);

    const x4 = String.fromCharCode(x - 2)
    const y4 = (y + 1).toString()
    const sqr4Pos = String.fromCharCode(x - 2) + (y + 1).toString()
    if (validatePosition(sqr4Pos)) movesCoordinates.push(sqr4Pos);

    // 3. (y) down 2 and + and - 1 (x)
    const x5 = String.fromCharCode(x + 1)
    const y5 = (y - 2).toString()
    const sqr5Pos = String.fromCharCode(x + 1) + (y - 2).toString()
    if (validatePosition(sqr5Pos)) movesCoordinates.push(sqr5Pos);


    const x6 = String.fromCharCode(x - 1)
    const y6 = (y - 2).toString()
    const sqr6Pos = String.fromCharCode(x - 1) + (y - 2).toString()
    if (validatePosition(sqr6Pos)) movesCoordinates.push(sqr6Pos);


    // 4. (y) down 1 and + and - 2 (x)
    const x7 = String.fromCharCode(x + 2)
    const y7 = (y - 1).toString()
    const sqr7Pos = String.fromCharCode(x + 2) + (y - 1).toString()
    if (validatePosition(sqr7Pos)) movesCoordinates.push(sqr7Pos);


    const x8 = String.fromCharCode(x - 2)
    const y8 = (y - 1).toString()
    const sqr8Pos = String.fromCharCode(x - 2) + (y - 1).toString()
    if (validatePosition(sqr8Pos)) movesCoordinates.push(sqr8Pos);


    const moves = []
    movesCoordinates.forEach((sqr) => {
        const square = GameStateManager.getInstance().GameState.get(sqr)
        moves.push(square);
        // console.log(TAG + `Knight Move Square: `, square)
    });

    selectedPiece.moves = moves;
    return moves;
}

export const handleRookMoves = (fromSquare, toSquare) => {
    const piece = fromSquare.piece
    const moves = calculateRookMoves(fromSquare);

    if (moves.includes(toSquare)) {
        // console.log(TAG + `moves includes selected square`)
        if (toSquare.piece !== null) {

            if (toSquare.piece.color !== piece.color) {
                // console.log(TAG + `selected square, has piece of different color, can move (capture)`)
                piece.isFirstMove = false;
                return true;
            } else {
                console.log(TAG + ``)
                return false;
            }
        } else if (KingLogicHandler.getInstance().isRookCastleMove(fromSquare, toSquare)) {
            piece.isFirstMove = false;

            return true;
        }
        piece.isFirstMove = false;
        return true;
    } else if (KingLogicHandler.getInstance().isRookCastleMove(fromSquare, toSquare)) {
        piece.isFirstMove = false;
        return true;
    }
    return false;

}

export const calculateRookMoves = (fromSquare) => {
    const piece = fromSquare.piece;
    const chessboard = fromSquare.chessboard;

    //x bounds
    let xMin = "a".charCodeAt(0) // x = 1 for file 'a'
    let xMax = "h".charCodeAt(0) // x = 8 for file 'h'

    //y bounds
    let yMin = 1; // y = 1 for rank 1
    let yMax = 8; // y = 8 for rank 8

    let x = fromSquare.file.charCodeAt(0);
    let y = fromSquare.rank;

    const leftMoves = x - xMin; // dist to left of board
    const rightMoves = xMax - x; // dist to right of board;

    const upMoves = yMax - y; // dist to top
    const downMoves = y - yMin; // dist to bottom 

    let nxtX = x;
    let nxtY = y;
    const squares = []

    //dist to right (h-file)
    for (let i = 0; i < rightMoves; i++) {
        nxtX += 1
        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY;
        // console.log(TAG + `nxt square pos [right] = ${pos}`);
        const sqr = GameStateManager.getInstance().GameState.get(pos);
        squares.push(sqr);
        if (sqr.piece !== null) break; // break once we hit a piece
    }

    nxtX = x;
    nxtY = y;
    //dist to left (a-file)

    // console.log(TAG + `rook total dist left = ${leftMoves}`)

    for (let i = 0; i < leftMoves; i++) {
        nxtX -= 1
        const file = String.fromCharCode(nxtX);
        // console.log(TAG + `rook moves left: file = ${file} was ${nxtX}`)
        const pos = file + nxtY;
        // console.log(TAG + `nxt square pos [left] = ${pos}`);
        const sqr = GameStateManager.getInstance().GameState.get(pos);

        squares.push(sqr);
        if (sqr.piece !== null) {
            // console.log(TAG + `rook moves left: found piece at sqr: ${sqr.position}`)
            break;
        };

    }

    nxtX = x;
    nxtY = y;
    for (let i = 0; i < downMoves; i++) {
        nxtY -= 1;
        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY;
        // console.log(TAG + `nxt square pos [down] = ${pos}`);
        const sqr = GameStateManager.getInstance().GameState.get(pos);
        squares.push(sqr);
        if (sqr.piece !== null) break;

    }

    nxtX = x;
    nxtY = y;
    for (let i = 0; i < upMoves; i++) {
        nxtY += 1;
        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY;
        // console.log(TAG + `nxt square pos [up]= ${pos}`);
        const sqr = GameStateManager.getInstance().GameState.get(pos);
        squares.push(sqr);
        if (sqr.piece !== null) break;
    }

    squares.forEach((square) => {
        // console.log(`Squares for rook: ${square.position}`);
    })
    piece.moves = squares
    return squares

}

export const handleQueenMoves = (fromSquare, toSquare) => {

    if (toSquare.piece !== null) {
        if (toSquare.piece.color === fromSquare.piece.color) return false;
    }
    const canMoveDiagonal = handleBishopMove(fromSquare, toSquare);
    const canMoveStraight = handleRookMoves(fromSquare, toSquare);
    // console.log(TAG + `Can move diagonal ${canMoveDiagonal} straight: ${canMoveStraight}`)
    return canMoveDiagonal || canMoveStraight;
}

export const calculateQueenMoves = (fromSquare) => {
    const piece = fromSquare.piece;
    const diagonalMoves = calculateBishopPath(fromSquare);
    const rookMoves = calculateRookMoves(fromSquare);
    const moves = []
    moves.push(...diagonalMoves);
    moves.push(...rookMoves);
    piece.moves = moves;
    return moves;
}

export const handleKingMoves = (fromSquare, toSquare) => {

    const piece = fromSquare.piece;
    const gameState = GameStateManager.getInstance().GameState;
    const moves = calculateKingMoves(fromSquare);

    // Check for threats on square, 
    const iToDrop = []
    moves.forEach((sqr) => {
        if (sqr.piece === undefined) {
            iToDrop.push(moves.indexOf(sqr));
        } else {
            const isThreatened = KingLogicHandler.getInstance().checkForThreatOnSquare(sqr, piece.color);
            if (isThreatened) {
                iToDrop.push(moves.indexOf(sqr));
            }
        }

    });

    console.log(TAG + `Got count of un-usable squares (for king) ${iToDrop.length}`);

    // iToDrop.forEach((i) => {
    //     console.log(TAG + `Illegal Move square : ${moves[i].position}`)

    //     moves.splice(i, 1);
    // });

    console.log(TAG + ``)

    if (moves.includes(toSquare)) {
        console.log(TAG + `Moves includes ${toSquare.position}`)
        // toSquare is within bounded moves
        if (toSquare.piece !== null) {
            // but square has a piece
            if (toSquare.piece.color !== piece.color) {
                KingLogicHandler.getInstance().onKingMove(fromSquare, toSquare);
                return true;
            } else if (KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare)) {
                KingLogicHandler.getInstance().onKingMove(fromSquare, toSquare);
                console.log(TAG + ` Passing Castle Move: `)

                return true;
            }
            else {
                // console.log(TAG + `square has piece but it is the same color.`)
                return false;
            }
        } else { // square is in legal moves and no piece is on that square. 
            //TODO: Check for a threat... 
            KingLogicHandler.getInstance().onKingMove(fromSquare, toSquare);
            return true;
        }
    } else if (KingLogicHandler.getInstance().isCastleMove(fromSquare, toSquare)) {
        console.log(TAG + ` Passing Castle Move: `)
        KingLogicHandler.getInstance().onKingMove(fromSquare, toSquare);
        return true; // TODO: Need to make two moves at once... this may need to be done manually.

        // const castlingSquares = KingLogicHandler.getInstance().castlingSquares[piece.color];
        // console.log(TAG + `Checking for attempt to castle to: ${toSquare.position} `, castlingSquares);
        // if (castlingSquares.castleLong.includes(toSquare.position) || castlingSquares.castleShort.includes(toSquare.position)) {
        //     KingLogicHandler.getInstance().handleCastling(fromSquare, toSquare);
        //     return false; // returning false, but sending second. castling request next! 
        // }
    }
    return false;
}

export const calculateKingMoves = (fromSquare) => {
    if (fromSquare.piece == null) {
        console.error(TAG + `Error: no piece on fromSquare ${fromSquare.position}`);
        return [];
    }
    const piece = fromSquare.piece;
    const gameState = GameStateManager.getInstance().GameState;
    // Filter Diagonal moves, that are only 1 file away? 

    const x = fromSquare.file.charCodeAt(0);
    const y = fromSquare.rank;


    const legalXLeft = x - 1; // left
    const legalXRight = x + 1; // right

    let legalYDown = y - 1 // down
    let legalYUp = y + 1; // up

    const moveCoords = [];
    // can move left
    if (validateFile(String.fromCharCode(legalXLeft))) {

        // can move left on file
        let newFile = String.fromCharCode(legalXLeft)
        let newPos = newFile + y // lateral move 
        moveCoords.push(newPos);

        if (validateRank(legalYUp.toString())) {
            newPos = newFile + legalYUp;
            moveCoords.push(newPos);
        } else {
            // console.log(TAG + `Invalid Rank Up king: ${legalYUp}`)
        }

        if (validateRank(legalYDown.toString())) {
            newPos = newFile + legalYDown;
            moveCoords.push(newPos);
        } else {
            // console.log(TAG + `Invalid Rank Down king: ${legalYDown}`)

        }

    } else {
        // console.log(TAG + `Invalid file to left of king: ${String.fromCharCode(legalXLeft)}`)
    }

    //Can move right
    if (validateFile(String.fromCharCode(legalXRight))) {
        // console.log(TAG + `legal file right:`)

        let newFile = String.fromCharCode(legalXRight)
        let newPos = newFile + y // lateral move 
        moveCoords.push(newPos);

        if (validateRank(legalYUp.toString())) {
            newPos = newFile + legalYUp;
            moveCoords.push(newPos);
        } else {
            // console.log(TAG + `Invalid Rank Up king: ${legalYUp}`)

        }

        if (validateRank(legalYDown.toString())) {
            newPos = newFile + legalYDown;
            moveCoords.push(newPos);
        } {
            // console.log(TAG + `Invalid Rank Down king: ${legalYDown}`)

        }
    } else {
        // console.log(TAG + `Invalid file to left of king: ${String.fromCharCode(legalXLeft)}`)
    }

    // Can move up
    if (validateRank(legalYUp.toString())) {
        //straight up, 
        const newPos = fromSquare.file + legalYUp;
        moveCoords.push(newPos);
    }

    // Can move down
    if (validateRank(legalYDown.toString())) {
        const newPos = fromSquare.file + legalYDown;
        moveCoords.push(newPos);
    }

    //Can Castle
    if (KingLogicHandler.getInstance().canCastleShort(piece.color)) {
        moveCoords.push(KingLogicHandler.getInstance().castlingSquares[piece.color].castleShort)
    } else if (KingLogicHandler.getInstance().canCastleLong(piece.color)) {
        moveCoords.push(KingLogicHandler.getInstance().castlingSquares[piece.color].castleLong)
    }

    const squares = [];

    moveCoords.forEach((pos) => {
        // console.log(TAG + `King move coords: ${pos}`)
        const sqr = gameState.get(pos);
        squares.push(sqr)
    });

    piece.moves = squares;

    return squares;
}