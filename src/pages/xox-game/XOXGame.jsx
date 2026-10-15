
import React, { useState, useEffect, useRef } from "react";
import "./XOXGame.css";

import {
  playPencilMark,
  playPencilStrike,
  playVictory,
  playRestart,
} from "./XOXGameSounds";

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

const createCells = () => Array(81).fill("");
const emptyWinners = () => Array(9).fill("");
const emptyLines = () => Array(9).fill(null);
const randomPlayer = () => (Math.random() < 0.5 ? "X" : "O");

function getWinningLine(values) {
  for (let i = 0; i < WIN_LINES.length; i++) {
    const [a, b, c] = WIN_LINES[i];

    if (
      values[a] &&
      values[a] !== "D" &&
      values[a] === values[b] &&
      values[b] === values[c]
    ) {
      return i;
    }
  }

  return null;
}

function getWinner(values) {
  const line = getWinningLine(values);
  return line === null ? "" : values[WIN_LINES[line][0]];
}

function getMiniBoard(cells, boardIndex) {
  const startRow = Math.floor(boardIndex / 3) * 3;
  const startCol = (boardIndex % 3) * 3;
  const result = [];

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      result.push(cells[(startRow + r) * 9 + startCol + c]);
    }
  }

  return result;
}

function getBoardStates(cells) {
  return Array.from({ length: 9 }, (_, index) => {
    const mini = getMiniBoard(cells, index);
    const winner = getWinner(mini);

    if (winner) return winner;
    if (mini.every(Boolean)) return "D";

    return "";
  });
}

function getBoardWinningLines(cells) {
  return Array.from({ length: 9 }, (_, index) =>
    getWinningLine(getMiniBoard(cells, index))
  );
}

function XMark() {
  const path =
    "M25 12 L50 37 L75 12 L91 28 L66 50 L91 72 L75 88 L50 63 L25 88 L9 72 L34 50 L9 28 Z";

  return (
    <svg className="xox-svg-mark" viewBox="0 0 100 100" aria-hidden="true">
      <path className="xox-mark-outline" d={path} />
      <path className="xox-mark-fill" d={path} />
    </svg>
  );
}

function OMark() {
  return (
    <svg className="xox-svg-mark" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="xox-mark-outline" cx="50" cy="50" r="39" />
      <circle className="xox-mark-fill" cx="50" cy="50" r="29" />
      <circle className="xox-mark-inner" cx="50" cy="50" r="14" />
    </svg>
  );
}

function Mark({ player }) {
  return player === "X" ? <XMark /> : <OMark />;
}

