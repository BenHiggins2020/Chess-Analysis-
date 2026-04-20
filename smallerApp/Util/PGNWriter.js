// ═══════════════════════════════════════════════════════════
//  LIVE PGN TRACKER
//
//  Tracks the current game move by move and maintains a
//  running PGN string you can read at any time.
//
//  Usage:
//    const tracker = createPGNTracker({ White: 'Ben', Black: 'Opponent' });
//
//    // In your handleMove:
//    const result = tracker.push('e2', 'e4');
//    console.log(result.san);        // 'e4'
//    console.log(result.pgn);        // full PGN so far
//    console.log(result.moveNumber); // 1
//    console.log(result.color);      // 'white'
//
//    // Get current PGN anytime:
//    tracker.pgn()
//
//    // Undo last move:
//    tracker.undo()
//
//    // Reset for a new game:
//    tracker.reset()
// ═══════════════════════════════════════════════════════════


// ─────────────────────────────────────────────
//  BOARD HELPERS
// ─────────────────────────────────────────────

function _initialBoard() {
    const b = {};
    const back = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    files.forEach((f, i) => {
        b[`${f}1`] = `w${back[i]}`;
        b[`${f}2`] = 'wP';
        b[`${f}7`] = 'bP';
        b[`${f}8`] = `b${back[i]}`;
    });
    return b;
}

function _coord(sq) {
    return { f: sq.charCodeAt(0) - 97, r: parseInt(sq[1]) - 1 };
}

function _sq(f, r) {
    return String.fromCharCode(97 + f) + (r + 1);
}

function _pathClear(board, from, to) {
    const { f: f1, r: r1 } = _coord(from);
    const { f: f2, r: r2 } = _coord(to);
    const df = Math.sign(f2 - f1), dr = Math.sign(r2 - r1);
    let f = f1 + df, r = r1 + dr;
    while (f !== f2 || r !== r2) {
        if (board[_sq(f, r)]) return false;
        f += df; r += dr;
    }
    return true;
}

function _canReach(board, piece, color, from, to, ep) {
    const { f: ff, r: fr } = _coord(from);
    const { f: tf, r: tr } = _coord(to);
    const df = tf - ff, dr = tr - fr, adf = Math.abs(df), adr = Math.abs(dr);
    const tgt = board[to];
    const empty = !tgt;
    const enemy = tgt && tgt[0] !== color;

    switch (piece) {
        case 'P': {
            const dir = color === 'w' ? 1 : -1, start = color === 'w' ? 1 : 6;
            if (df === 0) {
                if (dr === dir && empty) return true;
                if (dr === 2 * dir && fr === start && empty && !board[_sq(ff, fr + dir)]) return true;
            } else if (adf === 1 && dr === dir && (enemy || to === ep)) return true;
            return false;
        }
        case 'N': return adf * adr === 2 && (empty || enemy);
        case 'B': return adf === adr && (empty || enemy) && _pathClear(board, from, to);
        case 'R': return (df === 0 || dr === 0) && (empty || enemy) && _pathClear(board, from, to);
        case 'Q': return (adf === adr || df === 0 || dr === 0) && (empty || enemy) && _pathClear(board, from, to);
        case 'K': return adf <= 1 && adr <= 1 && (empty || enemy);
    }
    return false;
}

function _isInCheck(board, color, ep) {
    // Find this color's king
    const kingSq = Object.keys(board).find(sq => board[sq] === `${color}K`);
    if (!kingSq) return false;
    const attacker = color === 'w' ? 'b' : 'w';
    return Object.entries(board).some(([sq, p]) =>
        p[0] === attacker && _canReach(board, p[1], attacker, sq, kingSq, ep)
    );
}

function _hasLegalMoves(board, color, ep) {
    for (const [from, p] of Object.entries(board)) {
        if (p[0] !== color) continue;
        for (let f = 0; f < 8; f++) {
            for (let r = 0; r < 8; r++) {
                const to = _sq(f, r);
                if (!_canReach(board, p[1], color, from, to, ep)) continue;
                const test = { ...board };
                delete test[from];
                test[to] = p;
                if (p[1] === 'P' && to === ep) {
                    const cr = color === 'w' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
                    delete test[`${to[0]}${cr}`];
                }
                if (!_isInCheck(test, color, null)) return true;
            }
        }
    }
    return false;
}


