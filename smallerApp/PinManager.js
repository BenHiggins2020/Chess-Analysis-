
export class PinManager {
    constructor() {
        this.TAG = "PinManager: "
        this.allSquares = [];
        this.pinnedPieceFlag = false;
        this.pinnedPiece = null;
        this.pinCounter = 0;
    }

    resetPinCount() {
        this.pinCounter = 0;
    }

    addSquare(square) {
        this.allSquares.push(square);
    }

    // Iterate through all the pieces
    // calculate their moves, 

    checkForPins() {

    }

}