export default function XOXGame({ onExit }) {
  const [cells, setCells] = useState(createCells);
  const [boardWinners, setBoardWinners] = useState(emptyWinners);
  const [boardWinningLines, setBoardWinningLines] = useState(emptyLines);

  const [currentPlayer, setCurrentPlayer] = useState(randomPlayer);
  const [activeBoard, setActiveBoard] = useState(null);
  const [lastMove, setLastMove] = useState(null);

  const [gameWinner, setGameWinner] = useState("");
  const [gameWinningLine, setGameWinningLine] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [moveCount, setMoveCount] = useState(0);

  const resultTimer = useRef(null);
  const restartTimer = useRef(null);
  const victoryPlayed = useRef(false);

  useEffect(() => {
    if (!gameWinner && !isDraw) return;

    // The final strike sound and victory sound are separate.
    playPencilStrike();

    const victoryTimer = setTimeout(() => {
      if (!victoryPlayed.current) {
        playVictory();
        victoryPlayed.current = true;
      }
    }, 650);

    resultTimer.current = setTimeout(() => {
      setShowResult(true);
    }, 1300);

    return () => {
      clearTimeout(victoryTimer);
      if (resultTimer.current) clearTimeout(resultTimer.current);
    };
  }, [gameWinner, isDraw]);

  useEffect(() => {
    return () => {
      if (resultTimer.current) clearTimeout(resultTimer.current);
      if (restartTimer.current) clearTimeout(restartTimer.current);
    };
  }, []);

  function playCell(index) {
    if (gameWinner || isDraw || restarting || cells[index]) return;

    const row = Math.floor(index / 9);
    const col = index % 9;

    const boardIndex =
      Math.floor(row / 3) * 3 + Math.floor(col / 3);

    if (boardWinners[boardIndex]) return;

    if (activeBoard !== null && activeBoard !== boardIndex) return;

    const nextCells = [...cells];
    nextCells[index] = currentPlayer;

    const nextWinners = getBoardStates(nextCells);
    const nextWinningLines = getBoardWinningLines(nextCells);

    const nextGameLine = getWinningLine(nextWinners);
    const nextGameWinner =
      nextGameLine === null
        ? ""
        : nextWinners[WIN_LINES[nextGameLine][0]];

    const nextDraw =
      !nextGameWinner && nextWinners.every(Boolean);

    const targetBoard = (row % 3) * 3 + (col % 3);

    const targetUnavailable =
      Boolean(nextWinners[targetBoard]) ||
      getMiniBoard(nextCells, targetBoard).every(Boolean);

    // Play a pencil sound only for a valid move.
    playPencilMark();

    // A mini-board winning line gets its own scratch sound.
    const newMiniBoardWon = nextWinners.some(
      (winner, i) =>
        !boardWinners[i] && winner && winner !== "D"
    );

    if (newMiniBoardWon && !nextGameWinner) {
      setTimeout(() => playPencilStrike(), 120);
    }

    setCells(nextCells);
    setBoardWinners(nextWinners);
    setBoardWinningLines(nextWinningLines);
    setLastMove(index);
    setMoveCount((count) => count + 1);

    setGameWinner(nextGameWinner);
    setGameWinningLine(nextGameLine);
    setIsDraw(nextDraw);
    setShowResult(false);

    setActiveBoard(
      nextGameWinner || nextDraw || targetUnavailable
        ? null
        : targetBoard
    );

    if (!nextGameWinner && !nextDraw) {
      setCurrentPlayer((player) => (player === "X" ? "O" : "X"));
    }
  }

  function restartGame() {
    if (resultTimer.current) clearTimeout(resultTimer.current);
    if (restartTimer.current) clearTimeout(restartTimer.current);

    playRestart();
    setRestarting(true);

    restartTimer.current = setTimeout(() => {
      setCells(createCells());
      setBoardWinners(emptyWinners());
      setBoardWinningLines(emptyLines());

      setCurrentPlayer(randomPlayer());
      setActiveBoard(null);
      setLastMove(null);

      setGameWinner("");
      setGameWinningLine(null);
      setIsDraw(false);
      setShowResult(false);
      setMoveCount(0);
      setRestarting(false);
      victoryPlayed.current = false;
    }, 250);
  }

  function handleExit() {
    if (typeof onExit === "function") {
      onExit();
    } else {
      window.history.back();
    }
  }

  const finished = Boolean(gameWinner || isDraw);
  const resultColor = gameWinner === "X" ? "blue" : "red";

  return (
    <main
      className={[
        "xox-game",
        currentPlayer === "X" ? "turn-blue" : "turn-red",
        restarting ? "is-restarting" : "",
        finished ? "game-over" : "",
      ].filter(Boolean).join(" ")}
    >
      <button
        className="xox-exit-button"
        type="button"
        onClick={handleExit}
        aria-label="Exit game"
      >
        ↗ EXIT
      </button>

      <section className="xox-board-area">
        <div
          className={`xox-board ${finished ? "game-finished" : ""}`}
          role="grid"
          aria-label="Ultimate Tic-Tac-Toe board"
        >
          {Array.from({ length: 9 }, (_, boardIndex) => {
            const winner = boardWinners[boardIndex];
            const miniCells = getMiniBoard(cells, boardIndex);

            const isFreeChoice =
              !finished && activeBoard === null && !winner;

            const isSpecificTarget =
              !finished && activeBoard === boardIndex && !winner;

            const isPlayable = isFreeChoice || isSpecificTarget;

            return (
              <div
                key={boardIndex}
                className={[
                  "xox-mini-board",
                  isPlayable ? "mini-active" : "",
                  isFreeChoice ? "mini-free-choice" : "",
                  isSpecificTarget ? "mini-target" : "",
                  winner === "X" ? "mini-won-x" : "",
                  winner === "O" ? "mini-won-o" : "",
                  winner === "D" ? "mini-draw" : "",
                ].filter(Boolean).join(" ")}
              >
                {miniCells.map((mark, localIndex) => {
                  const row =
                    Math.floor(boardIndex / 3) * 3 +
                    Math.floor(localIndex / 3);

                  const col =
                    (boardIndex % 3) * 3 + (localIndex % 3);

                  const index = row * 9 + col;
                  const isLastMove = lastMove === index;

                  return (
                    <button
                      key={index}
                      type="button"
                      role="gridcell"
                      className={[
                        "xox-cell",
                        mark ? `mark-${mark.toLowerCase()}` : "",
                        isLastMove ? "cell-last-move" : "",
                      ].filter(Boolean).join(" ")}
                      onClick={() => playCell(index)}
                      disabled={
                        Boolean(mark) ||
                        Boolean(winner) ||
                        finished ||
                        restarting ||
                        (activeBoard !== null &&
                          activeBoard !== boardIndex)
                      }
                      aria-label={`Row ${row + 1}, column ${col + 1}${
                        mark ? `: ${mark}` : ""
                      }`}
                    >
                      {mark && (
                        <span
                          key={`${index}-${mark}-${moveCount}`}
                          className={[
                            "xox-mark",
                            isLastMove ? "mark-entering" : "",
                          ].filter(Boolean).join(" ")}
                        >
                          <Mark player={mark} />
                        </span>
                      )}
                    </button>
                  );
                })}

                {winner && winner !== "D" && (
                  <>
                    {boardWinningLines[boardIndex] !== null && (
                      <div
                        key={`mini-strike-${boardIndex}-${boardWinningLines[boardIndex]}`}
                        className={`xox-mini-strike line-${boardWinningLines[boardIndex]}`}
                        aria-hidden="true"
                      />
                    )}

                    <div
                      key={`${boardIndex}-${winner}`}
                      className={`xox-board-winner winner-${winner.toLowerCase()}`}
                      aria-label={`Board won by ${winner}`}
                    >
                      <Mark player={winner} />
                    </div>
                  </>
                )}

                {winner === "D" && (
                  <div className="xox-board-draw">DRAW</div>
                )}
              </div>
            );
          })}

          {finished && gameWinningLine !== null && (
            <div
              key={`game-strike-${gameWinningLine}`}
              className={`xox-game-strike line-${gameWinningLine}`}
              aria-hidden="true"
            />
          )}
        </div>
      </section>

      {showResult && (
        <div
          className={`xox-winner-screen ${
            isDraw ? "result-draw" : `result-${resultColor}`
          }`}
          role="status"
          aria-live="assertive"
        >
          <div className="xox-winner-content">
            <div className="xox-winner-kicker">CHICACO VERSE</div>

            <div className="xox-winner-title">
              {isDraw ? (
                <>GAME<br />DRAW</>
              ) : (
                <>{resultColor.toUpperCase()}<br />WINS</>
              )}
            </div>

            {!isDraw && (
              <div className="xox-winner-mark">
                <Mark player={gameWinner} />
              </div>
            )}

            <button
              type="button"
              className="xox-winner-restart"
              onClick={restartGame}
            >
              ↻ PLAY AGAIN
            </button>

            <button
              type="button"
              className="xox-winner-exit"
              onClick={handleExit}
            >
              EXIT
            </button>
          </div>
        </div>
      )}

      {!showResult && (
        <div className="xox-bottom-actions">
          
        </div>
      )}
    </main>
  );
}
