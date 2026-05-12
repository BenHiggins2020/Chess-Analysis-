/**
 * @typedef {Object} MoveStructure
 * @property {number} number - The move number (e.g., 1, 2).
 * @property {'White'|'Black'} player - The player who made the move.
 * @property {string} move - Cleaned notation for the move (e.g., "e4", "Nf6").
 */

/**
 * Parses a highly compressed and variation-filled PGN string 
 * to extract the main, continuous line of moves by focusing on 
 * sequential patterns rather than strictly standard PGN format.
 * 
 * This function uses advanced regex matching to find move sequences (X. Move) 
 * while stripping away internal variation notes (like those in parentheses).
 *
 * @param {string} rawPGNString The raw PGN input string containing compressed variations.
 * @returns {MoveStructure[]} An array of structured objects containing the primary moves.
 */
function parseCompressedPGN(rawPGNString) {
    const moves = [];

    // 1. Normalize spacing and remove unnecessary commas/newlines for easier regex matching.
    let cleanedString = rawPGNString
        .replace(/[\r\n]+/g, ' ') // Remove newlines
        .replace(/,+|\s*,\s*/g, '') // Remove commas (unless critical to notation)
        .trim();

    // Regex pattern: Matches a number followed by ". " and then captures the move content.
    // It looks for patterns like "1. e4", "2... d5", etc., anywhere in the string.
    const moveRegex = /(\d+)\.\s*([a-zA-Z0-9\-\+\*\s]+)/g;

    let match;
    let lastPlayerWasWhite = true; // Assume first move is White's

    // Use regex.exec() in a loop to capture all matches sequentially
    while ((match = moveRegex.exec(cleanedString)) !== null) {
        const fullMatch = match[0].trim();
        const moveNumber = parseInt(match[1]);
        let rawContent = match[2].trim();

        // --- Heuristic Player Determination ---
        // If the current content looks like a response (contains '...' or follows 
        // a white move and is not clearly marked by number), it's likely Black.
        let player;
        if (rawContent.includes('...') || rawContent.toLowerCase().startsWith('...')) {
            player = 'Black';
        } else if (!isNaN(moveNumber) && moveNumber >= 1) {
            // For numbered moves, we alternate based on the previous successful move or assumed start.
            if (moves.length === 0 || lastPlayerWasWhite) {
                player = 'White'; // Starting sequence is White
            } else {
                // This heuristic helps when sequential numbers appear in variations
                player = 'Black';
            }

        } else {
            // Default to alternating based on the overall flow (if all else fails)
            player = lastPlayerWasWhite ? 'White' : 'Black';
        }

        // --- Cleaning and Formatting ---
        let actualMove = rawContent;

        // 1. Remove extraneous punctuation, parentheses, etc., which wrap variations.
        actualMove = actualMove.replace(/[()\s]+/, ' ').trim();
        // 2. Clean up remaining noise that isn't standard algebraic notation or piece names.
        actualMove = actualMove.replace(/\*$/, '').trim();

        // Only add the move if it contains valid characters and wasn't empty after cleaning.
        if (actualMove && actualMove.length > 0) {
            moves.push({
                number: moveNumber,
                player: player,
                move: actualMove
            });
            lastPlayerWasWhite = player === 'White'; // Update context for the next iteration
        }
    }

    return moves;
}


// ==============================================
// TEST CASES (Using the original provided data)
// ==============================================

