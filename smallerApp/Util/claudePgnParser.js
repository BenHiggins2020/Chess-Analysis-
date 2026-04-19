export class ClaudePGNParser {
    constructor() { }
    // ═══════════════════════════════════════════════════════════
    //  PGN PARSER
    //  
    //  Parses a PGN string into structured move objects.
    //
    //  Each move object looks like:
    //  {
    //    moveNumber:  14,
    //    color:       'white',          // 'white' or 'black'
    //    san:         'Nxd5',           // original SAN notation
    //    piece:       'N',              // K Q R B N P
    //    from:        'f3',             // square piece moved FROM  e.g. 'f3'
    //    to:          'd5',             // square piece moved TO    e.g. 'd5'
    //    capture:     true,             // was something taken?
    //    promotion:   null,             // 'Q','R','B','N' or null
    //    castle:      null,             // 'kingside', 'queenside', or null
    //    check:       true,             // gives check?
    //    checkmate:   false,            // gives checkmate?
    //    nag:         '$2',             // numeric annotation glyph or null
    //    annotation:  'mistake',        // human label for NAG or null
    //  }
    //
    //  Usage:
    //    const result = parsePGN(pgnString);
    //    result.headers  → { White: 'Ben', Black: 'Opponent', ... }
    //    result.moves    → array of move objects above
    //    result.result   → '1-0' | '0-1' | '1/2-1/2' | '*'
    // ═══════════════════════════════════════════════════════════


    // ─────────────────────────────────────────────
    //  STEP 1: Extract headers
    //  PGN headers look like:  [White "Ben"]
    //  We pull them all into a plain object.
    // ─────────────────────────────────────────────
    extractHeaders(pgn) {
        const headers = {};
        const pattern = /\[([A-Za-z]\w*)\s+"([^"]*)"\]/g;
        let match;
        while ((match = pattern.exec(pgn)) !== null) {
            headers[match[1]] = match[2];
        }
        return headers;
    }


    // ─────────────────────────────────────────────
    //  STEP 2: Strip everything that isn't a move
    //
    //  PGN files contain a lot of noise:
    //    { comments like this }
    //    (variations like this)
    //    $2  ← NAG annotations (we extract these before stripping)
    //    1.  ← move numbers
    //    1-0 ← result token
    // ─────────────────────────────────────────────

    // Remove nested bracket pairs — handles { {nested} } correctly
    stripBrackets(text, open, close) {
        let result = '';
        let depth = 0;
        for (const ch of text) {
            if (ch === open) { depth++; continue; }
            if (ch === close) { depth = Math.max(0, depth - 1); continue; }
            if (depth === 0) result += ch;
        }
        return result;
    }

    extractMoveTokens(pgn) {
        let text = pgn;

        // Remove header lines (lines starting with "[")
        text = text.replace(/^\[.*\]$/gm, '');

        // Remove { comments } — also covers Lichess [%clk 0:05:00] clock annotations
        text = this.stripBrackets(text, '{', '}');

        // Remove (variation lines) — handles deeply nested variations
        text = this.stripBrackets(text, '(', ')');

        // Remove NAG codes — $1 $2 $6 etc.
        // (We extract them earlier in the full parse, before this step)
        text = text.replace(/\$\d+/g, '');

        // Remove result tokens
        text = text.replace(/\b(1-0|0-1|1\/2-1\/2)\b|\*/g, '');

        // Remove move numbers: "14." or "14..." (black continuation)
        text = text.replace(/\d+\.+/g, '');

        // Remove move annotation symbols ! ? !! ?? !? ?!
        text = text.replace(/[!?]+/g, '');

        // Collapse whitespace
        text = text.replace(/\s+/g, ' ').trim();

        return text.split(' ').filter(t => t.length > 0);
    }


    // ─────────────────────────────────────────────
    //  STEP 3: Parse a single SAN token
    //
    //  SAN (Standard Algebraic Notation) has these forms:
    //
    //    Pawn moves:    e4   exd5   e8=Q   exd8=Q+
    //    Piece moves:   Nf3  Nbd2   R1e4   Bxc6+
    //    Castling:      O-O  O-O-O  (also 0-0 variant from some exporters)
    //
    //  The full SAN grammar:
    //    [PIECE] [disambiguation] [x] <target square> [=PROMOTION] [+/#]
    //
    //  Disambiguation is needed when two of the same piece can reach the
    //  same square — e.g. "Nbd2" means the knight on the b-file goes to d2.
    //  It can be:
    //    - a file letter:        Nbd2  (knight from b-file)
    //    - a rank number:        R1e4  (rook from rank 1)  
    //    - a full square:        Qd1f3 (queen from d1 — rare)
    // ─────────────────────────────────────────────
    parseSAN(san) {
        // Normalise castling notation (some exporters use 0-0 instead of O-O)
        const normSAN = san.replace(/^0-0-0/, 'O-O-O').replace(/^0-0/, 'O-O');

        // ── Castling ──
        if (normSAN.startsWith('O-O-O') || normSAN.startsWith('O-O')) {
            return {
                san,
                piece: 'K',
                from: null,     // filled in later by the board tracker
                to: null,
                capture: false,
                promotion: null,
                castle: normSAN.startsWith('O-O-O') ? 'queenside' : 'kingside',
                check: normSAN.includes('+'),
                checkmate: normSAN.includes('#'),
                nag: null,
                annotation: null,
            };
        }

        // Work on a cleaned version (strip +, #, ! ?)
        let s = normSAN.replace(/[+#!?]/g, '');

        // ── Promotion  e.g. e8=Q ──
        let promotion = null;
        if (s.includes('=')) {
            const parts = s.split('=');
            s = parts[0];
            promotion = parts[1].toUpperCase(); // Q R B N
        }

        // ── Piece letter ──
        // If first char is uppercase A-Z and it's a piece letter, it's a piece move.
        // Otherwise it's a pawn move.
        let piece = 'P';
        if (s.length > 0 && 'KQRBN'.includes(s[0])) {
            piece = s[0];
            s = s.slice(1);
        }

        // ── Capture flag ──
        const capture = s.includes('x');
        s = s.replace('x', '');

        // ── Target square — always the LAST two characters ──
        // Whatever is left before it is disambiguation.
        const to = s.slice(-2);           // e.g. "d5"
        const disambig = s.slice(0, -2);        // e.g. "" or "b" or "1" or "d1"

        // ── Parse disambiguation into from-file and/or from-rank ──
        let fromFile = null;  // 'a'-'h'
        let fromRank = null;  // '1'-'8'
        let fromSquare = null; // full square if both given

        if (disambig.length === 2) {
            // Full square e.g. "d1" in Qd1f3
            fromSquare = disambig;
            fromFile = disambig[0];
            fromRank = disambig[1];
        } else if (disambig.length === 1) {
            if (disambig >= 'a' && disambig <= 'h') fromFile = disambig;
            else if (disambig >= '1' && disambig <= '8') fromRank = disambig;
        }

        return {
            san,
            piece,
            from: fromSquare || null,  // only set if fully specified in SAN
            fromFile,                        // file hint if given (e.g. 'b' in Nbd2)
            fromRank,                        // rank hint if given (e.g. '1' in R1e4)
            to,
            capture,
            promotion,
            castle: null,
            check: normSAN.includes('+'),
            checkmate: normSAN.includes('#'),
            nag: null,
            annotation: null,
        };
    }


    // ─────────────────────────────────────────────
    //  STEP 4: Full board tracker to resolve "from" squares
    //
    //  SAN only tells you WHERE a piece goes, not WHERE it came from
    //  (unless there's disambiguation). To know the origin square you
    //  have to maintain the board state and work out which piece
    //  can legally reach the target square.
    //
    //  Board is represented as a plain object:
    //    { 'e1': 'wK', 'e8': 'bK', 'f3': 'wN', ... }
    //  Keys are square names ('a1'-'h8').
    //  Values are two-char strings: color ('w'/'b') + piece ('K'Q'R'B'N'P').
    // ─────────────────────────────────────────────

    initialBoard() {
        const board = {};

        const backRank = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        files.forEach((file, i) => {
            board[`${file}1`] = `w${backRank[i]}`;  // white back rank
            board[`${file}2`] = 'wP';               // white pawns
            board[`${file}7`] = 'bP';               // black pawns
            board[`${file}8`] = `b${backRank[i]}`;  // black back rank
        });

        return board;
    }

    // Convert 'e4' → { file: 4, rank: 3 }  (0-indexed internally)
    sqToCoord(sq) {
        return {
            file: sq.charCodeAt(0) - 97,  // 'a'=0, 'b'=1, ... 'h'=7
            rank: parseInt(sq[1]) - 1     // '1'=0, '2'=1, ... '8'=7
        };
    }

    // Convert { file: 4, rank: 3 } → 'e4'
    coordToSq(file, rank) {
        return String.fromCharCode(97 + file) + (rank + 1);
    }

    // Check if a square exists on the board
    onBoard(file, rank) {
        return file >= 0 && file <= 7 && rank >= 0 && rank <= 7;
    }

    // Is the path from (f1,r1) to (f2,r2) clear? (exclusive of endpoints)
    pathClear(board, f1, r1, f2, r2) {
        const df = Math.sign(f2 - f1);
        const dr = Math.sign(r2 - r1);
        let f = f1 + df, r = r1 + dr;
        while (f !== f2 || r !== r2) {
            if (board[this.coordToSq(f, r)]) return false;
            f += df; r += dr;
        }
        return true;
    }

    // Can piece of type [piece] move from (ff,fr) to (tf,tr)?
    // [color] is 'w' or 'b' — needed for pawn direction
    canReach(board, piece, color, ff, fr, tf, tr, enPassant) {
        const df = tf - ff;
        const dr = tr - fr;
        const adf = Math.abs(df);
        const adr = Math.abs(dr);

        const target = board[this.coordToSq(tf, tr)];
        const isEmpty = !target;
        const isEnemy = target && target[0] !== color;
        const epSq = enPassant; // square string or null

        switch (piece) {
            case 'P': {
                const dir = color === 'w' ? 1 : -1;
                const start = color === 'w' ? 1 : 6;  // starting rank (0-indexed)
                const epHit = epSq && this.coordToSq(tf, tr) === epSq;
                if (df === 0) {
                    // Forward one square
                    if (dr === dir && isEmpty) return true;
                    // Forward two squares from start rank
                    if (dr === 2 * dir && fr === start && isEmpty
                        && !board[this.coordToSq(ff, fr + dir)]) return true;
                } else if (adf === 1 && dr === dir) {
                    // Diagonal capture (normal or en passant)
                    if (isEnemy || epHit) return true;
                }
                return false;
            }

            case 'N':
                // Knight: L-shape — 2+1 in any direction
                return adf * adr === 2 && (isEmpty || isEnemy);

            case 'B':
                // Bishop: diagonal only, path must be clear
                return adf === adr && (isEmpty || isEnemy)
                    && this.pathClear(board, ff, fr, tf, tr);

            case 'R':
                // Rook: same file or rank, path must be clear
                return (df === 0 || dr === 0) && (isEmpty || isEnemy)
                    && this.pathClear(board, ff, fr, tf, tr);

            case 'Q':
                // Queen: bishop OR rook moves
                return (adf === adr || df === 0 || dr === 0)
                    && (isEmpty || isEnemy)
                    && this.pathClear(board, ff, fr, tf, tr);

            case 'K':
                // King: one square any direction (castling handled separately)
                return adf <= 1 && adr <= 1 && (isEmpty || isEnemy);
        }
        return false;
    }

    // Find all squares that hold [color][piece] and can reach [toSq]
    // Returns array of square strings e.g. ['f3', 'g5']
    findCandidates(board, piece, color, toSq, enPassant) {
        const { file: tf, rank: tr } = this.sqToCoord(toSq);
        const candidates = [];

        for (const [sq, occupant] of Object.entries(board)) {
            if (occupant !== `${color}${piece}`) continue;
            const { file: ff, rank: fr } = this.sqToCoord(sq);
            if (this.canReach(board, piece, color, ff, fr, tf, tr, enPassant)) {
                candidates.push(sq);
            }
        }

        return candidates;
    }

    // Apply a parsed move to the board, returning updated board + en passant square
    applyMove(board, move, color) {
        const newBoard = { ...board };
        let enPassant = null;  // new en passant square after this move

        if (move.castle) {
            const rank = color === 'w' ? '1' : '8';
            const isKing = move.castle === 'kingside';
            // Move king
            delete newBoard[`e${rank}`];
            newBoard[`${isKing ? 'g' : 'c'}${rank}`] = `${color}K`;
            // Move rook
            delete newBoard[`${isKing ? 'h' : 'a'}${rank}`];
            newBoard[`${isKing ? 'f' : 'd'}${rank}`] = `${color}R`;
            return { board: newBoard, enPassant };
        }

        const from = move.from;
        const to = move.to;

        // En passant capture — remove the pawn that was passed
        if (move.piece === 'P' && move.capture && !board[to]) {
            const epRank = color === 'w' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
            delete newBoard[`${to[0]}${epRank}`];
        }

        // Move the piece
        delete newBoard[from];
        newBoard[to] = `${color}${move.promotion || move.piece}`;

        // Record new en passant square for double pawn push
        if (move.piece === 'P') {
            const fr = parseInt(from[1]), tr = parseInt(to[1]);
            if (Math.abs(tr - fr) === 2) {
                // The en passant target is the square the pawn skipped over
                const epRank = color === 'w' ? fr + 1 : fr - 1;
                enPassant = `${from[0]}${epRank}`;
            }
        }

        return { board: newBoard, enPassant };
    }

    // Resolve the "from" square for a move using the live board state
    resolveFrom(board, move, color, enPassant) {
        if (move.castle) {
            // King always starts on e1 or e8
            return color === 'w' ? 'e1' : 'e8';
        }

        let candidates = this.findCandidates(board, move.piece, color, move.to, enPassant);

        // Apply disambiguation hints to filter candidates
        if (candidates.length > 1) {
            if (move.fromFile) {
                candidates = candidates.filter(sq => sq[0] === move.fromFile);
            }
            if (move.fromRank) {
                candidates = candidates.filter(sq => sq[1] === move.fromRank);
            }
        }

        return candidates[0] || null;
    }


    // ─────────────────────────────────────────────
    //  STEP 5: NAG → human label mapping
    //
    //  NAG = Numeric Annotation Glyph.
    //  Chess.com exports use these instead of ! and ?
    //  The most common ones are:
    // ─────────────────────────────────────────────
    NAG_LABELS = {
        '$1': 'good move',       // !
        '$2': 'mistake',         // ?
        '$3': 'brilliant move',  // !!
        '$4': 'blunder',         // ??
        '$5': 'interesting',     // !?
        '$6': 'dubious',         // ?!
        '$7': 'forced',
        '$9': 'only move',
        '$10': 'equal',
        '$13': 'unclear',
        '$14': 'white is slightly better',
        '$15': 'black is slightly better',
        '$16': 'white is better',
        '$17': 'black is better',
        '$18': 'white is winning',
        '$19': 'black is winning',
    };

    // Extract NAG from the raw PGN text around a move token
    // We pull NAGs before stripping them so we can attach them to moves
    extractNAGs(pgnMovesSection) {
        // Find all "token $N" pairs — the NAG always follows its move token
        const pattern = /([^\s]+)\s+(\$\d+)/g;
        const nagMap = {};  // san → nag string
        let match;
        while ((match = pattern.exec(pgnMovesSection)) !== null) {
            nagMap[match[1]] = match[2];
        }
        return nagMap;
    }


    // ─────────────────────────────────────────────
    //  STEP 6: Main parse function — ties it all together
    // ─────────────────────────────────────────────
    parsePGN(pgn) {

        // ── Headers ──
        const headers = this.extractHeaders(pgn);
        const result = headers.Result || '*';

        // ── Get the moves section (everything after the headers) ──
        // Headers end at the last ']' line
        const movesSection = pgn.replace(/^\[.*\]$/gm, '');

        // ── Extract NAGs before stripping them ──
        const nagMap = this.extractNAGs(movesSection);

        // ── Tokenise ──
        const rawTokens = this.extractMoveTokens(pgn);

        // ── SAN validation regex ──
        // Matches all legal SAN forms including promotions and castling
        const sanRE = /^(O-O-O|O-O|0-0-0|0-0|[KQRBN]([a-h]|[1-8]|[a-h][1-8])?x?[a-h][1-8]|[a-h](x[a-h])?[1-8])(=[QRBNqrbn])?[+#]?$/;

        const sanTokens = rawTokens.filter(t => sanRE.test(t.replace(/[+#]$/, '')));

        // ── Board tracking ──
        let board = this.initialBoard();
        let enPassant = null;   // current en passant target square or null
        let moveNumber = 1;

        const moves = [];

        sanTokens.forEach((san, i) => {
            const color = i % 2 === 0 ? 'w' : 'b';
            const colorFull = color === 'w' ? 'white' : 'black';

            // Parse the SAN token into a structured object
            const parsed = this.parseSAN(san);

            // Resolve the "from" square using the live board
            const from = this.resolveFrom(board, parsed, color, enPassant);
            parsed.from = from;

            // Attach NAG if this move had one
            const nag = nagMap[san.replace(/[+#]/g, '')] || nagMap[san] || null;
            parsed.nag = nag;
            parsed.annotation = nag ? (NAG_LABELS[nag] || nag) : null;

            // Add metadata
            parsed.moveNumber = moveNumber;
            parsed.color = colorFull;

            // Clean up internal-only fields before returning
            delete parsed.fromFile;
            delete parsed.fromRank;

            moves.push(parsed);

            // Apply the move to update the board for the next iteration
            const updated = this.applyMove(board, { ...parsed, from }, color);
            board = updated.board;
            enPassant = updated.enPassant;

            // Increment move number after black's move
            if (color === 'b') moveNumber++;
        });

        return { headers, moves, result };
    }
}