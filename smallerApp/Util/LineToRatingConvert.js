import { GameStateManager } from "../GameStateManage.js";

export const ratingLinesMap = {
    "1200": 4,
    "1350-1400": 8,
    "1450-1500": 12,
    "1550-1600": 16,
    "1600-1750": 300,
    "1800+": 600,
    '> 2700': Infinity // or a very large number
};

const raitingMap = new Map();
raitingMap.set("1200", 4);
raitingMap.set("1350-1400", 8);
raitingMap.set("1450-1500", 12);
raitingMap.set("1550-1600", 16);
raitingMap.set("1600-1750", 300);
raitingMap.set("1800+", 600);

export function setStockfishLines(opponentRating) {
    if (typeof opponentRating !== 'string') {
        throw new Error('Invalid input: opponentRating must be a string');
    }

    console.log(`Setting Stockfish lines for opponent rating: ${opponentRating}`);
    const lines = raitingMap.get(opponentRating);
    console.log(`Setting Stockfish lines for opponent rating: ${lines}`);

    if (lines === undefined) {
        throw new Error(`Unsupported opponent rating: ${opponentRating}`);
    }

    GameStateManager.getInstance().setStockfishLines(lines);
}

// Example usage:
// const selectedRating = '1450-1500';
// const linesToSet = setStockfishLines(selectedRating);
// console.log(`Selected Rating: ${selectedRating}, Lines to Set: ${linesToSet}`); // Output: Selected Rating: 1450-1500, Lines to Set: 12

// Setting Stockfish lines (assuming you have access to a function that sets the lines)
// setStockfishLinesFunction(linesToSet);
