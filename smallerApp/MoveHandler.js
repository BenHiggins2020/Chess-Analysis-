
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

        // const piece = fromSquare.piece;
        // const chessboard = fromSquare.chessboard;

        // const isDiagonalMove = Math.abs(fromSquare.file.charCodeAt(0) - toSquare.file.charCodeAt(0)) === Math.abs(fromSquare.rank - toSquare.rank);

        // // Use Slope to calculate bishop move:
        // // y = mx + b
        // const fileDiff = Math.abs(fromSquare.file.charCodeAt(0) - toSquare.file.charCodeAt(0));
        // const rankDiff = Math.abs(fromSquare.rank - toSquare.rank);

        // // y1 - y2 / x1 - x2
        // const slope = (toSquare.rank - fromSquare.rank) / (toSquare.file.charCodeAt(0) - fromSquare.file.charCodeAt(0));

        // //calculate y-intercept (b) using one of the points (x1, y1) 
        // const yIntercept = toSquare.rank - slope * toSquare.file.charCodeAt(0);

        // // use the char codes to step through the file. 
        // let ChangeInX = toSquare.file.charCodeAt(0) - fromSquare.file.charCodeAt(0);
        // let ChangeInY = toSquare.rank - fromSquare.rank;
        // let stepX = ChangeInX / Math.abs(ChangeInX); // will be either 1 or -1
        // let stepY = ChangeInY / Math.abs(ChangeInY); // will be either 1 or -1

        // // How many steps to take is equal to the absolute value of the change in x (or y, since they should be the same for a diagonal move)
        // // 2. Determine the direction of the step (+1 or -1)
        // const fileStep = fileDiff > 0 ? 1 : -1;
        // const rankStep = rankDiff > 0 ? 1 : -1;

        // // console.log(TAG + `got change in file: ${ChangeInX}`)
        // // console.log(TAG + `got change in rank: ${ChangeInY}`)

        // // 3. Iterate through the path
        // let currentFileCode = fromSquare.file.charCodeAt(0) + stepX;
        // let currentRank = fromSquare.rank + stepY;

        // const targetFileCode = toSquare.file.charCodeAt(0);

        // // the step is wrong here. 
        // while (currentFileCode !== targetFileCode) {
        //     const currentCoord = `${String.fromCharCode(currentFileCode)}${currentRank}`;
        //     // console.log(TAG + `Checking path at ${currentCoord} for obstruction.`);
        //     const squareToCheck = chessboard.gameState.get(currentCoord);

        //     // console.log(TAG + `Checking square ${currentCoord} for obstruction. Piece on square:`, squareToCheck.piece);

        //     if (squareToCheck && squareToCheck.piece !== 'empty') {
        //         // console.log(`Path blocked at: ${currentCoord}`);
        //         return false; // Path is blocked
        //     }

        //     // Move to the next square in the diagonal
        //     currentFileCode += fileStep;
        //     currentRank += rankStep;
        // }



        // if (!isDiagonalMove) {
        //     console.error(TAG + "Invalid move: Bishops can only move diagonally.");
        //     return false;
        // }

        return true; // Placeholder: allow all moves for now
    } catch (e) {
        console.error(TAG + `ERROR: ${e}`)
    }

}

export const calculateBishopPath = (fromSquare, toSquare) => {

    // console.log(TAG + `Calculating bishop path from ${fromSquare.file}${fromSquare.rank}`);
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

    console.log(TAG + `calculate left + up `);
    for (let i = 0; i < maxStepsLeft; i++) {

        nxtX -= 1; // move left one file
        nxtY += 1; // move up according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY

        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            console.log(TAG + `Reached edge of board`);
            break; // stop if we go out of bounds
        }
        const sqr = chessboard.gameState.get(pos)
        squares.push(sqr)
    }

    nxtX = x; // file as char code
    nxtY = y; // rank
    console.log(TAG + `calculate steps left + down`);
    for (let i = 0; i < maxStepsLeft; i++) {

        nxtX -= 1; // move left one file
        nxtY -= 1; // move down according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY

        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            console.log(TAG + `Reached edge of board`);
            break; // stop if we go out of bounds
        }
        const sqr = chessboard.gameState.get(pos)
        squares.push(sqr)
        // console.log(TAG + `Checking left path: ${file}${nxtY}`);
    }


    // console.log(TAG + `Now checking right path... ${maxStepsRight}`);

    // Moving right and down, increasing file, decreasing rank
    nxtX = x;
    nxtY = y;
    console.log(TAG + `calculate right + down`)

    for (let i = 0; i < maxStepsRight; i++) {

        nxtX += 1; // move right one file
        nxtY -= 1; // move down according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            console.log(TAG + `Reached edge of board at ${file}${nxtY}, stopping right path calculation.`);
            break; // stop if we go out of bounds
        }

        const sqr = chessboard.gameState.get(pos)
        const piece = sqr.piece // checked square piece
        squares.push(sqr)

        if (piece !== null && piece !== "empty") {
            console.log(TAG + `found piece on square: `, piece)
            if (piece.color !== selectedPiece.color) {
                console.log(TAG + ` checking square ${pos} for piece: ${piece}`)
            }

        }

    }

    nxtX = x;
    nxtY = y;
    console.log(TAG + ` calculate right + up`);
    for (let i = 0; i < maxStepsRight; i++) {
        nxtX += 1; // move right one file
        nxtY += 1; // move up according to slope

        const file = String.fromCharCode(nxtX);
        const pos = file + nxtY
        console.warn(TAG + `Checking square: ${pos}`)
        if (file.charCodeAt(0) < xMin || file.charCodeAt(0) > xMax || nxtY < yMin || nxtY > yMax) {
            console.log(TAG + `Reached edge of board at ${file}${nxtY}, stopping right path calculation.`);
            break; // stop if we go out of bounds
        }

        const sqr = chessboard.gameState.get(pos)
        const piece = sqr.piece // checked square piece
        squares.push(sqr)
    }

    selectedPiece.moves = squares;
}