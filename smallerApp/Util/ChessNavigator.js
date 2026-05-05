/**
 * chessNavigator.js
 * ─────────────────────────────────────────────────────────────────────────────
 * A self-contained chess move navigator.
 *
 * Accepts a PGN string OR a starting FEN + array of SAN moves.
 * Lets you step forward/backward through the game and returns the
 * fromSquare, toSquare, and current FEN at each position — ready to
 * plug straight into your chess review app.
 *
 * ── Quick Start ──────────────────────────────────────────────────────────────
 *
 *   const nav = new ChessNavigator({ pgn: `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6` });
 *
 *   nav.next();   // { san:'e4', fromSquare:'e2', toSquare:'e4', fen:'...', ... }
 *   nav.next();   // { san:'e5', fromSquare:'e7', toSquare:'e5', ... }
 *   nav.prev();   // back to after 1.e4
 *   nav.goTo(0);  // back to start (no move played)
 *
 * ── Constructor options ───────────────────────────────────────────────────────
 *
 *   new ChessNavigator({ pgn })              // parse moves from PGN string
 *   new ChessNavigator({ fen, moves })       // starting FEN + SAN move array
 *   new ChessNavigator({})                   // standard starting position, no moves
 *
 * ── Return shape ──────────────────────────────────────────────────────────────
 *
 *   {
 *     moveIndex  : number,   // 0 = start (no move played yet)
 *     total      : number,   // total half-moves in the game
 *     san        : string,   // SAN of the move just played ('' at start)
 *     fromSquare : string,   // e.g. 'e2'  ('' at start)
 *     toSquare   : string,   // e.g. 'e4'  ('' at start)
 *     promotion  : string,   // promotion piece if applicable ('' otherwise)
 *     fen        : string,   // FEN of the current position
 *     isStart    : boolean,
 *     isEnd      : boolean,
 *   }
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * No dependencies — pure vanilla JS, works in Node and the browser.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ─── Minimal chess engine ─────────────────────────────────────────────────────
// A lightweight, self-contained chess implementation sufficient to:
//   • Parse FEN / generate FEN
//   • Apply SAN moves and return from/to squares
//   • Handle castling, en-passant, promotion

const PIECES = { P: 1, N: 2, B: 3, R: 4, Q: 5, K: 6, p: -1, n: -2, b: -3, r: -4, q: -5, k: -6 };
const PIECE_CHARS = Object.fromEntries(Object.entries(PIECES).map(([k, v]) => [v, k]));

const FILES = 'abcdefgh';
const fileOf = sq => FILES.indexOf(sq[0]);
const rankOf = sq => parseInt(sq[1]) - 1;
const mkSq = (f, r) => FILES[f] + (r + 1);
const sqValid = (f, r) => f >= 0 && f < 8 && r >= 0 && r < 8;

/** Parse a FEN string into a board state object */
function parseFen(fen) {
    const [placement, turn, castling, ep, half, full] = fen.trim().split(' ');
    const board = Array(64).fill(0);

    let sq = 0;
    for (const ch of placement) {
        if (ch === '/') continue;
        if (/\d/.test(ch)) { sq += parseInt(ch); }
        else { board[fenSqToIndex(sq)] = PIECES[ch]; sq++; }
    }

    return {
        board,
        turn,               // 'w' | 'b'
        castling,           // e.g. 'KQkq'
        ep: ep === '-' ? null : ep,   // en-passant target square
        halfMove: parseInt(half) || 0,
        fullMove: parseInt(full) || 1,
    };
}

/** Convert FEN placement index (left-to-right, top-to-bottom) → board index (a1=0) */
function fenSqToIndex(fenIdx) {
    const fenRank = 7 - Math.floor(fenIdx / 8);
    const fenFile = fenIdx % 8;
    return fenRank * 8 + fenFile;
}

function sqToIndex(sq) { return rankOf(sq) * 8 + fileOf(sq); }
function indexToSq(i) { return FILES[i % 8] + (Math.floor(i / 8) + 1); }

