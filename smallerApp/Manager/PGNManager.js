import { GameStateManager } from "../GameStateManage.js";

export class PGNManager {
    static TAG = "PGNManager: "
    constructor() {
        this.TAG = "PGNManager: "
        this.PGN = " 1. e4 d5 2. exd5 Qxd5 3. Nc3 (3. Nf3 Bg4 (3... Nc6 4. d4) 4. Be2 Nc6 5. O-O (5. d4 O-O-O) 5... O-O-O 6. Nc3 Qd7 7. b4 Nf6 8. b5 Bxf3 9. Bxf3 Nd4 10. a4 Qf5) ( 3. d4 Nf6 4. Nc3) (3. c4 Qe4+ 4. Qe2 Qxe2+ 5. Bxe2 Nc6) 3... Qa5 (3... Qd8 4. d4 Nf6 5. Nf3 Bg4 6. Bc4 e6 7. O-O Nc6) (3... Qd6 4. d4 Nf6 5. Nf3 a6 6. Be2 Nc6 7. O-O Bf5 8. Be3 O-O-O) 4. d4 (4. Bc4 Nf6 5. Nf3 Bg4 6. O-O e6) (4. b4 Qxb4 5. Rb1 Qd6 6. d4 Nf6 7. g3 Nc6) (4. Nf3 Nf6 5. Bc4 Bg4 6. O-O Nc6) 4... Nf6 5. Nf3 (5. Bd2 c6 6. Nf3 Bg4 7. Bc4 e6 8. O-O Qc7 9. Re1 Be7) 5... Bg4 (5... Bf5 6. Bc4 e6 7. Bd2 c6 8. O-O Qc7 9. Re1 Be7 10. Rc1 Nbd7) 6. h3 Bh5 7. Be2 (7. g4 Bg6 8. Ne5 e6 9. h4) 7... Nc6 8. O-O O-O-O 9. Be3 e5 *"
    }

    static getSquareFromMove(moveNum, PGN) {
        let pgn = PGN;
        pgn = this.extractHeader(pgn);
        this.extractMoveSubstring(moveNum, pgn)

        // const pgnMove = this.extractMoveSubstringFromPGN(moveNum, pgn);
        this.extractMoveFromLine(pgn);
    }

    static extractMoveSubstring(number, PGN) {
        let numStr = number + '. '

        // let movesubStart = PGN.lastIndexOf(numStr);
        let pgnTracker = GameStateManager.getInstance().PGNTracker
        console.log(this.TAG + ` got move num: `, pgnTracker.moveCount())

        console.log(this.TAG + ` got fen: `, pgnTracker.fen())

        console.log(this.TAG + ` got history of moves: `, pgnTracker.history)

    }

    static extractMoveSubstringFromPGN(moveNum, PGN) {
        let searchForMove = moveNum === 1 ? (moveNum) + '.' : moveNum - 1 + '.'
        console.log(this.TAG + `searching for moveNum: '${searchForMove}'`)
        let moveIndex = PGN.indexOf(searchForMove);

        console.log(this.TAG + `got index of move number (${moveNum}): ${moveIndex}`);

        // current move check for next move. 

        let nextMove = (moveNum + 1) + '. ';
        let nextMoveIndex = PGN.indexOf(`${nextMove}`);
        if (nextMoveIndex === -1 || moveNum === 1 || moveNum === -1) {
            // next move was not found. Check if we should look for end of game (*)
            nextMove = '*'
            let firstStarI = PGN.indexOf('*')
            nextMoveIndex = PGN.lastIndexOf('*');
            console.log(this.TAG + `next move was not found. Checking for final move (*), first index of Star: ${firstStarI} , then last index of: ${nextMoveIndex} `)
        }

        const substring = PGN.substring(moveIndex, nextMoveIndex);
        console.log(this.TAG + `got substring: ${substring}`);

        console.log(this.TAG + `got index of next move number (${nextMove}): ${nextMoveIndex}`);

        return substring;
    }

    static extractMoveFromLine(singleMoveStr) {
        let moves = singleMoveStr.substring(2, singleMoveStr.length);
        console.log(this.TAG + `singleMoveStr - header: ${moves}`);
        moves = moves.split(' ');
        console.log(this.TAG + `split: [0]${moves[0]}, [1] ${moves[1]}`, moves);

    }

    static extractHeader(PGN) {
        const lastIndexOfHeader = PGN.lastIndexOf(']');
        const newStr = PGN.substring(lastIndexOfHeader + 1, PGN.length);
        console.log(this.TAG + `extracted string: `, newStr)
    }
}