// ─────────────────────────────────────────────
//  PIECE DETECTOR
//
//  Given just fromSquare and toSquare, look up what
//  piece is sitting on fromSquare in the current board.
//  This means the caller doesn't need to track pieces —
//  just squares.
// ─────────────────────────────────────────────
function _getPiece(board, from) {
    const occupant = board[from];
    if (!occupant) return null;
    return occupant[1]; // e.g. 'wN' → 'N'
}


// ─────────────────────────────────────────────
//  DISAMBIGUATION
// ─────────────────────────────────────────────
function _disambiguate(board, piece, color, from, to, ep) {
    const others = Object.keys(board).filter(sq =>
        sq !== from &&
        board[sq] === `${color}${piece}` &&
        _canReach(board, piece, color, sq, to, ep)
    );
    if (!others.length) return '';

    const sameFile = others.filter(sq => sq[0] === from[0]);
    if (!sameFile.length) return from[0]; // file disambig e.g. 'b' → Nbd2

    const sameRank = others.filter(sq => sq[1] === from[1]);
    if (!sameRank.length) return from[1]; // rank disambig e.g. '1' → R1e4

    return from; // full square e.g. 'd1' → Qd1f3
}


// ─────────────────────────────────────────────
//  APPLY MOVE — returns { board, ep, castleRights }
// ─────────────────────────────────────────────
function _apply(board, from, to, piece, color, promotion, ep, cr) {
    const next = { ...board };
    let newEP = null;
    const rights = { ...cr };

    // ── Castling (king moves 2 squares) ──
    if (piece === 'K' && Math.abs(_coord(to).f - _coord(from).f) === 2) {
        const rank = color === 'w' ? '1' : '8';
        const kingSide = _coord(to).f > _coord(from).f;
        delete next[from];
        next[to] = `${color}K`;
        if (kingSide) { delete next[`h${rank}`]; next[`f${rank}`] = `${color}R`; }
        else { delete next[`a${rank}`]; next[`d${rank}`] = `${color}R`; }
        if (color === 'w') { rights.wK = false; rights.wQ = false; }
        else { rights.bK = false; rights.bQ = false; }
        return { board: next, ep: null, castleRights: rights };
    }

    // ── En passant capture ──
    if (piece === 'P' && to === ep) {
        const capRank = color === 'w' ? parseInt(to[1]) - 1 : parseInt(to[1]) + 1;
        delete next[`${to[0]}${capRank}`];
    }

    // ── Move piece ──
    delete next[from];
    next[to] = `${color}${promotion || piece}`;

    // ── New en passant square ──
    if (piece === 'P' && Math.abs(parseInt(to[1]) - parseInt(from[1])) === 2) {
        const epRank = color === 'w' ? parseInt(from[1]) + 1 : parseInt(from[1]) - 1;
        newEP = `${from[0]}${epRank}`;
    }

    // ── Castling rights ──
    if (piece === 'K') {
        if (color === 'w') { rights.wK = false; rights.wQ = false; }
        else { rights.bK = false; rights.bQ = false; }
    }
    if (from === 'h1' || to === 'h1') rights.wK = false;
    if (from === 'a1' || to === 'a1') rights.wQ = false;
    if (from === 'h8' || to === 'h8') rights.bK = false;
    if (from === 'a8' || to === 'a8') rights.bQ = false;

    return { board: next, ep: newEP, castleRights: rights };
}


