import { calculateKingMoves, calculateKnightMoves, calculatePawnMoves, calculateQueenMoves, calculateRookMoves, calculateBishopPath } from "./MoveHandler.js";
import { Square } from "./Square.js";
import { Piece } from "./Piece.js";
import { PGNParserUtil } from "./Util/PGNParserUtil.js";
import { ClaudePGNParser } from "./Util/claudePgnParser.js";
import { createPGNTracker } from "./Util/PGNWriter.js";
import { createStockfish } from "./Repository/StockfishApi.js";
import { KingLogicHandler } from "./Handlers/KingLogicHandler.js";
import { PawnLogicHandler } from "./Handlers/PawnLogicHandler.js";
import { BishopLogicHandler, } from "./Handlers/BishopLogicHandler.js";
import { RookLogicHandler } from "./Handlers/RookLogicHandler.js";
import { PGNManager } from "./Manager/PGNManager.js";
import { ChessNavigator } from "./Util/ChessNavigator.js";
import { buildCoachPrompt } from "./Util/PromptUtil.js";
import { executePlayerMove, applyNavigatorUndo, applyNavigatorRedo } from "./GameMoveProcessor.js";
import { PracticeOpeningMode } from "./Modes/PracticeOpeningMode.js"

export class GameStateManager {
    static #instance = null;
    #selected = null
    #turn = 'white';
    #gameState = new Map(); // key: square position (e.g. "e4"), value: Square object
    #fenState = new Map();
    #pieceNameMap = new Map()
    constructor(name) {
        this.playComputer = true;
        this.TAG = "GameStateManager: "
        if (GameStateManager.#instance) {
            throw new Error("Use getInstance")
        }
        this.name = name
        this.player = "white";
        this.stockfishLines = 4; // default lines for <= 1200 rating
        GameStateManager.#instance = this;

        this.practiceMode = new PracticeOpeningMode();

        this.pgnParser = new ClaudePGNParser();
        //Handle King stuff: 
        this.blackKingMoves = [];
        this.blackKingPos = 'e8';
        this.whiteKingMoves = [];
        this.whiteKingPos = 'e1';
        this.eval_before = 0;
        this.eval_after = 0;
        this.PGNTracker = createPGNTracker({ "White": "Player 1", "Black": "Player 2" });
        //this.stockfish = await createStockfish(); // from the earlier helper
        this.setupStockfish();

        this.moveObj = {
            toSquare: "",
            froMSquare: ""
        }

        this.moveList = new Map();
        this.currentMoveNumber = 0;
        this.nav = new ChessNavigator();

    }

    setStockfishLines(lines) {
        this.stockfishLines = lines;
    }

    async setupStockfish() {
        this.stockfish = await createStockfish();
    }

    computerMove() {
        const fen = this.PGNTracker.fen();
        this.analyse(fen).then((result) => {
            console.log(this.TAG + `Stockfish analysis result to start the game... `, result);
            console.log(this.TAG + `Stockfish analysis result =  `, result.bestMove);
            const bestMove = result.bestMove;
            const pos1 = bestMove.substring(0, 2);
            const pos2 = bestMove.substring(2, 4);
            this.handleMove(pos1, pos2);


        });
    }

    onStart() {
        // Disable radio buttons, 
        const selectedOption = document.querySelector('input[name="play-as"]:checked');
        console.log(this.TAG + `Player chose to play as: ${selectedOption.value}`);
        this.player = selectedOption.value;

        // need to have computer make the first move as white.
        // flip the board. 
        this.flipBoard();

        if (this.player === 'black') {
            // Computer makes the first move as white.
            if (this.stockfish) {
                const fen = this.PGNTracker.fen();
                console.log(this.TAG + `Generating FEN for initial position... ${fen}`);
                this.computerMove();
            } else {
                console.warn(this.TAG + "Stockfish is not initialized yet. Cannot make the first move as white.");
                this.setupStockfish().then(() => {
                    this.computerMove();
                });
            }
        }
        // }

    }


