import { useEffect, useRef, useState } from "react";
import "./FlipTenGame.css";

/* =========================================================
   CARD COLORS
========================================================= */

const CARD_COLORS = {
    red: "#EF4444",
    blue: "#3B82E8",
    yellow: "#E8C43A",
    green: "#4CAF68",
};


/* =========================================================
   PLAYER COLORS
========================================================= */

const PLAYER_COLORS = [
    "#F04447",
    "#4285E8",
    "#55AD68",
    "#E7C542",
    "#A66BE0",
    "#ED8A45",
];


const EXIT_HOLD_TIME = 3000;
const PLACE_ANIMATION_TIME = 650;


/* =========================================================
   WAIT
========================================================= */

const wait = (ms) =>
    new Promise((resolve) =>
        setTimeout(resolve, ms)
    );


/* =========================================================
   SHUFFLE
========================================================= */

const shuffleArray = (array) => {

    const shuffled = [...array];

    for (
        let i = shuffled.length - 1;
        i > 0;
        i--
    ) {

        const randomIndex =
            Math.floor(
                Math.random() * (i + 1)
            );

        [
            shuffled[i],
            shuffled[randomIndex],
        ] = [
            shuffled[randomIndex],
            shuffled[i],
        ];
    }

    return shuffled;
};


/* =========================================================
   CREATE 44 CARD UNO-STYLE DECK
========================================================= */

const createUnoDeck = () => {

    const deck = [];

    const colors = [
        "red",
        "blue",
        "yellow",
        "green",
    ];


    colors.forEach((color) => {

        for (
            let number = 0;
            number <= 9;
            number++
        ) {

            deck.push({
                type: "number",
                number,
                color,
            });

        }


        deck.push({
            type: "skip",
            number: null,
            color,
        });

    });


    return deck;
};


/* =========================================================
   CREATE PLAYER BOARD
========================================================= */

const createPlayerBoard = () => {

    const deck =
        shuffleArray(
            createUnoDeck()
        );


    return deck
        .slice(0, 10)
        .map((card) => ({
            ...card,
            solved: false,
        }));
};


/* =========================================================
   CREATE DRAW DECK
========================================================= */

const createDrawDeck = () => {

    return shuffleArray(
        createUnoDeck()
    );
};


/* =========================================================
   CONFETTI DATA
========================================================= */

const createConfetti = () => {

    return Array.from(
        { length: 70 },
        (_, index) => ({

            id: index,

            left:
                Math.random() * 100,

            delay:
                Math.random() * 1.5,

            duration:
                2.5 +
                Math.random() * 2,

            rotation:
                Math.random() * 360,

            size:
                7 +
                Math.random() * 8,

            color: [
                "#EF4444",
                "#3B82E8",
                "#E8C43A",
                "#4CAF68",
                "#A66BE0",
                "#ED8A45",
                "#111111",
            ][
                Math.floor(
                    Math.random() * 7
                )
            ],

        })
    );
};


/* =========================================================
   FLIPTEN GAME
========================================================= */

