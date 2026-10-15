
import React, { useState, useEffect } from "react";
import "./DotsAndBoxes.css";

const SIZE = 6;
const BOX_SIZE = SIZE - 1;
const TOTAL_BOXES = BOX_SIZE * BOX_SIZE;

const BLUE = "blue";
const RED = "red";

const createEdges = () => ({
  h: Array(BOX_SIZE * SIZE).fill(""),
  v: Array(SIZE * BOX_SIZE).fill(""),
});

const createBoxes = () => Array(TOTAL_BOXES).fill("");

const getHorizontalIndex = (row, col) => row * BOX_SIZE + col;
const getVerticalIndex = (row, col) => row * SIZE + col;

function getBoxEdges(row, col) {
  return [
    ["h", getHorizontalIndex(row, col)],
    ["h", getHorizontalIndex(row + 1, col)],
    ["v", getVerticalIndex(row, col)],
    ["v", getVerticalIndex(row, col + 1)],
  ];
}

function isBoxComplete(edges, row, col) {
  return getBoxEdges(row, col).every(([type, index]) =>
    Boolean(edges[type][index])
  );
}

function getScore(boxes, player) {
  return boxes.filter((owner) => owner === player).length;
}

function DotsAndBoxes({ onExit }) {
  const [edges, setEdges] = useState(createEdges);
  const [boxes, setBoxes] = useState(createBoxes);
  const [currentPlayer, setCurrentPlayer] = useState(BLUE);
  const [lastEdge, setLastEdge] = useState(null);
  const [capturedBoxes, setCapturedBoxes] = useState([]);
  const [showResult, setShowResult] = useState(false);

  const blueScore = getScore(boxes, BLUE);
  const redScore = getScore(boxes, RED);
  const finished = boxes.every(Boolean);

  useEffect(() => {
    if (!finished) {
      setShowResult(false);
      return;
    }

    const timer = setTimeout(() => setShowResult(true), 1100);
    return () => clearTimeout(timer);
  }, [finished]);

  function playEdge(type, index) {
    if (finished || edges[type][index]) return;

    const nextEdges = {
      h: [...edges.h],
      v: [...edges.v],
    };

    nextEdges[type][index] = currentPlayer;

    const nextBoxes = [...boxes];
    const newlyCaptured = [];

    // Check all boxes after this move.
    // A single line can complete two adjacent boxes.
    for (let row = 0; row < BOX_SIZE; row++) {
      for (let col = 0; col < BOX_SIZE; col++) {
        const boxIndex = row * BOX_SIZE + col;

        if (
          !nextBoxes[boxIndex] &&
          isBoxComplete(nextEdges, row, col)
        ) {
          nextBoxes[boxIndex] = currentPlayer;
          newlyCaptured.push(boxIndex);
        }
      }
    }

    setEdges(nextEdges);
    setBoxes(nextBoxes);
    setLastEdge(`${type}-${index}`);
    setCapturedBoxes(newlyCaptured);

    // Capturing any boxes gives the same player another turn.
    if (newlyCaptured.length === 0) {
      setCurrentPlayer((player) =>
        player === BLUE ? RED : BLUE
      );
    }
  }

  function restartGame() {
    setEdges(createEdges());
    setBoxes(createBoxes());
    setCurrentPlayer(BLUE);
    setLastEdge(null);
    setCapturedBoxes([]);
    setShowResult(false);
  }

  function handleExit() {
    if (typeof onExit === "function") {
      onExit();
    } else {
      window.history.back();
    }
  }

  const winner =
    blueScore > redScore
      ? BLUE
      : redScore > blueScore
        ? RED
        : "draw";

  const point = (index) => 40 + index * 84;

  function renderHorizontalEdges() {
    return Array.from({ length: SIZE }, (_, row) =>
      Array.from({ length: BOX_SIZE }, (_, col) => {
        const index = getHorizontalIndex(row, col);
        const owner = edges.h[index];
        const id = `h-${index}`;

        return (
          <g key={id}>
            <line
              x1={point(col)}
              y1={point(row)}
              x2={point(col + 1)}
              y2={point(row)}
              className={`db-edge ${
                owner ? `edge-${owner}` : "edge-available"
              } ${lastEdge === id ? "edge-last" : ""}`}
            />

            {!owner && !finished && (
              <line
                x1={point(col)}
                y1={point(row)}
                x2={point(col + 1)}
                y2={point(row)}
                className="db-edge-hit"
                onClick={() => playEdge("h", index)}
                role="button"
                tabIndex={0}
                aria-label={`Draw horizontal line, row ${row + 1}, position ${col + 1}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    playEdge("h", index);
                  }
                }}
              />
            )}
          </g>
        );
      })
    );
  }

  function renderVerticalEdges() {
    return Array.from({ length: BOX_SIZE }, (_, row) =>
      Array.from({ length: SIZE }, (_, col) => {
        const index = getVerticalIndex(row, col);
        const owner = edges.v[index];
        const id = `v-${index}`;

        return (
          <g key={id}>
            <line
              x1={point(col)}
              y1={point(row)}
              x2={point(col)}
              y2={point(row + 1)}
              className={`db-edge ${
                owner ? `edge-${owner}` : "edge-available"
              } ${lastEdge === id ? "edge-last" : ""}`}
            />

            {!owner && !finished && (
              <line
                x1={point(col)}
                y1={point(row)}
                x2={point(col)}
                y2={point(row + 1)}
                className="db-edge-hit"
                onClick={() => playEdge("v", index)}
                role="button"
                tabIndex={0}
                aria-label={`Draw vertical line, row ${row + 1}, column ${col + 1}`}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    playEdge("v", index);
                  }
                }}
              />
            )}
          </g>
        );
      })
    );
  }

  return (
    <main className={`db-game turn-${currentPlayer}`}>
      <header className="db-header">
        <div className="db-player-card blue-card">
          <span className="db-player-label">BLUE</span>
          <span className="db-player-score">{blueScore}</span>
          <span className="db-player-caption">BOXES</span>
        </div>

        <div className="db-heading">
          <span className="db-eyebrow">CHICACO VERSE</span>
          <h1>DOTS &amp; BOXES</h1>
          <span className="db-turn">
            {finished
              ? "GAME OVER"
              : `${currentPlayer.toUpperCase()}'S TURN`}
          </span>
        </div>

        <div className="db-player-card red-card">
          <span className="db-player-label">RED</span>
          <span className="db-player-score">{redScore}</span>
          <span className="db-player-caption">BOXES</span>
        </div>
      </header>

      <section className="db-main">
        <aside className="db-side-score blue-side">
          <span className="db-side-name">BLUE</span>
          <span className="db-side-points">{blueScore}</span>
          <span className="db-side-caption">POINTS</span>
          {currentPlayer === BLUE && !finished && (
            <span className="db-turn-indicator" />
          )}
        </aside>

        <div className="db-board-wrap">
          <svg
            className="db-board"
            viewBox="0 0 500 500"
            role="group"
            aria-label="Dots and Boxes board with 25 boxes"
          >
            {boxes.map((owner, index) => {
              const row = Math.floor(index / BOX_SIZE);
              const col = index % BOX_SIZE;
              const isNew = capturedBoxes.includes(index);

              return (
                <rect
                  key={`box-${index}`}
                  x={point(col)}
                  y={point(row)}
                  width="84"
                  height="84"
                  className={[
                    "db-box",
                    owner ? `box-${owner}` : "",
                    isNew ? "box-newly-captured" : "",
                  ].filter(Boolean).join(" ")}
                />
              );
            })}

            {Array.from({ length: SIZE }, (_, index) => (
              <g key={`grid-${index}`}>
                <line
                  x1={point(index)}
                  y1={point(0)}
                  x2={point(index)}
                  y2={point(SIZE - 1)}
                  className="db-grid-line"
                />
                <line
                  x1={point(0)}
                  y1={point(index)}
                  x2={point(SIZE - 1)}
                  y2={point(index)}
                  className="db-grid-line"
                />
              </g>
            ))}

            {renderHorizontalEdges()}
            {renderVerticalEdges()}

            {Array.from({ length: SIZE }, (_, row) =>
              Array.from({ length: SIZE }, (_, col) => (
                <circle
                  key={`dot-${row}-${col}`}
                  cx={point(col)}
                  cy={point(row)}
                  r="10"
                  className="db-dot"
                />
              ))
            )}
          </svg>
        </div>

        <aside className="db-side-score red-side">
          <span className="db-side-name">RED</span>
          <span className="db-side-points">{redScore}</span>
          <span className="db-side-caption">POINTS</span>
          {currentPlayer === RED && !finished && (
            <span className="db-turn-indicator" />
          )}
        </aside>
      </section>

      <footer className="db-footer">
        <div className="db-footer-info">
          <span className={`db-current-dot ${currentPlayer}`} />
          <span>
            {finished ? "All boxes claimed" : "Connect a line to play"}
          </span>
        </div>

        <div className="db-footer-actions">
          <button
            type="button"
            className="db-restart"
            onClick={restartGame}
          >
            ↻ RESTART
          </button>

          <button
            type="button"
            className="db-exit"
            onClick={handleExit}
          >
            EXIT
          </button>
        </div>
      </footer>

      {showResult && (
        <div
          className={`db-result result-${winner}`}
          role="dialog"
          aria-modal="true"
          aria-label="Game result"
        >
          <div className="db-result-content">
            <span className="db-result-kicker">CHICACO VERSE</span>
            <div className="db-trophy">★</div>

            <h2>
              {winner === "draw"
                ? "IT'S A DRAW!"
                : `${winner.toUpperCase()} WINS!`}
            </h2>

            <p className="db-result-summary">
              {blueScore} BLUE BOXES — {redScore} RED BOXES
            </p>

            <p className="db-result-message">
              {winner === "draw"
                ? "Perfectly balanced."
                : `${winner.toUpperCase()} takes the board!`}
            </p>

            <button
              type="button"
              className="db-play-again"
              onClick={restartGame}
            >
              ↻ PLAY AGAIN
            </button>

            <button
              type="button"
              className="db-result-exit"
              onClick={handleExit}
            >
              EXIT GAME
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

export default DotsAndBoxes;
