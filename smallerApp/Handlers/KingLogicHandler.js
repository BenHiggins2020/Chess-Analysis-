import { GameStateManager } from "../GameStateManage.js";

export class KingLogicHandler {
    static #instance = null;
    constructor(name) {
        this.name = name;
        this.TAG = "KingLogicHandler: "

        if (KingLogicHandler.#instance) {
            //Throw error? 
            throw new Error("Error: Instantiation failed: Use KingLogicHandler.getInstance() instead of new.");
            return KingLogicHandler.#instance;
        }

        this.hasWhiteKingMoved = false;
        this.hasWhiteKingSideRookMoved = false;
        this.hasWhiteQueenSideRookMoved = false;

        this.hasBlackKingMoved = false;
        this.hasBlackKingSideMoved = false;
        this.hasBlackQueenSideMoved = false;


        KingLogicHandler.#instance = this;

        this.castlingSquares = {
            "white": {
                castleLong: ['a1', 'b1', 'c1',],
                castleShort: ['g1', 'h1']
            },
            "black": {
                castleLong: ['a8', 'b8', 'c8'],
                castleShort: ['g8', 'h8']
            }
        }

    }

    static getInstance(name = "Default Instance") {
        if (!KingLogicHandler.#instance) {
            KingLogicHandler.#instance = new KingLogicHandler(name);
        }
        return KingLogicHandler.#instance;
    }

    onKingMove = (fromSquare, toSquare) => {
        if (fromSquare.piece == null) {
            console.error(this.TAG + `Error: no piece on fromSquare ${fromSquare.position}`);
            return;
        }

        const piece = fromSquare.piece;
        if (piece.type.toLowerCase() !== 'k') {
            console.error(this.TAG + `Error: piece on fromSquare ${fromSquare.position} is not a king`);
            return;
        }

        if (this.isCastleMove(fromSquare, toSquare)) {
            console.log(this.TAG + `isCastle move!! lets castle the rook!! `);
            this.castle(fromSquare, toSquare);
        }
        if (piece.color === 'white') {
            this.hasWhiteKingMoved = true;
            console.log(this.TAG + `White king has moved. hasWhiteKingMoved set to true.`);
        } else if (piece.color === 'black') {
            this.hasBlackKingMoved = true;
            console.log(this.TAG + `Black king has moved. hasBlackKingMoved set to true.`);
        }
    }

    handleCastling = (fromSquare, toSquare) => {
        console.log(this.TAG + `Attempting to Castle as ${fromSquare.piece.color}`);
        const piece = fromSquare.piece;
        console.log(this.TAG + `Castle to ${toSquare.position}`);

        switch (piece.color) {
            case "white":
                if (this.hasWhiteKingMoved) {
                    console.log(this.TAG + `White has moved. Cannot castle..`);
                    return;
                }
                if (!this.#whiteCastlingRights(toSquare.position)) {
                    console.log(this.TAG + "White does not have castling rights. ");
                    return;
                }
                break;
            case "black":
                if (this.hasBlackKingMoved) {
                    console.log(this.TAG + `Black has moved. Cannot castle..`);
                    return;
                }
                if (!this.#blackCastlingRights(toSquare.position)) {
                    console.log(this.TAG + "Black does not have castling rights. ");
                    return;
                }
                break;

        }
        this.castle(fromSquare, toSquare);

    }

