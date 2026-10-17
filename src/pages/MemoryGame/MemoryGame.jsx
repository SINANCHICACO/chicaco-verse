import { useEffect, useRef, useState } from "react";
import "./MemoryGame.css";

const OBJECTS = [
  "flower",
  "camera",
  "sun",
  "moon",
  "cloud",
  "leaf",
  "apple",
  "key",
  "lock",
  "bell",
  "gift",
];

const THEMES = {
  Red: {
    bg: "#f79a7c",
    board: "#594344",
  },
  Blue: {
    bg: "#65afca",
    board: "#3d4352",
  },
};

function shuffledDeck() {
  const deck = OBJECTS.flatMap((type, pair) => [
    { id: `${pair}-a`, pair, type },
    { id: `${pair}-b`, pair, type },
  ]);

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck.map((card, index) => ({
    ...card,
    rotation: Math.round((Math.random() * 8 - 4) * 10) / 10,
    offsetY: Math.round(Math.random() * 6 - 3),
    offsetX: Math.round(Math.random() * 4 - 2),
    index,
  }));
}

function ObjectArt({ type }) {
  return (
    <span
      className={`object-art art-${type}`}
      aria-hidden="true"
    >
      {type === "flower" && (
        <>
          <i className="petal p1" />
          <i className="petal p2" />
          <i className="petal p3" />
          <i className="petal p4" />
          <i className="petal p5" />
          <i className="center" />
        </>
      )}

      {type === "camera" && (
        <>
          <i className="camera-flash" />
          <i className="lens" />
          <i className="lens-inner" />
        </>
      )}

      {type === "sun" && (
        <>
          <i className="sun-rays" />
          <i className="sun-core" />
        </>
      )}

      {type === "moon" && (
        <i className="moon-shape" />
      )}

      {type === "cloud" && (
        <>
          <i className="cloud-a" />
          <i className="cloud-b" />
          <i className="cloud-c" />
        </>
      )}

      {type === "leaf" && (
        <>
          <i className="leaf-shape" />
          <i className="leaf-line" />
        </>
      )}

      {type === "apple" && (
        <>
          <i className="fruit" />
          <i className="fruit-leaf" />
          <i className="fruit-stem" />
        </>
      )}

      {type === "key" && (
        <>
          <i className="key-ring" />
          <i className="key-stem" />
          <i className="key-tooth" />
        </>
      )}

      {type === "lock" && (
        <>
          <i className="lock-arch" />
          <i className="lock-body" />
          <i className="lock-hole" />
        </>
      )}

      {type === "bell" && (
        <>
          <i className="bell-body" />
          <i className="bell-top" />
          <i className="bell-clapper" />
        </>
      )}

      {type === "gift" && (
        <>
          <i className="gift-box" />
          <i className="gift-v" />
          <i className="gift-h" />
          <i className="gift-bow" />
        </>
      )}
    </span>
  );
}

