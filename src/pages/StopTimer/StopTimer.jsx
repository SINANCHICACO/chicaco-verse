import { useEffect, useRef, useState } from "react";
import "./StopTimer.css";

const COLORS = [
    "#ff5b5b",
    "#41c9a8",
    "#ffd166",
    "#7c83fd",
    "#ff8ac6",
    "#56b4e9",
    "#f08a4b",
    "#b8de6f",
    "#c792ea",
    "#f4d35e",
];

function formatTime(ms) {
    const centiseconds = Math.floor(ms / 10);
    const minutes = Math.floor(centiseconds / 6000);
    const seconds = Math.floor((centiseconds % 6000) / 100);
    const hundredths = centiseconds % 100;

    return `${String(minutes).padStart(2, "0")}.${String(
        seconds
    ).padStart(2, "0")}.${String(hundredths).padStart(2, "0")}`;
}

function beep() {
    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        const audioContext = new AudioContextClass();
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 880;

        gain.gain.setValueAtTime(0.001, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.15,
            audioContext.currentTime + 0.015
        );
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.2
        );

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.21);
        oscillator.onended = () => audioContext.close();
    } catch {
        // The game continues if audio is unavailable.
    }
}

function makePlayer(name, index) {
    return {
        id: `${Date.now()}-${Math.random()}`,
        name,
        color: COLORS[index % COLORS.length],
        time: null,
        difference: null,
    };
}

