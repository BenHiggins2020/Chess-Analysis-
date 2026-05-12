import { GameStateManager } from "../GameStateManage.js";
import { Square } from "../Square.js";

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
        this.whiteKingCheck = false;
        this.whiteKingPos = "e1";

        this.hasBlackKingMoved = false;
        this.hasBlackKingSideMoved = false;
        this.hasBlackQueenSideMoved = false;
        this.blackKingCheck = false;
        this.blackKingPos = "e8";

        KingLogicHandler.#instance = this;

        this.castlingSquares = {
            "white": {
                // King destinations only (not rook squares)
                castleLong: ['c1', 'd1', 'b1', 'a1'],
                castleShort: ['f1', 'g1', 'h1']
            },
            "black": {
                // King destinations only (not rook squares)
                castleLong: ['c8', 'd8', 'b8', 'a8'],
                castleShort: ['f8', 'g8', 'h8']
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
        console.log(this.TAG + `onKingMove: fromSquare: ${fromSquare.position} toSquare: ${toSquare.position}`);

        if (fromSquare.piece == null) {
            console.error(this.TAG + `Error: no piece on fromSquare ${fromSquare.position}`);
            return;
        }

        const piece = fromSquare.piece;
        if (piece.type.toLowerCase() !== 'k') {
            console.error(this.TAG + `Error: piece on fromSquare ${fromSquare.position} is not a king`);
            return;
        }


        console.log(this.TAG + `onKingMove: checking for castleMove: ${this.isCastleMove(fromSquare, toSquare)} and canCastle: ${this.canCastle(piece.color)}`);

        if (this.isCastleMove(fromSquare, toSquare) && this.canCastle(piece.color)) {
            console.log(this.TAG + `[onKingMove] isCastle move and we can castle!!! lets castle the rook!! `);
            this.castle(fromSquare, toSquare);
        }
        if (piece.color === 'white') {
            this.hasWhiteKingMoved = true;
            this.whiteKingPos = toSquare.position;
            // // console.log(this.TAG + `White king has moved. hasWhiteKingMoved set to true.`);
        } else if (piece.color === 'black') {
            this.hasBlackKingMoved = true;
            this.blackKingPos = toSquare.position;

            // console.log(this.TAG + `Black king has moved. hasBlackKingMoved set to true.`);
        }
    }

    handleCastling = (fromSquare, toSquare) => {
        // console.log(this.TAG + `Attempting to Castle as ${fromSquare.piece.color}`);
        const piece = fromSquare.piece;
        // console.log(this.TAG + `Castle to ${toSquare.position}`);

        switch (piece.color) {
            case "white":
                if (this.hasWhiteKingMoved) {
                    // console.log(this.TAG + `White has moved. Cannot castle..`);
                    return;
                }
                if (!this.#whiteCastlingRights(toSquare.position)) {
                    // console.log(this.TAG + "White does not have castling rights. ");
                    return;
                }
                break;
            case "black":
                if (this.hasBlackKingMoved) {
                    // console.log(this.TAG + `Black has moved. Cannot castle..`);
                    return;
                }
                if (!this.#blackCastlingRights(toSquare.position)) {
                    // console.log(this.TAG + "Black does not have castling rights. ");
                    return;
                }
                break;

        }
        console.log(this.TAG + `Attempting to Castle as ${fromSquare.piece.color}`);
        this.castle(fromSquare, toSquare);

    }

    #whiteCastlingRights = (toCoord) => {
        // console.log(this.TAG + ` WhiteCastlingRights: toCoord: ${toCoord}`)

        if (this.castlingSquares.white.castleShort.includes(toCoord)) {
            // console.log(this.TAG + `WhiteCastlingRights: Castling Short`);

            // Kingside castling for white
            // Squares f1 and g1 must be empty, and not under attack.
            const h1 = GameStateManager.getInstance().getSquare('h1');

            const g1 = GameStateManager.getInstance().getSquare('g1');
            const f1 = GameStateManager.getInstance().getSquare('f1');

            const logic = {
                pieceIsNOTUndefined: (h1.piece !== null && h1.piece !== undefined),
                pieceIsRook: h1.piece.type === "R",
                pieceHasNOTMoved: !h1.piece.hasMoved
            }

            // console.log(this.TAG + `Logic Check for Rook on H1: `, logic);

            if (logic.pieceIsNOTUndefined && logic.pieceIsRook && logic.pieceHasNOTMoved) {
                // console.log(this.TAG + `WhiteCastlingRights: rook has not moved from h1. `)
                //continue
            }

            if ((g1.piece === null || g1.piece === undefined) && (f1.piece === null || f1.piece === undefined)) {
                // No piece on square f1, and rook on g1 has not moved. 
            } else {
                // console.log(this.TAG + `WhiteCastlingRights: square was not empty:`)
                console.warn(this.TAG + ` g1 `, g1.piece);
                console.warn(this.TAG + ` f1 `, f1.piece);

                return false;
            }

            const f1Threat = this.checkForThreatOnSquare(f1, 'white');
            const g1Threat = this.checkForThreatOnSquare(g1, 'white');

            if (!f1Threat && !g1Threat) {
                // No Threats on Squares
            } else {
                // console.log(this.TAG + `threat found on f1: ${f1Threat}, threat found on g1 ${g1Threat}`);
            }
        }
        else if (this.castlingSquares.white.castleLong.includes(toCoord)) {
            // console.log(this.TAG + `WhiteCastlingRights: Castling Long`);

            // Queenside castling for white
            // Squares b1, c1 and d1 must be empty, and not under attack.

            const a1 = GameStateManager.getInstance().getSquare('a1');

            const b1 = GameStateManager.getInstance().getSquare('b1');
            const c1 = GameStateManager.getInstance().getSquare('c1');

            if ((a1.piece !== null || ai.piece !== undefined) && a1.piece.type.toLowerCase() === "r" && !a1.hasMoved) {
                // rook is still on a1 and has not moved. 
            } else {
                return false;
            }

            if (b1.piece === null, c1.piece === null) {
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
            // console.log(this.TAG + `white can't castle to ${toCoord}`)
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
                // console.log(this.TAG + `Squares f8 and g8 are empty. Checking for threats...`);
            } else {
                // console.log(this.TAG + `Cannot castle kingside for black. Squares f8 ${b8} and g8 ${c8} must be empty.`);
                return; // Cannot castle if either of the squares are not empty
            }

            const f8Threat = this.checkForThreatOnSquare(this.chessboard.gameState.get('f8'), 'black');
            const g8Threat = this.checkForThreatOnSquare(this.chessboard.gameState.get('g8'), 'black');

            if (!f8Threat && !g8Threat) {
                // console.log(this.TAG + `Squares f8 and g8 are not under attack. Castling is allowed.`);
            } else {
                // console.log(this.TAG + `Cannot castle kingside for black. Square f8 under threat ${f8Threat} and square g8 under threat ${g8Threat}.`);
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
                // console.log(this.TAG + `Squares b8, c8 and d8 are empty. Checking for threats...`);
            } else {
                // console.log(this.TAG + `Cannot castle queenside for black. Squares b8 ${b8}, c8 ${c8} and d8 ${d8} must be empty.`);
                return; // Cannot castle if any of the squares are not empty
            }

            const b8Threat = this.checkForThreatOnSquare(b8, 'black');
            const c8Threat = this.checkForThreatOnSquare(c8, 'black');
            const d8Threat = this.checkForThreatOnSquare(d8, 'black');

            if (!b8Threat && !c8Threat && !d8Threat) {
                // console.log(this.TAG + `Squares b8, c8 and d8 are not under attack. Castling is allowed.`);
            } else {
                // console.log(this.TAG + `Cannot castle queenside for black. Squares b8 under threat ${b8Threat}, c8 under threat ${c8Threat} and d8 under threat ${d8Threat}.`);
                return; // Cannot castle if any of the squares are under attack
            }

        } else {
            // console.log(this.TAG + `black can't castle to ${toCoord}`)
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
                    this.whiteKingPos = "g1"
                } else {
                    this.castleLongWhite();
                    this.whiteKingPos = "c1"

                }
                break;
            case "black":
                if (this.castlingSquares.black.castleShort.includes(toSquare.position)) {
                    this.casteShortBlack();
                    this.blackKingPos = "g8";
                } else {
                    this.castleLongBlack();
                    this.blackKingPos = "c8";
                }
                break;
        }
    }

    isCastleMove(fromSquare, toSquare) {
        const piece = fromSquare.piece
        console.log(this.TAG + ` isCastleMove. ${piece.type} ${piece.type.toLowerCase() !== "k"}`)
        if (piece.type.toLowerCase() !== "k") return false;
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
                // console.log(this.TAG + `Rook can castle: ${rookCanCastle}`);
                return rookCanCastle
                break;
            case "black":
                rookCanCastle = 'f8' === (toSquare.position) || 'd8' === (toSquare.position)
                // console.log(this.TAG + `Rook can castle: ${rookCanCastle}`);
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


    /**
     * takes a position coordinate. and maps it to properChecks.
     * @param {str} coord 
     */
    canCastleWhite(coord) {

    }

    canCastle(color) {
        return this.canCastleShort(color) || this.canCastleLong(color);
    }

    canCastleLong(color) {
        const toCoord = color === "white" ? "c1" : "c8";
        return this.#canCastleTo(toCoord, color);
    }

    canCastleShort(color) {
        const toCoord = color === "white" ? "g1" : "g8";
        return this.#canCastleTo(toCoord, color);
    }


    /**
     * Checks each square for a piece of opposite color to the king.
     * Then checks if it has moves which would include the king's target square. 
     * 
     * @param {Square} square this is the square that is under attack by another piece.
     * @param {String} kingColor color of the king being attacked. 
     * @returns false for no threats, true if a threat is found.  
     */
    checkForThreatOnSquare = (square, kingColor) => {
        // kingColor is the color of the king being attacked.
        // Attackers are always the opposite color.
        return this.#isSquareAttacked(square.position, this.#opponentColor(kingColor));
    }

    #opponentColor = (color) => {
        return color === "white" ? "black" : "white";
    }

    #posToFileRank = (pos) => {
        // pos like "e4"
        const fileCode = pos.charCodeAt(0);
        const rank = Number(pos[1]);
        return { fileCode, rank };
    }

    #xyToPos = (fileCode, rank) => {
        if (rank < 1 || rank > 8) return null;
        const a = "a".charCodeAt(0);
        const h = "h".charCodeAt(0);
        if (fileCode < a || fileCode > h) return null;
        return String.fromCharCode(fileCode) + String(rank);
    }

    #isSquareAttacked = (targetPos, attackerColor) => {
        const { fileCode, rank } = this.#posToFileRank(targetPos);
        const board = GameStateManager.getInstance();

        // Pawn attacks
        if (attackerColor === "white") {
            const p1 = this.#xyToPos(fileCode - 1, rank - 1);
            const p2 = this.#xyToPos(fileCode + 1, rank - 1);
            for (const p of [p1, p2]) {
                if (!p) continue;
                const sq = board.getSquare(p);
                if (sq?.piece && sq.piece.color === attackerColor && sq.piece.type?.toLowerCase() === "p") return true;
            }
        } else {
            const p1 = this.#xyToPos(fileCode - 1, rank + 1);
            const p2 = this.#xyToPos(fileCode + 1, rank + 1);
            for (const p of [p1, p2]) {
                if (!p) continue;
                const sq = board.getSquare(p);
                if (sq?.piece && sq.piece.color === attackerColor && sq.piece.type?.toLowerCase() === "p") return true;
            }
        }

        // Knight attacks
        const knightDeltas = [
            { dx: 1, dy: 2 }, { dx: 2, dy: 1 }, { dx: 2, dy: -1 }, { dx: 1, dy: -2 },
            { dx: -1, dy: -2 }, { dx: -2, dy: -1 }, { dx: -2, dy: 1 }, { dx: -1, dy: 2 }
        ];
        for (const { dx, dy } of knightDeltas) {
            const p = this.#xyToPos(fileCode + dx, rank + dy);
            if (!p) continue;
            const sq = board.getSquare(p);
            if (sq?.piece && sq.piece.color === attackerColor && sq.piece.type?.toLowerCase() === "n") return true;
        }

        // King attacks (adjacent squares only)
        for (let dy = -1; dy <= 1; dy++) {
            for (let dx = -1; dx <= 1; dx++) {
                if (dx === 0 && dy === 0) continue;
                const p = this.#xyToPos(fileCode + dx, rank + dy);
                if (!p) continue;
                const sq = board.getSquare(p);
                if (sq?.piece && sq.piece.color === attackerColor && sq.piece.type?.toLowerCase() === "k") return true;
            }
        }

        // Sliding pieces: rooks/queens (orthogonal)
        const rookDirs = [
            { dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }
        ];
        for (const { dx, dy } of rookDirs) {
            let x = fileCode + dx;
            let y = rank + dy;
            while (true) {
                const p = this.#xyToPos(x, y);
                if (!p) break;
                const sq = board.getSquare(p);
                if (!sq) break;
                if (sq.piece) {
                    if (sq.piece.color === attackerColor) {
                        const t = sq.piece.type?.toLowerCase();
                        if (t === "r" || t === "q") return true;
                    }
                    break; // blocked by first piece
                }
                x += dx;
                y += dy;
            }
        }

        // Sliding pieces: bishops/queens (diagonal)
        const bishopDirs = [
            { dx: 1, dy: 1 }, { dx: 1, dy: -1 }, { dx: -1, dy: 1 }, { dx: -1, dy: -1 }
        ];
        for (const { dx, dy } of bishopDirs) {
            let x = fileCode + dx;
            let y = rank + dy;
            while (true) {
                const p = this.#xyToPos(x, y);
                if (!p) break;
                const sq = board.getSquare(p);
                if (!sq) break;
                if (sq.piece) {
                    if (sq.piece.color === attackerColor) {
                        const t = sq.piece.type?.toLowerCase();
                        if (t === "b" || t === "q") return true;
                    }
                    break;
                }
                x += dx;
                y += dy;
            }
        }

        return false;
    }

    #withTemporaryBoardState = (patches, fn) => {
        // patches: [{ square, piece }]
        const saved = new Map();
        for (const { square } of patches) {
            if (!saved.has(square)) saved.set(square, square.piece);
        }
        for (const { square, piece } of patches) {
            square.piece = piece;
        }
        try {
            return fn();
        } finally {
            for (const [square, piece] of saved.entries()) {
                square.piece = piece;
            }
        }
    }

    /**
     * Returns whether a king move is legal (cannot move into check).
     * Includes castling-through-check prevention.
     */
    isKingMoveLegal = (fromSquare, toSquare) => {
        const king = fromSquare?.piece;
        if (!king || king.type?.toLowerCase() !== "k") return false;
        if (!toSquare) return false;

        const kingColor = king.color;
        const opponentColor = this.#opponentColor(kingColor);

        // Castling legality (including intermediate squares not attacked).
        if (this.isCastleMove(fromSquare, toSquare)) {
            return this.#canCastleTo(toSquare.position, kingColor);
        }

        // Normal king moves
        if (toSquare.piece && toSquare.piece.color === kingColor) return false;

        const fileDelta = Math.abs(toSquare.file.charCodeAt(0) - fromSquare.file.charCodeAt(0));
        const rankDelta = Math.abs(toSquare.rank - fromSquare.rank);
        if (fileDelta > 1 || rankDelta > 1) return false;

        // Simulate king move and ensure destination isn't attacked.
        return this.#withTemporaryBoardState(
            [
                { square: fromSquare, piece: null },
                { square: toSquare, piece: king }
            ],
            () => !this.#isSquareAttacked(toSquare.position, opponentColor)
        );
    }

    #canCastleTo = (toCoord, kingColor) => {
        const board = GameStateManager.getInstance();
        const opponentColor = this.#opponentColor(kingColor);

        const kingStart = kingColor === "white" ? "e1" : "e8";
        const kingSquare = board.getSquare(kingStart);
        const kingPiece = kingSquare?.piece;
        if (!kingPiece || kingPiece.type?.toLowerCase() !== "k" || kingPiece.color !== kingColor) return false;

        // King moved flag
        if (kingColor === "white" && this.hasWhiteKingMoved) return false;
        if (kingColor === "black" && this.hasBlackKingMoved) return false;

        let rookFromPos, rookToPos, intermediatePos, emptySquares;
        console.log(this.TAG + `Check if can castle ${toCoord} for ${kingColor}
             \n Castle Short: ${this.castlingSquares[kingColor].castleShort} 
             \n Castle Long: ${this.castlingSquares[kingColor].castleLong}
                `);

        if (kingColor === "white" && (this.castlingSquares.white.castleShort.includes(toCoord))) {
            rookFromPos = "h1";
            rookToPos = "f1";
            intermediatePos = "f1";
            emptySquares = ["f1", "g1"];
        } else if (kingColor === "white" && (this.castlingSquares.white.castleLong.includes(toCoord))) {
            rookFromPos = "a1";
            rookToPos = "d1";
            intermediatePos = "d1";
            emptySquares = ["b1", "c1", "d1"];
        } else if (kingColor === "black" && (this.castlingSquares.black.castleShort.includes(toCoord))) {
            rookFromPos = "h8";
            rookToPos = "f8";
            intermediatePos = "f8";
            emptySquares = ["f8", "g8"];
        } else if (kingColor === "black" && (this.castlingSquares.black.castleShort.includes(toCoord))) {
            rookFromPos = "a8";
            rookToPos = "d8";
            intermediatePos = "d8";
            emptySquares = ["b8", "c8", "d8"];
        } else {
            return false;
        }

        const rookFrom = board.getSquare(rookFromPos);
        const rookPiece = rookFrom?.piece;
        if (!rookPiece || rookPiece.color !== kingColor || rookPiece.type?.toLowerCase() !== "r") {
            console.log(this.TAG + `Invalid castle move. rrook piece was:\n
                ${!rookPiece}|| ${rookPiece.color} !== ${kingColor} || ${rookPiece.type}?.toLowerCase() !== "r" `);
            return false;
        };

        // Squares between king and rook must be empty.
        for (const pos of emptySquares) {
            if (board.getSquare(pos)?.piece) {
                console.log(this.TAG + `Cannot castle, piece was found on ${pos}`)
                return false
            };
        }

        // Step 0: kingStart not attacked.
        if (this.#isSquareAttacked(kingStart, opponentColor)) {
            console.log(this.TAG + `Cannot castle, king Position ${kingStart} is attacked.`);
            return false;
        };

        const intermediateSq = board.getSquare(intermediatePos);
        const destSq = board.getSquare(toCoord);
        const rookToSq = board.getSquare(rookToPos);

        // Step 1: king moved to intermediate; rook stays on rookFrom.
        return this.#withTemporaryBoardState(
            [
                { square: kingSquare, piece: null },
                { square: intermediateSq, piece: kingPiece }
            ],
            () => {
                if (this.#isSquareAttacked(intermediatePos, opponentColor)) return false;

                // Step 2: king on destination, rook moved to rookTo.
                return this.#withTemporaryBoardState(
                    [
                        { square: rookFrom, piece: null },
                        { square: rookToSq, piece: rookPiece },
                        { square: destSq, piece: kingPiece }
                    ],
                    () => !this.#isSquareAttacked(toCoord, opponentColor)
                );
            }
        );
    }

    getCorrectKingSquare(fromSquare, toSquare) {
        const piece = fromSquare.piece;
        const toCoord = toSquare.position;
        let squares = this.castlingSquares;

        switch (piece.color) {
            case "white":
                squares = this.castlingSquares.white;

                if (toCoord === 'g1' || toCoord == 'c1') {
                    // console.log(this.TAG + `toCoord is correct! King should be at ${toCoord}`)
                }
                if (squares.castleLong.includes(toCoord)) {
                    // console.log(this.TAG + `castling long, got coord ${toCoord}, chaning to c1`);
                    return GameStateManager.getInstance().getSquare('c1');

                } else if (squares.castleShort.includes(toCoord)) {
                    // console.log(this.TAG + `castling short, got coord ${toCoord}, chaning to g1`);
                    return GameStateManager.getInstance().getSquare('g1');
                }
                break;

            case "black":
                squares = this.castlingSquares.black;

                if (toCoord === 'g8' || toCoord == 'c8') {
                    // console.log(this.TAG + `toCoord is correct! King should be at ${toCoord}`)
                }
                if (squares.castleLong.includes(toCoord)) {
                    // console.log(this.TAG + `castling long, got coord ${toCoord}, chaning to c8`);
                    return GameStateManager.getInstance().getSquare('c8');
                } else if (squares.castleShort.includes(toCoord)) {
                    // console.log(this.TAG + `castling short, got coord ${toCoord}, chaning to g8`);
                    return GameStateManager.getInstance().getSquare('g8');
                }
                break;
        }
    }

}