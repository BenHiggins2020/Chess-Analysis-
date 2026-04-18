/**
 * Converts your custom GameState (array of Square objects) to FEN
 * @param {Array} squares - The array of 64 Square objects
 * @param {string} turn - 'white' or 'black'
 */
function parseGameStateToFen(squares, turn = 'white') {
    let fenRows = [];

    // FEN starts from Rank 8 down to Rank 1
    for (let r = 8; r >= 1; r--) {
        let rowStr = "";
        let emptyCount = 0;

        // Files 'a' through 'h'
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];

        for (let f = 0; f < files.length; f++) {
            const fileName = files[f];
            // Find the square in your array that matches this rank and file
            const square = squares.find(s => s.rank === r && s.file === fileName);
            const piece = square ? square.piece : null;

            if (!piece) {
                emptyCount++;
            } else {
                if (emptyCount > 0) {
                    rowStr += emptyCount;
                    emptyCount = 0;
                }

                // Map your piece.type ("P") and piece.color ("white") to FEN logic
                const letter = piece.type; // e.g., 'P', 'N', 'K'
                rowStr += (piece.color === 'white')
                    ? letter.toUpperCase()
                    : letter.toLowerCase();
            }
        }

        if (emptyCount > 0) rowStr += emptyCount;
        fenRows.push(rowStr);
    }

    const piecePlacement = fenRows.join('/');
    const sideToMove = (turn === 'white') ? 'w' : 'b';

    // We append 'KQkq - 0 1' as placeholders for castling, en passant, and clock
    return `${piecePlacement} ${sideToMove} KQkq - 0 1`;
}

async function fetchOpeningData(fen) {
    // encodeURIComponent is vital because FEN strings have spaces and slashes
    const url = `https://explorer.lichess.ovh/masters?fen=${encodeURIComponent(fen)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Lichess API request failed');

        const data = await response.json();

        // 1. Log the Opening Name
        if (data.opening) {
            console.log(`%c Opening: ${data.opening.name} (${data.opening.eco}) `, 'background: #222; color: #bada55');
        }

        // 2. Log the top 3 moves played by Masters
        console.log("Top Master Continuations:");
        data.moves.slice(0, 3).forEach(move => {
            console.log(`${move.san}: Played ${move.white + move.draws + move.black} times`);
        });

        return data;
    } catch (error) {
        console.error("Error fetching from Lichess:", error);
    }
}