
import { useCallback, useEffect, useRef, useState } from "react";
import "./MathGuess.css";

const WIN_SCORE = 7;

function createQuestion() {
  const operations = ["+", "−", "×", "÷"];
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let a;
  let b;
  let answer;

  switch (operation) {
    case "+":
      a = randomInt(10, 99);
      b = randomInt(1, 50);
      answer = a + b;
      break;

    case "−":
      a = randomInt(20, 99);
      b = randomInt(1, a);
      answer = a - b;
      break;

    case "×":
      a = randomInt(2, 12);
      b = randomInt(2, 12);
      answer = a * b;
      break;

    default:
      b = randomInt(2, 12);
      answer = randomInt(2, 12);
      a = b * answer;
      break;
  }

  const choices = new Set([answer]);

  while (choices.size < 3) {
    const offset = randomInt(1, Math.max(5, Math.ceil(answer * 0.35)));
    const wrongAnswer =
      Math.random() < 0.5 ? answer + offset : answer - offset;

    if (wrongAnswer >= 0 && wrongAnswer !== answer) {
      choices.add(wrongAnswer);
    }
  }

  return {
    a,
    b,
    operation,
    answer,
    options: shuffle([...choices]),
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function playSound(type) {
  try {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    const context = new AudioContextClass();
    const now = context.currentTime;

    const notes =
      type === "correct"
        ? [660, 880, 1100]
        : type === "wrong"
          ? [300, 220]
          : type === "win"
            ? [523, 659, 784, 1047]
            : [440];

    notes.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.09;

      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(frequency, start);

      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);

      oscillator.connect(gain);
      gain.connect(context.destination);

      oscillator.start(start);
      oscillator.stop(start + 0.15);
    });

    window.setTimeout(() => context.close(), 1000);
  } catch {
    // Sound is optional.
  }
}

function PlayerSide({
  player,
  score,
  question,
  locked,
  result,
  winner,
  onAnswer,
  position,
}) {
  const isBlue = player === "Blue";
  const isWinner = winner === player;

  return (
    <section
      className={`math-player math-player-${player.toLowerCase()} math-player-${position}`}
      aria-label={`${player} player's side`}
    >
      <div className="math-player-content">
        <header className="math-player-header">
          <div className="math-player-name">
            <span className="math-player-dot" />
            PLAYER {isBlue ? "1" : "2"}
          </div>

          <div className="math-player-score">
            <span className="math-score-number">{score}</span>
            <span className="math-score-label">POINTS</span>
          </div>
        </header>

        <div className="math-progress-track">
          <span
            className="math-progress-fill"
            style={{ width: `${(score / WIN_SCORE) * 100}%` }}
          />
        </div>

        <div className="math-question-area">
          <span className="math-question-label">
            {winner
              ? isWinner
                ? "MATCH WINNER!"
                : "MATCH COMPLETE"
              : locked
                ? "ROUND COMPLETE"
                : "SOLVE THIS"}
          </span>

          <div className="math-equation">
            {question.a} {question.operation} {question.b} = ?
          </div>
        </div>

        <div className="math-answer-grid">
          {question.options.map((option) => {
            const isCorrect = option === question.answer;
            const isSelected = result?.selected === option;

            let stateClass = "";

            if (result && isCorrect) {
              stateClass = "answer-correct";
            } else if (result && isSelected) {
              stateClass = "answer-wrong";
            }

            return (
              <button
                key={option}
                type="button"
                className={`math-answer ${stateClass}`}
                onClick={() => onAnswer(player, option)}
                disabled={locked || Boolean(winner)}
                aria-label={`${player} chooses ${option}`}
              >
                {option}
              </button>
            );
          })}
        </div>

        <div className="math-player-footer">
          {winner
            ? isWinner
              ? "YOU WIN!"
              : "BETTER LUCK NEXT TIME"
            : locked
              ? result?.winner === player
                ? "POINT EARNED!"
                : result?.winner
                  ? "POINT TO OPPONENT"
                  : "NEXT QUESTION..."
              : "TAP ONE ANSWER"}
        </div>
      </div>
    </section>
  );
}

export default function MathGuess() {
  const [question, setQuestion] = useState(createQuestion);
  const [scores, setScores] = useState({ Blue: 0, Red: 0 });
  const [result, setResult] = useState(null);
  const [winner, setWinner] = useState("");
  const [round, setRound] = useState(1);

  const lockedRef = useRef(false);
  const nextRoundTimer = useRef(null);

  const restart = useCallback(() => {
    window.clearTimeout(nextRoundTimer.current);
    lockedRef.current = false;
    setScores({ Blue: 0, Red: 0 });
    setQuestion(createQuestion());
    setResult(null);
    setWinner("");
    setRound(1);
  }, []);

  useEffect(() => {
    return () => window.clearTimeout(nextRoundTimer.current);
  }, []);

  const answerQuestion = useCallback(
    (player, selected) => {
      if (lockedRef.current || winner) return;

      lockedRef.current = true;

      const isCorrect = selected === question.answer;
      const pointWinner = isCorrect
        ? player
        : player === "Blue"
          ? "Red"
          : "Blue";

      const nextScores = {
        ...scores,
        [pointWinner]: scores[pointWinner] + 1,
      };

      setScores(nextScores);

      const nextWinner =
        nextScores.Blue >= WIN_SCORE
          ? "Blue"
          : nextScores.Red >= WIN_SCORE
            ? "Red"
            : "";

      setResult({
        player,
        selected,
        isCorrect,
        winner: pointWinner,
      });

      if (isCorrect) {
        playSound("correct");
      } else {
        playSound("wrong");
      }

      if (nextWinner) {
        setWinner(nextWinner);
        playSound("win");
        return;
      }

      nextRoundTimer.current = window.setTimeout(() => {
        setQuestion(createQuestion());
        setResult(null);
        setRound((previous) => previous + 1);
        lockedRef.current = false;
      }, 1100);
    },
    [question, scores, winner]
  );

  return (
    <main className="math-game">
      <div className="math-game-stage">
        <PlayerSide
          player="Blue"
          score={scores.Blue}
          question={question}
          locked={Boolean(result) || Boolean(winner)}
          result={result}
          winner={winner}
          onAnswer={answerQuestion}
          position="top"
        />

        <div className="math-center-divider">
          <span className="math-center-label">MATH GUESS</span>
          <span className="math-round-label">
            {winner ? "MATCH OVER" : `ROUND ${round}`}
          </span>
          <button
            type="button"
            className="math-restart-button"
            onClick={restart}
            aria-label="Restart match"
            title="Restart match"
          >
            ↻
          </button>
        </div>

        <PlayerSide
          player="Red"
          score={scores.Red}
          question={question}
          locked={Boolean(result) || Boolean(winner)}
          result={result}
          winner={winner}
          onAnswer={answerQuestion}
          position="bottom"
        />

        {winner && (
          <div className="math-winner-overlay" role="dialog" aria-modal="true">
            <div className={`math-winner-card winner-${winner.toLowerCase()}`}>
              <span className="math-winner-kicker">MATCH COMPLETE</span>
              <h1>{winner.toUpperCase()} WINS!</h1>
              <p>
                {scores.Blue} — {scores.Red}
              </p>
              <button type="button" onClick={restart}>
                PLAY AGAIN
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