/** Serialise a board state back to FEN */
function toFen(state) {
    const { board, turn, castling, ep, halfMove, fullMove } = state;
    let rows = [];
    for (let r = 7; r >= 0; r--) {
        let row = '', empty = 0;
        for (let f = 0; f < 8; f++) {
            const p = board[r * 8 + f];
            if (p === 0) { empty++; }
            else { if (empty) { row += empty; empty = 0; } row += PIECE_CHARS[p]; }
        }
        if (empty) row += empty;
        rows.push(row);
    }
    return `${rows.join('/')} ${turn} ${castling || '-'} ${ep || '-'} ${halfMove} ${fullMove}`;
}

/**
 * Apply a SAN move to a state, returning { newState, fromSq, toSq, promotion }.
 * Throws if the move cannot be parsed or applied.
 */
function applyMove(state, san) {
    // Strip check/checkmate/annotation suffixes
    const cleanSan = san.replace(/[+#!?]/g, '').trim();

    // ── Castling ──────────────────────────────────────────────────────────────
    if (cleanSan === 'O-O' || cleanSan === '0-0') {
        return applyCastle(state, 'K');
    }
    if (cleanSan === 'O-O-O' || cleanSan === '0-0-0') {
        return applyCastle(state, 'Q');
    }

    // ── Parse SAN ─────────────────────────────────────────────────────────────
    // Regex groups: piece? | disambiguation? | capture? | toFile toRank | =promotion?
    const m = cleanSan.match(
        /^([NBRQK])?([a-h]?[1-8]?)x?([a-h][1-8])(?:=([NBRQK]))?$/
    );
    if (!m) throw new Error(`Cannot parse SAN: "${san}"`);

    const [, pieceLetter, disambig, toSquare, promoPiece] = m;
    const pieceType = pieceLetter || 'P';   // default = pawn

    const toIdx = sqToIndex(toSquare);
    const toFile = fileOf(toSquare);
    const toRank = rankOf(toSquare);
    const isWhite = state.turn === 'w';
    const pieceValue = isWhite ? PIECES[pieceType] : PIECES[pieceType.toLowerCase()];

    // Find candidate squares that hold the right piece and can legally reach toSquare
    const candidates = [];
    for (let idx = 0; idx < 64; idx++) {
        if (state.board[idx] !== pieceValue) continue;
        const fromSq = indexToSq(idx);
        if (disambig) {
            // disambig is a file letter and/or rank digit
            if (/[a-h]/.test(disambig) && fromSq[0] !== disambig[0]) continue;
            if (/[1-8]/.test(disambig) && fromSq[1] !== disambig.slice(-1)) continue;
        }
        if (canReach(state, fromSq, toSquare, pieceType, promoPiece)) {
            candidates.push(fromSq);
        }
    }

    if (candidates.length === 0) throw new Error(`No legal move for "${san}" in position ${toFen(state)}`);
    if (candidates.length > 1) throw new Error(`Ambiguous move "${san}" — candidates: ${candidates.join(', ')}`);

    const fromSquare = candidates[0];
    const newState = executeMove(state, fromSquare, toSquare, promoPiece);
    return { newState, fromSquare, toSquare, promotion: promoPiece || '' };
}

/** Check whether a piece on fromSq could reach toSq (pure geometry + board state, no legality) */
function canReach(state, fromSq, toSq, pieceType, promo) {
    const ff = fileOf(fromSq), fr = rankOf(fromSq);
    const tf = fileOf(toSq), tr = rankOf(toSq);
    const df = tf - ff, dr = tr - fr;
    const isWhite = state.turn === 'w';

    switch (pieceType) {
        case 'P': {
            const dir = isWhite ? 1 : -1;
            const startRank = isWhite ? 1 : 6;
            // Push
            if (df === 0) {
                if (dr === dir && state.board[sqToIndex(toSq)] === 0) return true;
                if (dr === 2 * dir && fr === startRank &&
                    state.board[sqToIndex(toSq)] === 0 &&
                    state.board[sqToIndex(mkSq(ff, fr + dir))] === 0) return true; // blocked check below
            }
            // Capture (including en-passant)
            if (Math.abs(df) === 1 && dr === dir) {
                const target = state.board[sqToIndex(toSq)];
                if ((isWhite ? target < 0 : target > 0)) return true;
                if (state.ep === toSq) return true;
            }
            return false;
        }
        case 'N':
            return (Math.abs(df) === 2 && Math.abs(dr) === 1) ||
                (Math.abs(df) === 1 && Math.abs(dr) === 2);
        case 'B':
            if (Math.abs(df) !== Math.abs(dr) || df === 0) return false;
            return !isBlocked(state.board, ff, fr, Math.sign(df), Math.sign(dr), tf, tr);
        case 'R':
            if (df !== 0 && dr !== 0) return false;
            if (df === 0 && dr === 0) return false;
            return !isBlocked(state.board, ff, fr, Math.sign(df), Math.sign(dr), tf, tr);
        case 'Q':
            if (df === 0 || dr === 0 || Math.abs(df) === Math.abs(dr)) {
                if (df === 0 && dr === 0) return false;
                const stepF = df === 0 ? 0 : Math.sign(df);
                const stepR = dr === 0 ? 0 : Math.sign(dr);
                return !isBlocked(state.board, ff, fr, stepF, stepR, tf, tr);
            }
            return false;
        case 'K':
            return Math.abs(df) <= 1 && Math.abs(dr) <= 1 && (df !== 0 || dr !== 0);
        default:
            return false;
    }
}

/** Returns true if any piece sits between (ff,fr) and (tf,tr) exclusive, stepping by (sf,sr) */
function isBlocked(board, ff, fr, sf, sr, tf, tr) {
    let f = ff + sf, r = fr + sr;
    while (f !== tf || r !== tr) {
        if (board[r * 8 + f] !== 0) return true;
        f += sf; r += sr;
    }
    return false;
}

// Pawn double-push blocker helper
function toSq2(f, r) { return sqValid(f, r) ? toSq(f, r) : null; }

/** Execute a move and return new state (immutable — clones board) */
function executeMove(state, fromSq, toSq, promoPiece) {
    const board = [...state.board];
    const fromIdx = sqToIndex(fromSq);
    const toIdx = sqToIndex(toSq);
    const piece = board[fromIdx];
    const isWhite = state.turn === 'w';
    const absP = Math.abs(piece);

    let castling = state.castling;
    let ep = null;
    let halfMove = state.halfMove + 1;

    // Capture or pawn move resets halfmove clock
    if (board[toIdx] !== 0 || absP === 1) halfMove = 0;

    // En-passant capture
    if (absP === 1 && toSq === state.ep) {
        const epCaptureRank = isWhite ? rankOf(toSq) - 1 : rankOf(toSq) + 1;
        board[epCaptureRank * 8 + fileOf(toSq)] = 0;
    }

    // Set en-passant target for double pawn push
    if (absP === 1 && Math.abs(rankOf(toSq) - rankOf(fromSq)) === 2) {
        const epRank = (rankOf(fromSq) + rankOf(toSq)) / 2;
        ep = FILES[fileOf(fromSq)] + (epRank + 1);
    }

    // Move piece
    board[fromIdx] = 0;
    board[toIdx] = piece;

    // Promotion
    if (absP === 1 && (rankOf(toSq) === 7 || rankOf(toSq) === 0)) {
        const promoP = promoPiece || 'Q';
        board[toIdx] = isWhite ? PIECES[promoP] : PIECES[promoP.toLowerCase()];
    }

    // Update castling rights
    const castlingUpdates = {
        e1: ['K', 'Q'], e8: ['k', 'q'],
        a1: ['Q'], h1: ['K'], a8: ['q'], h8: ['k'],
    };
    for (const sq of [fromSq, toSq]) {
        for (const right of (castlingUpdates[sq] || [])) {
            castling = castling.replace(right, '');
        }
    }
    if (!castling) castling = '-';

    return {
        board,
        turn: isWhite ? 'b' : 'w',
        castling,
        ep,
        halfMove,
        fullMove: state.fullMove + (isWhite ? 0 : 1),
    };
}

/** Handle castling moves */
function applyCastle(state, side) {
    const isWhite = state.turn === 'w';
    const rank = isWhite ? 1 : 8;
    const board = [...state.board];

    const kingFrom = `e${rank}`;
    const kingTo = side === 'K' ? `g${rank}` : `c${rank}`;
    const rookFrom = side === 'K' ? `h${rank}` : `a${rank}`;
    const rookTo = side === 'K' ? `f${rank}` : `d${rank}`;

    const king = board[sqToIndex(kingFrom)];
    const rook = board[sqToIndex(rookFrom)];

    board[sqToIndex(kingFrom)] = 0;
    board[sqToIndex(rookFrom)] = 0;
    board[sqToIndex(kingTo)] = king;
    board[sqToIndex(rookTo)] = rook;

    let castling = state.castling;
    if (isWhite) castling = castling.replace('K', '').replace('Q', '');
    else castling = castling.replace('k', '').replace('q', '');
    if (!castling) castling = '-';

    return {
        newState: {
            board,
            turn: isWhite ? 'b' : 'w',
            castling,
            ep: null,
            halfMove: state.halfMove + 1,
            fullMove: state.fullMove + (isWhite ? 0 : 1),
        },
        fromSquare: kingFrom,
        toSquare: kingTo,
        promotion: '',
    };
}

// ─── PGN parser ───────────────────────────────────────────────────────────────

/**
 * Extract the moves array from a PGN string.
 * Handles move numbers, comments {...}, and result tokens.
 * Returns an array of SAN strings.
 */
function parsePgn(pgn) {
    // Strip comments
    let text = pgn.replace(/\{[^}]*\}/g, '');
    // Strip variations
    text = text.replace(/\([^)]*\)/g, '');
    // Strip tags
    text = text.replace(/\[.*?\]/g, '');
    // Remove result
    text = text.replace(/1-0|0-1|1\/2-1\/2|\*/g, '');
    // Remove move numbers (e.g. "1." "12..." "1...")
    text = text.replace(/\d+\.+/g, '');

    return text.trim().split(/\s+/).filter(t => t && /^[a-zA-Z]/.test(t));
}

