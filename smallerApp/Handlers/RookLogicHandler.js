import { Square } from "../Square.js";
import { GameStateManager } from "../GameStateManage.js";
import { BoardLogicHandler } from "./BoardLogicHandler.js";

export class RookLogicHandler {
    static TAG = "RookLogicHandler: "
    constructor() {

    }

    static calculateRookMovesForSquare(fromSquare, color) {
        const currentRank = fromSquare.rank;
        const currentFile = fromSquare.file;
        const fileCode = currentFile.charCodeAt(0);

        const ranks = BoardLogicHandler.validRanks;
        const files = BoardLogicHandler.validFiles;


        const ranksAbove = ranks.filter((rank) => {
            console.log(this.TAG + `${Number(rank)} > ${Number(currentRank)} where ${currentRank} instanceOfNumber = ${Number(currentRank) instanceof Number}`)
            return Number(rank) > Number(currentRank);
        });

        const ranksBelow = ranks.filter((rank) => {
            return Number(rank) < Number(currentRank);
        }).reverse(); // reverse so we can count out from this (@4) 3, 2, 1. 

        const filesRight = files.filter((file) => {
            return file.charCodeAt(0) < fileCode;
        }).reverse(); // reversed so we can count up from this value (@d) c, b, a

        const filesLeft = files.filter((file) => {
            return file.charCodeAt(0) > fileCode;
        });

        let pieceFound = false;
        const upMoves = ranksAbove.map((rank) => {
            //file is constant:
            const { pos, shouldBreak } = this.addPositionRankCheck(currentFile, rank, color, pieceFound);
            pieceFound = shouldBreak;
            if (pieceFound) return undefined;
            return pos;
        }).filter((pos) => {
            return pos !== undefined && pos !== ''
        })

        pieceFound = false;

        const downMoves = ranksBelow.map((rank) => {
            //file is constant:
            const { pos, shouldBreak } = this.addPositionRankCheck(currentFile, rank, color, pieceFound);
            pieceFound = shouldBreak;
            if (pieceFound) return undefined;
            return pos;
        }).filter((pos) => {
            return pos !== undefined && pos !== ''
        })
        pieceFound = false;

        const rightMoves = filesRight.map((file) => {
            const { pos, shouldBreak } = this.addPositionRankCheck(file, currentRank, color, pieceFound);
            pieceFound = shouldBreak;
            if (pieceFound) return undefined;
            // console.log(this.TAG + `returning pos: ${pos}`)

            return pos;
        }).filter((pos) => {
            return pos !== undefined && pos !== ''
        })
        // console.log(this.TAG + `[${fromSquare.position}] Files Right of piece `, rightMoves);

        const leftMoves = filesLeft.map((file) => {
            const { pos, shouldBreak } = this.addPositionRankCheck(file, currentRank, color, pieceFound);
            pieceFound = shouldBreak;
            if (pieceFound) return undefined;
            return pos;
        }).filter((pos) => {
            return pos !== undefined && pos !== ''
        })

        const moves = []

        // console.log(this.TAG + `[${fromSquare.position}] Ranks higher than piece `, upMoves);
        moves.push(...upMoves);
        // console.log(this.TAG + `[${fromSquare.position}] Ranks lower than piece `, downMoves);

        moves.push(...downMoves);
        // console.log(this.TAG + `[${fromSquare.position}] Files Right of piece `, rightMoves);

        moves.push(...rightMoves);
        // console.log(this.TAG + `[${fromSquare.position}] Files Right of piece `, leftMoves);

        moves.push(...leftMoves);

        moves.map((pos) => {
            return GameStateManager.getInstance().getSquare(pos);
        })

        return moves
    }

    static addPositionRankCheck(file, rank, color, shouldBreak2) {
        let shouldBreak = shouldBreak2;
        let pos = file + rank;
        if (shouldBreak) return { pos, shouldBreak };

        if (!BoardLogicHandler.validateRank(rank)) {
            return { pos, shouldBreak };
        }

        console.log(this.TAG + `Got position: ${pos}`);

        const sqr = GameStateManager.getInstance().getSquare(pos);
        console.log(this.TAG + `Got sqr: w/piece`, sqr.piece);

        if (sqr.piece !== null) {
            console.warn(this.TAG + `piece found on :${pos}`);
            shouldBreak = true

            if (sqr.piece.color === color) {
                pos = '';

                const value = { pos, shouldBreak }
                console.warn(this.TAG + `piece found on :${pos} is the same color returning `, value);
                return { pos, shouldBreak };
            } else {
                console.warn(this.TAG + `piece found on :${pos} is opposite color (${color} v ${sqr.piece.color})`);


                return { pos, shouldBreak }
            }
        }

        return { pos, shouldBreak };
    }

    /**
     * 
     * @param {Square} fromSquare 
     * @returns Array of Squares for possible moves of a piece at this position
     */
    static calculateRookMovesForSquare2(fromSquare) {
        console.log(this.TAG + `calculatingRookMoves... `);

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