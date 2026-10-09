
import { useCallback, useEffect, useRef, useState } from "react";
import "./ColorGuess.css";

const INTRO_MS = 2000;
const MEMORY_MS = 2000;
const ROLL_MS = 1700;

const clamp = (value, min, max) =>
    Math.min(max, Math.max(min, value));

const hslToCss = ({ h, s, l }) =>
    `hsl(${h}, ${s}%, ${l}%)`;

const hslToRgb = ({ h, s, l }) => {
    h = ((h % 360) + 360) % 360;
    s /= 100;
    l /= 100;

    const chroma = (1 - Math.abs(2 * l - 1)) * s;
    const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - chroma / 2;

    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) [r, g, b] = [chroma, x, 0];
    else if (h < 120) [r, g, b] = [x, chroma, 0];
    else if (h < 180) [r, g, b] = [0, chroma, x];
    else if (h < 240) [r, g, b] = [0, x, chroma];
    else if (h < 300) [r, g, b] = [x, 0, chroma];
    else [r, g, b] = [chroma, 0, x];

    return [
        Math.round((r + m) * 255),
        Math.round((g + m) * 255),
        Math.round((b + m) * 255),
    ];
};

const rgbToLab = ([r, g, b]) => {
    const linearize = (value) => {
        value /= 255;
        return value <= 0.04045
            ? value / 12.92
            : ((value + 0.055) / 1.055) ** 2.4;
    };

    r = linearize(r);
    g = linearize(g);
    b = linearize(b);

    const x =
        (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) /
        0.95047;

    const y =
        r * 0.2126729 + g * 0.7151522 + b * 0.072175;

    const z =
        (r * 0.0193339 + g * 0.119192 + b * 0.9503041) /
        1.08883;

    const f = (value) =>
        value > 0.0088564517
            ? Math.cbrt(value)
            : 7.787037 * value + 16 / 116;

    const fx = f(x);
    const fy = f(y);
    const fz = f(z);

    return [
        116 * fy - 16,
        500 * (fx - fy),
        200 * (fy - fz),
    ];
};

const colorAccuracy = (original, guess) => {
    const a = rgbToLab(hslToRgb(original));
    const b = rgbToLab(hslToRgb(guess));

    const distance = Math.sqrt(
        (a[0] - b[0]) ** 2 +
        (a[1] - b[1]) ** 2 +
        (a[2] - b[2]) ** 2
    );

    return Math.round(clamp(100 - distance, 0, 100));
};

const makeRandomColor = (previous = []) => {
    for (let attempt = 0; attempt < 500; attempt++) {
        const candidate = {
            h: Math.floor(Math.random() * 360),
            s: 35 + Math.floor(Math.random() * 66),
            l: 20 + Math.floor(Math.random() * 61),
        };

        if (
            previous.every(
                (color) => colorAccuracy(color, candidate) < 88
            )
        ) {
            return candidate;
        }
    }

    return {
        h: Math.floor(Math.random() * 360),
        s: 80,
        l: 45,
    };
};

const initialGuess = () => ({
    h: 180,
    s: 50,
    l: 50,
});

const readPlayers = () => {
    try {
        const stored =
            sessionStorage.getItem("loopbackPlayers") ||
            sessionStorage.getItem("chicacoVersePlayers");

        if (stored) {
            const parsed = JSON.parse(stored);

            if (Array.isArray(parsed) && parsed.length >= 2) {
                const getName = (player, index) => {
                    if (typeof player === "string") return player;
                    if (player && typeof player === "object") {
                        return player.name || `Player ${index + 1}`;
                    }
                    return `Player ${index + 1}`;
                };

                return [
                    getName(parsed[0], 0),
                    getName(parsed[1], 1),
                ];
            }
        }
    } catch {
        // Use default player names.
    }

    return ["Player 1", "Player 2"];
};

