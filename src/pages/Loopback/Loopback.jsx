import { useState } from "react";
import "./Loopback.css";

function Loopback() {
    const [players, setPlayers] = useState([
        "",
        "",
    ]);

    const [showInstructions, setShowInstructions] =
        useState(false);

    const updatePlayerName = (index, value) => {
        setPlayers((currentPlayers) => {
            const updatedPlayers = [...currentPlayers];

            updatedPlayers[index] = value;

            return updatedPlayers;
        });
    };

    const startGame = () => {
        const finalPlayers = players.map(
            (name, index) => {
                const trimmedName = name.trim();

                return (
                    trimmedName ||
                    `Player ${index + 1}`
                );
            }
        );

        sessionStorage.setItem(
            "loopbackPlayers",
            JSON.stringify(finalPlayers)
        );

        window.location.href =
            "/games/loopback/game";
    };

    return (
        <main className="loopback-setup">

            {/* HEADER */}

            <header className="loopback-header">

                <button
                    className="loopback-back"
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

                <div className="loopback-title">
                    LOOPBACK
                </div>

                <button
                    className="loopback-info"
                    onClick={() =>
                        setShowInstructions(true)
                    }
                    aria-label="How to play"
                >
                    i
                </button>

            </header>


            {/* CONTENT */}

            <section className="loopback-setup-content">

                <p className="loopback-subtitle">
                    DRAW • MOVE • LOOP BACK
                </p>

                <h1>
                    WHO'S PLAYING?
                </h1>


                <div className="loopback-player-list">

                    {/* PLAYER 1 */}

                    <div className="loopback-player-row">

                        <div className="loopback-player-color loopback-red" />

                        <div className="loopback-player-number">
                            P1
                        </div>

                        <input
                            type="text"
                            value={players[0]}
                            maxLength={15}
                            placeholder="Player 1"
                            onChange={(event) =>
                                updatePlayerName(
                                    0,
                                    event.target.value
                                )
                            }
                        />

                    </div>


                    {/* PLAYER 2 */}

                    <div className="loopback-player-row">

                        <div className="loopback-player-color loopback-blue" />

                        <div className="loopback-player-number">
                            P2
                        </div>

                        <input
                            type="text"
                            value={players[1]}
                            maxLength={15}
                            placeholder="Player 2"
                            onChange={(event) =>
                                updatePlayerName(
                                    1,
                                    event.target.value
                                )
                            }
                        />

                    </div>

                </div>


                <button
                    className="loopback-start"
                    onClick={startGame}
                >
                    START GAME
                    <span>→</span>
                </button>

            </section>


            {/* INSTRUCTIONS */}

            {showInstructions && (

                <div
                    className="loopback-instruction-overlay"
                    onClick={() =>
                        setShowInstructions(false)
                    }
                >

                    <div
                        className="loopback-instruction-box"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >

                        <button
                            className="loopback-instruction-close"
                            onClick={() =>
                                setShowInstructions(false)
                            }
                        >
                            ×
                        </button>

                        <h2>
                            HOW TO PLAY
                        </h2>

                        <div className="loopback-instruction-content">

                            <p>
                                Two players race from the
                                middle toward their own finish.
                            </p>

                            <p>
                                Draw a number and move the
                                <strong> O </strong>
                                that many spaces.
                            </p>

                            <p>
                                <strong>X</strong> ends your
                                chance immediately.
                            </p>

                            <p>
                                The path can send the
                                <strong> O </strong>
                                backward.
                            </p>

                            <p>
                                Reach your finish first to win.
                            </p>

                        </div>

                    </div>

                </div>

            )}

        </main>
    );
}

export default Loopback;