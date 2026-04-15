
const TAG = "PawnMoveHandler: ";

export const handlePawnMove = (fromSquare, toSquare, piece, chessboard) => {
    //Pawns can move on the same file but cannot move past another piece, but they can only capture diagonally. 
    const isToSquareEmpty = toSquare.piece === 'empty' || toSquare.piece === null;

    const isDiagonalMove = fromSquare.file !== toSquare.file;
    const isStraightMove = fromSquare.file === toSquare.file;

    const fileDiff = Math.abs(fromSquare.file.charCodeAt(0) - toSquare.file.charCodeAt(0));
    const rankDiff = Math.abs(fromSquare.rank - toSquare.rank);

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