// ─────────────────────────────────────────────
//  SAN GENERATOR
//  Given board state BEFORE the move, produce SAN
// ─────────────────────────────────────────────
function _toSAN(board, from, to, piece, color, promotion, ep, cr) {

    // ── Castling ──
    if (piece === 'K' && Math.abs(_coord(to).f - _coord(from).f) === 2) {
        const { board: after } = _apply(board, from, to, piece, color, null, ep, cr);
        const opp = color === 'w' ? 'b' : 'w';
        const check = _isInCheck(after, opp, null);
        const mate = check && !_hasLegalMoves(after, opp, null);
        const suffix = mate ? '#' : check ? '+' : '';
        const kingSide = _coord(to).f > _coord(from).f;
        return (kingSide ? 'O-O' : 'O-O-O') + suffix;
    }

    // ── Piece letter (blank for pawns) ──
    const letter = piece === 'P' ? '' : piece;

    // ── Disambiguation ──
    const dis = piece === 'P' ? '' : _disambiguate(board, piece, color, from, to, ep);

    // ── Capture ──
    const isCapture = !!board[to] || (piece === 'P' && to === ep);
    const capStr = isCapture
        ? (piece === 'P' ? `${from[0]}x` : 'x')
        : '';

    // ── Promotion ──
    const promoStr = promotion ? `=${promotion}` : '';

    // ── Check / Checkmate ──
    const { board: after, ep: newEP } = _apply(board, from, to, piece, color, promotion, ep, cr);
    const opp = color === 'w' ? 'b' : 'w';
    const check = _isInCheck(after, opp, newEP);
    const mate = check && !_hasLegalMoves(after, opp, newEP);
    const suffix = mate ? '#' : check ? '+' : '';

    return `${letter}${dis}${capStr}${to}${promoStr}${suffix}`;
}


