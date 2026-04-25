import { Square } from "../Square.js";
import { GameStateManager } from "../GameStateManage.js";
import { BoardLogicHandler } from "./BoardLogicHandler.js";

export class BishopLogicHandler {
    static #instance = null;
    static TAG = "BishopLogicHandler: ";
    constructor(name) {

        if (BishopLogicHandler.#instance) {
            throw new Error("Error creating bishoplogic handler. use getInstance");
        }
    }

    static getInstance(name = "Default Instance") {
        if (!BishopLogicHandler.#instance) {
            BishopLogicHandler.#instance = new BishopLogicHandler(name);
        }

        return BishopLogicHandler.#instance;
    }

    static calculateBishopMovesForSquare(fromSquare) {
        console.log(this.TAG + ` Calculating bishop moves on square ${fromSquare.position}`)
        const moves = [];
        let xMin = "a".charCodeAt(0) // x = 1 for file 'a'
        let xMax = "h".charCodeAt(0) // x = 8 for file 'h'

        let x = fromSquare.file.charCodeAt(0);
        let y = fromSquare.rank;

        let distX = xMax - x;
        // right - up diagonal 
        // x increases, y increases; 

        const files = BoardLogicHandler.validFiles;
        let filesRight = files.filter((file) => file.charCodeAt(0) > x);

        let rank = y;
        let foundPiece = false;
        const upDiagR = filesRight.map((file) => {
            // console.log(this.TAG + `checking position: ${file}${rank + 1}`);
            rank += 1
            if (foundPiece) return undefined;
            if (!BoardLogicHandler.validateRank(rank)) {
                // console.log(this.TAG + `Do nothing! its an invalid rank/position  ${file}${rank} `)
                return undefined;
            }

            const pos = file + rank;
            if (!BoardLogicHandler.isSquareEmpty(pos)) {
                foundPiece = true; // this is the last square to include in row!;

                // Only include it if square is opposite color: 
                const sqr = GameStateManager.getInstance().getSquare(pos);
                //
            }
            // console.log(this.TAG + `returning position! ${file}${rank} `)
            return pos;

        }).filter((pos) => {
            return pos !== undefined;
        });


        rank = y;
        foundPiece = false;
        const downDiagR = filesRight.map((file) => {
            // console.log(this.TAG + `checking position: ${file}${rank - 1}`);
            rank -= 1
            if (foundPiece) return undefined;
            if (!BoardLogicHandler.validateRank(rank)) {
                // console.log(this.TAG + `Do nothing! its an invalid rank/position  ${file}${rank} `)
                return undefined;
            }
            const pos = file + rank;
            if (!BoardLogicHandler.isSquareEmpty(pos)) {
                foundPiece = true; // this is the last square to include in row!;

                // Only include it if square is opposite color: 
                const sqr = GameStateManager.getInstance().getSquare(pos);
                //
            }
            // console.log(this.TAG + `returning position! ${file}${rank} `)
            return pos;
        }).filter((pos) => {
            // console.log(this.TAG + `filtering: ${pos}`)
            return pos !== undefined;
        });


        const diags = [];
        moves.push(...upDiagR);
        moves.push(...downDiagR);

        let filesLeft = files.filter((file) => file.charCodeAt(0) < x);
        filesLeft.reverse(); // reverse so incrementing is correct

        rank = y;
        foundPiece = false;
        const diagLUp = filesLeft.map((file) => {
            rank += 1;
            if (foundPiece) return undefined;
            if (!BoardLogicHandler.validateRank(rank)) {
                return undefined;
            }

            const pos = file + rank;
            if (!BoardLogicHandler.isSquareEmpty(pos)) {
                foundPiece = true; // this is the last square to include in row!;

                // Only include it if square is opposite color: 
                const sqr = GameStateManager.getInstance().getSquare(pos);
                //
            }
            // console.log(this.TAG + `returning position! ${file}${rank} `)
            return pos;

        }).filter((pos) => {
            return pos !== undefined && BoardLogicHandler.isSquareEmpty(pos)
        })


        rank = y;
        const diagLDown = filesLeft.map((file) => {
            rank -= 1;
            if (!BoardLogicHandler.validateRank(rank)) {
                return undefined;
            }
            const pos = file + rank;
            if (!BoardLogicHandler.isSquareEmpty(pos)) {
                foundPiece = true; // this is the last square to include in row!;

                // Only include it if square is opposite color: 
                const sqr = GameStateManager.getInstance().getSquare(pos);
                //
            }
            // console.log(this.TAG + `returning position! ${file}${rank} `)
            return pos;

        }).filter((pos) => {
            return pos !== undefined
        })

        console.log(this.TAG + `[${fromSquare.position}] Right Side diagonal going Up: \n`, upDiagR);
        console.log(this.TAG + `[${fromSquare.position}] Right Side diagonal going Down: \n`, downDiagR);

        console.log(this.TAG + `[${fromSquare.position}] Left Side diagonal going Up: \n`, diagLUp);
        console.log(this.TAG + `[${fromSquare.position}] Left Side diagonal going Down: \n`, diagLDown);

        moves.push(...diagLUp);
        moves.push(...diagLDown);

        console.log(this.TAG + `Calculated Bishop moves: ${moves.length} \n`, moves);
        return moves;

    }

    /**
     * Calculates possible moves for a bishop at specified square
     * @param {Square} fromSquare 
     * @returns 
     */
    static calculateBishopMovesForSquare2(fromSquare) {
        console.log(this.TAG + ` Calculating bishop moves on square ${fromSquare.position}`)

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
            }
            allSquares.push(sqr);
        }
        console.log(this.TAG + ` bishop's current moves...  ${squares.length}`);

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
            if (sqr.piece === null) {
                // There is a piece on the square, lets include this as the last one. 
                squares.push(sqr)

                allSquares.push(sqr);
            }

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
                }
                allSquares.push(sqr);
            }



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
                }
                allSquares.push(sqr);
            }

            console.log(this.TAG + `Total moves for a Bishop on ${fromSquare.position}, ${squares.length}`);
            return squares;
        }
        console.log(this.TAG + ` bishop's current moves...  ${squares.length}`);


    }
}
