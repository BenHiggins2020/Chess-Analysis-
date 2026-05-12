/**
 * pgn-parser.js
 *
 * Parses PGN strings (including arbitrarily nested variations) into a
 * structured tree that can be stepped through for analysis.
 *
 * Public API
 * ----------
 * parsePGN(pgn: string) → GameTree
 *
 * GameTree {
 *   headers  : object            // tag-pair key/value map (may be empty)
 *   mainLine : Node[]            // ordered list of main-line Node objects
 *   result   : string            // "*" | "1-0" | "0-1" | "1/2-1/2"
 * }
 *
 * Node {
 *   moveNumber  : number         // e.g. 1, 2, 3 …
 *   color       : "white"|"black"
 *   san         : string         // Standard Algebraic Notation
 *   comment     : string|null    // text inside { … } after this move
 *   nags        : string[]       // NAG tokens like "$1", "!", "?", "!!", "??"
 *   variations  : Node[][]       // each element is an alternative line (same shape)
 *   depth       : number         // 0 = main line, 1 = first-level variation, …
 * }
 *
 * Helper exports
 * --------------
 * flattenMainLine(gameTree)  → Node[]   (main line only, in order)
 * flattenAll(gameTree)       → Node[]   (every node, depth-first, mainline + all variations)
 * nodesBySide(nodes, color)  → Node[]   (filter by "white" or "black")
 * toSANList(nodes)           → string[] (just the SAN strings)
 */

// ---------------------------------------------------------------------------
// Tokeniser
// ---------------------------------------------------------------------------

const TOKEN = {
    MOVE_NUMBER: "MOVE_NUMBER",   // e.g. "1.", "3..."
    SAN: "SAN",           // e.g. "e4", "Nxf3+", "O-O-O", "a8=Q#"
    NAG: "NAG",           // "$1" or inline "!", "?", "!!", "??", "!?", "?!"
    COMMENT: "COMMENT",       // text between { }
    LPAREN: "LPAREN",        // (
    RPAREN: "RPAREN",        // )
    RESULT: "RESULT",        // * 1-0 0-1 1/2-1/2
    EOF: "EOF",
};