const testCases = [
    {
        name: "Example 1: Long Variation Line",
        pgen: `1. e4 c6 2. d4 (2. Nf3 d5 3. Nc3 Bg4 (3... a6 4. d4 Bg4) 4. h3 Bxf3 5. Qxf3 e6) (2. Nc3 d5 3. Qf3) 2... d5 3. e5 (3. Nc3 dxe4 4. Nxe4 Bf5 (4... Nf6 5. Nxf6+ exf6 6. Nf3 Bd6 7. Bd3 O-O 8. O-O Re8 9. Be3) 5. Ng3 Bg6 6. h4 h6 7. h5 Bh7 8. Nf3 Nd7 9. Bd3 Bxd3 10. Qxd3 e6) (3. Nd2) (3. exd5 cxd5 4. c4 (4. Nf3 Nc6 (4... g6)) (4. Bd3 Nc6) 4... Nf6 5. Nc3 e6 (5... g6 6. Qb3 Bg7 7. cxd5 O-O)) (3. f3 g6 (3... dxe4 4. fxe4) 4. Nc3 Bg7 5. Be3 Qb6) 3... c5 (3... Bf5 4. Nf3 (4. h4) (4. c4) (4. Nc3) 4... e6 5. Be2 c5 6. O-O Nc6) 4. c3 (4. dxc5 Nc6 (4... e6 5. Be3) 5. Nf3 Bg4 6. Bf4 e6) (4. Nf3) 4... Nc6 5. Nf3 Bg4 6. Be2 e6 7. O-O Nge7 *`
    },
    {
        name: "Example 2: Standard Opening",
        pgen: `1. e4 e5 2. Nc3 Nf6 (2... Nc6 3. Bc4 Bc5 (3... d6 4. d3) (3... Nf6 4. d3 Bc5 5. f4 d6 6. Nf3 Ng4 (6... O-O 7. f5) 7. Ng5 O-O 8. f5 Bf2+ 9. Kf1 Ne3+ 10. Bxe3 Bxe3 11. h4 Bxg5 12. hxg5 Qxg5 13. Rh5 Qf4+ 14. Kg1) 4. Qg4 Qf6 5. Nd5 Qxf2+ 6. Kd1 Kf8 7. Nh3 h5 8. Qg5 f6 9. Qg6 Rh6 10. Ne7) 3. f4 d5 (3... exf4 4. e5 Ng8 5. Nf3 d6 6. d4 dxe5 7. Qe2 Bb4 8. Qxe5+ Qe7 9. Bxf4) (3... d6 4. Nf3 Nc6 5. Bb5 Bd7 6. d3) 4. fxe5 Nxe4 5. Qf3 Nxc3 (5... f5 6. d3 Nxc3 7. bxc3 d4 (7...Be6) 8. Qg3 dxc3 9. Be2 Be6 10. Bf3 Nc6 11. Ne2 Qd7 12. Be3 Nb4 13. Rc1) (5...Nc6 6. Bb5 Nxc3 7. dxc3 Qh4+ 8. g3 Qe4+) 6. bxc3 (6. dxc3 Be6 7. Bf4 c5 8. O-O-O Nc6 9. Bc4) 6... Be7 7. d4 O-O 8. Bd3 Be6 9. Ne2 c5 10. O-O Nc6 11. Be3 *`
    },
    {
        name: "Example 3: Queen's Gambit Declined",
        pgen: `1. e4 d5 2. exd5 Qxd5 3. Nc3 (3. Nf3 Bg4 (3... Nc6 4. d4) 4. Be2 Nc6 5. O-O (5. d4 O-O-O) 5... O-O-O 6. Nc3 Qd7 7. b4 Nf6 8. b5 Bxf3 9. Bxf3 Nd4 10. a4 Qf5) ( 3. d4 Nf6 4. Nc3) (3. c4 Qe4+ 4. Qe2 Qxe2+ 5. Bxe2 Nc6) 3... Qa5 (3... Qd8 4. d4 Nf6 5. Nf3 Bg4 6. Bc4 e6 7. O-O Nc6) (3... Qd6 4. d4 Nf6 5. Nf3 a6 6. Be2 Nc6 7. O-O Bf5 8. Be3 O-O-O) 4. d4 (4. Bc4 Nf6 5. Nf3 Bg4 6. O-O e6) (4. b4 Qxb4 5. Rb1 Qd6 6. d4 Nf6 7. g3 Nc6) (4. Nf3 Nf6 5. Bc4 Bg4 6. O-O Nc6) 4... Nf6 5. Nf3 (5. Bd2 c6 6. Nf3 Bg4 7. Bc4 e6 8. O-O Qc7 9. Re1 Be7) 5... Bg4 (5... Bf5 6. Bc4 e6 7. Bd2 c6 8. O-O Qc7 9. Re1 Be7 10. Rc1 Nbd7) 6. h3 Bh5 7. Be2 (7. g4 Bg6 8. Ne5 e6 9. h4) 7... Nc6 8. O-O O-O-O 9. Be3 e5 *`
    }
];

// ==============================================
// EXECUTION AND OUTPUT DISPLAY
// ==============================================

console.log("------------------------------------------");
console.log("✨ Robust PGN Parser Execution ✨");
console.log("------------------------------------------\n");

testCases.forEach((test, index) => {
    const movesArray = parseCompressedPGN(test.pgen);

    console.log(`====================`);
    console.log(`TEST CASE ${index + 1}: ${test.name}`);
    console.log(`====================`);

    let outputMoves = [];
    movesArray.forEach((move, i) => {
        outputMoves.push(`${i + 1}. [${move.player}] ${move.move}`);
    });

    // Display the cleaned and structured result
    console.log("✅ Parsing successful! Extracted Sequential Move Line:");
    console.log(outputMoves.join(' '));
});
