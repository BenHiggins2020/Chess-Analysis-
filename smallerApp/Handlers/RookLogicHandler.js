import { Square } from "../Square.js";
import { GameStateManager } from "../GameStateManage.js";

export class RookLogicHandler {
    static TAG = "RookLogicHandler: "
    constructor() {

    }

    /**
     * 
     * @param {Square} fromSquare 
     * @returns Array of Squares for possible moves of a piece at this position
     */
    static calculateRookMovesForSquare(fromSquare) {
        console.log(this.TAG + `calculatingRookMoves... `);
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
            console.log(this.TAG + `Squares for rook: ${square.position}`);
        })
        // piece.moves = squares
        return squares

    }

}