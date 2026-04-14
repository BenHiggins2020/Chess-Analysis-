import { Chessboard, Square } from "./chess-review-offline.js";
console.log("Script")
const board = document.getElementById("board");

const game = new Chessboard();


game.gameState.forEach((square, coord) => {

    board.appendChild(square.UI_ref);

})


const pgn = document.getElementById("pgn");