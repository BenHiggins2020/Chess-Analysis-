export class PGNParserUtil {

    static convertPositionsToPGNMove = (fromSquare, toSquare) => {
        return convertMoves(fromSquare, toSquare);
        function convertMoves(startPosition, endPosition) {
            // Helper arrays for standard chess piece symbols
            const uppercasePieces = ['♜', '♞', '♝', '♛', '♚', '♝', '♟'];
            const lowercasePieces = ['r', 'n', 'b', 'q', 'k', 'b', 'p'];

            // Extract file and rank from start position
            const startLetter = startPosition[0];
            let startRank = parseInt(startPosition.slice(1));

            // Extract file and rank from end position
            const endLetter = endPosition[0];
            let endRank = parseInt(endPosition.slice(1));

            const movesArray = [];
            for (let i = 0; i < startPosition.length - 1; i += 2) {
                // Get current start square
                const currentStartLetter = startPosition[i];
                const currentStartRank = parseInt(startPosition.slice(i + 1));

                // Get moving piece from the start square's letter
                let piece;
                if (currentStartLetter === 'a') {
                    piece = lowercasePieces[0];
                } else if (currentStartLetter === 'h') {
                    piece = uppercasePieces[6];
                } else if (currentStartLetter === '1') {
                    piece = lowercasePieces[3];
                } else if (currentStartLetter === '8') {
                    piece = uppercasePieces[7];
                } else {
                    // Handle other files and ranks
                    const index = currentStartLetter.charCodeAt(0) - 'a'.charCodeAt(0);
                    let rankIndex = parseInt(currentStartRank.toString());
                    if (rankIndex < 2) {
                        piece = lowercasePieces[index];
                    } else if (rankIndex > 7) {
                        piece = uppercasePieces[index];
                    } else {
                        // Default to pawn for unclear ranks
                        piece = lowercasePieces[3];
                    }
                }

                // Create PGN entry with start position and moving piece
                movesArray.push(`${currentStartLetter}${currentStartRank}${piece}`);
            }

            return movesArray;
        }
    }


    static parsePGNMove = (moveString) => {
        // Regular expression to match move notation (e.g., "e2e4", "exd5", "Qxe7")
        const piecesWhite = ['p', 'n', 'b', 'r', 'q', 'k']; // Pawn, Knight, Bishop, Rook, Queen, King
        const piecesBlack = ['P', 'N', 'B', 'R', 'Q', 'K']; // For black pieces

        console.log(`Parsing move string: ${moveString}`);
        const whiteMove = moveString.split(' ')[0]; // Get the first move (white's move)
        const blackMove = moveString.split(' ')[1]; // Get the second move (black's move)
        console.log(whiteMove[0], blackMove[0])

        const whitePiece = piecesWhite.find(p => whiteMove[0] === p) || "P"
        const blackPiece = piecesBlack.find(p => blackMove[0] === p) || "p"

        console.log(whitePiece, blackPiece)
        // const whitePiece = whiteMove ? piecesWhite.find(p => whiteMove.includes(p)) : "P"; // Default to Pawn if no piece is specified
        // const blackPiece = blackMove ? piecesBlack.find(p => blackMove.includes(p)) : "p"; // Default to Pawn if no piece is specified


        const moveRegex = /([pnrbqk])?([a-h]?[1-8]?)?([a-h][1-8]?)/i;

        const match = moveRegex.exec(moveString);

        const move1 = { whitePiece, whiteMove }
        const move2 = { blackPiece, blackMove }
        return { move1, move2 }

        if (match) {
            const piece = match[1] ? match[1].toLowerCase() : null;  // Piece involved (e.g., "n", "q")
            const destinationSquare = match[3]; // Destination square (e.g., "e4", "d5")

            return { piece, destinationSquare };
        } else {
            return null; // Invalid move notation
        }
    }

    static parsePGN(pgnString) {
        const moves = pgnString.trim().split(/\s*\d+\.\s*/); // Split by move numbers

        // const regex = /\s*\d+\.\s*|(?<=\))\s*/;  //Split by move numbers and after parenthesis.

        // const moves = pgnString.trim().split(regex).filter(Boolean); //Split the string based on the regex and remove empty strings.

        moves.shift(); // Remove the initial empty string.

        const extractedMoves = [];
        let variationMove = "";

        for (const move of moves) {
            console.log(`Parsing move: ${move}`);

            if (move.includes('(')) {
                const variation = moves.substring(moves.indexOf(move) + 1, moves.lastIndexOf(')'));
                const variationMoves = this.handleVariation(variation);
                extractedMoves.push(...variationMoves);
            }

            const moveData = this.parsePGNMove(move.trim());
            console.log("MoveData:", moveData);

            if (moveData) {
                extractedMoves.push(moveData);
            } else {
                console.warn(`Skipping invalid move: ${move}`);  // Or handle errors more appropriately
            }
        }

        return extractedMoves;
    }

    handleVariation(variationString) {
        const variationMoves = [];

        // Use a recursive function to handle nested variations
        function parseNestedVariations(variationString) {
            const regex = /\s*\d+\.\s*|(?<=\))\s*/;
            const moves = variationString.split(regex).filter(Boolean);

            for (const move of moves) {
                const trimmedMove = move.trim();
                if (trimmedMove.includes('(')) {
                    // Nested variation found - recursively parse it
                    const nestedVariation = trimmedMove.substring(trimmedMove.indexOf('(') + 1, trimmedMove.lastIndexOf(')'));
                    const nestedVariationMoves = parseNestedVariations(nestedVariation);
                    variationMoves.push(...nestedVariationMoves);
                } else {
                    // Regular move within the variation
                    variationMoves.push(this.parsePGNMove(trimmedMove));
                }
            }
        }

        parseNestedVariations(variationString); // Start recursive parsing

        return variationMoves;
    }
}
// Example PGN (from your previous example, simplified)
// const pgnString = "1. e4 d5 2. exd5 Qxd5 3. Nc3";
// const extractedMoves = parsePGN(pgnString);

// console.log(extractedMoves);
/* Expected Output:
[
  { piece: 'e', destinationSquare: 'e4' },
  { piece: null, destinationSquare: 'd5' },
  { piece: 'e', destinationSquare: 'xd5' },
  { piece: 'q', destinationSquare: 'xd5' },
  { piece: 'n', destinationSquare: 'Nc3' }
]
*/