// ═══════════════════════════════════════════════════════════
//  createPGNTracker — the main exported function
//
//  headers: optional object with PGN tag values
//    { White, Black, Event, Site, Date, Round }
// ═══════════════════════════════════════════════════════════
export function createPGNTracker(headers = {}) {

    // ── State ──
    let board = _initialBoard();
    let ep = null;         // current en passant square
    let castleRights = { wK: true, wQ: true, bK: true, bQ: true };
    let moveNumber = 1;
    let colorIdx = 0;            // 0 = white, 1 = black
    let moveTokens = [];           // accumulated "1. e4 e5 2. Nf3 ..." tokens
    let history = [];           // for undo support

    // ── Header builder ──
    function _buildHeaderStr(result = '*') {
        const required = ['Event', 'Site', 'Date', 'Round', 'White', 'Black', 'Result'];
        const defaults = {
            Event: '?', Site: '?',
            Date: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
            Round: '?', White: '?', Black: '?', Result: '*'
        };
        const merged = { ...defaults, ...headers, Result: result };
        return required.map(t => `[${t} "${merged[t]}"]`).join('\n');
    }

    // ── Move text formatter — wraps at 80 chars ──
    function _formatMoves(result) {
        const tokens = [...moveTokens, result];
        const lines = [];
        let line = '';
        for (const tok of tokens) {
            const candidate = line ? `${line} ${tok}` : tok;
            if (candidate.length > 80) { lines.push(line); line = tok; }
            else line = candidate;
        }
        if (line) lines.push(line);
        return lines.join('\n');
    }

    // ──────────────────────────────────────────
    //  push(fromSquare, toSquare, promotion?)
    //
    //  The function you call on every handleMove.
    //
    //  fromSquare:  e.g. 'e2'
    //  toSquare:    e.g. 'e4'
    //  promotion:   'Q' | 'R' | 'B' | 'N' | null
    //
    //  Returns:
    //  {
    //    san:        'e4',         the SAN for this move
    //    pgn:        '...',        full PGN string so far
    //    moveText:   '1. e4 e5',  just the move text (no headers)
    //    moveNumber: 1,
    //    color:      'white',
    //    from:       'e2',
    //    to:         'e4',
    //    piece:      'P',
    //    capture:    false,
    //    check:      false,
    //    checkmate:  false,
    //  }
    // ──────────────────────────────────────────
    function push(fromSquare, toSquare, promotion = null) {
        const color = colorIdx === 0 ? 'w' : 'b';
        const piece = _getPiece(board, fromSquare);

        if (!piece) {
            throw new Error(`No piece on ${fromSquare}`);
        }

        // Generate SAN using board state BEFORE the move
        const san = _toSAN(board, fromSquare, toSquare, piece, color, promotion, ep, castleRights);

        // Save state snapshot for undo
        history.push({
            board: { ...board },
            ep,
            castleRights: { ...castleRights },
            moveNumber,
            colorIdx,
            moveTokensLen: moveTokens.length,
        });

        // Add to move token list with move number prefix on white's turn
        if (colorIdx === 0) {
            // White's move — add "N. san"
            moveTokens.push(`${moveNumber}.`, san);
        } else {
            // Black's move — just the SAN (move number already added)
            moveTokens.push(san);
        }

        // Apply the move to update board state
        const updated = _apply(board, fromSquare, toSquare, piece, color, promotion, ep, castleRights);
        board = updated.board;
        ep = updated.ep;
        castleRights = updated.castleRights;

        // Advance turn
        const wasWhite = colorIdx === 0;
        colorIdx = 1 - colorIdx;
        if (colorIdx === 0) moveNumber++;

        // Build return object
        const isCapture = san.includes('x');
        const isCheck = san.endsWith('+');
        const isCheckmate = san.endsWith('#');

        return {
            san,
            pgn: _buildHeaderStr() + '\n\n' + _formatMoves('*'),
            moveText: _formatMoves('*'),
            moveNumber: wasWhite ? moveNumber - (colorIdx === 0 ? 1 : 0) : moveNumber,
            color: wasWhite ? 'white' : 'black',
            from: fromSquare,
            to: toSquare,
            piece,
            promotion,
            capture: isCapture,
            check: isCheck,
            checkmate: isCheckmate,
        };
    }

    // ──────────────────────────────────────────
    //  undo() — remove the last move
    // ──────────────────────────────────────────
    function undo() {
        if (!history.length) return null;
        const snap = history.pop();
        board = snap.board;
        ep = snap.ep;
        castleRights = snap.castleRights;
        moveNumber = snap.moveNumber;
        colorIdx = snap.colorIdx;
        moveTokens = moveTokens.slice(0, snap.moveTokensLen);
        return pgn();
    }

    // ──────────────────────────────────────────
    //  pgn(result?) — get current full PGN
    // ──────────────────────────────────────────
    function pgn(result = '*') {
        return _buildHeaderStr(result) + '\n\n' + _formatMoves(result);
    }

    // ──────────────────────────────────────────
    //  finish(result) — mark game as over
    //  result: '1-0' | '0-1' | '1/2-1/2'
    // ──────────────────────────────────────────
    function finish(result) {
        headers.Result = result;
        return pgn(result);
    }

    // ──────────────────────────────────────────
    //  reset() — start a new game
    // ──────────────────────────────────────────
    function reset(newHeaders = {}) {
        board = _initialBoard();
        ep = null;
        castleRights = { wK: true, wQ: true, bK: true, bQ: true };
        moveNumber = 1;
        colorIdx = 0;
        moveTokens = [];
        history = [];
        if (newHeaders) headers = { ...headers, ...newHeaders };
    }

    // ──────────────────────────────────────────
    //  currentTurn() — whose turn is it?
    // ──────────────────────────────────────────
    function currentTurn() {
        return colorIdx === 0 ? 'white' : 'black';
    }

    // ──────────────────────────────────────────
    //  moveCount() — total half-moves played
    // ──────────────────────────────────────────
    function moveCount() {
        return history.length;
    }


    function fen() {
        // Piece placement — rank 8 down to rank 1
        let placement = '';
        for (let r = 7; r >= 0; r--) {
            let empty = 0;
            for (let f = 0; f < 8; f++) {
                const piece = board[_sq(f, r)];
                if (piece) {
                    if (empty) { placement += empty; empty = 0; }
                    // board stores 'wN', 'bP' etc.
                    // FEN uses uppercase for white, lowercase for black
                    placement += piece[0] === 'w' ? piece[1] : piece[1].toLowerCase();
                } else {
                    empty++;
                }
            }
            if (empty) placement += empty;
            if (r > 0) placement += '/';
        }

        // Active color
        const activeColor = colorIdx === 0 ? 'w' : 'b';

        // Castling availability
        let castling = '';
        if (castleRights.wK) castling += 'K';
        if (castleRights.wQ) castling += 'Q';
        if (castleRights.bK) castling += 'k';
        if (castleRights.bQ) castling += 'q';
        if (!castling) castling = '-';

        // En passant target square
        const epStr = ep || '-';

        // Halfmove and fullmove clocks
        // (we don't track halfmove clock for simplicity — defaulting to 0 is fine for analysis)
        const fullMove = moveNumber;

        return `${placement} ${activeColor} ${castling} ${epStr} 0 ${fullMove}`;
    }

    // Then expose it in the return object:
    return { push, undo, pgn, fen, finish, reset, currentTurn, moveCount };
}