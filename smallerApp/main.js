import { Chessboard } from "./Chessboard.js";
import { Square } from "./Square.js";
import { Piece } from "./Piece.js";
import { GameStateManager } from "./GameStateManage.js"
console.log("Script")
const board = document.getElementById("board");
const gameState = new GameStateManager();
const game = new Chessboard();


game.gameState.forEach((square, coord) => {

    board.appendChild(square.UI_ref);

})


const pgn = document.getElementById("pgn");