
import { useCallback, useEffect, useRef, useState } from "react";
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
];

const THEMES = {
  Red: { bg: "#f79a7c", board: "#594344" },
  Blue: { bg: "#65afca", board: "#3d4352" },
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
    rotation: Math.round((Math.random() * 6 - 3) * 10) / 10,
    offsetY: Math.round(Math.random() * 4 - 2),
    offsetX: Math.round(Math.random() * 4 - 2),
    index,
  }));
}

function ObjectArt({ type }) {
  return (
    <span className={`object-art art-${type}`} aria-hidden="true">
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

      {type === "moon" && <i className="moon-shape" />}

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
    </span>
  );
}

export default function MemoryGame() {
  const [cards, setCards] = useState(shuffledDeck);
  const [opened, setOpened] = useState([]);
  const [matched, setMatched] = useState([]);
  const [turn, setTurn] = useState("Red");
  const [score, setScore] = useState({ Red: 0, Blue: 0 });
  const [winner, setWinner] = useState("");
  const [bestScore, setBestScore] = useState(0);

  const mismatchTimer = useRef(null);
  const soundContext = useRef(null);
  const winnerSoundPlayed = useRef(false);
  const roundId = useRef(0);

  const playSound = useCallback((type) => {
    try {
      const AudioContextClass =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContextClass) return;

      if (!soundContext.current) {
        soundContext.current = new AudioContextClass();
      }

      const ctx = soundContext.current;

      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const now = ctx.currentTime;

      const tone = (
        frequency,
        start,
        duration,
        waveform = "sine",
        volume = 0.07
      ) => {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.type = waveform;
        oscillator.frequency.setValueAtTime(frequency, start);

        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(
          volume,
          start + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          start + duration
        );

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.start(start);
        oscillator.stop(start + duration + 0.02);
      };

      if (type === "flip") {
        tone(520, now, 0.09, "triangle", 0.045);
        tone(760, now + 0.035, 0.07, "sine", 0.025);
      }

      if (type === "match") {
        tone(660, now, 0.13, "triangle", 0.06);
        tone(880, now + 0.09, 0.16, "triangle", 0.065);
        tone(1100, now + 0.18, 0.19, "sine", 0.05);
      }

      if (type === "miss") {
        tone(310, now, 0.12, "triangle", 0.045);
        tone(230, now + 0.11, 0.15, "triangle", 0.04);
      }

      if (type === "turn") {
        tone(440, now, 0.07, "sine", 0.035);
      }

      if (type === "restart") {
        tone(520, now, 0.08, "triangle", 0.04);
        tone(390, now + 0.07, 0.1, "triangle", 0.04);
      }

      if (type === "win") {
        [523, 659, 784, 1047, 784, 1047].forEach(
          (frequency, index, notes) => {
            tone(
              frequency,
              now + index * 0.14,
              index === notes.length - 1 ? 0.42 : 0.19,
              "triangle",
              0.07
            );
          }
        );
      }
    } catch {
      // Sound is optional.
    }
  }, []);

  useEffect(() => {
    return () => {
      clearTimeout(mismatchTimer.current);

      if (soundContext.current) {
        soundContext.current.close();
      }
    };
  }, []);

  useEffect(() => {
    if (matched.length !== cards.length || cards.length === 0) {
      return;
    }

    if (score.Red === score.Blue) {
      setWinner("Draw");
    } else {
      setWinner(score.Red > score.Blue ? "Red" : "Blue");
    }

    if (!winnerSoundPlayed.current) {
      winnerSoundPlayed.current = true;
      playSound("win");
    }
  }, [matched, score, cards.length, playSound]);

  useEffect(() => {
    setBestScore((previous) =>
      Math.max(previous, score.Red, score.Blue)
    );
  }, [score]);

  function flip(card) {
    if (
      winner ||
      opened.length >= 2 ||
      opened.includes(card.id) ||
      matched.includes(card.id)
    ) {
      return;
    }

    playSound("flip");

    const next = [...opened, card.id];
    setOpened(next);

    if (next.length !== 2) return;

    const first = cards.find((item) => item.id === next[0]);

    if (!first) return;

    const currentRound = roundId.current;

    if (first.pair === card.pair) {
      playSound("match");

      mismatchTimer.current = setTimeout(() => {
        if (currentRound !== roundId.current) return;

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
      }, 350);
    } else {
      playSound("miss");

      mismatchTimer.current = setTimeout(() => {
        if (currentRound !== roundId.current) return;

        setOpened([]);

        setTurn((previous) =>
          previous === "Red" ? "Blue" : "Red"
        );

        playSound("turn");
      }, 900);
    }
  }

  function restart() {
    clearTimeout(mismatchTimer.current);
    roundId.current += 1;
    winnerSoundPlayed.current = false;

    setCards(shuffledDeck());
    setOpened([]);
    setMatched([]);
    setTurn(Math.random() < 0.5 ? "Red" : "Blue");
    setScore({ Red: 0, Blue: 0 });
    setWinner("");

    playSound("restart");
  }

  function exitGame() {
    clearTimeout(mismatchTimer.current);
    window.location.href = "/";
  }

  const theme = THEMES[turn];
  const pairsFound = matched.length / 2;

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
          <span className={`turn-dot ${turn.toLowerCase()}`} />
          <b>{turn.toUpperCase()}'S TURN</b>
          <span className="turn-hint">Find a pair to score</span>
        </div>

        {/* Restart and Exit are outside the score panels. */}
        <div className="memory-controls">
          <button
            type="button"
            className="board-control restart-control"
            onClick={restart}
            aria-label="Restart game"
            title="Restart game"
          >
            ↻
          </button>

          <span className="controls-label">MEMORY MATCH</span>

          <button
            type="button"
            className="board-control exit-control"
            onClick={exitGame}
            aria-label="Exit to home"
            title="Exit game"
          >
            ×
          </button>
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
                  } ${isMatched ? "matched" : ""} ${
                    opened.includes(card.id) ? "just-opened" : ""
                  }`}
                  onClick={() => flip(card)}
                  disabled={
                    !!winner ||
                    isMatched ||
                    opened.length === 2 ||
                    opened.includes(card.id)
                  }
                  aria-label={
                    faceUp
                      ? `Revealed ${card.type}${
                          isMatched ? ", matched" : ""
                        }`
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
            PAIRS FOUND
            <b>{pairsFound}/10</b>
          </span>

          <div
            className="progress-track"
            aria-label={`${pairsFound} of 10 pairs found`}
          >
            <span style={{ width: `${pairsFound * 10}%` }} />
          </div>

          <span>
            BEST SCORE
            <b>{bestScore}</b>
          </span>
        </footer>

        {winner && (
          <div
            className={`memory-winner winner-${winner.toLowerCase()}`}
            role="dialog"
            aria-modal="true"
          >
            <div className="winner-card">
              <div className="winner-medal" aria-hidden="true">
                <i />
              </div>

              <span className="winner-kicker">
                {winner === "Draw" ? "GREAT GAME" : "GAME COMPLETE"}
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
                    WINS!
                  </>
                )}
              </div>

              <p className="winner-message">
                {winner === "Draw"
                  ? "Both players finish with the same score."
                  : `${winner} found the most matching pairs!`}
              </p>

              <div className="winner-scoreline">
                <span>
                  <i className="player-dot" />
                  RED <b>{score.Red}</b>
                </span>

                <i className="score-divider" />

                <span>
                  <i className="player-dot" />
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

              <button
                type="button"
                className="winner-exit"
                onClick={exitGame}
              >
                BACK TO HOME
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
