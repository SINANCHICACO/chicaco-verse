import { useState } from "react";
import "./FlipTen.css";

function FlipTen() {
    const [playerCount, setPlayerCount] = useState(2);

    const [players, setPlayers] = useState([
        "",
        "",
    ]);

    const [showInstructions, setShowInstructions] =
        useState(false);

    const changePlayerCount = (amount) => {
        const newCount = Math.min(
            6,
            Math.max(2, playerCount + amount)
        );

        setPlayerCount(newCount);

        setPlayers((currentPlayers) => {
            const updatedPlayers = [...currentPlayers];

            if (newCount > updatedPlayers.length) {
                while (updatedPlayers.length < newCount) {
                    updatedPlayers.push("");
                }
            } else {
                updatedPlayers.length = newCount;
            }

            return updatedPlayers;
        });
    };

    const updatePlayerName = (index, value) => {
        setPlayers((currentPlayers) => {
            const updatedPlayers = [...currentPlayers];

            updatedPlayers[index] = value;

            return updatedPlayers;
        });
    };

    const startGame = () => {
        const finalPlayers = players.map((name, index) => {
            const trimmedName = name.trim();

            return trimmedName || `Player ${index + 1}`;
        });

        // Save players for this browser session
        sessionStorage.setItem(
            "chicacoVersePlayers",
            JSON.stringify(finalPlayers)
        );

        // Go to the actual FLIPTEN game screen
        window.location.href = "/games/flipten/game";
    };

    return (
        <main className="flipten-setup">

            {/* HEADER */}

            <header className="flipten-header">

                <button
                    className="flipten-back"
                    onClick={() => {
                        window.location.href = "/";
                    }}
                    aria-label="Back to home"
                >
                    <img
                        src="/images/back-arrow.png"
                        alt="Back"
                    />
                </button>

                <div className="flipten-title">
                    FLIPTEN
                </div>

                <button
                    className="flipten-info"
                    onClick={() =>
                        setShowInstructions(true)
                    }
                    aria-label="How to play"
                >
                    i
                </button>

            </header>


            {/* MAIN */}

            <section className="flipten-setup-content">

                <p className="flipten-subtitle">
                    A CARD GAME OF LUCK & MEMORY
                </p>

                <h1>
                    WHO'S PLAYING?
                </h1>


                {/* PLAYER COUNT */}

                <div className="player-count-section">

                    <span className="section-label">
                        PLAYERS
                    </span>

                    <div className="player-counter">

                        <button
                            type="button"
                            onClick={() =>
                                changePlayerCount(-1)
                            }
                            disabled={playerCount === 2}
                        >
                            −
                        </button>

                        <span>
                            {playerCount}
                        </span>

                        <button
                            type="button"
                            onClick={() =>
                                changePlayerCount(1)
                            }
                            disabled={playerCount === 6}
                        >
                            +
                        </button>

                    </div>

                </div>


                {/* PLAYER NAMES */}

                <div className="player-list">

                    {players.map((name, index) => (

                        <div
                            className="player-input-row"
                            key={index}
                        >

                            <div
                                className={`player-color player-color-${index + 1}`}
                            />

                            <div className="player-number">
                                P{index + 1}
                            </div>

                            <input
                                type="text"
                                value={name}
                                maxLength={15}
                                placeholder={`Player ${index + 1}`}
                                onChange={(event) =>
                                    updatePlayerName(
                                        index,
                                        event.target.value
                                    )
                                }
                            />

                        </div>

                    ))}

                </div>


                {/* START GAME */}

                <button
                    className="flipten-start"
                    onClick={startGame}
                >
                    START GAME
                    <span>→</span>
                </button>

            </section>


            {/* INSTRUCTIONS MODAL */}

            {showInstructions && (

                <div
                    className="instruction-overlay"
                    onClick={() =>
                        setShowInstructions(false)
                    }
                >

                    <div
                        className="instruction-box"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="instruction-close"
                            onClick={() =>
                                setShowInstructions(false)
                            }
                            aria-label="Close instructions"
                        >
                            ×
                        </button>

                        <h2>
                            HOW TO PLAY
                        </h2>

                        <div className="instruction-content">

                            <p>
                                Each player gets 10 hidden cards.
                            </p>

                            <p>
                                Draw a card to reveal the
                                corresponding position.
                            </p>

                            <p>
                                Find all 10 positions before
                                everyone else.
                            </p>

                            <p>
                                <strong>SKIP</strong> skips the
                                next player's turn.
                            </p>

                            <p>
                                Get the same number again and
                                your turn ends.
                            </p>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}

export default FlipTen;