    #whiteCastlingRights = (toCoord) => {
        console.log(this.TAG + `toCoord: ${toCoord}`)
        if (this.castlingSquares.white.castleShort.includes(toCoord)) {
            // Kingside castling for white
            // Squares f1 and g1 must be empty, and not under attack.
            const g1 = GameStateManager.getInstance().getSquare('g1');
            const f1 = GameStateManager.getInstance().getSquare('f1');

            if (g1.piece === null && f1.piece === null) {
                // No pieces on squares, passes 
            } else {
                console.log(this.TAG + `square was not empty. g1: ${g1.piece !== null} f1 ${f1.piece !== null}`)
                return false;
            }

            const f1Threat = this.checkForThreatOnSquare(f1, 'white');
            const g1Threat = this.checkForThreatOnSquare(g1, 'white');

            if (!f1Threat && !g1Threat) {
                // No Threats on Squares
            } else {
                console.log(this.TAG + `threat found on f1: ${f1Threat}, threat found on g1 ${g1Threat}`);
            }
        }
        else if (this.castlingSquares.white.castleLong.includes(toCoord)) {
            // Queenside castling for white
            // Squares b1, c1 and d1 must be empty, and not under attack.

            const a1 = GameStateManager.getInstance().getSquare('a1');
            const b1 = GameStateManager.getInstance().getSquare('b1');
            const c1 = GameStateManager.getInstance().getSquare('c1');


            if (a1.piece === null && b1.piece === null, c1.piece === null) {
                // No pieces on squares, passes 
            } else {
                return false;
            }

            const a1Threat = this.checkForThreatOnSquare(a1, 'white');
            const b1Threat = this.checkForThreatOnSquare(b1, 'white');
            const c1Threat = this.checkForThreatOnSquare(c1, 'white');


            if (!a1Threat && !b1Threat && !c1Threat) {
                // No Threats on Squares
            } else {
                return false;
            }
        } else {
            console.log(this.TAG + `white can't castle to ${toCoord}`)
            return false;
        }
        return true;
    }

    #blackCastlingRights = (toCoord) => {
        if (toCoord === 'g8' || toCoord === 'h8') {
            // Kingside castling for black

            // Squares f8 and g8 must be empty, and not under attack.
            const b8 = GameStateManager.getInstance().getSquare('g8').piece == null;
            const c8 = GameStateManager.getInstance().getSquare('h8').piece == null;
            if (b8 && c8) {
                console.log(this.TAG + `Squares f8 and g8 are empty. Checking for threats...`);
            } else {
                console.log(this.TAG + `Cannot castle kingside for black. Squares f8 ${b8} and g8 ${c8} must be empty.`);
                return; // Cannot castle if either of the squares are not empty
            }

            const f8Threat = this.checkForThreatOnSquare(this.chessboard.gameState.get('f8'), 'black');
            const g8Threat = this.checkForThreatOnSquare(this.chessboard.gameState.get('g8'), 'black');

            if (!f8Threat && !g8Threat) {
                console.log(this.TAG + `Squares f8 and g8 are not under attack. Castling is allowed.`);
            } else {
                console.log(this.TAG + `Cannot castle kingside for black. Square f8 under threat ${f8Threat} and square g8 under threat ${g8Threat}.`);
                return; // Cannot castle if either of the squares are under attack
            }

        }
        else if (toCoord === 'c8' || toCoord === 'a8' || toCoord === 'b8') {
            // Queenside castling for black
            // Squares b8, c8 and d8 must be empty, and not under attack.

            const b8 = GameStateManager.getInstance().getSquare('b8').piece == null;
            const c8 = GameStateManager.getInstance().getSquare('c8').piece == null;
            const d8 = GameStateManager.getInstance().getSquare('d8').piece == null;

            if (b8 && c8 && d8) {
                console.log(this.TAG + `Squares b8, c8 and d8 are empty. Checking for threats...`);
            } else {
                console.log(this.TAG + `Cannot castle queenside for black. Squares b8 ${b8}, c8 ${c8} and d8 ${d8} must be empty.`);
                return; // Cannot castle if any of the squares are not empty
            }

            const b8Threat = this.checkForThreatOnSquare(b8, 'black');
            const c8Threat = this.checkForThreatOnSquare(c8, 'black');
            const d8Threat = this.checkForThreatOnSquare(d8, 'black');

            if (!b8Threat && !c8Threat && !d8Threat) {
                console.log(this.TAG + `Squares b8, c8 and d8 are not under attack. Castling is allowed.`);
            } else {
                console.log(this.TAG + `Cannot castle queenside for black. Squares b8 under threat ${b8Threat}, c8 under threat ${c8Threat} and d8 under threat ${d8Threat}.`);
                return; // Cannot castle if any of the squares are under attack
            }

        } else {
            console.log(this.TAG + `black can't castle to ${toCoord}`)
            return false;
        }

        return true;
    }

    castle(fromSquare, toSquare) {
        console.log(this.TAG + " Castling. ");
        const piece = fromSquare.piece
        switch (piece.color) {
            case "white":
                if (this.castlingSquares.white.castleShort.includes(toSquare.position)) {
                    this.casteShortWhite();
                } else {
                    this.castleLongWhite();
                }
                break;
            case "black":
                if (this.castlingSquares.black.castleShort.includes(toSquare.position)) {
                    this.casteShortBlack();
                } else {
                    this.castleLongBlack();
                }
                break;
        }
    }

    isCastleMove(fromSquare, toSquare) {
        const piece = fromSquare.piece
        switch (piece.color) {
            case "white":
                return this.castlingSquares.white.castleShort.includes(toSquare.position) || this.castlingSquares.white.castleLong.includes(toSquare.position)
                break;
            case "black":
                return this.castlingSquares.black.castleShort.includes(toSquare.position) || this.castlingSquares.black.castleLong.includes(toSquare.position)
                break;
        }
    }

    isRookCastleMove(fromSquare, toSquare) {
        const piece = fromSquare.piece
        let rookCanCastle = false;
        switch (piece.color) {
            case "white":
                rookCanCastle = 'f1' === (toSquare.position) || 'd1' === (toSquare.position)
                console.log(this.TAG + `Rook can castle: ${rookCanCastle}`);
                return rookCanCastle;
                break;
            case "black":
                rookCanCastle = 'f8' === (toSquare.position) || 'd8' === (toSquare.position)
                console.log(this.TAG + `Rook can castle: ${rookCanCastle}`);
                return rookCanCastle;
                break;
        }
    }

    castleLongBlack() {
        console.log(this.TAG + `castling long - black`);
        // Rook to d8 ... 
        const a8 = GameStateManager.getInstance().getSquare('a8');
        const d8 = GameStateManager.getInstance().getSquare('d8');
        const rook = a8.piece;

        d8.setPiece(rook);
        a8.removePiece();

    }

    casteShortBlack() {
        console.log(this.TAG + `castling short - black`);
        const h8 = GameStateManager.getInstance().getSquare('h8');
        const f8 = GameStateManager.getInstance().getSquare('f8');
        const rook = h8.piece;

        f8.setPiece(rook);
        h8.removePiece();
    }

    castleLongWhite() {
        console.log(this.TAG + `castling long - white`);
        //Rd1, Kc1
        const a1 = GameStateManager.getInstance().getSquare('a1');
        const d1 = GameStateManager.getInstance().getSquare('d1');
        const rook = a1.piece;

        d1.setPiece(rook);
        a1.removePiece();
    }

    casteShortWhite() {
        console.log(this.TAG + `castling short - white`);
        //Rd1, Kc1
        const h1 = GameStateManager.getInstance().getSquare('h1');
        const f1 = GameStateManager.getInstance().getSquare('f1');
        const rook = h1.piece;

        f1.setPiece(rook);
        h1.removePiece();
    }

    canCastle(color) {
        let canCastle = false;
        switch (color) {
            case "white":
                canCastle = this.hasWhiteKingMoved && this.#whiteCastlingRights('h1') || this.#whiteCastlingRights('a1')
                break;
            case "black":
                canCastle = this.hasBlackKingMoved && this.#blackCastlingRights('h8') || this.#blackCastlingRights('a8')
                break;
        }
        return canCastle;
    }

    canCastleLong(color) {
        let canCastle = false;

        switch (color) {
            case "white":
                canCastle = this.hasWhiteKingMoved && this.#whiteCastlingRights('a1')
                break;
            case "black":
                canCastle = this.hasBlackKingMoved && this.#blackCastlingRights('a8')
                break;
        }
    }

    canCastleShort(color) {
        let canCastle = false;
        switch (color) {
            case "white":
                canCastle = this.hasWhiteKingMoved && this.#whiteCastlingRights('h1')
                break;
            case "black":
                canCastle = this.hasBlackKingMoved && this.#blackCastlingRights('h8')
                break;
        }
        return canCastle;
    }


    checkForThreatOnSquare = (square, kingColor) => {
        // Check if the square is under attack by any opponent piece
        // This would involve checking all opponent pieces and their legal moves to see if any can move to this square.
        GameStateManager.getInstance().GameState.forEach((sq) => {
            if (sq.piece !== null && sq.piece.color !== kingColor) {
                const opponentMoves = sq.piece.moves;
                if (opponentMoves.includes(square.position)) {
                    console.log(this.TAG + `Square ${square.position} is under attack by ${sq.piece.type} at ${sq.position}`);
                    return true;
                }
            }
        });
        console.log(this.TAG + `No threats on square ${square.position}`)
        return false; // No threat
    }

    getCorrectKingSquare(fromSquare, toSquare) {
        const piece = fromSquare.piece;
        const toCoord = toSquare.position;
        let squares = this.castlingSquares;

        switch (piece.color) {
            case "white":
                squares = this.castlingSquares.white;

                if (toCoord === 'g1' || toCoord == 'c1') {
                    console.log(this.TAG + `toCoord is correct! King should be at ${toCoord}`)
                }
                if (squares.castleLong.includes(toCoord)) {
                    console.log(this.TAG + `castling long, got coord ${toCoord}, chaning to c1`);
                    return GameStateManager.getInstance().getSquare('c1');

                } else if (squares.castleShort.includes(toCoord)) {
                    console.log(this.TAG + `castling short, got coord ${toCoord}, chaning to g1`);
                    return GameStateManager.getInstance().getSquare('g1');
                }
                break;

            case "black":
                squares = this.castlingSquares.black;

                if (toCoord === 'g8' || toCoord == 'c8') {
                    console.log(this.TAG + `toCoord is correct! King should be at ${toCoord}`)
                }
                if (squares.castleLong.includes(toCoord)) {
                    console.log(this.TAG + `castling long, got coord ${toCoord}, chaning to c8`);
                    return GameStateManager.getInstance().getSquare('c8');
                } else if (squares.castleShort.includes(toCoord)) {
                    console.log(this.TAG + `castling short, got coord ${toCoord}, chaning to g8`);
                    return GameStateManager.getInstance().getSquare('g8');
                }
                break;
        }
    }

}