export default function MemoryGame() {
  const [cards, setCards] = useState(shuffledDeck);
  const [opened, setOpened] = useState([]);
  const [matched, setMatched] = useState([]);
  const [turn, setTurn] = useState("Red");

  const [score, setScore] = useState({
    Red: 0,
    Blue: 0,
  });

  const [winner, setWinner] = useState("");

  const mismatchTimer = useRef(null);

  useEffect(() => {
    return () => {
      clearTimeout(mismatchTimer.current);
    };
  }, []);

  useEffect(() => {
    if (matched.length === OBJECTS.length * 2) {
      if (score.Red === score.Blue) {
        setWinner("Draw");
      } else {
        setWinner(score.Red > score.Blue ? "Red" : "Blue");
      }
    }
  }, [matched, score]);

  function flip(card) {
    if (
      winner ||
      opened.length === 2 ||
      opened.includes(card.id) ||
      matched.includes(card.id)
    ) {
      return;
    }

    const next = [...opened, card.id];
    setOpened(next);

    if (next.length !== 2) {
      return;
    }

    const first = cards.find(
      (item) => item.id === next[0]
    );

    if (first.pair === card.pair) {
      // Matching pair: award one point and keep the turn.
      mismatchTimer.current = setTimeout(() => {
        setMatched((previous) => [
          ...previous,
          first.id,
          card.id,
        ]);

        setScore((previous) => ({
          ...previous,
          [turn]: previous[turn] + 1,
        }));

        setOpened([]);
      }, 400);
    } else {
      // Mismatch: hide both cards and switch players.
      mismatchTimer.current = setTimeout(() => {
        setOpened([]);

        setTurn((previous) =>
          previous === "Red" ? "Blue" : "Red"
        );
      }, 950);
    }
  }

  function restart() {
    clearTimeout(mismatchTimer.current);

    setCards(shuffledDeck());
    setOpened([]);
    setMatched([]);

    setTurn(
      Math.random() < 0.5 ? "Red" : "Blue"
    );

    setScore({
      Red: 0,
      Blue: 0,
    });

    setWinner("");
  }

  const theme = THEMES[turn];

  return (
    <main
      className="memory-page"
      style={{
        "--player-bg": theme.bg,
        "--board-bg": theme.board,
      }}
    >
      <div className="memory-stage">
        <header className="memory-header">
          <section
            className={`score-panel red-panel ${
              turn === "Red" ? "is-active" : ""
            }`}
          >
            <span className="score-label">
              <i className="player-dot" />
              RED
            </span>

            <strong>{score.Red}</strong>
            <small>POINTS</small>
          </section>

          <div className="memory-title">
            <h1>MEMORY</h1>
            <span>FIND THE MATCHING PAIRS</span>
          </div>

          <section
            className={`score-panel blue-panel ${
              turn === "Blue" ? "is-active" : ""
            }`}
          >
            <span className="score-label">
              <i className="player-dot" />
              BLUE
            </span>

            <strong>{score.Blue}</strong>
            <small>POINTS</small>
          </section>
        </header>

        <div className="turn-strip">
          <span
            className={`turn-dot ${turn.toLowerCase()}`}
          />

          <b>{turn.toUpperCase()}'S TURN</b>

          <span className="turn-hint">
            Find a pair to score
          </span>
        </div>

        <section
          className="memory-board"
          aria-label="Memory game board"
        >
          <div className="memory-grid">
            {cards.map((card) => {
              const isMatched = matched.includes(card.id);

              const faceUp =
                opened.includes(card.id) || isMatched;

              return (
                <button
                  key={card.id}
                  type="button"
                  style={{
                    "--card-rotation": `${card.rotation}deg`,
                    "--card-offset-y": `${card.offsetY}px`,
                    "--card-offset-x": `${card.offsetX}px`,
                    "--card-index": card.index,
                  }}
                  className={`memory-card ${
                    faceUp ? "revealed" : ""
                  } ${isMatched ? "matched" : ""}`}
                  onClick={() => flip(card)}
                  disabled={
                    !!winner ||
                    isMatched ||
                    opened.length === 2 ||
                    opened.includes(card.id)
                  }
                  aria-label={
                    faceUp
                      ? `Revealed ${card.type}`
                      : "Face-down card"
                  }
                >
                  <span className="memory-card-inner">
                    <span className="card-back">
                      <i className="back-mark" />
                      <i className="back-dot" />
                    </span>

                    <span className="card-face">
                      <ObjectArt type={card.type} />
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="memory-footer">
          <span>
            PAIRS FOUND{" "}
            <b>
              {matched.length / 2}/{OBJECTS.length}
            </b>
          </span>

          <button
            type="button"
            className="memory-restart"
            onClick={restart}
            aria-label="Restart game"
          >
            <i />
          </button>

          <span>
            BEST SCORE{" "}
            <b>{Math.max(score.Red, score.Blue)}</b>
          </span>
        </footer>

        {winner && (
          <div
            className={`memory-winner winner-${winner.toLowerCase()}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="winner-card">
              <span className="winner-kicker">
                GAME COMPLETE
              </span>

              <div className="winner-copy">
                {winner === "Draw" ? (
                  <>
                    IT'S A
                    <br />
                    DRAW
                  </>
                ) : (
                  <>
                    {winner.toUpperCase()}
                    <br />
                    WINS
                  </>
                )}
              </div>

              <div className="winner-scoreline">
                <span>
                  RED <b>{score.Red}</b>
                </span>

                <i />

                <span>
                  BLUE <b>{score.Blue}</b>
                </span>
              </div>

              <button
                type="button"
                className="play-again"
                onClick={restart}
              >
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}