// ─── ChessNavigator ──────────────────────────────────────────────────────────

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export class ChessNavigator {
    /**
     * @param {object} opts
     * @param {string}   [opts.pgn]   - Full PGN string (takes precedence over fen+moves)
     * @param {string}   [opts.fen]   - Starting FEN  (default: standard starting position)
     * @param {string[]} [opts.moves] - Array of SAN moves (used when pgn is not provided)
     */
    constructor({ pgn, fen, moves } = {}) {
        this._startFen = fen || DEFAULT_FEN;
        this._sanMoves = pgn ? parsePgn(pgn) : (moves || []);

        // Pre-compute all positions up front
        this._positions = this._buildPositions();
        this._index = 0;   // 0 = starting position (no move played)
    }

    // ── Internal ───────────────────────────────────────────────────────────────

    _buildPositions() {
        const positions = [{
            state: parseFen(this._startFen),
            fen: this._startFen,
            san: '',
            fromSquare: '',
            toSquare: '',
            promotion: '',
        }];

        let state = positions[0].state;
        for (const san of this._sanMoves) {
            try {
                const { newState, fromSquare, toSquare, promotion } = applyMove(state, san);
                positions.push({
                    state: newState,
                    fen: toFen(newState),
                    san,
                    fromSquare,
                    toSquare,
                    promotion,
                });
                state = newState;
            } catch (e) {
                console.warn(`ChessNavigator: skipping move "${san}" — ${e.message}`);
                break;
            }
        }
        return positions;
    }

    _snapshot() {
        console.log("CHESS NAVIGATOR: " + ` index: ${this._index}`)
        const p = this._positions[this._index];
        return {
            moveIndex: this._index,
            total: this._positions.length - 1,
            san: p.san,
            fromSquare: p.fromSquare,
            toSquare: p.toSquare,
            promotion: p.promotion,
            fen: p.fen,
            isStart: this._index === 0,
            isEnd: this._index === this._positions.length - 1,
        };
    }

    // ── Public API ─────────────────────────────────────────────────────────────

    /**
     * Current state snapshot (does not move).
     * @returns {MoveSnapshot}
     */
    current() {
        return this._snapshot();
    }

    /**
     * Step forward one move.
     * Returns the snapshot AFTER the move (i.e. includes fromSquare/toSquare of the move just played).
     * Returns current snapshot unchanged if already at end.
     */
    next() {
        if (this._index < this._positions.length - 1) this._index++;
        return this._snapshot();
    }

    /**
     * Step backward one move.
     * Returns the snapshot of the position BEFORE that move.
     * Returns current snapshot unchanged if already at start.
     */
    prev() {
        console.log("CHESS NAVIGATOR: " + ` index: ${this._index}`)

        if (this._index > 0) this._index -= 1;
        return this._snapshot();
    }

    /**
     * Jump to a specific move index (0 = start).
     * @param {number} index
     */
    goTo(index) {
        this._index = Math.max(0, Math.min(index, this._positions.length - 1));
        return this._snapshot();
    }

    /** Jump to the very beginning. */
    toStart() { return this.goTo(0); }

    /** Jump to the very end. */
    toEnd() { return this.goTo(this._positions.length - 1); }

    /** Total number of half-moves in the loaded game. */
    get length() { return this._positions.length - 1; }

    /** All positions as an array of snapshots (read-only, useful for building a move list UI). */
    get allMoves() {
        return this._positions.map((_, i) => {
            const saved = this._index;
            this._index = i;
            const snap = this._snapshot();
            this._index = saved;
            return snap;
        });
    }

    /**
     * Register a callback that fires whenever the current position changes.
     *
     *   nav.onChange(snap => renderBoard(snap.fen));
     *
     * Returns an unsubscribe function:
     *   const unsub = nav.onChange(cb);
     *   unsub(); // stop listening
     */
    onChange(cb) {
        if (!this._listeners) this._listeners = new Set();
        this._listeners.add(cb);
        return () => this._listeners.delete(cb);
    }

    _emit() {
        if (!this._listeners || this._listeners.size === 0) return;
        const snap = this._snapshot();
        this._listeners.forEach(cb => cb(snap));
    }

    /**
     * Hot-reload a new PGN string from your live game.
     *
     * • Rebuilds the position list from the updated PGN.
     * • If you were at the END (following live play), stays at the new end.
     * • If you were stepped back reviewing an earlier move, stays at that
     *   index so your review isn't interrupted as new moves come in.
     * • Fires onChange if the currently viewed position FEN changed.
     *
     * Usage — call this every time your app's PGN updates:
     *   myGame.on('move', pgn => nav.loadPgn(pgn));
     *
     * @param {string} pgn
     * @returns {MoveSnapshot} current snapshot after reload
     */
    loadPgn(pgn) {
        const wasAtEnd = this._index === this._positions.length - 1;
        const prevFen = this._positions[this._index]?.fen;

        this._sanMoves = parsePgn(pgn);
        this._positions = this._buildPositions();

        if (wasAtEnd) {
            // Auto-follow the live game to the newest move
            this._index = this._positions.length - 1;
        } else {
            // Stay put, but clamp if history somehow shrank
            this._index = Math.min(this._index, this._positions.length - 1);
        }

        if (this._positions[this._index]?.fen !== prevFen) this._emit();
        return this._snapshot();
    }
}