function FlipTenGame() {

    const [players, setPlayers] =
        useState([]);


    const [playerBoards, setPlayerBoards] =
        useState([]);


    const [drawDeck, setDrawDeck] =
        useState([]);


    const [currentPlayer, setCurrentPlayer] =
        useState(0);


    const [activeCard, setActiveCard] =
        useState(null);


    const [targetIndex, setTargetIndex] =
        useState(null);


    const [phase, setPhase] =
        useState("ready");


    const [animatingPosition, setAnimatingPosition] =
        useState(null);


    const [showPopup, setShowPopup] =
        useState(false);


    const [popupTitle, setPopupTitle] =
        useState("");


    const [statusCard, setStatusCard] =
        useState(null);


    const [winner, setWinner] =
        useState(null);


    const [showInstructions, setShowInstructions] =
        useState(false);


    const [isShuffling, setIsShuffling] =
        useState(false);


    const [exitProgress, setExitProgress] =
        useState(0);


    const [confetti, setConfetti] =
        useState([]);


    const exitTimerRef =
        useRef(null);


    const exitIntervalRef =
        useRef(null);


    const initializedRef =
        useRef(false);


    const gameActiveRef =
        useRef(true);


    /* =====================================================
       INITIALIZE
    ===================================================== */

    useEffect(() => {

        gameActiveRef.current = true;


        if (initializedRef.current) {
            return;
        }


        initializedRef.current = true;


        const savedPlayers =
            sessionStorage.getItem(
                "chicacoVersePlayers"
            );


        if (!savedPlayers) {

            window.location.href =
                "/games/flipten";

            return;
        }


        try {

            const parsedPlayers =
                JSON.parse(
                    savedPlayers
                );


            if (
                !Array.isArray(parsedPlayers) ||
                parsedPlayers.length < 2
            ) {

                window.location.href =
                    "/games/flipten";

                return;
            }


            setPlayers(
                parsedPlayers
            );


            setPlayerBoards(
                parsedPlayers.map(() =>
                    createPlayerBoard()
                )
            );


            setDrawDeck(
                createDrawDeck()
            );


        } catch (error) {

            console.error(
                "FLIPTEN error:",
                error
            );


            window.location.href =
                "/games/flipten";

        }


        return () => {

            gameActiveRef.current = false;

            clearTimeout(
                exitTimerRef.current
            );

            clearInterval(
                exitIntervalRef.current
            );

        };

    }, []);


    /* =====================================================
       WINNER CONFETTI
    ===================================================== */

    useEffect(() => {

        if (!winner) {
            return;
        }


        setConfetti(
            createConfetti()
        );


        const timer =
            setTimeout(() => {

                setConfetti(
                    createConfetti()
                );

            }, 4500);


        return () =>
            clearTimeout(timer);

    }, [winner]);


    /* =====================================================
       CURRENT PLAYER COLOR
    ===================================================== */

    const currentPlayerColor =
        PLAYER_COLORS[
            currentPlayer
        ] ||
        PLAYER_COLORS[0];


    /* =====================================================
       EXIT HOLD
    ===================================================== */

    const startExitHold = () => {

        if (
            phase === "animating"
        ) {
            return;
        }


        clearTimeout(
            exitTimerRef.current
        );

        clearInterval(
            exitIntervalRef.current
        );


        setExitProgress(0);


        const startTime =
            Date.now();


        exitIntervalRef.current =
            setInterval(() => {

                const elapsed =
                    Date.now() -
                    startTime;


                const progress =
                    Math.min(
                        elapsed /
                            EXIT_HOLD_TIME,
                        1
                    );


                setExitProgress(
                    progress
                );


                if (
                    progress >= 1
                ) {

                    clearInterval(
                        exitIntervalRef.current
                    );

                }

            }, 30);


        exitTimerRef.current =
            setTimeout(() => {

                clearInterval(
                    exitIntervalRef.current
                );


                setExitProgress(1);


                window.location.href =
                    "/";

            }, EXIT_HOLD_TIME);

    };


    const cancelExitHold = () => {

        clearTimeout(
            exitTimerRef.current
        );

        clearInterval(
            exitIntervalRef.current
        );


        setExitProgress(0);

    };


    /* =====================================================
       DRAW CARD
    ===================================================== */

    const drawCard = () => {

        if (
            phase !== "ready" ||
            winner ||
            drawDeck.length === 0
        ) {
            return;
        }


        const card =
            drawDeck[0];


        setDrawDeck(
            (currentDeck) =>
                currentDeck.slice(1)
        );


        /* =================================================
           SKIP
        ================================================= */

        if (
            card.type === "skip"
        ) {

            setStatusCard(
                card
            );


            setPopupTitle(
                "SKIP"
            );


            setShowPopup(true);


            setPhase(
                "ended"
            );


            setTimeout(() => {

                if (
                    !gameActiveRef.current
                ) {
                    return;
                }


                setShowPopup(false);

                moveToNextPlayer();

            }, 1100);


            return;
        }


        /* =================================================
           NUMBER
        ================================================= */

        const number =
            card.number;


        const board =
            playerBoards[
                currentPlayer
            ];


        const existingCard =
            board[number];


        /*
         * Same number / already solved.
         */

        if (
            existingCard &&
            existingCard.solved
        ) {

            setStatusCard(
                card
            );


            setPopupTitle(
                "SAME NUMBER"
            );


            setShowPopup(true);


            setPhase(
                "ended"
            );


            setTimeout(() => {

                if (
                    !gameActiveRef.current
                ) {
                    return;
                }


                setShowPopup(false);

                moveToNextPlayer();

            }, 1100);


            return;
        }


        setActiveCard(
            card
        );


        setTargetIndex(
            number
        );


        setPopupTitle(
            "DRAWN CARD"
        );


        setShowPopup(true);


        setPhase(
            "placing"
        );

    };


    /* =====================================================
       PLACE CARD
    ===================================================== */

    const placeCard = async () => {

        if (
            phase !== "placing" ||
            !activeCard ||
            activeCard.type !== "number" ||
            targetIndex === null
        ) {
            return;
        }


        const playerIndex =
            currentPlayer;


        const board =
            playerBoards[
                playerIndex
            ];


        const oldCard =
            board[
                targetIndex
            ];


        if (
            !oldCard ||
            oldCard.solved
        ) {
            return;
        }


        setShowPopup(false);

        setPhase(
            "animating"
        );


        setAnimatingPosition(
            targetIndex
        );


        await wait(
            PLACE_ANIMATION_TIME
        );


        if (
            !gameActiveRef.current
        ) {
            return;
        }


        const updatedBoard =
            board.map(
                (card, index) => {

                    if (
                        index ===
                        targetIndex
                    ) {

                        return {

                            type:
                                activeCard.type,

                            number:
                                activeCard.number,

                            color:
                                activeCard.color,

                            solved:
                                true,

                        };

                    }


                    return {
                        ...card,
                    };

                }
            );


        setPlayerBoards(
            (currentBoards) => {

                const updatedBoards =
                    [...currentBoards];


                updatedBoards[
                    playerIndex
                ] =
                    updatedBoard;


                return updatedBoards;

            }
        );


        setAnimatingPosition(
            null
        );


        /* =================================================
           WINNER
        ================================================= */

        const hasWon =
            updatedBoard.every(
                (card) =>
                    card.solved
            );


        if (hasWon) {

            setActiveCard(null);

            setTargetIndex(null);

            setWinner(
                players[
                    playerIndex
                ]
            );

            setPhase(
                "ended"
            );

            return;
        }


        /* =================================================
           REVEAL OLD CARD
        ================================================= */

        const revealedCard = {
            ...oldCard,
        };


        /* =================================================
           REVEALED SKIP
        ================================================= */

        if (
            revealedCard.type ===
            "skip"
        ) {

            setStatusCard(
                revealedCard
            );


            setPopupTitle(
                "SKIP"
            );


            setShowPopup(true);


            setPhase(
                "ended"
            );


            setTimeout(() => {

                if (
                    !gameActiveRef.current
                ) {
                    return;
                }


                setShowPopup(false);

                moveToNextPlayer();

            }, 1100);


            return;
        }


        /* =================================================
           REVEALED NUMBER
        ================================================= */

        const nextNumber =
            revealedCard.number;


        const nextPosition =
            updatedBoard[
                nextNumber
            ];


        /*
         * SAME NUMBER
         */

        if (
            nextPosition &&
            nextPosition.solved
        ) {

            setStatusCard(
                revealedCard
            );


            setPopupTitle(
                "SAME NUMBER"
            );


            setShowPopup(true);


            setPhase(
                "ended"
            );


            setTimeout(() => {

                if (
                    !gameActiveRef.current
                ) {
                    return;
                }


                setShowPopup(false);

                moveToNextPlayer();

            }, 1100);


            return;
        }


        /* =================================================
           CONTINUE CHAIN
        ================================================= */

        setActiveCard(
            revealedCard
        );


        setTargetIndex(
            nextNumber
        );


        setPopupTitle(
            "CARD REVEALED"
        );


        setShowPopup(true);


        setPhase(
            "placing"
        );

    };


    /* =====================================================
       NEXT PLAYER
    ===================================================== */

    const moveToNextPlayer = () => {

        setActiveCard(null);

        setTargetIndex(null);

        setStatusCard(null);

        setShowPopup(false);

        setAnimatingPosition(null);

        setPhase(
            "ready"
        );


        setCurrentPlayer(
            (current) =>
                (
                    current + 1
                ) %
                players.length
        );

    };


    /* =====================================================
       SHUFFLE
    ===================================================== */

    const shuffleDrawDeck = async () => {

        if (
            phase !== "ready" ||
            drawDeck.length === 0 ||
            winner ||
            isShuffling
        ) {
            return;
        }


        setIsShuffling(true);


        await wait(750);


        setDrawDeck(
            (currentDeck) =>
                shuffleArray(
                    currentDeck
                )
        );


        await wait(250);


        setIsShuffling(false);

    };


    /* =====================================================
       RESTART
    ===================================================== */

    const restartSetup = () => {

        window.location.href =
            "/games/flipten";

    };


    /* =====================================================
       LOADING
    ===================================================== */

    if (
        players.length === 0
    ) {
        return null;
    }


    const popupCard =
        activeCard ||
        statusCard;


    const isPlaceable =
        phase === "placing" &&
        activeCard &&
        activeCard.type === "number";


    const popupColor =
        popupCard?.color ||
        "blue";


    /* =====================================================
       RENDER
    ===================================================== */

    return (

        <main
            className={`
                flipten-game

                ${
                    isShuffling
                        ? "deck-is-shuffling"
                        : ""
                }

                ${
                    winner
                        ? "game-has-winner"
                        : ""
                }
            `}
            style={{
                backgroundColor:
                    currentPlayerColor,
            }}
        >


            {/* =================================================
                WINNER CONFETTI
            ================================================= */}

            {
                winner && (

                    <div
                        className="winner-confetti"
                        aria-hidden="true"
                    >

                        {
                            confetti.map(
                                (piece) => (

                                    <span
                                        key={
                                            piece.id
                                        }
                                        className="confetti-piece"
                                        style={{
                                            left:
                                                `${piece.left}%`,

                                            width:
                                                `${piece.size}px`,

                                            height:
                                                `${piece.size * 1.6}px`,

                                            backgroundColor:
                                                piece.color,

                                            animationDelay:
                                                `${piece.delay}s`,

                                            animationDuration:
                                                `${piece.duration}s`,

                                            transform:
                                                `rotate(${piece.rotation}deg)`,
                                        }}
                                    />

                                )
                            )
                        }

                    </div>

                )
            }


            {/* =================================================
                HEADER
            ================================================= */}

            <header className="flipten-game-header">


                {/* EXIT */}

                <div className="flipten-exit-wrapper">

                    <button
                        className="flipten-exit"
                        onPointerDown={
                            startExitHold
                        }
                        onPointerUp={
                            cancelExitHold
                        }
                        onPointerLeave={
                            cancelExitHold
                        }
                        onPointerCancel={
                            cancelExitHold
                        }
                    >

                        <span
                            className="flipten-exit-progress"
                            style={{
                                "--exit-progress":
                                    `${
                                        exitProgress *
                                        360
                                    }deg`,
                            }}
                        />

                        <img
                            src="/images/back-arrow.png"
                            alt="Exit"
                        />

                    </button>


                    <div className="flipten-exit-text">

                        HOLD 3s
                        <br />
                        TO EXIT

                    </div>

                </div>


                {/* PLAYER */}

                <div className="flipten-player-heading">

                    <div className="flipten-player-number">

                        PLAYER{" "}
                        {currentPlayer + 1}

                    </div>


                    <div className="flipten-player-name">

                        {
                            players[
                                currentPlayer
                            ]
                        }

                    </div>

                </div>


                {/* INFO */}

                <button
                    className="flipten-game-info"
                    onClick={() =>
                        setShowInstructions(
                            true
                        )
                    }
                >

                    i

                </button>

            </header>


            {/* =================================================
                BOARD
            ================================================= */}

            <section className="flipten-board">


                <div className="flipten-card-grid">

                    {
                        playerBoards[
                            currentPlayer
                        ]?.map(
                            (card, index) => {

                                const isTarget =
                                    targetIndex ===
                                    index;


                                const isAnimating =
                                    animatingPosition ===
                                    index;


                                return (

                                    <div
                                        key={index}
                                        className={`
                                            flipten-player-card

                                            ${
                                                card.solved
                                                    ? "solved"
                                                    : ""
                                            }

                                            ${
                                                isTarget
                                                    ? "targeting"
                                                    : ""
                                            }

                                            ${
                                                isAnimating
                                                    ? "placing-card"
                                                    : ""
                                            }
                                        `}
                                        style={
                                            card.solved
                                                ? {
                                                    "--card-color":
                                                        CARD_COLORS[
                                                            card.color
                                                        ],
                                                }
                                                : {}
                                        }
                                    >

                                        <div className="card-inner">

                                            {
                                                card.solved ? (

                                                    <>

                                                        <div className="uno-card-symbol">

                                                            <span>

                                                                {
                                                                    card.type ===
                                                                    "skip"
                                                                        ? "X"
                                                                        : card.number
                                                                }

                                                            </span>

                                                        </div>


                                                        <span className="uno-card-corner top-left">

                                                            {
                                                                card.type ===
                                                                "skip"
                                                                    ? "X"
                                                                    : card.number
                                                            }

                                                        </span>


                                                        <span className="uno-card-corner bottom-right">

                                                            {
                                                                card.type ===
                                                                "skip"
                                                                    ? "X"
                                                                    : card.number
                                                            }

                                                        </span>

                                                    </>

                                                ) : (

                                                    <div className="card-circle" />

                                                )
                                            }

                                        </div>

                                    </div>

                                );

                            }
                        )
                    }

                </div>


                {/* =================================================
                    DRAW DECK
                ================================================= */}

                <button
                    className="flipten-draw-pile"
                    onClick={
                        drawCard
                    }
                    disabled={
                        phase !== "ready" ||
                        winner ||
                        drawDeck.length === 0
                    }
                >

                    <span className="draw-layer layer-1" />

                    <span className="draw-layer layer-2" />

                    <span className="draw-layer layer-3" />

                    <span className="draw-top-card">

                        <span className="draw-card-circle" />

                    </span>

                </button>

            </section>


            {/* =================================================
                SHUFFLE
            ================================================= */}

            <button
                className="flipten-shuffle-button"
                onClick={
                    shuffleDrawDeck
                }
                disabled={
                    phase !== "ready" ||
                    winner ||
                    drawDeck.length === 0 ||
                    isShuffling
                }
            >

                <span className="shuffle-icon">

                    ⇄

                </span>


                <span>

                    SHUFFLE

                </span>

            </button>


            {/* =================================================
                POPUP
            ================================================= */}

            {
                showPopup &&
                popupCard && (

                    <div className="flipten-popup-overlay">

                        <div
                            className={`
                                flipten-popup-card
                                popup-${popupColor}
                            `}
                            style={{
                                "--popup-color":
                                    CARD_COLORS[
                                        popupColor
                                    ],
                            }}
                        >

                            <div className="flipten-popup-label">

                                {
                                    popupTitle
                                }

                            </div>


                            <div className="flipten-popup-uno-card">

                                <span className="popup-corner top-left">

                                    {
                                        popupCard.type ===
                                        "skip"
                                            ? "X"
                                            : popupCard.number
                                    }

                                </span>


                                <div className="popup-oval">

                                    <span>

                                        {
                                            popupCard.type ===
                                            "skip"
                                                ? "X"
                                                : popupCard.number
                                        }

                                    </span>

                                </div>


                                <span className="popup-corner bottom-right">

                                    {
                                        popupCard.type ===
                                        "skip"
                                            ? "X"
                                            : popupCard.number
                                    }

                                </span>

                            </div>


                            {
                                isPlaceable && (

                                    <button
                                        className="flipten-popup-place"
                                        onClick={
                                            placeCard
                                        }
                                    >

                                        PLACE

                                        <span>

                                            {
                                                activeCard.number
                                            }

                                        </span>

                                    </button>

                                )
                            }

                        </div>

                    </div>

                )
            }


            {/* =================================================
                WINNER
            ================================================= */}

            {
                winner && (

                    <div className="flipten-winner-overlay">


                        {/* SIDE POPPERS */}

                        <div className="winner-popper left-popper">

                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />

                        </div>


                        <div className="winner-popper right-popper">

                            <span />
                            <span />
                            <span />
                            <span />
                            <span />
                            <span />

                        </div>


                        {/* WINNER CARD */}

                        <div className="flipten-winner-box">

                            <div className="winner-trophy">

                                🏆

                            </div>


                            <div className="winner-small">

                                WINNER

                            </div>


                            <div className="winner-name">

                                {
                                    winner
                                }

                            </div>


                            <div className="winner-message">

                                ALL 10 FLIPPED!

                            </div>


                           


                            <button
                                onClick={
                                    restartSetup
                                }
                            >

                                PLAY AGAIN

                            </button>

                        </div>

                    </div>

                )
            }


            {/* =================================================
                INSTRUCTIONS
            ================================================= */}

            {
                showInstructions && (

                    <div
                        className="flipten-instruction-overlay"
                        onClick={() =>
                            setShowInstructions(
                                false
                            )
                        }
                    >

                        <div
                            className="flipten-instruction-box"
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                        >

                            <button
                                className="instruction-close"
                                onClick={() =>
                                    setShowInstructions(
                                        false
                                    )
                                }
                            >

                                ×

                            </button>


                            <h2>
                                HOW TO PLAY
                            </h2>


                            <div className="instruction-content">

                                <p>
                                    Draw a card from
                                    the center deck.
                                </p>

                                <p>
                                    The number tells
                                    you which position
                                    to target.
                                </p>

                                <p>
                                    Press{" "}
                                    <strong>
                                        PLACE
                                    </strong>{" "}
                                    to put that card
                                    into the highlighted
                                    position.
                                </p>

                                <p>
                                    The hidden card that
                                    was there is revealed
                                    and becomes the next
                                    target.
                                </p>

                                <p>
                                    Continue the chain
                                    until you hit SKIP
                                    or a number already
                                    flipped.
                                </p>

                                <p>
                                    <strong>
                                        SKIP
                                    </strong>{" "}
                                    immediately ends
                                    your turn.
                                </p>

                                <p>
                                    Flip all 10 positions
                                    to win.
                                </p>

                            </div>

                        </div>

                    </div>

                )
            }

        </main>
    );
}

export default FlipTenGame;