export default function StopTimer() {
    const [screen, setScreen] = useState("setup");
    const [nameInput, setNameInput] = useState("");
    const [players, setPlayers] = useState([]);
    const [target, setTarget] = useState(0);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showTimer, setShowTimer] = useState(false);
    const [running, setRunning] = useState(false);
    const [elapsed, setElapsed] = useState(0);
    const [result, setResult] = useState(null);

    const startRef = useRef(0);
    const rafRef = useRef(null);
    const nameCounterRef = useRef(1);
    const screenRef = useRef("setup");

    const currentPlayer = players[currentIndex];
    const finished = players.filter(
        (player) => player.time !== null
    ).length;

    const ranked = [...players]
        .filter((player) => player.time !== null)
        .sort((a, b) => a.difference - b.difference);

    const playerColor = currentPlayer?.color || COLORS[0];

    function changeScreen(nextScreen) {
        screenRef.current = nextScreen;
        setScreen(nextScreen);
    }

    useEffect(() => {
        if (!running) return undefined;

        let animationFrame;

        function tick() {
            setElapsed(performance.now() - startRef.current);
            animationFrame = requestAnimationFrame(tick);
        }

        animationFrame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(animationFrame);
    }, [running]);

    useEffect(() => {
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    function addPlayer(event) {
        event?.preventDefault();

        if (players.length >= 10) return;

        // An empty name automatically becomes Player 1, Player 2, etc.
        let name = nameInput.trim();

        if (!name) {
            const usedNames = new Set(
                players.map((player) => player.name.toLowerCase())
            );

            while (
                usedNames.has(
                    `player ${nameCounterRef.current}`.toLowerCase()
                )
            ) {
                nameCounterRef.current += 1;
            }

            name = `Player ${nameCounterRef.current}`;
            nameCounterRef.current += 1;
        }

        // Give duplicate names a unique automatic name instead of an error.
        if (
            players.some(
                (player) =>
                    player.name.toLowerCase() === name.toLowerCase()
            )
        ) {
            const usedNames = new Set(
                players.map((player) => player.name.toLowerCase())
            );

            while (
                usedNames.has(
                    `player ${nameCounterRef.current}`.toLowerCase()
                )
            ) {
                nameCounterRef.current += 1;
            }

            name = `Player ${nameCounterRef.current}`;
            nameCounterRef.current += 1;
        }

        setPlayers((previous) => [
            ...previous,
            makePlayer(name, previous.length),
        ]);

        setNameInput("");
    }

    function removePlayer(id) {
        setPlayers((previous) =>
            previous
                .filter((player) => player.id !== id)
                .map((player, index) => ({
                    ...player,
                    color: COLORS[index % COLORS.length],
                }))
        );
    }

    function startGame() {
        if (players.length < 2) return;

        // If the player list is empty, create two default players.
        let readyPlayers = [...players];

        if (readyPlayers.length === 0) {
            readyPlayers = [
                makePlayer("Player 1", 0),
                makePlayer("Player 2", 1),
            ];
            nameCounterRef.current = 3;
        } else if (readyPlayers.length === 1) {
            readyPlayers.push(makePlayer("Player 2", 1));
            nameCounterRef.current = Math.max(
                nameCounterRef.current,
                3
            );
        }

        setPlayers(
            readyPlayers.map((player, index) => ({
                ...player,
                color: COLORS[index % COLORS.length],
                time: null,
                difference: null,
            }))
        );

        setTarget(Math.floor(Math.random() * 10) + 1);
        setCurrentIndex(0);
        setElapsed(0);
        setResult(null);
        setRunning(false);
        changeScreen("game");
    }

    function toggleTimer() {
        if (!currentPlayer || result) return;

        if (!running) {
            startRef.current = performance.now();
            setElapsed(0);
            setRunning(true);
            beep();
            return;
        }

        const time = performance.now() - startRef.current;
        const difference = Math.abs(time / 1000 - target);

        setElapsed(time);
        setRunning(false);

        setPlayers((previous) =>
            previous.map((player, index) =>
                index === currentIndex
                    ? { ...player, time, difference }
                    : player
            )
        );

        setResult({
            time,
            difference,
        });
    }

    function nextPlayer() {
        if (currentIndex >= players.length - 1) {
            setRunning(false);
            changeScreen("leaderboard");
            return;
        }

        setCurrentIndex((index) => index + 1);
        setElapsed(0);
        setResult(null);
        setRunning(false);
    }

    function rematch() {
        setPlayers((previous) =>
            previous.map((player) => ({
                ...player,
                time: null,
                difference: null,
            }))
        );

        setTarget(Math.floor(Math.random() * 10) + 1);
        setCurrentIndex(0);
        setElapsed(0);
        setResult(null);
        setRunning(false);
        changeScreen("game");
    }

    function newGame() {
        setPlayers([]);
        setNameInput("");
        setTarget(0);
        setCurrentIndex(0);
        setElapsed(0);
        setResult(null);
        setRunning(false);
        nameCounterRef.current = 1;
        changeScreen("setup");
    }

    return (
        <main
            className="stop-timer-page"
            style={{
                "--player-color": playerColor,
                "--accent": playerColor,
            }}
        >
            <header className="st-topbar">
                <button
                    className="st-home"
                    type="button"
                    onClick={() => {
                        window.location.href = "/";
                    }}
                    aria-label="Exit to home page"
                >
                    EXIT ×
                </button>

                <div className="st-brand">
                    CHICACO <span>VERSE</span>
                </div>

                <div className="st-label">REACTION GAME</div>
            </header>

            {screen === "setup" && (
                <section className="st-panel st-setup-screen">
                    <div className="st-eyebrow">THE TIMING CHALLENGE</div>

                    <h1>
                        STOP THE <span>TIMER.</span>
                    </h1>

                    <p className="st-lead">
                        Trust your instincts. Stop as close to the target as
                        possible.
                    </p>

                    <div className="st-setup-grid">
                        <div className="st-box">
                            <h2>
                                Players <small>{players.length}/10</small>
                            </h2>

                            <form
                                className="st-add"
                                onSubmit={addPlayer}
                                autoComplete="off"
                            >
                                <input
                                    type="text"
                                    value={nameInput}
                                    onChange={(event) =>
                                        setNameInput(event.target.value)
                                    }
                                    maxLength={24}
                                    placeholder="Name or leave blank"
                                    aria-label="Player name"
                                    autoComplete="off"
                                    autoCorrect="off"
                                    spellCheck={false}
                                    enterKeyHint="done"
                                />

                                <button
                                    type="submit"
                                    disabled={players.length >= 10}
                                >
                                    ADD +
                                </button>
                            </form>

                            <div className="st-player-list">
                                {players.map((player, index) => (
                                    <div
                                        className="st-player"
                                        key={player.id}
                                        style={{ "--row-color": player.color }}
                                    >
                                        <i />

                                        <small>
                                            {String(index + 1).padStart(2, "0")}
                                        </small>

                                        <strong>{player.name}</strong>

                                        <button
                                            type="button"
                                            aria-label={`Remove ${player.name}`}
                                            onClick={() => removePlayer(player.id)}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <aside className="st-box st-settings">
                            <h2>Game settings</h2>

                            <div className="st-setting">
                                <div>
                                    <strong>Show timer</strong>
                                    <small>
                                        Display the live clock while playing
                                    </small>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={showTimer}
                                    aria-label="Show timer"
                                    className={`st-toggle ${showTimer ? "on" : ""}`}
                                    onClick={() =>
                                        setShowTimer((value) => !value)
                                    }
                                >
                                    <i />
                                </button>
                            </div>
                        </aside>
                    </div>

                    <div className="st-setup-footer">
                        <small>
                            {players.length}/10 PLAYERS ADDED
                        </small>

                        <button
                            className="st-primary"
                            type="button"
                            onClick={startGame}
                            disabled={players.length < 2}
                        >
                            START GAME
                        </button>
                    </div>
                </section>
            )}

            {screen === "game" && currentPlayer && (
                <section
                    className="st-panel st-game"
                    style={{
                        "--player-color": currentPlayer.color,
                        "--accent": currentPlayer.color,
                    }}
                >
                    <div className="st-game-heading">
                        <div>
                            <div className="st-eyebrow">
                                PLAYER {currentIndex + 1} OF {players.length}
                            </div>

                            <h1>
                                YOUR <span>TURN.</span>
                            </h1>
                        </div>

                        <div className="st-progress">
                            {finished}/{players.length} <small>DONE</small>
                        </div>
                    </div>

                    <div className="st-turn-card">
                        <div className="st-player-heading">
                            <i>{currentPlayer.name.slice(0, 1).toUpperCase()}</i>

                            <div>
                                <small>UP NOW</small>
                                <h2>{currentPlayer.name}</h2>
                            </div>

                            <b>PLAYER {currentIndex + 1}</b>
                        </div>

                        <div className="st-target">
                            <small>YOUR TARGET</small>

                            <strong>
                                {String(target).padStart(2, "0")}
                                <em>.00 SEC</em>
                            </strong>

                            <p>Stop as close to this time as you can.</p>
                        </div>

                        <div
                            className={`st-digital ${result ? "st-digital-result" : ""}`}
                            aria-live="off"
                        >
                            {showTimer || result
                                ? formatTime(elapsed)
                                : "••.••.••"}

                            <small>
                                {running
                                    ? "TIMER RUNNING"
                                    : result
                                        ? "FINAL TIME"
                                        : showTimer
                                            ? "MINUTES . SECONDS . CENTISECONDS"
                                            : "TIMER HIDDEN"}
                            </small>
                        </div>

                        {!result ? (
                            <div className="st-button-wrap">
                                <button
                                    type="button"
                                    className={`st-big-button ${running ? "stop" : ""}`}
                                    onClick={toggleTimer}
                                    aria-label={running ? "Stop timer" : "Start timer"}
                                >
                                    <span>{running ? "STOP" : "START"}</span>
                                </button>

                                <p>
                                    {running
                                        ? "FEEL THE TIME. HIT STOP."
                                        : "PRESS START WHEN YOU'RE READY"}
                                </p>
                            </div>
                        ) : (
                            <div className="st-result">
                                <strong>
                                    {result.difference < 0.005
                                        ? "PERFECT STOP!"
                                        : "YOUR TIME IS LOCKED"}
                                </strong>

                                <span>
                                    {result.difference.toFixed(2)}s off target
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="st-game-bottom">
                        <div className="st-track">
                            {players.map((player, index) => (
                                <span
                                    key={player.id}
                                    className={[
                                        index === currentIndex ? "current" : "",
                                        player.time !== null ? "done" : "",
                                    ]
                                        .filter(Boolean)
                                        .join(" ")}
                                    style={{ "--dot": player.color }}
                                >
                                    {player.time !== null ? "✓" : index + 1}
                                </span>
                            ))}
                        </div>

                        {result && (
                            <button
                                className="st-primary"
                                type="button"
                                onClick={nextPlayer}
                            >
                                {currentIndex === players.length - 1
                                    ? "VIEW LEADERBOARD"
                                    : "NEXT PLAYER"}{" "}
                                →
                            </button>
                        )}
                    </div>

                    <p className="st-footnote">
                        ONE SHOT EACH. TRUST YOUR INSTINCTS.
                    </p>
                </section>
            )}

            {screen === "leaderboard" && (
                <section className="st-panel st-leaderboard">
                    <div className="st-eyebrow">GAME COMPLETE</div>

                    <h1 className="st-leader-title">
                        THE <span>LEADERBOARD.</span>
                    </h1>

                    <p className="st-lead">
                        Target: {target.toFixed(2)} seconds. The smallest
                        difference wins.
                    </p>

                    {ranked[0] && (
                        <div
                            className="st-winner"
                            style={{ "--winner-color": ranked[0].color }}
                        >
                            <div className="st-crown">♛</div>

                            <section>
                                <small>CHAMPION</small>
                                <h2>{ranked[0].name}</h2>
                                <p>CLOSEST TO THE TARGET</p>
                            </section>

                            <strong>
                                {ranked[0].difference.toFixed(2)}
                                <small> SEC OFF</small>
                            </strong>
                        </div>
                    )}

                    <div className="st-table">
                        <div className="st-row table-head">
                            <span>RANK / PLAYER</span>
                            <span>STOPPED AT</span>
                            <span>DIFFERENCE</span>
                        </div>

                        {ranked.map((player, index) => (
                            <div
                                className={`st-row st-rank-row ${index === 0 ? "first" : ""}`}
                                key={player.id}
                                style={{
                                    "--row-color": player.color,
                                    "--row-delay": `${index * 130}ms`,
                                }}
                            >
                                <span className="st-rank">
                                    <b>
                                        {index === 0
                                            ? "♛"
                                            : String(index + 1).padStart(2, "0")}
                                    </b>

                                    <i />
                                    <span className="st-rank-name">{player.name}</span>
                                </span>

                                <strong>{formatTime(player.time)}</strong>

                                <strong className="st-diff">
                                    {player.difference.toFixed(2)}s
                                </strong>
                            </div>
                        ))}
                    </div>

                    <div className="st-actions">
                        <button
                            className="st-secondary"
                            type="button"
                            onClick={rematch}
                        >
                            REMATCH ↻
                        </button>

                        <button
                            className="st-primary"
                            type="button"
                            onClick={newGame}
                        >
                            NEW GAME
                        </button>
                    </div>
                </section>
            )}

            <footer className="st-footer">
                <span />
                CHICACO VERSE
                <span />
            </footer>
        </main>
    );
}