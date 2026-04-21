import { Piece } from "./Piece.js";
import { GameStateManager } from "./GameStateManage.js";

/**
 * Square class represents each square on the chessboard, 
 * holding information about its file, rank, piece, and color.
 * Manages the UI for each square, including piece placement and move highlighting.
 * Also handles user interactions like clicking and dragging pieces.
 */
export class Square {
    constructor(file, rank, chessboard) {
        this.TAG = "Square:  "
        this.chessboard = chessboard;
        this.file = file;
        this.rank = rank;
        this.position = file + rank; // e.g. 'e4'
        this.piece = null; // e.g. 'wP', 'bK', etc. will be a string
        this.color = this.createColorType(file, rank);

        this.UI_ref = document.createElement('div');
        this.UI_ref.dataset.file = file.toString();
        this.UI_ref.dataset.rank = rank.toString();
        this.UI_ref.classList.add(`square`);

        this.UI_ref.classList.add(`${this.color}-square`);
        this.setupUI();
    }

    createColorType(file, rank) {
        let color = 'default';
        switch (rank.toString()) {
            // For odd ranks, the color starts with 'dark' and alternates with each file.
            case "1":

            case "3":
            case "5":
            case "7":
                switch (file.toString()) {
                    case "a":
                    case "c":
                    case "e":
                    case "g":
                        color = 'dark';
                        break;
                    case "b":
                    case "d":
                    case "f":
                    case "h":
                        color = 'light';
                        break;
                }
                break;

            // For even ranks, the color starts with 'light' and alternates with each file.
            case "2":
            case "4":
            case "6":
            case "8":
                switch (file.toString()) {
                    case "a":
                    case "c":
                    case "e":
                    case "g":
                        color = 'light';
                        break;
                    case "b":
                    case "d":
                    case "f":
                    case "h":
                        color = 'dark';
                        break;
                }

            default:
                console.error(this.TAG + `Invalid rank: ${rank}`);
                break;


        }
        return color;
    }

    setupUI() {
        this.enabled_state = this.UI_ref.style;
    }

    setPiece(piece) {
        // console.warn(this.TAG + ` setPiece: ${piece.type} to square: ${this.position}`)

        if (piece === null || piece === 'empty' || !(piece instanceof Piece)) {
            console.warn(this.TAG + `trying to set null piece. returning. `)
            return;
        }

        if (this.piece !== null) {
            // console.warn(this.TAG + ` other piece already exists on square. ${this.piece.type} updateing to -> ${piece.type}`);
        }

        this.piece = piece;

        this.UI_ref.replaceChildren(this.piece.UI_ref)
        // this.UI_ref.appendChild(piece.UI_ref);

        this.setupPieceUI();
    }

    removePiece() {
        // console.warn(this.TAG + `Removing piece (${this.piece.type}) from ${this.file}${this.rank}`);

        if (this.piece === null || this.piece === 'empty') {
            // console.warn(this.TAG + `No piece to remove from ${this.file}${this.rank}`);
            return;
        };

        if (this.UI_ref.childElementCount > 0) { // removes child. 
            this.UI_ref.removeChild(this.piece.UI_ref);
        } else {
            // console.log(this.TAG + `removing piece... but Child count is 0... `);
        }

        if (this.piece !== null) {
            this.piece = null
        }
    }

    setupPieceUI = () => {
        const piece = this.piece.UI_ref;
        let selectedPiece = null; // used for dragging 
        //going to use gamestatemanager for this 

        piece.addEventListener("mousedown", (e) => {
            if (e.button !== 0) return;
            e.preventDefault();

            selectedPiece = piece;
            selectedPiece.style.pointerEvents = "none";
            selectedPiece.classList.add("dragging-now", "draggin-now");

            const shiftX = selectedPiece.offsetWidth / 2;
            const shiftY = selectedPiece.offsetHeight / 2;

            const parentSquare = this.UI_ref;
            document.body.appendChild(selectedPiece);
            selectedPiece.style.position = "fixed";
            selectedPiece.style.zIndex = "10000";
            selectedPiece.style.left = `${e.clientX - shiftX}px`;
            selectedPiece.style.top = `${e.clientY - shiftY}px`;

            const moveAt = (clientX, clientY) => {
                selectedPiece.style.left = `${clientX - shiftX}px`;
                selectedPiece.style.top = `${clientY - shiftY}px`;
            };

            moveAt(e.clientX, e.clientY);

            function onMouseMove(event) {
                moveAt(event.clientX, event.clientY);
            }

            document.addEventListener("mousemove", onMouseMove);

            document.onmouseup = (event) => {
                document.removeEventListener("mousemove", onMouseMove);

                selectedPiece.classList.remove("dragging-now", "draggin-now");
                selectedPiece.style.pointerEvents = "auto";
                selectedPiece.style.zIndex = "";
                selectedPiece.style.position = "";

                const elementBelow = document.elementFromPoint(
                    event.clientX,
                    event.clientY,
                );
                const targetSquare = elementBelow?.closest(".square");

                const fromCoord = String(this.file) + String(this.rank);

                if (targetSquare?.dataset?.file && selectedPiece != null) {
                    const toCoord =
                        targetSquare.dataset.file + targetSquare.dataset.rank;
                    if (fromCoord !== toCoord) {
                        const movedOk = this.chessboard.handleMove(
                            fromCoord,
                            toCoord,
                        );
                        if (!movedOk) {
                            parentSquare.appendChild(selectedPiece);
                        } else {
                            selectedPiece.remove();
                        }
                    } else {
                        parentSquare.appendChild(selectedPiece);
                    }
                } else {
                    parentSquare.appendChild(selectedPiece);
                }

                selectedPiece.style.left = "";
                selectedPiece.style.top = "";
                selectedPiece = null;
                document.onmouseup = null;
            };
        });

        piece.ondragstart = () => false;

        this.UI_ref.addEventListener("click", () => {
            if (this.piece === null || this.piece === "empty") return;
            GameStateManager.getInstance().setSelected(this);
        });
    }

    render() {
        this.UI_ref.innerHTML = '';
        this.hideMove();
        if (this.piece !== 'empty' && this.piece !== null) {
            this.UI_ref.appendChild(this.piece.UI_ref);
        }
    }

    showMove = () => {
        this.UI_ref.classList.add("square--hint");
    };

    hideMove = () => {
        this.UI_ref.classList.remove("square--hint");
    };

}