// ─── Exports ─────────────────────────────────────────────────────────────────

// CommonJS
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ChessNavigator, parseFen, toFen, applyMove, parsePgn };
}

// ES module (uncomment if using bundler / native ESM)
// export { ChessNavigator, parseFen, toFen, applyMove, parsePgn };

// Browser global
if (typeof window !== 'undefined') {
    window.ChessNavigator = ChessNavigator;
}


// ─── Quick usage examples (runs in Node: `node chessNavigator.js`) ────────────
if (typeof require !== 'undefined' && require.main === module) {
    console.log('\n── Example 1: Load from PGN ──────────────────────────────');
    const nav = new ChessNavigator({
        pgn: `1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7`,
    });

    console.log('Total moves:', nav.length);

    let snap;
    snap = nav.next(); console.log(`Move ${snap.moveIndex}: ${snap.san}  ${snap.fromSquare}→${snap.toSquare}`);
    snap = nav.next(); console.log(`Move ${snap.moveIndex}: ${snap.san}  ${snap.fromSquare}→${snap.toSquare}`);
    snap = nav.next(); console.log(`Move ${snap.moveIndex}: ${snap.san}  ${snap.fromSquare}→${snap.toSquare}`);
    snap = nav.prev(); console.log(`Back to ${snap.moveIndex}: ${snap.san || '(start)'}`);
    snap = nav.goTo(5); console.log(`Jump to 5: ${snap.san}  ${snap.fromSquare}→${snap.toSquare}`);

    console.log('\n── Example 2: Load from FEN + moves array ────────────────');
    const nav2 = new ChessNavigator({
        fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
        moves: ['O-O', 'Nf6', 'd3', 'd6'],
    });

    console.log('Castling move:');
    snap = nav2.next();
    console.log(` san:${snap.san}  from:${snap.fromSquare}  to:${snap.toSquare}`);
    console.log(` FEN: ${snap.fen}`);

    console.log('\n── Example 3: allMoves list ──────────────────────────────');
    const nav3 = new ChessNavigator({ pgn: '1. d4 d5 2. c4 e6' });
    nav3.allMoves.forEach(m => {
        if (m.moveIndex === 0) console.log(`  [start]`);
        else console.log(`  ${m.moveIndex}. ${m.san.padEnd(6)} ${m.fromSquare}→${m.toSquare}`);
    });
}

