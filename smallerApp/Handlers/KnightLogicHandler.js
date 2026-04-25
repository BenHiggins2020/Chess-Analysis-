import { Square } from "../Square.js";

export class KnighLogicHandler {
    constructor() {
        this.TAG = "KnighLogicHandler: ";
    }

    /**
     *  Calculates moves for a knight at square
     * @param {Square} fromSquare 
     * @returns 
     */
    static calculateKnightMoves(fromSquare) {

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

        // selectedPiece.moves = moves;
        return moves;
    }
}