const RESULT_RE = /^(\*|1-0|0-1|1\/2-1\/2)/;
const MOVE_NUM_RE = /^(\d+)(\.{1,3})/;   // "1." or "3..."
const NAG_RE = /^(\$\d+|!!|\?\?|!\?|\?!|!|\?)/;
// SAN: castle | piece-move | pawn-move  (all optional suffix: =Q # + x etc.)
const SAN_RE = /^(O-O-O|O-O|[KQRBN][a-h]?[1-8]?x?[a-h][1-8](?:=[QRBN])?[+#]?|[a-h][1-8]?x?[a-h]?[1-8](?:=[QRBN])?[+#]?)/;

function tokenise(pgn) {
    const tokens = [];
    let i = 0;

    // Strip header tag-pairs first so we only tokenise the move-text section
    // (parsePGN handles headers separately; here we just skip them)

    while (i < pgn.length) {
        // Skip whitespace
        if (/\s/.test(pgn[i])) { i++; continue; }

        // Comment
        if (pgn[i] === "{") {
            const end = pgn.indexOf("}", i + 1);
            if (end === -1) throw new Error("Unclosed comment brace");
            tokens.push({ type: TOKEN.COMMENT, value: pgn.slice(i + 1, end).trim() });
            i = end + 1;
            continue;
        }

        // Variation delimiters
        if (pgn[i] === "(") { tokens.push({ type: TOKEN.LPAREN, value: "(" }); i++; continue; }
        if (pgn[i] === ")") { tokens.push({ type: TOKEN.RPAREN, value: ")" }); i++; continue; }

        // Semicolon comment (to end of line)
        if (pgn[i] === ";") {
            const nl = pgn.indexOf("\n", i);
            i = nl === -1 ? pgn.length : nl + 1;
            continue;
        }

        // Result
        const resultM = pgn.slice(i).match(RESULT_RE);
        if (resultM) {
            tokens.push({ type: TOKEN.RESULT, value: resultM[1] });
            i += resultM[1].length;
            continue;
        }

        // Move number (must come before SAN so "1." is not swallowed as pawn)
        const numM = pgn.slice(i).match(MOVE_NUM_RE);
        if (numM) {
            tokens.push({ type: TOKEN.MOVE_NUMBER, value: numM[1], dots: numM[2] });
            i += numM[0].length;
            continue;
        }

        // NAG
        const nagM = pgn.slice(i).match(NAG_RE);
        if (nagM) {
            tokens.push({ type: TOKEN.NAG, value: nagM[1] });
            i += nagM[1].length;
            continue;
        }

        // SAN
        const sanM = pgn.slice(i).match(SAN_RE);
        if (sanM) {
            tokens.push({ type: TOKEN.SAN, value: sanM[1] });
            i += sanM[1].length;
            continue;
        }

        // Unknown character – skip (handles stray punctuation, line endings, etc.)
        i++;
    }

    tokens.push({ type: TOKEN.EOF });
    return tokens;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

function createNode(moveNumber, color, san, depth) {
    return {
        moveNumber,
        color,
        san,
        comment: null,
        nags: [],
        variations: [],   // array of Node[] arrays
        depth,
    };
}

/**
 * Internal recursive parser.
 *
 * @param {object[]} tokens  - flat token array
 * @param {number}   pos     - current position (by-reference via object)
 * @param {number}   depth   - variation depth (0 = main line)
 * @param {number}   startMoveNumber - move number at entry (for resuming after variation)
 * @param {string}   startColor      - "white"|"black" at entry
 * @returns {{ nodes: Node[], result: string|null }}
 */
function parseLine(tokens, pos, depth, startMoveNumber, startColor) {
    const nodes = [];
    let result = null;

    // pos is passed as a mutable object so sub-calls advance the shared cursor
    let currentMoveNumber = startMoveNumber;
    let currentColor = startColor;

    while (pos.i < tokens.length) {
        const tok = tokens[pos.i];

        if (tok.type === TOKEN.EOF || tok.type === TOKEN.RPAREN) {
            break;
        }

        if (tok.type === TOKEN.RESULT) {
            result = tok.value;
            pos.i++;
            break;
        }

        // Move number annotation – update tracking state
        if (tok.type === TOKEN.MOVE_NUMBER) {
            currentMoveNumber = parseInt(tok.value, 10);
            // Three dots means it's Black's move continuation after a variation
            currentColor = tok.dots === "..." ? "black" : "white";
            pos.i++;
            continue;
        }

        // SAN = a move
        if (tok.type === TOKEN.SAN) {
            const node = createNode(currentMoveNumber, currentColor, tok.value, depth);
            pos.i++;

            // Advance color/number for next move
            if (currentColor === "white") {
                currentColor = "black";
            } else {
                currentColor = "white";
                currentMoveNumber++;
            }

            // Consume optional NAGs and comments that follow this move
            while (pos.i < tokens.length) {
                const next = tokens[pos.i];
                if (next.type === TOKEN.NAG) {
                    node.nags.push(next.value);
                    pos.i++;
                } else if (next.type === TOKEN.COMMENT) {
                    node.comment = next.value;
                    pos.i++;
                } else {
                    break;
                }
            }

            // Consume zero or more variations that follow this move
            while (pos.i < tokens.length && tokens[pos.i].type === TOKEN.LPAREN) {
                pos.i++; // consume "("

                // Variations start from the same position as the move just played,
                // so we roll back one ply to find the "before" state.
                // The variation's first token will be a move-number annotation that
                // tells us exactly where to re-enter.
                const varResult = parseLine(
                    tokens, pos, depth + 1,
                    node.moveNumber,
                    node.color,        // the variation re-plays from the same side
                );
                node.variations.push(varResult.nodes);

                if (pos.i < tokens.length && tokens[pos.i].type === TOKEN.RPAREN) {
                    pos.i++; // consume ")"
                }
            }

            nodes.push(node);
            continue;
        }

        // NAG or COMMENT outside a move context (rare but valid PGN) – skip
        if (tok.type === TOKEN.NAG || tok.type === TOKEN.COMMENT) {
            pos.i++;
            continue;
        }

        // Anything else – skip
        pos.i++;
    }

    return { nodes, result };
}

// ---------------------------------------------------------------------------
// Header parser
// ---------------------------------------------------------------------------

function parseHeaders(pgn) {
    const headers = {};
    const headerRE = /\[(\w+)\s+"([^"]*)"\]/g;
    let match;
    let lastIndex = 0;

    while ((match = headerRE.exec(pgn)) !== null) {
        headers[match[1]] = match[2];
        lastIndex = headerRE.lastIndex;
    }

    // Return headers and the remaining move-text portion
    const moveText = pgn.slice(lastIndex).trim();
    return { headers, moveText };
}

// ---------------------------------------------------------------------------
// Public: parsePGN
// ---------------------------------------------------------------------------

/**
 * Parse a PGN string into a GameTree.
 *
 * @param   {string} pgn
 * @returns {GameTree}
 */
function parsePGN(pgn) {
    const { headers, moveText } = parseHeaders(pgn);
    const tokens = tokenise(moveText);
    const pos = { i: 0 };
    const { nodes, result } = parseLine(tokens, pos, 0, 1, "white");

    return {
        headers,
        mainLine: nodes,
        result: result ?? "*",
    };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return only the main-line nodes in order. */
function flattenMainLine(gameTree) {
    return gameTree.mainLine;
}

/** Depth-first traversal: main line + all variation nodes. */
function flattenAll(gameTree) {
    const out = [];
    function walk(nodes) {
        for (const node of nodes) {
            out.push(node);
            for (const variation of node.variations) {
                walk(variation);
            }
        }
    }
    walk(gameTree.mainLine);
    return out;
}

/** Filter a node list by side. */
function nodesBySide(nodes, color) {
    return nodes.filter(n => n.color === color);
}

/** Extract just the SAN strings from a node list. */
function toSANList(nodes) {
    return nodes.map(n => n.san);
}

// ---------------------------------------------------------------------------
// PGN serialiser
// ---------------------------------------------------------------------------

/**
 * Render a flat ordered array of Node objects as a PGN string.
 * Nodes must already be in game order (no variations — this is a single path).
 *
 * @param   {Node[]} nodes
 * @param   {string} result  - "*" | "1-0" | "0-1" | "1/2-1/2"
 * @param   {object} headers - optional tag-pair map
 * @returns {string}
 */
function serializePath(nodes, result = "*", headers = {}) {
    const headerStr = Object.entries(headers)
        .map(([k, v]) => `[${k} "${v}"]`)
        .join("\n");

    let out = "";
    let prevColor = null;

    for (const node of nodes) {
        // Always print move number for White; for Black only print if first move or
        // following a comment/gap (here we always follow white, so just check color).
        if (node.color === "white") {
            out += `${node.moveNumber}. `;
        } else if (prevColor !== "white") {
            // Black move appearing after a gap (shouldn't happen in a clean path,
            // but guard anyway with ellipsis notation)
            out += `${node.moveNumber}... `;
        }

        out += node.san;

        if (node.nags.length) out += " " + node.nags.join(" ");
        if (node.comment) out += ` { ${node.comment} }`;

        out += " ";
        prevColor = node.color;
    }

    out += result;

    return headerStr ? headerStr + "\n\n" + out.trim() : out.trim();
}

// ---------------------------------------------------------------------------
// Variation expander
// ---------------------------------------------------------------------------

/**
 * Expand every variation path in a GameTree into a separate flat PGN string.
 *
 * A variation in PGN is a self-contained alternative line. It branches off at
 * a given move and is entirely independent — when you enter a variation you do
 * NOT continue with the outer line afterward. The variation IS the path from
 * that point onward.
 *
 * Tree model:
 *   - The main line is the trunk.
 *   - At any node N, each entry in N.variations is a complete alternative line
 *     that starts INSTEAD of N (same board position before N, different move).
 *   - A path = one root-to-leaf walk, choosing exactly one branch at every fork.
 *
 * @param   {GameTree} gameTree
 * @returns {Array<{ label: string, pgn: string, nodes: Node[] }>}
 *   `label`  — human-readable breadcrumb of branches taken
 *   `pgn`    — clean linear PGN string for this path
 *   `nodes`  — flat Node array (no variations) for this path
 */
function expandVariations(gameTree) {
    const results = [];

    /**
     * Walk a line, forking at every node that carries variations.
     *
     * @param {Node[]}   line       - the current line being walked
     * @param {Node[]}   prefix     - moves committed so far on this path
     * @param {string[]} breadcrumb - human-readable branch labels
     */
    function walk(line, prefix, breadcrumb) {
        // Base case: reached the end of this line → record the completed path.
        if (line.length === 0) {
            results.push({
                label: breadcrumb.length ? breadcrumb.join(" → ") : "Main line",
                nodes: prefix.slice(),
                pgn: serializePath(prefix, gameTree.result, gameTree.headers),
            });
            return;
        }

        const [head, ...tail] = line;

        // Fork: for each variation attached to this node, start a new path that
        // takes that variation INSTEAD of head. The outer tail is dropped because
        // variations are self-contained — they do not return to the parent line.
        for (let v = 0; v < head.variations.length; v++) {
            const varLine = head.variations[v];
            const varLabel = `${head.moveNumber}${head.color === "white" ? "." : "..."} var${v + 1} (${varLine[0]?.san ?? "?"})`;
            walk(varLine, prefix.slice(), [...breadcrumb, varLabel]);
        }

        // Continue down the current line, committing head (stripped of variations
        // so the serialised output stays linear).
        const flatNode = { ...head, variations: [] };
        walk(tail, [...prefix, flatNode], breadcrumb);
    }

    walk(gameTree.mainLine, [], []);
    return results;
}

// ---------------------------------------------------------------------------
// Exports (works as ES module or CommonJS)
// ---------------------------------------------------------------------------

if (typeof module !== "undefined" && module.exports) {
    module.exports = {
        parsePGN,
        flattenMainLine,
        flattenAll,
        nodesBySide,
        toSANList,
        serializePath,
        expandVariations,
    };
}
// For browser / ES module environments:
export { parsePGN, flattenMainLine, flattenAll, nodesBySide, toSANList, serializePath, expandVariations };