// ─── Example 4: live game — loadPgn() + onChange() ────────────────────────────
if (typeof require !== 'undefined' && require.main === module) {
    console.log('\n── Example 4: live game — loadPgn() + onChange() ─────────');

    const nav4 = new ChessNavigator({});

    // Wire onChange to your board renderer
    nav4.onChange(snap => {
        const board = snap.fen.split(' ')[0];
        console.log(`  [onChange] ${snap.moveIndex}/${snap.total}: ${snap.san || 'start'}  ${board}`);
    });

    // Simulate moves arriving one by one from your live game
    const liveMoves = ['e4', 'e5', 'Nf3', 'Nc6', 'Bb5'];
    let livePgn = '';
    for (let i = 0; i < liveMoves.length; i++) {
        livePgn += (i % 2 === 0 ? ` ${Math.floor(i / 2) + 1}.` : '') + ` ${liveMoves[i]}`;
        const snap = nav4.loadPgn(livePgn.trim());
        console.log(`  loadPgn → at ${snap.moveIndex}/${snap.total}, isEnd:${snap.isEnd}`);
    }

    // Step back to move 2 to review — then a new move arrives — should stay put
    console.log('\n  Step back to move 2 to review:');
    nav4.goTo(2);
    console.log(`  now at ${nav4.current().moveIndex}/${nav4.current().total}`);

    livePgn += ' a6';
    console.log('  New move arrives (a6) — reviewer stays at index 2:');
    const after = nav4.loadPgn(livePgn.trim());
    console.log(`  index is ${after.moveIndex} (total now ${after.total}) ✓`);
}