function ColorGuess() {
    const [players] = useState(readPlayers);

    const [phase, setPhase] = useState("start");
    const [currentPlayer, setCurrentPlayer] = useState(0);

    const [targets, setTargets] = useState([]);
    const [guess, setGuess] = useState(initialGuess);
    const [scores, setScores] = useState([null, null]);

    const [currentScore, setCurrentScore] = useState(null);
    const [remainingMs, setRemainingMs] = useState(0);

    const [rollingColor, setRollingColor] = useState({
        h: 0,
        s: 100,
        l: 50,
    });

    const [introText, setIntroText] = useState("");
    const [finalWinner, setFinalWinner] = useState(null);

    const runId = useRef(0);
    const timers = useRef([]);

    const clearTimers = useCallback(() => {
        timers.current.forEach((timer) => {
            clearTimeout(timer);
            clearInterval(timer);
        });

        timers.current = [];
    }, []);

    useEffect(() => {
        return () => {
            runId.current += 1;
            clearTimers();
        };
    }, [clearTimers]);

    const sleep = useCallback((ms) => {
        return new Promise((resolve) => {
            const timer = setTimeout(resolve, ms);
            timers.current.push(timer);
        });
    }, []);

    const runPlayer = useCallback(
        async (playerIndex, existingTargets = []) => {
            clearTimers();

            const thisRun = ++runId.current;

            setCurrentPlayer(playerIndex);
            setCurrentScore(null);
            setGuess(initialGuess());
            setPhase("playerIntro");
            setIntroText(`${players[playerIndex]} START!`);

            await sleep(INTRO_MS);
            if (runId.current !== thisRun) return;

            // Color-roll animation.
            setPhase("rolling");

            const rollStart = performance.now();

            await new Promise((resolve) => {
                const timer = setInterval(() => {
                    if (runId.current !== thisRun) {
                        clearInterval(timer);
                        resolve();
                        return;
                    }

                    setRollingColor(makeRandomColor(existingTargets));

                    if (performance.now() - rollStart >= ROLL_MS) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 65);

                timers.current.push(timer);
            });

            if (runId.current !== thisRun) return;

            const target = makeRandomColor(existingTargets);
            const updatedTargets = [...existingTargets, target];

            setTargets(updatedTargets);
            setRollingColor(target);
            setPhase("memory");

            // Memorize the original color.
            const memoryStart = performance.now();

            await new Promise((resolve) => {
                const timer = setInterval(() => {
                    if (runId.current !== thisRun) {
                        clearInterval(timer);
                        resolve();
                        return;
                    }

                    const remaining = Math.max(
                        0,
                        MEMORY_MS - (performance.now() - memoryStart)
                    );

                    setRemainingMs(remaining);

                    if (remaining <= 0) {
                        clearInterval(timer);
                        resolve();
                    }
                }, 10);

                timers.current.push(timer);
            });

            if (runId.current !== thisRun) return;

            // Countdown.
            const countdownWords = [
                { word: "READY", h: 332 },
                { word: "SET", h: 232 },
                { word: "GO", h: 0 },
            ];

            for (const item of countdownWords) {
                setIntroText(item.word);

                setRollingColor({
                    h: item.h,
                    s: 55,
                    l: 30,
                });

                setPhase("countdown");

                await sleep(650);
                if (runId.current !== thisRun) return;
            }

            setIntroText("RECREATE THE COLOR");
            setPhase("recreateIntro");

            await sleep(INTRO_MS);
            if (runId.current !== thisRun) return;

            setGuess(initialGuess());
            setPhase("guess");
        },
        [clearTimers, players, sleep]
    );

    const beginGame = () => {
        setTargets([]);
        setScores([null, null]);
        setFinalWinner(null);

        runPlayer(0, []);
    };

    const updateGuess = (key, value) => {
        setGuess((previous) => ({
            ...previous,
            [key]: Number(value),
        }));
    };

    const finishGuess = () => {
        if (phase !== "guess") return;

        const original = targets[currentPlayer];
        if (!original) return;

        const score = colorAccuracy(original, guess);

        setScores((previous) => {
            const updated = [...previous];
            updated[currentPlayer] = score;
            return updated;
        });

        setCurrentScore(score);
        setPhase("result");
    };

    const nextPlayer = () => {
        if (currentPlayer === 0) {
            runPlayer(1, targets);
            return;
        }

        const [first, second] = scores;

        if (first === second) {
            setFinalWinner("tie");
        } else {
            setFinalWinner(first > second ? 0 : 1);
        }

        setPhase("final");
    };

    const goHome = () => {
        window.location.href = "/";
    };

    const originalColor = targets[currentPlayer] || rollingColor;
    const guessedCss = hslToCss(guess);
    const originalCss = hslToCss(originalColor);

    const resultMessage =
        currentScore < 80
            ? "OOPS!"
            : currentScore < 90
                ? "ALMOST!"
                : currentScore < 99
                    ? "PERFECT!"
                    : "YOU'RE AN ARTIST!";

    const resultSubtitle =
        currentScore < 80
            ? "That color got away from you."
            : currentScore < 90
                ? "You're getting close!"
                : currentScore < 99
                    ? "Beautifully matched."
                    : "Your eyes are incredible.";

    return (
        <main className={`cg-game cg-phase-${phase}`}>
            {phase === "start" && (
                <section className="cg-start">
                    <header className="cg-corners">
                        <span>COLOR BLIND?</span>
                        <span>2 PLAYERS</span>
                    </header>

                    <div className="cg-start-center">
                        <p>LOOK CLOSELY. TRUST YOUR EYES.</p>
                        <h1>GUESS</h1>

                        <div className="cg-player-pills">
                            <span>
                                <i className="cg-dot cg-dot-one" />
                                {players[0]}
                            </span>

                            <span>
                                <i className="cg-dot cg-dot-two" />
                                {players[1]}
                            </span>
                        </div>

                        <button
                            className="cg-button cg-start-button"
                            onClick={beginGame}
                        >
                            GUESS THE COLOR <span>→</span>
                        </button>
                    </div>

                    <footer className="cg-footer-note">
                        ONE COLOR. TWO PLAYERS. WHO HAS THE BETTER EYE?
                    </footer>
                </section>
            )}

            {(phase === "playerIntro" ||
                phase === "countdown" ||
                phase === "recreateIntro") && (
                <section
                    className={`cg-interstitial ${
                        phase === "countdown" ? "cg-countdown-screen" : ""
                    }`}
                    style={{
                        backgroundColor:
                            phase === "countdown"
                                ? hslToCss(rollingColor)
                                : "#17151b",
                    }}
                >
                    <div className="cg-round-label">
                        ROUND {currentPlayer + 1} / 2
                    </div>

                    {phase === "playerIntro" && (
                        <div className="cg-big-message cg-pop-in">
                            <small>GET READY</small>
                            <h1>{introText}</h1>
                        </div>
                    )}

                    {phase === "countdown" && (
                        <h1 className="cg-countdown-word" key={introText}>
                            {introText}
                        </h1>
                    )}

                    {phase === "recreateIntro" && (
                        <div className="cg-big-message cg-recreate-message">
                            <h1>RECREATE<br />THE COLOR.</h1>
                            <p>
                                Adjust the controls to match what you remember.
                            </p>
                        </div>
                    )}
                </section>
            )}

            {phase === "rolling" && (
                <section
                    className="cg-color-roll"
                    style={{ backgroundColor: hslToCss(rollingColor) }}
                >
                    <div className="cg-roll-label">
                        ROUND {currentPlayer + 1} / 2
                    </div>
                    <div className="cg-roll-indicator">
                        MEMORIZE THIS COLOR
                    </div>
                </section>
            )}

            {phase === "memory" && (
                <section
                    className="cg-memory-screen"
                    style={{ backgroundColor: originalCss }}
                >
                    <div className="cg-memory-top">
                        <span>{currentPlayer + 1} / 2</span>
                        <span>{players[currentPlayer]}</span>
                    </div>

                    <div className="cg-memory-timer">
                        <strong>
                            {(remainingMs / 1000).toFixed(2)}
                        </strong>
                        <span>Seconds to remember</span>
                    </div>
                </section>
            )}

            {/* FULL-SCREEN COLOR SELECTOR */}
            {phase === "guess" && (
                <section
                    className="cg-guess-screen"
                    style={{ backgroundColor: guessedCss }}
                >
                    <header className="cg-guess-header">
                        <div>
                            <small>{players[currentPlayer]}'S TURN</small>
                        </div>

                        <span>{currentPlayer + 1} / 2</span>
                    </header>

                    <div className="cg-guess-center-label">
                        <span>YOUR COLOR</span>
                        <strong>{guessedCss.toUpperCase()}</strong>
                    </div>

                    {/* Horizontal sliders sit directly on the color screen */}
                    <div className="cg-controls">
                        <HorizontalColorControl
                            label="HUE"
                            value={guess.h}
                            max={359}
                            valueLabel={`${guess.h}°`}
                            track="hue"
                            hue={guess.h}
                            saturation={guess.s}
                            lightness={guess.l}
                            onChange={(value) => updateGuess("h", value)}
                        />

                        <HorizontalColorControl
                            label="SATURATION"
                            value={guess.s}
                            max={100}
                            valueLabel={`${guess.s}%`}
                            track="saturation"
                            hue={guess.h}
                            saturation={guess.s}
                            lightness={guess.l}
                            onChange={(value) => updateGuess("s", value)}
                        />

                        <HorizontalColorControl
                            label="LIGHTNESS"
                            value={guess.l}
                            max={100}
                            valueLabel={`${guess.l}%`}
                            track="lightness"
                            hue={guess.h}
                            saturation={guess.s}
                            lightness={guess.l}
                            onChange={(value) => updateGuess("l", value)}
                        />
                    </div>

                    <button
                        className="cg-button cg-done-button"
                        onClick={finishGuess}
                    >
                        DONE 
                    </button>
                </section>
            )}

            {phase === "result" && (
                <section className="cg-result-screen">
                    <header className="cg-result-header">
                        <span>{players[currentPlayer]}'S RESULT</span>
                        <span>{currentPlayer + 1} / 2</span>
                    </header>

                    <div className="cg-result-title">
                        <h1>{resultMessage}</h1>
                        <p>{resultSubtitle}</p>
                    </div>

                    <div className="cg-comparison">
                        <div
                            className="cg-comparison-half cg-original-half"
                            style={{ backgroundColor: originalCss }}
                        >
                            <span>ORIGINAL COLOR</span>
                        </div>

                        <div className="cg-comparison-divider">VS</div>

                        <div
                            className="cg-comparison-half cg-guess-half"
                            style={{ backgroundColor: guessedCss }}
                        >
                            <span>YOUR GUESS</span>
                        </div>
                    </div>

                    <div className="cg-score-block">
                        <strong>{currentScore}%</strong>
                        <span>COLOR ACCURACY</span>
                    </div>

                    <div className="cg-scoreboard">
                        <span>
                            {players[0]} <b>{scores[0] ?? "—"}%</b>
                        </span>
                        <span>
                            {players[1]} <b>{scores[1] ?? "—"}%</b>
                        </span>
                    </div>

                    <button
                        className="cg-button cg-next-button"
                        onClick={nextPlayer}
                    >
                        {currentPlayer === 0
                            ? "NEXT PLAYER"
                            : "SHOW WINNER"}
                        <span>→</span>
                    </button>
                </section>
            )}

            {phase === "final" && (
                <section className="cg-final-screen">
                    <div className="cg-final-eyebrow">
                        COLOR GUESS · FINAL RESULTS
                    </div>

                    {finalWinner === "tie" ? (
                        <>
                            <p className="cg-final-kicker">SAME EYES?</p>
                            <h1>IT'S A TIE!</h1>
                            <p>Both players matched the color equally well.</p>
                        </>
                    ) : (
                        <>
                            <p className="cg-final-kicker">
                                THE WINNER IS
                            </p>
                            <h1 className="cg-winner-name">
                                {players[finalWinner]}
                            </h1>
                            <div className="cg-winner-score">
                                {scores[finalWinner]}%
                            </div>
                            <p>THE SHARPEST EYE IN THE ROOM.</p>
                        </>
                    )}

                    <div className="cg-final-scores">
                        {players.map((player, index) => (
                            <div
                                className={`cg-final-player ${
                                    finalWinner === index ? "is-winner" : ""
                                }`}
                                key={`${player}-${index}`}
                            >
                                <span
                                    className={`cg-dot cg-dot-${index + 1}`}
                                />
                                <span>{player}</span>
                                <strong>{scores[index]}%</strong>
                                {finalWinner === index && <b>WINNER</b>}
                            </div>
                        ))}
                    </div>

                    <button
                        className="cg-button cg-start-button"
                        onClick={beginGame}
                    >
                        PLAY AGAIN <span>↻</span>
                    </button>

                    <button className="cg-home-button" onClick={goHome}>
                        BACK TO CHICACO VERSE
                    </button>
                </section>
            )}
        </main>
    );
}

function HorizontalColorControl({
    label,
    value,
    max,
    valueLabel,
    track,
    hue,
    saturation,
    lightness,
    onChange,
}) {
    let gradient;

    if (track === "hue") {
        gradient =
            "linear-gradient(to right, #ff0000 0%, #ffff00 16.66%, #00ff00 33.33%, #00ffff 50%, #0000ff 66.66%, #ff00ff 83.33%, #ff0000 100%)";
    } else if (track === "saturation") {
        gradient = `linear-gradient(to right, hsl(${hue}, 0%, ${lightness}%), hsl(${hue}, 100%, ${lightness}%))`;
    } else {
        gradient = `linear-gradient(to right, hsl(${hue}, ${saturation}%, 0%), hsl(${hue}, ${saturation}%, 50%), hsl(${hue}, ${saturation}%, 100%))`;
    }

    return (
        <div className="cg-control">
            <div className="cg-control-heading">
                <label>{label}</label>
                <strong>{valueLabel}</strong>
            </div>

            <input
                className={`cg-range cg-range-${track}`}
                type="range"
                min="0"
                max={max}
                step="1"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                aria-label={label}
                style={{
                    "--cg-track-gradient": gradient,
                    "--cg-range-position": `${(value / max) * 100}%`,
                }}
            />
        </div>
    );
}

export default ColorGuess;