    flipBoard() {
        if (this.player === 'black') {
            console.log(this.TAG + "Flipping board 180deg (playing as black)...");
            const board = document.getElementById("board");
            board.style.transform = "rotate(180deg)";
            this.#gameState.forEach((square) => {
                square.UI_ref.style.transform = "rotate(180deg)";
            });
        } else {
            console.log(this.TAG + "Flipping board 0deg (playing as black)...");
            const board = document.getElementById("board");
            board.style.transform = "rotate(0deg)";
            this.#gameState.forEach((square) => {
                square.UI_ref.style.transform = "rotate(0deg)";
            });
        }
    }

    get currentTurn() {
        return this.#turn;
    }

    set currentTurn(color) {
        if (color !== 'white' && color !== 'black') {
            console.error(this.TAG + "Invalid player color: " + color);
            return;
        }
        console.log(this.TAG + `Switching turn to: ${color}`);
        this.#turn = color;
    }

    generateChessboard = () => {
        console.log(this.TAG + "Generating chessboard...");
        // const chessboard = document.getElementById('chessboard-container');
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = [8, 7, 6, 5, 4, 3, 2, 1];
        for (let rank of ranks) {
            for (let file of files) {
                const squareObj = new Square(file, rank, this);
                const squareName = squareObj.file + squareObj.rank;
                this.#gameState.set(
                    squareName,
                    squareObj
                );
            }
        }
    }

    setPieces = () => {
        if (this.#gameState.size === 0) {
            console.error(this.TAG + "Game state is empty. Cannot set pieces.");
            return;
        }

        // Set Pawns: Rank 2
        let rank = 2;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('P', 'w', this);
            const square = this.#gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        rank = 7;
        for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
            const piece = new Piece('p', 'b', this);
            const square = this.#gameState.get(`${file}${rank}`);
            square.setPiece(piece);
        }

        let rookPositions = ['a1', 'h1']
        for (let pos of rookPositions) {
            const piece = new Piece('R', 'w', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        rookPositions = ['a8', 'h8']
        for (let pos of rookPositions) {
            const piece = new Piece('r', 'b', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        let knightPositions = ['b1', 'g1']
        for (let pos of knightPositions) {
            const piece = new Piece('N', 'w', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        knightPositions = ['b8', 'g8']
        for (let pos of knightPositions) {
            const piece = new Piece('n', 'b', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        let bishopPositions = ['c1', 'f1']
        for (let pos of bishopPositions) {
            const piece = new Piece('B', 'w', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }
        bishopPositions = ['c8', 'f8']
        for (let pos of bishopPositions) {
            const piece = new Piece('b', 'b', this);
            const square = this.#gameState.get(pos);
            square.setPiece(piece);
        }

        let queenPosition = 'd1';
        let piece = new Piece('Q', 'w', this);
        let square = this.#gameState.get(queenPosition);
        square.setPiece(piece);
        queenPosition = 'd8';

        piece = new Piece('q', 'b', this);
        square = this.#gameState.get(queenPosition);
        square.setPiece(piece);

        let kingPosition = 'e1';
        piece = new Piece('K', 'w', this);
        square = this.#gameState.get(kingPosition);
        square.setPiece(piece);

        kingPosition = 'e8';
        piece = new Piece('k', 'b', this);
        square = this.#gameState.get(kingPosition);
        square.setPiece(piece);

        // Now we need to place this piece on the correct square based on its type and color.
        // For example, for white pieces:
        // - Pawns (P) go on rank 2 (a2, b2, c2, d2, e2, f2, g2, h2)
        // - Rooks (R) go on a1 and h1
        // - Knights (N) go on b1 and g1
        // - Bishops (B) go on c1 and f1
        // - Queen (Q) goes on d1
        // - King (K) goes on e1
        // For black pieces, it's similar but on ranks 7 and 8.
    };

    clearPieces() {
        this.#gameState.forEach((square) => {
            if (square.piece) {
                square.removePiece();
            }
        });

    }

    get GameState() {
        return this.#gameState;
    }

    setSelected(square) {
        // console.log(this.TAG + `square: `, square);

        const piece = square.piece;

        // selecting a new piece, deselect. 
        if (this.#selected !== null) {
            this.#selected.onDeselected();
        }

        // Deselect on second selection. 
        if (this.#selected === piece) {
            this.deselect();
            return;
        }

        console.log(this.TAG + `selecting: ${piece.type} on ${square.position}`)
        this.#selected = piece
        this.#selected.onSelected();
    }

    deselect() {
        if (this.#selected !== null) {
            console.log(this.TAG + `deselecting: ${this.#selected.type}`)
            this.#selected.onDeselected();
            this.#selected = null;
        }
    }

    static getInstance(name = "Default Instance") {
        if (!GameStateManager.#instance) {

            GameStateManager.#instance = new GameStateManager(name);
        }
        return GameStateManager.#instance;
    }

    getSquare(position) {
        return this.#gameState.get(position);
    }

    resetBoard() {
        this.clearPieces();
        this.setPieces();
        // clear fen and pgn
        // this.whiteKingMoves = [];
        // this.whiteKingPos = 'e1';
        // this.blackKingMoves = [];
        // this.blackKingPos = 'e8';
        this.checked = null;
        this.PGNTracker.reset({ White: "Player 1", Black: "Player 2" });

        this.#turn = 'white';
        this.updateStatus(this.#turn);
        this.updatePGN("");
        this.currentMoveNumber = 0;


    }

    // Todo replace this with KingLogicHandler... 
    updateKingSquares(square) {
        //square is the new square the king is on... 
        const kingMoves = []
        calculateKingMoves(square).forEach((sqr) => {
            kingMoves.push(sqr.position)
        });

        switch (square.piece.color) {
            case "white":
                this.whiteKingPos = square.position;
                this.whiteKingMoves = kingMoves;
                break;
            case "black":
                this.blackKingPos = square.position;
                this.blackKingMoves = kingMoves;
                break;
        }


    }

    // After a move, check if it threatens king.
    // the square paramter should be for a new piece...  
    /**
     *  Takes the square of an opponent piece, and checks whether or not it will check the king. 
     * This should be able to be done pre-emptively... 
     * @param {Square} square position of Opposite color.  
     * @param {Piece} piece which we are checking could be threatening. 
     */
    checkForThreats(square, threateningPiece) {
        let piece = threateningPiece !== null ? threateningPiece : square.piece;
        console.log(this.TAG + `Checking for Threats from ${piece.type} ${square.position}
             w/ ${piece.color} ${piece.type}`);

        // Check if the piece on this square threatens the opposite king? 
        // Threatens means, that the piece can move to a square that the king can also move (or is on). 
        // Take moves away from the king. 
        // Check if the king is in Check. 

        let moves = this.calculateMovesForPieceOnSquare(square, piece).filter((sqr) => { return sqr !== undefined }); // attacking piece moves from square...
        console.log(this.TAG + `moves =  `, moves);
        let kingSquare = null;

        if (moves === undefined) {
            console.log(this.TAG + `Moves were undefined! just going to return for now... `);
            return;
        }

        switch (piece.color) {
            case 'black':
                // console.log(this.TAG + ` Black's ${square.piece.type} on ${square.position} `)

                kingSquare = this.#gameState.get(KingLogicHandler.getInstance().whiteKingPos);

                const kingThreat = KingLogicHandler.getInstance().checkForThreatOnSquare(kingSquare, "white");
                console.log(this.TAG + `moves : ${moves.length}`, moves)
                let movesCoords = moves.map((sqr) => { sqr.position });
                console.log(this.TAG + `movesCoords =  `, movesCoords);
                if (moves.includes(
                    (kingSquare)
                )) {
                    console.warn(this.TAG + ` CHECK!!! `)
                    this.setChecked('white');
                    // Check!!
                }

                // Calculate the moves for king. 
                let whiteKingMoves = this.calculateMovesForPieceOnSquare(kingSquare);
                const initialWhiteKingMovesCount = whiteKingMoves.length;

                whiteKingMoves.forEach((sqr) => {

                    // console.log(this.TAG + `checking white king move: ${sqr.position} against list of Checking piece moves: ${moves.includes(sqr)}`)

                    if (moves.includes(sqr)) {
                        // console.log(this.TAG + `removing white king move: ${sqr.position} from legal moves, because it is threatened by piece on ${square.position}`)
                        whiteKingMoves = whiteKingMoves.filter((value, index, moves) => {
                            !moves.includes(value)
                        })
                    }
                })

                kingSquare.moves = whiteKingMoves; // update the king moves in the piece object.
                // console.log(this.TAG + `filtered white king moves: ${this.whiteKingMoves.length} of ${initialWhiteKingMovesCount}`)

                // check for threats 
                break;

            case 'white':

                kingSquare = this.#gameState.get(KingLogicHandler.getInstance().blackKingPos);
                let blackKingMoves = this.calculateMovesForPieceOnSquare(kingSquare);

                // console.log(this.TAG + ` White's ${square.piece.type} on ${square.position} `)
                if (moves.includes((this.#gameState.get(blackKingMoves)))) {
                    // Check!!
                    console.warn(this.TAG + ` CHECK!!! `)
                    this.setChecked('black');
                }
                // blackKingMoves = this.calculateMovesForPieceOnSquare(this.#gameState.get(KingLogicHandler.getInstance().blackKingPos));
                const initialBlackKingMovesCount = this.blackKingMoves.length;
                blackKingMoves.forEach((sqr) => {

                    // console.log(this.TAG + `checking black king move: ${sqr.position} against list of Checking piece moves: ${moves.includes(sqr)}`)

                    if (moves.includes(sqr)) {
                        this.blackKingMoves = this.blackKingMoves.filter((value, index, moves) => {
                            !moves.includes(value)
                        })

                        // console.log(this.TAG + `filtered blackKingMoves moves: ${this.blackKingMoves.length} of 8`)

                        // this.blackKingMoves.forEach((move) => {
                        // console.log(this.TAG + `black king moves: ${move.position}`)
                        // })
                    }
                })
                this.#gameState.get(this.blackKingPos).piece.moves = this.blackKingMoves; // update the king moves in the piece object.
                // console.log(this.TAG + `filtered black king moves: ${this.blackKingMoves.length} of ${initialBlackKingMovesCount}`)
                // check for threats on black... 
                break;
        }
    }

    calculateMovesForPieceOnSquare(square, calculatingForPiece = null) {
        let piece = square.piece;

        if (calculatingForPiece === null) {
            // continue, we are just checking the moves for a piece that is already on the square (fromSquare)
            // piece = square.piece
            console.log(this.TAG + `calculating Moves... got: `, piece)
        } else {
            console.warn(this.TAG + `calculating (future?) moves for piece ${calculatingForPiece.type} on at position: ${square.position}`)
            piece = calculatingForPiece;
        }

        let moves = []
        switch (piece.type.toString().toUpperCase()) {
            case "P":
                moves = PawnLogicHandler.getInstance().getLegalPawnMoves(square, null);
                // moves = calculatePawnMoves(square);//PawnLogicHandler.getInstance().getLegalPawnMoves(square, null);

                // console.log(this.TAG + `moves: ${moves} `, result)
                break;
            case "K":
                moves = calculateKingMoves(square);
                break;
            case "B":
                moves = BishopLogicHandler.calculateBishopMovesForSquare(square);
                break;
            case "Q":
                moves = calculateQueenMoves(square);
                break;
            case "R":
                moves = RookLogicHandler.calculateRookMovesForSquare(square);
                break;
            case "N":
                moves = calculateKnightMoves(square);
                break;
        }
        console.log(this.TAG + `calculated moves: ${moves.length} for ${piece.type}`)
        return moves;
    }

    setChecked(color) {
        // set the king of this color to checked.
        this.checked = color;
        //Disable all moves that do not get the king out of check.

        // King gets out of check by, moving to a square that is not threatened,
        //  blocking the check with another piece,
        //  or capturing the checking piece.


    }


    findSquare(squareNotation) {
        // Convert the notation to row and column indices.  Handles both
        // algebraic and numeric notations.

        const notation = squareNotation.toLowerCase();

        // Handle numeric notation (e.g., "a1")
        if (/^[1-8][a-h]$/.test(notation)) {
            const col = notation.match(/[a-h]/)[0];
            const row = parseInt(notation.replace(/[a-h]/g, ''), 10);
            return { row: row, col: col };
        }

        // Handle algebraic notation (e.g., "e2")
        if (/^[a-h][1-8]$/.test(notation)) {
            const col = notation.match(/[a-h]/)[0];
            const row = parseInt(notation.replace(/[a-h]/g, ''), 10);
            return { row: row, col: col };
        }

        // Handle mixed notation (e.g., "e2") - last resort
        if (/^[a-h][1-8]$/.test(notation)) {
            const col = notation.match(/[a-h]/)[0];
            const row = parseInt(notation.replace(/[a-h]/g, ''), 10);
            return { row: row, col: col };
        }

        // Invalid notation
        return null;
    }

    cpLossToQuality(loss) {
        if (loss < 5) return 'excellent';   // nearly perfect
        if (loss < 20) return 'good';
        if (loss < 50) return 'inaccuracy';  // slightly wrong
        if (loss < 150) return 'mistake';     // clearly bad
        return 'blunder';                    // losing move
    }

    async doAnalysis() {
        // console.log(this.TAG + `Performing analysis for current position...`);
        const fen = this.PGNTracker.fen();
        this.eval_before = this.eval_after;
        const result = this.analyse(fen);
        this.eval_after = result.cp;

        // console.log(this.TAG + ` Centipawn loss:`, cpLoss);
        // console.log(this.TAG + ` Move quality:`, quality);

        // console.log(`Centipawn loss: ${cpLoss}`);
        // console.log(`Quality: ${quality}`);
        // console.log(`Best move was: ${this.eval_after.bestMove}`); // in UCI e.g. 'g1f3'
        // console.log(`Eval after: ${this.eval_after.cp}`);
        //UI?? 
        // console.log(result.san);        // 'Nf3'
        // console.log(result.color);      // 'white'
        // console.log(result.piece);      // 'N'
        // console.log(result.capture);    // false
        // console.log(result.check);      // false
        // console.log(pgnTracker.pgn);        // full PGN string so far
        return result;
    }

    async analyse(fen) {
        const result = await this.stockfish.analyse(fen, this.stockfishLines);
        console.log(this.TAG + `Stockfish evaluation:`, result);
        return result;
    }

    handleMove = (fromCoord, toCoord) => {
        executePlayerMove(this, fromCoord, toCoord);
    }

    onBack() {
        const pgn = this.PGNTracker.pgn();
        const moveCount = this.PGNTracker.moveCount();
        console.log(this.TAG + `onBack pressed: Current move number : ${this.currentMoveNumber} , move count via pgn tracker ${moveCount}`);


        let result = this.nav.loadPgn(pgn);
        console.log(this.TAG + `loading pgn: `, result)
        if (moveCount !== this.currentMoveNumber) {
            result = this.nav.prev();
        }
        // gets the current move, 


        // console.log(this.TAG + `snapshot via navigator`, snap)
        // let result = this.nav.prev();
        console.log(this.TAG + `result of navigation: `, result);

        // check if result is a capture, 
        // if(result.san.includes('x')){

        // }

        applyNavigatorUndo(this, result);





        //PGNManager.getSquareFromMove(this.currentMoveNumber - 1, this.PGNTracker.pgn())
        // this.currentMoveNumber -= 1;
        // if (!this.currentMoveNumber <= this.moveList.length) {
        //     console.log(this.TAG + ` we cannot move ahead! current move number: ${this.currentMoveNumber} of ${this.moveList.length} ... ${this.PGNTracker.history.length}`)
        // }

        // let moveData = this.moveList.get(this.currentMoveNumber);
        // console.log(this.TAG + `moveData: `, moveData);

        // const toSquare = moveData.toSquare;
        // const fromSquare = moveData.fromSquare;

        //this.#forceMove(toSquare)
    }

    onNext() {
        console.log(this.TAG + `onNext pressed`);

        // this.currentMoveNumber += 1;

        if (!this.currentMoveNumber <= this.moveList.length) {
            console.log(this.TAG + ` we cannot move ahead! current move number: ${this.currentMoveNumber} of ${this.moveList.length} ... ${this.PGNTracker.history.length}`)
        }

        const pgn = this.PGNTracker.pgn()
        //   let result = this.nav.loadPgn(pgn);
        // if (moveCount !== this.currentMoveNumber) {
        this.nav.loadPgn(pgn)
        this.nav.goTo(this.currentMoveNumber);
        const result = this.nav.next();
        // }
        // gets the current move, 




        applyNavigatorRedo(this, result);
        // let moveData = this.moveList.get(this.currentMoveNumber);
        // const toSquare = moveData.toSquare;
        // const fromSquare = moveData.froMSquare;

        // this.#forceMove(toSquare)
    }



    async requestAnalysis() {
        const tracker = this.PGNTracker;
        const pgn = tracker.pgn();
        const fen = this.PGNTracker.fen();
        const stockfishAnalysis = await this.analyse(fen);

        const lastMove = this.nav.prev().san;

        console.log(this.TAG + `requesting Analysis: `,);

        const doc = document.getElementById("analysis");
        // doc.text = response;

        const response = await buildCoachPrompt(
            fen, lastMove, stockfishAnalysis.bestMove, stockfishAnalysis.cpLoss, pgn, {
            onChunk: (chunk, fullText) => {
                console.log(this.TAG + `fullText: `, fullText)
                console.log(this.TAG + `chunk: `, chunk)

                doc.textContent = fullText;
            }
        }
        );
        console.log(this.TAG + `analysis finished: `, response)

    }

    updateStatus(currentPlayer) {
        const statusDisplay = document.getElementById("status");
        statusDisplay.textContent = `${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} to move.`;
    }

    updatePGN(text) {
        // console.log(this.TAG + `Updating analysis output:`, analysisText);
        const pgnText = document.getElementById("pgn-text");
        let str = text.split(']').slice(-1)[0].trim(); // Get the last part after the last ']'


        // console.log(this.TAG + `Extracted analysis text:`, str);
        pgnText.textContent = str;
        //if mode is set to practice: 
        this.practiceMode.loadPlayerPGN(str);
    }

    setMode(mode) {

        switch (mode) {
            case "practice":
                this.mode = new PracticeOpeningMode();
                break;
            case "computer":
                thius.computerMove = true;
                // this.mode = new ComputerMode();
                break;
            case "self":
                this.computerMove = false;
                // this.mode = new SelfMode();
                break;
            default:
        }

        let pgn = `1.e4 e5 2.Nf3 Nc6 3.Bc4 Nf6 4.O-O Be7 5.d3 O-O 6.c3 Re8 7.h3 d5 8.exd5 Nxd5
9.cxd5 Qxd5 10.Nbd2 Bg4 11.Nf1 Ne4 12.Bxe4 Rxe4 13.Qb3 c6 14.Re1 b5
15.a3 Ba6 16.Ra1 h6 17.Bb3 Qe6 18.hxg4 hxg4 19.g3 Qh3+ 20.Kf1 gxf2+
21.Ke1 fxe1=Q+ 22.Rxe1 Rxe1 23.Qxe1 Kd7 24.a4 bxa4 25.Nc4 a5
26.Kc3 Ke6 27.Ba4 Kf5 28.Be8 Kg6 29.Kc4 Kg7 30.b3 Kg7 31.Kc4 Kh7
32.Bb7 Kg7 33.Kd5 f6 34.gxf6+ Kxf6 35.Ke6 Qg6 36.Qe8# 1-0
`
        pgn = `1.e4 e6 2.Bc4 Qg5 *`
        this.practiceMode.loadPGN(pgn);
    }
}
