
import React, { useEffect, useRef, useState } from "react";
import "./NumberGame.css";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0"];

const PLAYERS = {
  p1: { name: "PLAYER 1", color: "red" },
  p2: { name: "PLAYER 2", color: "blue" },
};

const formatTime = (seconds) => {
  const value = Math.max(0, Math.ceil(seconds));
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(
    value % 60
  ).padStart(2, "0")}`;
};

function getFeedback(secret, guess) {
  let places = 0;
  const secretCounts = {};
  const guessCounts = {};

  for (let i = 0; i < 4; i++) {
    if (secret[i] === guess[i]) places++;

    secretCounts[secret[i]] = (secretCounts[secret[i]] || 0) + 1;
    guessCounts[guess[i]] = (guessCounts[guess[i]] || 0) + 1;
  }

  let digits = 0;

  for (const digit in guessCounts) {
    digits += Math.min(
      guessCounts[digit],
      secretCounts[digit] || 0
    );
  }

  return { digits, places };
}

export default function NumberGame() {
  const [screen, setScreen] = useState("setup");
  const [timeLimit, setTimeLimit] = useState(60);
  const [noDuplicates, setNoDuplicates] = useState(false);

  const [giverId, setGiverId] = useState("p1");
  const [secret, setSecret] = useState("");
  const [guess, setGuess] = useState("");
  const [history, setHistory] = useState([]);

  const [remaining, setRemaining] = useState(60);
  const [startedAt, setStartedAt] = useState(null);
  const [showIntro, setShowIntro] = useState(false);
  const [error, setError] = useState("");
  const [feedbackState, setFeedbackState] = useState("");

  const [results, setResults] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [winner, setWinner] = useState(null);

  const clockRef = useRef(null);
  const introRef = useRef(null);
  const errorRef = useRef(null);
  const feedbackRef = useRef(null);
  const historyEndRef = useRef(null);

  const submitLockRef = useRef(false);
  const roundEndedRef = useRef(false);
  const startedAtRef = useRef(null);
  const remainingRef = useRef(60);
  const screenRef = useRef("setup");
  const resultsRef = useRef([]);

  const guesserId = giverId === "p1" ? "p2" : "p1";
  const giver = PLAYERS[giverId];
  const guesser = PLAYERS[guesserId];

  const activePlayer = screen === "secret" ? giver : guesser;
  const activeColor =
    activePlayer?.color === "red" ? "#ff4057" : "#4387ff";

  const progress = Math.max(
    0,
    Math.min(100, (remaining / timeLimit) * 100)
  );

  // Keep refs synchronized with state for reliable timer callbacks.
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    resultsRef.current = results;
  }, [results]);

  useEffect(() => {
    remainingRef.current = remaining;
  }, [remaining]);

  useEffect(() => {
    startedAtRef.current = startedAt;
  }, [startedAt]);

  useEffect(() => {
    historyEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [history]);

  useEffect(() => {
    return () => {
      window.clearInterval(clockRef.current);
      window.clearTimeout(introRef.current);
      window.clearTimeout(errorRef.current);
      window.clearTimeout(feedbackRef.current);
    };
  }, []);

  function clearClock() {
    window.clearInterval(clockRef.current);
    clockRef.current = null;
  }

  function clearTimers() {
    clearClock();
    window.clearTimeout(introRef.current);
    window.clearTimeout(errorRef.current);
    window.clearTimeout(feedbackRef.current);
  }

  function flashError(message) {
    setError(message);

    window.clearTimeout(errorRef.current);
    errorRef.current = window.setTimeout(() => {
      setError("");
    }, 1800);
  }

  function showFeedback(state) {
    setFeedbackState(state);

    window.clearTimeout(feedbackRef.current);
    feedbackRef.current = window.setTimeout(() => {
      setFeedbackState("");
    }, 650);
  }

  function showMessage(callback) {
    setShowIntro(true);

    window.clearTimeout(introRef.current);
    introRef.current = window.setTimeout(() => {
      setShowIntro(false);
      callback?.();
    }, 2000);
  }

  // Start the clock from a single timestamp and update the display.
  function startClock() {
    clearClock();

    if (
      screenRef.current !== "guessing" ||
      roundEndedRef.current
    ) {
      return;
    }

    const start = Date.now();

    startedAtRef.current = start;
    setStartedAt(start);

    remainingRef.current = timeLimit;
    setRemaining(timeLimit);

    clockRef.current = window.setInterval(() => {
      if (
        roundEndedRef.current ||
        screenRef.current !== "guessing"
      ) {
        clearClock();
        return;
      }

      const elapsed = (Date.now() - start) / 1000;
      const left = Math.max(0, timeLimit - elapsed);

      remainingRef.current = left;
      setRemaining(left);

      if (left <= 0) {
        clearClock();
        recordTurn({
          solved: false,
          guessedNumber: null,
        });
      }
    }, 100);
  }

  function startGame() {
    clearTimers();

    const firstPlayer = Math.random() < 0.5 ? "p1" : "p2";

    setGiverId(firstPlayer);
    setSecret("");
    setGuess("");
    setHistory([]);
    setResults([]);
    resultsRef.current = [];

    setLastResult(null);
    setWinner(null);
    setRemaining(timeLimit);
    remainingRef.current = timeLimit;

    setStartedAt(null);
    startedAtRef.current = null;
    setError("");
    setFeedbackState("");

    submitLockRef.current = false;
    roundEndedRef.current = false;

    screenRef.current = "secret";
    setScreen("secret");

    showMessage();
  }

  function hasDuplicate(value) {
    return new Set(value).size !== value.length;
  }

  function backspace() {
    setError("");

    if (screen === "secret") {
      setSecret((current) => current.slice(0, -1));
    }

    if (
      screen === "guessing" &&
      !submitLockRef.current &&
      !roundEndedRef.current
    ) {
      setGuess((current) => current.slice(0, -1));
    }
  }

  function addDigit(digit) {
    setError("");

    if (screen === "secret") {
      if (secret.length >= 4) return;

      const next = secret + digit;

      if (noDuplicates && hasDuplicate(next)) {
        flashError("DUPLICATE DIGITS ARE NOT ALLOWED");
        showFeedback("wrong");
        return;
      }

      setSecret(next);
      return;
    }

    if (
      screen !== "guessing" ||
      submitLockRef.current ||
      roundEndedRef.current ||
      guess.length >= 4
    ) {
      return;
    }

    const next = guess + digit;

    if (noDuplicates && hasDuplicate(next)) {
      flashError("DUPLICATE DIGITS ARE NOT ALLOWED");
      showFeedback("wrong");
      return;
    }

    setGuess(next);

    // Automatically submit the moment digit four is entered.
    if (next.length === 4) {
      submitLockRef.current = true;
      submitGuess(next);
    }
  }

  function giveNumber() {
    if (secret.length !== 4) {
      flashError("ENTER ALL FOUR DIGITS");
      return;
    }

    clearClock();

    setGuess("");
    setHistory([]);
    setError("");
    setFeedbackState("");
    setRemaining(timeLimit);
    remainingRef.current = timeLimit;

    setStartedAt(null);
    startedAtRef.current = null;

    submitLockRef.current = false;
    roundEndedRef.current = false;

    screenRef.current = "guessing";
    setScreen("guessing");

    // Start only after the intro message disappears.
    showMessage(() => {
      if (roundEndedRef.current) return;
      startClock();
    });
  }

  // Record a solved or timed-out turn exactly once.
  function recordTurn({ solved, guessedNumber = null }) {
    if (roundEndedRef.current) return;

    roundEndedRef.current = true;
    clearClock();

    const start = startedAtRef.current;

    const elapsed =
      start === null
        ? 0
        : Math.min(timeLimit, Math.max(0, (Date.now() - start) / 1000));

    const recordedTime = solved ? elapsed : timeLimit;

    const result = {
      giverId,
      guesserId,
      guesserName: guesser.name,
      time: recordedTime,
      solved,
      guessedNumber,
      secret,
      history: [...history],
    };

    const nextResults = [...resultsRef.current, result];

    resultsRef.current = nextResults;
    setResults(nextResults);
    setLastResult(result);

    remainingRef.current = solved ? Math.max(0, timeLimit - elapsed) : 0;
    setRemaining(remainingRef.current);
    setGuess("");

    submitLockRef.current = false;

    if (!solved) {
      showFeedback("wrong");
    }

    if (nextResults.length >= 2) {
      const first = nextResults[0];
      const second = nextResults[1];

      if (first.time === second.time) {
        setWinner({ tie: true });
      } else {
        setWinner(first.time < second.time ? first : second);
      }

      screenRef.current = "result";
      setScreen("result");
    } else {
      screenRef.current = solved ? "solved" : "round-timeout";
      setScreen(solved ? "solved" : "round-timeout");
    }
  }

  function submitGuess(value = guess) {
    if (
      value.length !== 4 ||
      screenRef.current !== "guessing" ||
      roundEndedRef.current
    ) {
      submitLockRef.current = false;
      return;
    }

    if (noDuplicates && hasDuplicate(value)) {
      submitLockRef.current = false;
      setGuess("");
      flashError("DUPLICATE DIGITS ARE NOT ALLOWED");
      showFeedback("wrong");
      return;
    }

    const feedback = getFeedback(secret, value);

    const entry = {
      id: `${Date.now()}-${history.length}`,
      guess: value,
      digits: feedback.digits,
      places: feedback.places,
      correct: feedback.places === 4,
    };

    setHistory((current) => [...current, entry]);
    setGuess("");
    setError("");

    if (feedback.places === 4) {
      showFeedback("correct");

      // Give the green success effect time to appear.
      window.setTimeout(() => {
        recordTurn({
          solved: true,
          guessedNumber: value,
        });
      }, 250);

      return;
    }

    showFeedback("wrong");
    submitLockRef.current = false;
  }

  function nextRound() {
    clearTimers();

    // The previous guesser now chooses the next secret.
    setGiverId(guesserId);
    setSecret("");
    setGuess("");
    setHistory([]);

    setRemaining(timeLimit);
    remainingRef.current = timeLimit;

    setStartedAt(null);
    startedAtRef.current = null;

    setLastResult(null);
    setError("");
    setFeedbackState("");

    submitLockRef.current = false;
    roundEndedRef.current = false;

    screenRef.current = "secret";
    setScreen("secret");

    showMessage();
  }

  function playAgain() {
    clearTimers();

    setSecret("");
    setGuess("");
    setHistory([]);
    setResults([]);
    resultsRef.current = [];

    setLastResult(null);
    setWinner(null);

    setRemaining(timeLimit);
    remainingRef.current = timeLimit;

    setStartedAt(null);
    startedAtRef.current = null;

    setShowIntro(false);
    setError("");
    setFeedbackState("");

    submitLockRef.current = false;
    roundEndedRef.current = false;

    screenRef.current = "setup";
    setScreen("setup");
  }

  function changeTime(amount) {
    setTimeLimit((current) =>
      Math.max(60, Math.min(240, current + amount))
    );
  }

  function renderSlots(value) {
    return [0, 1, 2, 3].map((index) => (
      <div
        className={`ng-code-slot ${
          value[index] ? "filled" : ""
        } ${feedbackState ? `feedback-${feedbackState}` : ""}`}
        key={index}
      >
        {value[index] || <span>•</span>}
      </div>
    ));
  }

  function renderKeypad(value) {
    return (
      <div className="ng-keypad">
        {DIGITS.map((digit) => (
          <button
            key={digit}
            onClick={() => addDigit(digit)}
            disabled={value.length >= 4}
          >
            {digit}
          </button>
        ))}

        <button
          className="ng-key-special"
          onClick={backspace}
          disabled={!value.length || submitLockRef.current}
          aria-label="Backspace"
        >
          ⌫
        </button>
      </div>
    );
  }

  function renderHistory() {
    return (
      <aside className="ng-history">
        <div className="ng-history-title">
          <span>GUESS HISTORY</span>
          <strong>{history.length}</strong>
        </div>

        <div className="ng-history-columns">
          <span>NUMBER</span>
          <span>DIGITS / PLACE</span>
        </div>

        {history.length === 0 ? (
          <div className="ng-empty-history">
            Your guesses<br />will appear here.
          </div>
        ) : (
          <div className="ng-history-list">
            {history.map((item, index) => (
              <div
                className={`ng-history-row ${
                  item.correct ? "history-correct" : ""
                }`}
                key={item.id}
              >
                <span className="ng-history-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{item.guess}</strong>
                <b>{item.digits}/{item.places}</b>
              </div>
            ))}
            <div ref={historyEndRef} />
          </div>
        )}
      </aside>
    );
  }

  return (
    <main
      className={`number-game tone-${activePlayer?.color || "neutral"} screen-${screen}`}
      style={{ "--player-color": activeColor }}
    >
      {screen === "setup" && (
        <section className="ng-setup">
          <button
            className="ng-back"
            onClick={() => {
              window.location.href = "/";
            }}
            aria-label="Back to games"
          >
            ←
          </button>

          <div className="ng-brand">
            CHICACO <span>VERSE</span>
          </div>

          <div className="ng-setup-content">
            <p className="ng-eyebrow">TWO PLAYER CHALLENGE</p>
            <h1>NUMBER<br /><span>GAME</span></h1>
            <p className="ng-description">
              Set the clock. Crack the code. Beat your opponent.
            </p>

            <div className="ng-time-panel">
              <span className="ng-field-label">TIME LIMIT</span>

              <div className="ng-time-control">
                <button
                  onClick={() => changeTime(-60)}
                  disabled={timeLimit <= 60}
                  aria-label="Decrease time"
                >
                  −
                </button>

                <div className="ng-time-value">
                  <strong>{timeLimit / 60}:00</strong>
                  <small>MINUTES</small>
                </div>

                <button
                  onClick={() => changeTime(60)}
                  disabled={timeLimit >= 240}
                  aria-label="Increase time"
                >
                  +
                </button>
              </div>

              <div className="ng-time-options">
                {[60, 120, 180, 240].map((seconds) => (
                  <button
                    key={seconds}
                    className={timeLimit === seconds ? "selected" : ""}
                    onClick={() => setTimeLimit(seconds)}
                  >
                    {seconds / 60} MIN
                  </button>
                ))}
              </div>

              <div className="ng-duplicate-setting">
                <div>
                  <strong>NO DUPLICATE DIGITS</strong>
                  <small>
                    {noDuplicates
                      ? "Each digit can appear only once."
                      : "Repeated digits are allowed."}
                  </small>
                </div>

                <button
                  type="button"
                  className={`ng-toggle ${noDuplicates ? "on" : ""}`}
                  role="switch"
                  aria-checked={noDuplicates}
                  onClick={() => setNoDuplicates((current) => !current)}
                >
                  <span />
                  <b>{noDuplicates ? "ON" : "OFF"}</b>
                </button>
              </div>
            </div>

            <div className="ng-player-legend">
              <span><i className="ng-dot red" /> PLAYER 1</span>
              <span><i className="ng-dot blue" /> PLAYER 2</span>
            </div>

            <button className="ng-primary" onClick={startGame}>
              START GAME 
            </button>

            <p className="ng-small-note">
              One player is randomly chosen to set the first number.
            </p>
          </div>
        </section>
      )}

      {screen === "secret" && (
        <section className="ng-play">
          <header className="ng-play-header">
            <div className="ng-round-label">
              NUMBER GAME <span> / ROUND {results.length + 1}</span>
            </div>
            <button className="ng-quit" onClick={playAgain}>EXIT ×</button>
          </header>

          <div className="ng-turn-heading">
            <span className="ng-eyebrow">YOUR TURN TO SET THE CODE</span>
            <h1>{giver.name}</h1>
            <p>Choose a secret four-digit number.</p>
          </div>

          {showIntro && (
            <div className="ng-toast">KEEP YOUR NUMBER SECRET</div>
          )}

          {error && <div className="ng-error">{error}</div>}

          <div className={`ng-code-slots ${feedbackState === "wrong" ? "ng-shake" : ""}`}>
            {renderSlots(secret)}
          </div>

          <p className="ng-helper">
            Your opponent will try to guess this number.
          </p>

          {renderKeypad(secret)}

          <button
            className="ng-primary ng-submit"
            disabled={secret.length !== 4}
            onClick={giveNumber}
          >
            GIVE NO. 
          </button>
        </section>
      )}

      {screen === "guessing" && (
        <section className="ng-play">
          <header className="ng-play-header">
            <div className="ng-round-label">
              NUMBER GAME <span> / ROUND {results.length + 1}</span>
            </div>
            <button className="ng-quit" onClick={playAgain}>EXIT ×</button>
          </header>

          <div className="ng-guess-layout">
            {renderHistory()}

            <div className="ng-guess-main">
              <div className="ng-guess-player">
                <span className="ng-eyebrow">CRACK THE CODE</span>
                <h1>{guesser.name}</h1>
                <p>Guess the secret number.</p>
              </div>

              <div className={`ng-timer ${remaining <= 10 ? "urgent" : ""}`}>
                <span>TIME REMAINING</span>
                <strong>{formatTime(remaining)}</strong>
                <div className="ng-timer-track">
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>

              {showIntro && (
                <div className="ng-toast">
                  GUESS YOUR OPPONENT&apos;S NUMBER
                </div>
              )}

              {error && <div className="ng-error">{error}</div>}

              <div
                className={`ng-code-slots ng-guess-slots ${
                  feedbackState === "wrong" ? "ng-shake" : ""
                }`}
              >
                {renderSlots(guess)}
              </div>

              {renderKeypad(guess)}

              <p className="ng-feedback-note">
                FOURTH DIGIT SUBMITS AUTOMATICALLY
              </p>
            </div>
          </div>
        </section>
      )}

      {screen === "solved" && (
        <section className="ng-intermission">
          <div className="ng-solved-mark">✓</div>
          <p className="ng-eyebrow">CODE CRACKED</p>

          <h1>{lastResult?.guesserName}<br /><span>GOT IT.</span></h1>

          <div className="ng-solved-number">{lastResult?.secret}</div>

          <div className="ng-frozen-timer">
            <span>TIME USED</span>
            <strong>{formatTime(lastResult?.time || 0)}</strong>
            <small>Time recorded for this round</small>
          </div>

          <p className="ng-intermission-copy">
            First turn completed. Switch roles for the second turn.
          </p>

          <button className="ng-primary" onClick={nextRound}>
            NEXT PLAYER 
          </button>
        </section>
      )}

      {screen === "round-timeout" && (
        <section className="ng-intermission">
          <div className="ng-timeout-mark">!</div>
          <p className="ng-eyebrow">TIME IS UP</p>

          <h1>TIME<br /><span>RECORDED.</span></h1>

          <div className="ng-frozen-timer timeout-timer">
            <span>{lastResult?.guesserName}</span>
            <strong>{formatTime(lastResult?.time ?? timeLimit)}</strong>
            <small>Full time limit recorded</small>
          </div>

          <p className="ng-intermission-copy">
            This turn is finished. The other player still gets their chance.
          </p>

          <button className="ng-primary" onClick={nextRound}>
            NEXT PLAYER 
          </button>
        </section>
      )}

      {screen === "result" && (
        <section className="ng-intermission ng-final-result">
          <div className="ng-solved-mark">
            {winner?.tie ? "=" : "✓"}
          </div>

          <p className="ng-eyebrow">NUMBER GAME · FINAL RESULT</p>

          <h1>{winner?.tie ? "IT'S A TIE." : "GAME OVER."}</h1>

          <h2 className="ng-winner-name">
            {winner?.tie ? "DRAW" : `${winner?.guesserName} WINS!`}
          </h2>

          <div className="ng-result-times">
            {results.map((result, index) => (
              <div
                className={`ng-result-time ${
                  winner && !winner.tie &&
                  winner.guesserId === result.guesserId
                    ? "winner"
                    : ""
                } ${!result.solved ? "timeout" : ""}`}
                key={`${result.guesserId}-${index}`}
              >
                <span>
                  {result.guesserName}
                  {!result.solved ? " · TIME OUT" : " · SOLVED"}
                </span>
                <strong>{formatTime(result.time)}</strong>
              </div>
            ))}
          </div>

          <p className="ng-intermission-copy">
            {winner?.tie
              ? "Both players recorded the same time."
              : "Both turns are complete. The lower recorded time wins."}
          </p>

          <button className="ng-primary" onClick={playAgain}>
            PLAY AGAIN 
          </button>
        </section>
      )}
    </main>
  );
}
