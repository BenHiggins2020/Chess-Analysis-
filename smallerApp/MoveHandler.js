
const TAG = "MoveHandler: ";

export const handlePawnMove = (fromSquare, toSquare, piece, chessboard) => {

    // Pawns can Move Straight Forward or Capture Diagonally: 
    const isStraightMove = fromSquare.file === toSquare.file;
    const isForwardMove = (piece.color === 'white' && toSquare.rank > fromSquare.rank) || (piece.color === 'black' && toSquare.rank < fromSquare.rank);

    if (!isForwardMove) {
        console.error(TAG + "Invalid move: Pawns can only move forward." + ` toSquare.rank > fromSquare.rank: ${piece.color} ${toSquare.rank > fromSquare.rank} for white, toSquare.rank < fromSquare.rank: ${toSquare.rank < fromSquare.rank} for black`);
        return false;
    }

    const isFirstMove = (piece.color === 'white' && fromSquare.rank === 2) || (piece.color === 'black' && fromSquare.rank === 7);
    console.log(TAG + `isFirstMove: ${isFirstMove}, piece color = ${piece.color} \n
        white: fromSquare.rank === 2: (${(piece.color === 'white' && fromSquare.rank === 2)}) \n
     black: fromSquare.rank === 7: (${(piece.color === 'black' && fromSquare.rank === 7)})) | ${fromSquare.rank}`);
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
        console.log(TAG + "Pawn can capture on " + toSquare.file + toSquare.rank);
        return true;
    }

    //Pawns can move one square forward if the target square is empty. On their first move, they can move two squares forward if both squares in front of them are empty.
    const isOneSquareForward = toSquare.file === fromSquare.file && ((piece.color === 'white' && toSquare.rank === fromSquare.rank + 1) || (piece.color === 'black' && toSquare.rank === fromSquare.rank - 1)) && isToSquareEmpty;
    const isTwoSquaresForward = toSquare.file === fromSquare.file && ((piece.color === 'white' && toSquare.rank === fromSquare.rank + 2) || (piece.color === 'black' && toSquare.rank === fromSquare.rank - 2)) && isToSquareEmpty
        && ((piece.color === 'white' && fromSquare.rank === 2) || (piece.color === 'black' && fromSquare.rank === 7)) // Pawns can only move two squares from starting position (rank 2 for white, rank 7 for black)
        && chessboard.gameState.get(fromSquare.file + (fromSquare.rank + (piece.color === 'white' ? 1 : -1))).piece === 'empty'; // is the square in front of the pawn empty?

    if (isOneSquareForward) {
        console.log(TAG + "Pawn can move one square forward to " + toSquare.file + toSquare.rank);
        return true;
    }
    if (isTwoSquaresForward) {
        console.log(TAG + "Pawn can move two squares forward to " + toSquare.file + toSquare.rank);
        return true;
    }

    return true; // Placeholder: allow all moves for now

};

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
        console.log(TAG + `Not a valid move ( ${fromSquare.position} -> ${toSquare.position}), violates one of these rules: 
            \n Is it a legal capture ${isCaptureMove}
            \n Is legal positional move: ${isLegalMove}`)
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
    let nxtX = x; // file as char code
    let nxtY = y; // rank


    //TODO: add function to repalce duplicate code. 
    function shouldBreak() {
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board`);
            return true; // stop if we go out of bounds
        }
        const sqr = chessboard.gameState.get(pos)
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
        const sqr = chessboard.gameState.get(pos)
        squares.push(sqr)
        if (sqr.piece !== null) {
            // There is a piece on the square, lets include this as the last one. 
            break;
        }
    }

    nxtX = x; // file as char code
    nxtY = y; // rank
    // console.log(TAG + `calculate steps left + down`);
    for (let i = 0; i < maxStepsLeft; i++) {

        nxtX -= 1; // move left one file
        nxtY -= 1; // move down according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY

        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board`);
            break; // stop if we go out of bounds
        }
        const sqr = chessboard.gameState.get(pos)
        squares.push(sqr)
        if (sqr.piece !== null) {
            // There is a piece on the square, lets include this as the last one. 
            break;
        }
    }


    // console.log(TAG + `Now checking right path... ${maxStepsRight}`);

    // Moving right and down, increasing file, decreasing rank
    nxtX = x;
    nxtY = y;
    // console.log(TAG + `calculate right + down`)

    for (let i = 0; i < maxStepsRight; i++) {

        nxtX += 1; // move right one file
        nxtY -= 1; // move down according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            // console.log(TAG + `Reached edge of board at ${file}${nxtY}, stopping right path calculation.`);
            break; // stop if we go out of bounds
        }

        const sqr = chessboard.gameState.get(pos)
        squares.push(sqr)
        if (sqr.piece !== null) {
            // There is a piece on the square, lets include this as the last one. 
            break;
        }

    }

    nxtX = x;
    nxtY = y;
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

        const sqr = chessboard.gameState.get(pos)
        squares.push(sqr)
        if (sqr.piece !== null) {
            // There is a piece on the square, lets include this as the last one. 
            break;
        }
    }

    selectedPiece.moves = squares;
}