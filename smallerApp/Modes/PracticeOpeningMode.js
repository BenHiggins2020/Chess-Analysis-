// import { parseCompressedPGN } from "../Util/PGN/PGNParser_gemma.js";
import { GameStateManager } from "../GameStateManage.js";
import { parsePGN } from "../Util/PGN/PGNParser_sonnet.js";

export class PracticeOpeningMode {
    constructor() {
        this.TAG = "PracticeMode: ";
        this.modelPGN = null;
        this.pgn = null; // do not use this!!
        this.playerPGN = null;

        this.moves = null;
        this.playerMoves = null;

        this.moveNum = 0;
        this.setupComplete = false;

    }

    //set PGN 

    // for player, allow them to make move 

    // if move does not match the pgn move - illegal! do not allow it! 

    //For this we will need to keep track of the move count. 
    // on each move, we will need to parse the original pgn, to check if these moves are correct. 

    // we will also need to feed computer moves from a specific line... 

    /**
     * Sets and begins parsing the selected game PGN. 
     * 
     * @param {string} PGN 
     */
    loadPGN(PGN) {
        this.setupComplete = false;
        this.modelPGN = PGN;

        this.pgn = PGN; // This may be a mistake... 
        const moves = this.parse(PGN);
        console.log(this.TAG + `parsed PGN: `, moves)
        // console.log(this.TAG + `moves: `, moves);
        this.moves = moves;
        this.setupComplete = true;
    }

    /**
     *  This will confirm whether the pgnMove made matches! 
     * @param {string} new PgnMove, 
     */
    handleOnMove() {
        // console.log(this.TAG + `new PgnMove: ${newPgnMove} for move Num: ${this.moveNum}`);
        console.warn(this.TAG + ` playerMoves: `, this.playerMoves.moves);
        console.warn(this.TAG + ` PGN Moves: `, this.moves.moves);

        const pmoves = this.playerMoves.moves;
        let playerMove = pmoves[pmoves.length - 3]
        let move = this.moves.moves[this.playerMoves.moves.length - 3];

        console.log(this.TAG + ` Correct Move should be :`, move);
        console.log(this.TAG + ` ... was`, playerMove);

    }

    parse(PGN) {


        // console.log(this.TAG + `parsing... `, PGN);
        // console.log(this.TAG + `no PGN found... was one set? `, this.pgn)

        if (PGN !== null) {
            this.pgn = PGN;
        } else {
        }

        let moves = null// parseCompressedPGN(PGN);

        moves = parsePGN(PGN); // parsing via claude sonnet. 
        // console.log(this.TAG + `moves: `, moves);
        return moves;
    }

    localPaser(PGN) {
        console.log(this.TAG + `parsing... `);
        if (PGN !== null) {
            this.pgn = PGN;
        }
        const lines = this.pgn.split('\n');
        let result = { game: {} };
        let headersFinished = false;
        let moves = '';

        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();

            if (!headersFinished && line.startsWith('[')) {
                // Parse headers
                const match = line.match(/\[(\w+) "(.*)"\]/);
                if (match) {
                    result.game[match[1]] = match[2];
                }
            } else if (line.length > 0 && !line.startsWith('{')) {
                headersFinished = true;
                moves += line + ' ';
            }
        }

        // Parse moves
        const moveList = [];
        let moveNumber = '';
        let whiteMove = '';
        let blackMove = '';

        for (let token of moves.trim().split(' ')) {
            // console.log(this.TAG + `  token: ${token}, includes '.'? ${token.includes('.')}`)
            if (token.includes('.')) {

                [moveNumber, whiteMove] = token.split('.');
                // console.log(this.TAG + ` whitemove: ${whiteMove}`)
                if (whiteMove.includes('.')) {
                    whiteMove = whiteMove.split('.')[1];
                    // console.log(this.TAG + `fixing whitemove: ${whiteMove}`);
                }


            }

            if (!isNaN(token) && token.includes('.')) {
                // Move number
                [moveNumber, whiteMove] = token.split('.');
                // console.log(this.TAG + ` token: ${token}, moveNumber: ${moveNumber} whiteMove: ${whiteMove}`)
            } else if (!isNaN(parseInt(token[0])) || token === 'O-O' || token === 'O-O-O') {
                // White's move
                // whiteMove = token;
            } else if (token.startsWith('{')) {
                // Comment, skip it
                continue;
            } else {
                // Black's move
                blackMove = token;

                // Add the full move to the list
                const fullMove = { number: moveNumber, white: whiteMove, black: blackMove };
                moveList.push(fullMove);

                // Reset for next move pair
                moveNumber = '';
                whiteMove = '';
                blackMove = '';
            }
        }

        result.moves = moveList;
        return result;
    }


    loadPlayerPGN(PGN) {
        // may need a different parser...  the pgn loads things one at a time, it doesnt pars
        this.playerPGN = PGN
        this.playerMoves = this.parse(this.playerPGN);
        console.log(this.TAG + `new player pgn: `, this.playerPGN)

        console.log(this.TAG + `new playermoves pgn: `, this.playerMoves)
        //this.handleOnMove();

    }


}