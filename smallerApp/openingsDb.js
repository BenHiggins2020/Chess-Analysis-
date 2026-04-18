/**
 * Built-in opening database.
 * Each entry: { name, eco, pgn, color }
 *   color: "w" = designed for White, "b" = designed for Black, "both" = either
 */
export const OPENINGS = [
    // ── White Openings ──────────────────────────────────────────
    {
        name: "Italian Game",
        eco: "C50",
        pgn: "1. e4 e5 2. Nf3 Nc6 3. Bc4",
        color: "w",
    },
    {
        name: "Ruy López",
        eco: "C60",
        pgn: "1. e4 e5 2. Nf3 Nc6 3. Bb5",
        color: "w",
    },
    {
        name: "Queen's Gambit",
        eco: "D06",
        pgn: "1. d4 d5 2. c4",
        color: "w",
    },
    {
        name: "London System",
        eco: "D00",
        pgn: "1. d4 d5 2. Bf4",
        color: "w",
    },
    {
        name: "English Opening",
        eco: "A10",
        pgn: "1. c4",
        color: "w",
    },
    {
        name: "King's Gambit",
        eco: "C30",
        pgn: "1. e4 e5 2. f4",
        color: "w",
    },
    {
        name: "Scotch Game",
        eco: "C45",
        pgn: "1. e4 e5 2. Nf3 Nc6 3. d4",
        color: "w",
    },
    {
        name: "Vienna Game",
        eco: "C25",
        pgn: "1. e4 e5 2. Nc3",
        color: "w",
    },

    // ── Black Openings ──────────────────────────────────────────
    {
        name: "Scandinavian Defense",
        eco: "B01",
        pgn: "1. e4 d5",
        color: "b",
    },
    {
        name: "Sicilian Defense",
        eco: "B20",
        pgn: "1. e4 c5",
        color: "b",
    },
    {
        name: "Sicilian Najdorf",
        eco: "B90",
        pgn: "1. e4 c5 2. Nf3 d6 3. d4 cxd4 4. Nxd4 Nf6 5. Nc3 a6",
        color: "b",
    },
    {
        name: "French Defense",
        eco: "C00",
        pgn: "1. e4 e6",
        color: "b",
    },
    {
        name: "Caro-Kann Defense",
        eco: "B10",
        pgn: "1. e4 c6",
        color: "b",
    },
    {
        name: "King's Indian Defense",
        eco: "E60",
        pgn: "1. d4 Nf6 2. c4 g6",
        color: "b",
    },
    {
        name: "Pirc Defense",
        eco: "B07",
        pgn: "1. e4 d6 2. d4 Nf6",
        color: "b",
    },
    {
        name: "Alekhine's Defense",
        eco: "B02",
        pgn: "1. e4 Nf6",
        color: "b",
    },
    {
        name: "Dutch Defense",
        eco: "A80",
        pgn: "1. d4 f5",
        color: "b",
    },
    {
        name: "Queen's Gambit Declined",
        eco: "D30",
        pgn: "1. d4 d5 2. c4 e6",
        color: "b",
    },
    {
        name: "Queen's Gambit Accepted",
        eco: "D20",
        pgn: "1. d4 d5 2. c4 dxc4",
        color: "b",
    },
    {
        name: "Nimzo-Indian Defense",
        eco: "E20",
        pgn: "1. d4 Nf6 2. c4 e6 3. Nc3 Bb4",
        color: "b",
    },
    {
        name: "Grünfeld Defense",
        eco: "D70",
        pgn: "1. d4 Nf6 2. c4 g6 3. Nc3 d5",
        color: "b",
    },
];
