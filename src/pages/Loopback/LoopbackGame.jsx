import { useEffect, useRef, useState } from "react";
import "./LoopbackGame.css";

const PLAYER_COLORS = ["#ef4949", "#4285e8"];

const CARD_COLORS = {
    red: "#ef4949",
    blue: "#4285e8",
    green: "#48a868",
    yellow: "#e7c843",
};

const COLOR_NAMES = Object.keys(CARD_COLORS);

const WILD_EFFECTS = [
    "X2",
    "-8",
    "-4",
    "X",
    "2+",
    "3+",
];

/* =========================================================
   PATH
========================================================= */

const LEFT_PATH = [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],

    [4, 1],

    [4, 2],
    [3, 2],
    [2, 2],
    [1, 2],
    [0, 2],

    [0, 3],

    [0, 4],
    [1, 4],
    [2, 4],
    [3, 4],
    [4, 4],

    [4, 5],

    [4, 6],
    [3, 6],
    [2, 6],
    [1, 6],
    [0, 6],

    [0, 7],

    [0, 8],
    [1, 8],
    [2, 8],
    [3, 8],
    [4, 8],
];

const RIGHT_PATH = [
    [10, 0],
    [9, 0],
    [8, 0],
    [7, 0],
    [6, 0],

    [6, 1],

    [6, 2],
    [7, 2],
    [8, 2],
    [9, 2],
    [10, 2],

    [10, 3],

    [10, 4],
    [9, 4],
    [8, 4],
    [7, 4],
    [6, 4],

    [6, 5],

    [6, 6],
    [7, 6],
    [8, 6],
    [9, 6],
    [10, 6],

    [10, 7],

    [10, 8],
    [9, 8],
    [8, 8],
    [7, 8],
    [6, 8],
];

const LEFT_ROUTE = [...LEFT_PATH].reverse();
const RIGHT_ROUTE = [...RIGHT_PATH].reverse();

const START = [5, 8];

const MAX_POSITION = 29;

/* =========================================================
   CARD HELPERS
========================================================= */

function createNumberCard(number, color) {
    return {
        id: `number-${number}-${color}-${Math.random()
            .toString(36)
            .slice(2)}`,
        type: "number",
        number,
        color,
        colorValue: CARD_COLORS[color],
    };
}

function createSkipCard(color) {
    return {
        id: `skip-${color}-${Math.random()
            .toString(36)
            .slice(2)}`,
        type: "skip",
        number: null,
        color,
        colorValue: CARD_COLORS[color],
    };
}

function createWildCard() {
    return {
        id: `wild-${Math.random()
            .toString(36)
            .slice(2)}`,
        type: "wild",
        number: null,
        color: "wild",
        colorValue: null,
    };
}

function shuffle(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));

        [copy[i], copy[j]] = [
            copy[j],
            copy[i],
        ];
    }

    return copy;
}

/* =========================================================
   MAIN DECK
========================================================= */

function createDeck() {
    const deck = [];

    /*
        Number cards:
        1 - 9
        4 colours
    */

    for (let number = 1; number <= 9; number++) {
        for (const color of COLOR_NAMES) {
            deck.push(
                createNumberCard(
                    number,
                    color
                )
            );
        }
    }

    /*
        X cards
    */

    for (const color of COLOR_NAMES) {
        deck.push(
            createSkipCard(color)
        );
    }

    /*
        Wild cards
    */

    for (let i = 0; i < 6; i++) {
        deck.push(createWildCard());
    }

    return shuffle(deck);
}

/* =========================================================
   NUMBER ONLY DECK

   Used for X2 / 2+ / 3+

   IMPORTANT:
   No X or wild cards here.
========================================================= */

function createNumberDeck() {
    const deck = [];

    for (let number = 1; number <= 9; number++) {
        for (const color of COLOR_NAMES) {
            deck.push(
                createNumberCard(
                    number,
                    color
                )
            );
        }
    }

    return shuffle(deck);
}

/* =========================================================
   LOOPBACK GAME
========================================================= */

function LoopbackGame() {
    const [players, setPlayers] = useState([
        "Player 1",
        "Player 2",
    ]);

    const [currentPlayer, setCurrentPlayer] =
        useState(0);

    /*
        Shared position:

        0      = START
        -1..-29 = LEFT
        +1..+29 = RIGHT
    */

    const [tokenPosition, setTokenPosition] =
        useState(0);

    const [cards, setCards] = useState([]);

    const [selectedCard, setSelectedCard] =
        useState(null);

    const [showCardPopup, setShowCardPopup] =
        useState(false);

    const [moving, setMoving] =
        useState(false);

    const [stepMoving, setStepMoving] =
        useState(false);

    const [winner, setWinner] =
        useState(null);

    const [showInstructions, setShowInstructions] =
        useState(false);

    /* =====================================================
       SIMPLE START MESSAGE
    ===================================================== */

    const [showStarter, setShowStarter] =
        useState(true);

    const [starterPlayer, setStarterPlayer] =
        useState(0);

    /* =====================================================
       WILD / POWER
    ===================================================== */

    const [activePower, setActivePower] =
        useState(null);

    const [extraChances, setExtraChances] =
        useState(0);

    const [powerNumbers, setPowerNumbers] =
        useState([]);

    const [powerDrawsRemaining, setPowerDrawsRemaining] =
        useState(0);

    const [wildReveal, setWildReveal] =
        useState(false);

    const [wildEffect, setWildEffect] =
        useState(null);

    /* =====================================================
       EXIT
    ===================================================== */

    const [isHoldingBack, setIsHoldingBack] =
        useState(false);

    const holdTimer = useRef(null);

    /* =====================================================
       DECK REFS
    ===================================================== */

    const deckRef = useRef([]);

    const numberDeckRef = useRef([]);

    /* =====================================================
       INITIALIZE GAME

       IMPORTANT:
       Read names from the setup page.

       Setup page stores:
       "loopbackPlayers"
    ===================================================== */

    useEffect(() => {
        let loadedPlayers = [
            "Player 1",
            "Player 2",
        ];

        try {
            const savedPlayers =
                sessionStorage.getItem(
                    "loopbackPlayers"
                );

            if (savedPlayers) {
                const parsedPlayers =
                    JSON.parse(savedPlayers);

                if (
                    Array.isArray(parsedPlayers) &&
                    parsedPlayers.length >= 2
                ) {
                    loadedPlayers = [
                        parsedPlayers[0]?.trim() ||
                            "Player 1",

                        parsedPlayers[1]?.trim() ||
                            "Player 2",
                    ];
                }
            }
        } catch (error) {
            console.error(
                "Unable to load Loopback players:",
                error
            );
        }

        /*
            Set the actual names first.
        */

        setPlayers(loadedPlayers);

        /*
            Create decks.
        */

        deckRef.current = createDeck();

        numberDeckRef.current =
            createNumberDeck();

        /*
            Random player starts.
        */

        const randomPlayer =
            Math.floor(
                Math.random() * 2
            );

        setStarterPlayer(
            randomPlayer
        );

        setCurrentPlayer(
            randomPlayer
        );

        /*
            Show the simple starter message.

            No animation.
            No boxes.
            No player reveal.
        */

        const timer = setTimeout(() => {
            setShowStarter(false);

            drawCardsForStart();
        }, 1600);

        return () => {
            clearTimeout(timer);

            if (holdTimer.current) {
                clearTimeout(
                    holdTimer.current
                );
            }
        };
    }, []);

    /* =========================================================
       DRAW STARTING CARDS
    ========================================================= */

    const drawCardsForStart = () => {
        if (
            deckRef.current.length < 4
        ) {
            deckRef.current =
                createDeck();
        }

        const drawn =
            deckRef.current.splice(
                0,
                4
            );

        setCards(drawn);
    };

    /* =========================================================
       NORMAL DRAW
    ========================================================= */

    const drawCards = () => {
        if (
            deckRef.current.length < 4
        ) {
            deckRef.current =
                createDeck();
        }

        const drawn =
            deckRef.current.splice(
                0,
                4
            );

        setCards(drawn);
    };

    /* =========================================================
       NUMBER-ONLY DRAW
    ========================================================= */

    const drawNumberCards = () => {
        if (
            numberDeckRef.current.length < 4
        ) {
            numberDeckRef.current =
                createNumberDeck();
        }

        const drawn =
            numberDeckRef.current.splice(
                0,
                4
            );

        setCards(drawn);
    };

    /* =========================================================
       HOLD BACK BUTTON
    ========================================================= */

    const startHold = (event) => {
        event.preventDefault();

        if (
            moving ||
            showCardPopup ||
            showStarter
        ) {
            return;
        }

        setIsHoldingBack(true);

        holdTimer.current = setTimeout(() => {
            window.location.href = "/";
        }, 2000);
    };

    const cancelHold = () => {
        setIsHoldingBack(false);

        if (holdTimer.current) {
            clearTimeout(
                holdTimer.current
            );

            holdTimer.current = null;
        }
    };

    /* =========================================================
       BOARD CELLS
    ========================================================= */

    const boardCells = [];

    for (let row = 0; row < 9; row++) {
        for (
            let col = 0;
            col < 11;
            col++
        ) {
            const isLeft =
                LEFT_PATH.some(
                    ([x, y]) =>
                        x === col &&
                        y === row
                );

            const isRight =
                RIGHT_PATH.some(
                    ([x, y]) =>
                        x === col &&
                        y === row
                );

            const isStart =
                col === START[0] &&
                row === START[1];

            if (
                !isLeft &&
                !isRight &&
                !isStart
            ) {
                continue;
            }

            boardCells.push({
                key: `${col}-${row}`,
                col,
                row,
                isStart,
            });
        }
    }

    /* =========================================================
       TOKEN COORDINATES
    ========================================================= */

    const getTokenCoordinates = (
        position
    ) => {
        if (position === 0) {
            return START;
        }

        if (position < 0) {
            return LEFT_ROUTE[
                Math.abs(position) - 1
            ];
        }

        return RIGHT_ROUTE[
            position - 1
        ];
    };

    const tokenCoordinates =
        getTokenCoordinates(
            tokenPosition
        );

    /* =========================================================
       TARGET
    ========================================================= */

    const getTargetPosition = () => {
        return currentPlayer === 0
            ? -MAX_POSITION
            : MAX_POSITION;
    };

    /* =========================================================
       MOVEMENT
    ========================================================= */

    const animateMovement = async (
        amount,
        direction
    ) => {
        if (amount <= 0) {
            return tokenPosition;
        }

        const proposed =
            tokenPosition +
            direction * amount;

        /*
            Never allow token to go
            beyond either finish.
        */

        if (
            proposed < -MAX_POSITION ||
            proposed > MAX_POSITION
        ) {
            return null;
        }

        let current =
            tokenPosition;

        setMoving(true);

        for (
            let i = 0;
            i < amount;
            i++
        ) {
            current += direction;

            setStepMoving(true);

            setTokenPosition(
                current
            );

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        245
                    )
            );

            setStepMoving(false);

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        65
                    )
            );
        }

        setMoving(false);

        return current;
    };

    /* =========================================================
       FINISH TURN
    ========================================================= */

    const finishTurn = () => {
        setTimeout(() => {
            const nextPlayer =
                currentPlayer === 0
                    ? 1
                    : 0;

            setCurrentPlayer(
                nextPlayer
            );

            setExtraChances(0);

            setActivePower(null);

            setWildEffect(null);

            setPowerNumbers([]);

            setPowerDrawsRemaining(
                0
            );

            drawCards();
        }, 400);
    };

    /* =========================================================
       SELECT CARD
    ========================================================= */

    const selectCard = (card) => {
        if (
            moving ||
            showCardPopup ||
            winner !== null ||
            showStarter
        ) {
            return;
        }

        setSelectedCard(card);

        setShowCardPopup(true);

        /*
            NUMBER CARD

            Automatically resolve.
            NO PLAY BUTTON.
        */

        if (card.type === "number") {
            setTimeout(() => {
                resolveNumberCard(card);
            }, 650);

            return;
        }

        /*
            X CARD

            Automatically resolve.
        */

        if (card.type === "skip") {
            setTimeout(() => {
                setShowCardPopup(false);

                setSelectedCard(null);

                finishTurn();
            }, 850);

            return;
        }

        /*
            WILD

            Wild still needs CLAIM because
            the actual wild effect has to
            be randomly determined.
        */
    };

    /* =========================================================
       NORMAL NUMBER
    ========================================================= */

    const resolveNumberCard = async (
        card
    ) => {
        if (
            !card ||
            card.type !== "number" ||
            moving ||
            winner !== null
        ) {
            return;
        }

        /*
            POWER DRAW
        */

        if (activePower) {
            await resolvePowerNumber(
                card
            );

            return;
        }

        setSelectedCard(null);

        setShowCardPopup(false);

        const target =
            getTargetPosition();

        const distance = Math.abs(
            target -
                tokenPosition
        );

        const moveNumber =
            card.number;

        /*
            Must land exactly.
        */

        if (moveNumber > distance) {
            setMoving(true);

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        500
                    )
            );

            setMoving(false);

            finishTurn();

            return;
        }

        const direction =
            target > tokenPosition
                ? 1
                : -1;

        const finalPosition =
            await animateMovement(
                moveNumber,
                direction
            );

        if (
            finalPosition === null
        ) {
            finishTurn();

            return;
        }

        /*
            WIN
        */

        if (
            finalPosition === target
        ) {
            setWinner(
                currentPlayer
            );

            return;
        }

        finishTurn();
    };

    /* =========================================================
       CLAIM WILD
    ========================================================= */

    const claimWild = () => {
        if (
            !selectedCard ||
            selectedCard.type !== "wild" ||
            wildReveal
        ) {
            return;
        }

        const effect =
            WILD_EFFECTS[
                Math.floor(
                    Math.random() *
                        WILD_EFFECTS.length
                )
            ];

        setWildEffect(effect);

        setWildReveal(true);

        setTimeout(
            async () => {
                setWildReveal(false);

                setSelectedCard(null);

                setShowCardPopup(false);

                /*
                    X
                */

                if (effect === "X") {
                    setTimeout(() => {
                        finishTurn();
                    }, 250);

                    return;
                }

                /*
                    -8
                */

                if (effect === "-8") {
                    setActivePower(
                        "-8"
                    );

                    setTimeout(
                        async () => {
                            const direction =
                                currentPlayer ===
                                0
                                    ? 1
                                    : -1;

                            const result =
                                await animateMovement(
                                    8,
                                    direction
                                );

                            setActivePower(
                                null
                            );

                            setWildEffect(
                                null
                            );

                            if (
                                result ===
                                null
                            ) {
                                finishTurn();

                                return;
                            }

                            finishTurn();
                        },
                        350
                    );

                    return;
                }

                /*
                    -4
                */

                if (effect === "-4") {
                    setActivePower(
                        "-4"
                    );

                    setTimeout(
                        async () => {
                            const direction =
                                currentPlayer ===
                                0
                                    ? 1
                                    : -1;

                            const result =
                                await animateMovement(
                                    4,
                                    direction
                                );

                            setActivePower(
                                null
                            );

                            setWildEffect(
                                null
                            );

                            if (
                                result ===
                                null
                            ) {
                                finishTurn();

                                return;
                            }

                            finishTurn();
                        },
                        350
                    );

                    return;
                }

                /*
                    X2

                    Draw exactly one
                    number card.
                */

                if (effect === "X2") {
                    setActivePower(
                        "X2"
                    );

                    setPowerNumbers(
                        []
                    );

                    setPowerDrawsRemaining(
                        1
                    );

                    setTimeout(() => {
                        drawNumberCards();
                    }, 350);

                    return;
                }

                /*
                    2+

                    Draw 2 numbers.
                */

                if (effect === "2+") {
                    setActivePower(
                        "2+"
                    );

                    setExtraChances(
                        2
                    );

                    setPowerNumbers(
                        []
                    );

                    setPowerDrawsRemaining(
                        2
                    );

                    setTimeout(() => {
                        drawNumberCards();
                    }, 350);

                    return;
                }

                /*
                    3+

                    Draw 3 numbers.
                */

                if (effect === "3+") {
                    setActivePower(
                        "3+"
                    );

                    setExtraChances(
                        3
                    );

                    setPowerNumbers(
                        []
                    );

                    setPowerDrawsRemaining(
                        3
                    );

                    setTimeout(() => {
                        drawNumberCards();
                    }, 350);

                    return;
                }
            },
            1200
        );
    };

    /* =========================================================
       POWER NUMBER
    ========================================================= */

    const resolvePowerNumber = async (
        card
    ) => {
        if (
            !card ||
            card.type !== "number" ||
            moving ||
            powerDrawsRemaining <= 0
        ) {
            return;
        }

        const updatedNumbers = [
            ...powerNumbers,
            card.number,
        ];

        const remaining =
            powerDrawsRemaining - 1;

        setPowerNumbers(
            updatedNumbers
        );

        setPowerDrawsRemaining(
            remaining
        );

        setSelectedCard(null);

        setShowCardPopup(false);

        /*
            Still need another number.
        */

        if (remaining > 0) {
            setExtraChances(
                remaining
            );

            setTimeout(() => {
                drawNumberCards();
            }, 350);

            return;
        }

        /*
            Calculate final movement.
        */

        let total = 0;

        /*
            X2:
            5 -> 10
        */

        if (activePower === "X2") {
            total =
                updatedNumbers[0] * 2;
        } else {
            /*
                2+ / 3+
                Add all numbers.
            */

            total =
                updatedNumbers.reduce(
                    (
                        sum,
                        number
                    ) =>
                        sum + number,
                    0
                );
        }

        setExtraChances(0);

        const target =
            getTargetPosition();

        const distance = Math.abs(
            target -
                tokenPosition
        );

        /*
            Must still land exactly.
        */

        if (total > distance) {
            setMoving(true);

            await new Promise(
                (resolve) =>
                    setTimeout(
                        resolve,
                        500
                    )
            );

            setMoving(false);

            setActivePower(null);

            setWildEffect(null);

            setPowerNumbers([]);

            setPowerDrawsRemaining(
                0
            );

            finishTurn();

            return;
        }

        const direction =
            target > tokenPosition
                ? 1
                : -1;

        const finalPosition =
            await animateMovement(
                total,
                direction
            );

        setActivePower(null);

        setWildEffect(null);

        setPowerNumbers([]);

        setPowerDrawsRemaining(
            0
        );

        if (
            finalPosition === null
        ) {
            finishTurn();

            return;
        }

        if (
            finalPosition === target
        ) {
            setWinner(
                currentPlayer
            );

            return;
        }

        finishTurn();
    };

    /* =========================================================
       RESTART
    ========================================================= */

    const restartGame = () => {
        deckRef.current =
            createDeck();

        numberDeckRef.current =
            createNumberDeck();

        setTokenPosition(0);

        setWinner(null);

        setCards([]);

        setSelectedCard(null);

        setShowCardPopup(false);

        setMoving(false);

        setStepMoving(false);

        setActivePower(null);

        setWildEffect(null);

        setExtraChances(0);

        setPowerNumbers([]);

        setPowerDrawsRemaining(
            0
        );

        /*
            Choose another random starter.
        */

        const randomPlayer =
            Math.floor(
                Math.random() * 2
            );

        setStarterPlayer(
            randomPlayer
        );

        setCurrentPlayer(
            randomPlayer
        );

        setShowStarter(true);

        setTimeout(() => {
            setShowStarter(false);

            drawCards();
        }, 1600);
    };

    /* =========================================================
       TROPHY
    ========================================================= */

    const Trophy = ({ color }) => {
        return (
            <svg
                className="trophy-icon"
                viewBox="0 0 64 64"
                aria-hidden="true"
            >
                <path
                    d="
                        M18 8
                        H46
                        V25
                        C46 37 39 43 32 43
                        C25 43 18 37 18 25
                        Z
                    "
                    fill={color}
                    stroke="#111"
                    strokeWidth="3"
                />

                <path
                    d="
                        M18 13
                        H9
                        V22
                        C9 29 13 33 20 33
                    "
                    fill="none"
                    stroke="#111"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                <path
                    d="
                        M46 13
                        H55
                        V22
                        C55 29 51 33 44 33
                    "
                    fill="none"
                    stroke="#111"
                    strokeWidth="4"
                    strokeLinecap="round"
                />

                <path
                    d="
                        M27 43
                        H37
                        V51
                        H27
                        Z
                    "
                    fill={color}
                    stroke="#111"
                    strokeWidth="3"
                />

                <path
                    d="
                        M20 55
                        H44
                    "
                    fill="none"
                    stroke="#111"
                    strokeWidth="5"
                    strokeLinecap="round"
                />
            </svg>
        );
    };

    /* =========================================================
       RENDER
    ========================================================= */

    return (
        <main
            className="loopback-game"
            style={{
                "--active-color":
                    PLAYER_COLORS[
                        currentPlayer
                    ],
            }}
        >
            {/* =================================================
                HEADER
            ================================================= */}

            <header className="loopback-header">
                <div className="loopback-back-wrapper">
                    <button
                        className={`loopback-back ${
                            isHoldingBack
                                ? "holding"
                                : ""
                        }`}
                        onPointerDown={
                            startHold
                        }
                        onPointerUp={
                            cancelHold
                        }
                        onPointerCancel={
                            cancelHold
                        }
                        onPointerLeave={
                            cancelHold
                        }
                        aria-label="Hold to exit"
                    >
                        <span className="back-progress" />

                        <img
                            src="/images/back-arrow.png"
                            alt="Back"
                        />
                    </button>

                    <div className="hold-label">
                        HOLD 2s
                        <br />
                        TO EXIT
                    </div>
                </div>

                <div className="header-player">
                    <h1>
                        PLAYER{" "}
                        {currentPlayer + 1}
                    </h1>

                    <div className="header-player-name">
                        {
                            players[
                                currentPlayer
                            ]
                        }
                    </div>
                </div>

                <button
                    className="loopback-info"
                    onClick={() =>
                        setShowInstructions(
                            true
                        )
                    }
                    aria-label="Instructions"
                >
                    i
                </button>
            </header>

            {/* =================================================
                BOARD
            ================================================= */}

            <section className="board-section">
                <div className="loopback-board">
                    {boardCells.map(
                        (cell) => {
                            const isLeftFinish =
                                cell.col === 0 &&
                                cell.row === 0;

                            const isRightFinish =
                                cell.col === 10 &&
                                cell.row === 0;

                            const isTokenHere =
                                cell.col ===
                                    tokenCoordinates[0] &&
                                cell.row ===
                                    tokenCoordinates[1];

                            return (
                                <div
                                    key={
                                        cell.key
                                    }
                                    className={`loopback-cell ${
                                        cell.isStart
                                            ? "start-cell"
                                            : ""
                                    }`}
                                    style={{
                                        gridColumn:
                                            cell.col +
                                            1,

                                        gridRow:
                                            cell.row +
                                            1,
                                    }}
                                >
                                    {isLeftFinish && (
                                        <Trophy
                                            color={
                                                PLAYER_COLORS[0]
                                            }
                                        />
                                    )}

                                    {isRightFinish && (
                                        <Trophy
                                            color={
                                                PLAYER_COLORS[1]
                                            }
                                        />
                                    )}

                                    {isTokenHere && (
                                        <div
                                            className={`loopback-token ${
                                                stepMoving
                                                    ? "jumping"
                                                    : ""
                                            }`}
                                            style={{
                                                backgroundColor:
                                                    PLAYER_COLORS[
                                                        currentPlayer
                                                    ],
                                            }}
                                        >
                                            O
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    )}
                </div>
            </section>

            {/* =================================================
                FOUR CARDS

                These are below the board with clear spacing.
            ================================================= */}

            <section className="loopback-cards">
                {cards.map((card) => (
                    <button
                        key={card.id}
                        className="loopback-card"
                        disabled={
                            moving ||
                            showCardPopup ||
                            winner !== null ||
                            showStarter
                        }
                        onClick={() =>
                            selectCard(
                                card
                            )
                        }
                    >
                        <span>?</span>
                    </button>
                ))}
            </section>

            {/* =================================================
                ACTIVE POWER
            ================================================= */}

            {activePower && (
                <div className="active-power-corner">
                    <div className="power-label">
                        POWER
                    </div>

                    <div className="power-value">
                        {activePower}
                    </div>

                    {powerDrawsRemaining >
                        0 && (
                        <div className="power-chances">
                            {
                                powerDrawsRemaining
                            }{" "}
                            DRAW
                            {powerDrawsRemaining >
                            1
                                ? "S"
                                : ""}{" "}
                            LEFT
                        </div>
                    )}
                </div>
            )}

            {/* =================================================
                WILD ACTIVE CARD

                Stays at bottom-left while
                X2 / 2+ / 3+ is being resolved.
            ================================================= */}

            {selectedCard?.type ===
                "wild" &&
                !wildReveal && (
                    <div className="pending-card-corner">
                        <div className="pending-card-title">
                            WILD
                        </div>

                        <div className="pending-dollar-card">
                            $
                        </div>
                    </div>
                )}

            {/* =================================================
                CARD POPUP
            ================================================= */}

            {showCardPopup &&
                selectedCard && (
                    <div className="card-popup-overlay">
                        <div className="card-popup-content">

                            {/* NUMBER */}

                            {selectedCard.type ===
                                "number" && (
                                <div
                                    className="revealed-card"
                                    style={{
                                        "--card-color":
                                            selectedCard.colorValue,
                                    }}
                                >
                                    <div className="revealed-card-inner">
                                        {
                                            selectedCard.number
                                        }
                                    </div>
                                </div>
                            )}

                            {/* X */}

                            {selectedCard.type ===
                                "skip" && (
                                <div className="skip-reveal">
                                    <div
                                        className="revealed-card skip-card"
                                        style={{
                                            "--card-color":
                                                selectedCard.colorValue,
                                        }}
                                    >
                                        <div className="revealed-card-inner">
                                            X
                                        </div>
                                    </div>

                                    <div className="skip-text">
                                        SKIP!
                                    </div>
                                </div>
                            )}

                            {/* WILD */}

                            {selectedCard.type ===
                                "wild" && (
                                <>
                                    <div
                                        className={`wild-card-flip ${
                                            wildReveal
                                                ? "flipping"
                                                : ""
                                        }`}
                                    >
                                        <div className="wild-card-face wild-front">
                                            $
                                        </div>

                                        <div className="wild-card-face wild-back">
                                            {
                                                wildEffect
                                            }
                                        </div>
                                    </div>

                                    {!wildReveal && (
                                        <button
                                            className="claim-button"
                                            onClick={
                                                claimWild
                                            }
                                        >
                                            CLAIM
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

            {/* =================================================
                RANDOM STARTER MESSAGE

                NO BOXES
                NO PLAYER REVEAL ANIMATION
            ================================================= */}

            {showStarter && (
                <div className="starter-overlay">
                    <div className="starter-content">
                        <div className="starter-eyebrow">
                            LOOPBACK
                        </div>

                        <div className="starter-player-number">
                            PLAYER{" "}
                            {starterPlayer +
                                1}
                        </div>

                        <div className="starter-player-name">
                            {
                                players[
                                    starterPlayer
                                ]
                            }
                        </div>

                        <div className="starter-message">
                            STARTS FIRST
                        </div>
                    </div>
                </div>
            )}

            {/* =================================================
                WINNER
            ================================================= */}

            {winner !== null && (
                <div className="winner-overlay">
                    <div className="winner-confetti">
                        {Array.from({
                            length: 30,
                        }).map(
                            (_, index) => (
                                <span
                                    key={
                                        index
                                    }
                                    style={{
                                        "--i":
                                            index,
                                    }}
                                />
                            )
                        )}
                    </div>

                    <div
                        className="winner-box"
                        style={{
                            "--winner-color":
                                PLAYER_COLORS[
                                    winner
                                ],
                        }}
                    >
                        <div className="winner-crown">
                            ★
                        </div>

                        <div className="winner-small">
                            LOOPBACK
                        </div>

                        <div className="winner-title">
                            WINNER!
                        </div>

                        <div className="winner-name">
                            {
                                players[
                                    winner
                                ]
                            }
                        </div>

                        <div className="winner-subtitle">
                            MADE IT TO THE
                            TROPHY
                        </div>

                        <button
                            className="winner-button"
                            onClick={
                                restartGame
                            }
                        >
                            PLAY AGAIN
                        </button>
                    </div>
                </div>
            )}

            {/* =================================================
                INSTRUCTIONS
            ================================================= */}

            {showInstructions && (
                <div
                    className="instructions-overlay"
                    onClick={() =>
                        setShowInstructions(
                            false
                        )
                    }
                >
                    <div
                        className="instructions-box"
                        onClick={(event) =>
                            event.stopPropagation()
                        }
                    >
                        <button
                            className="instructions-close"
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

                        <p>
                            🎴 Choose one of
                            the four cards.
                        </p>

                        <p>
                            🔢 Number cards
                            automatically
                            reveal and move
                            the O.
                        </p>

                        <p>
                            🎯 Reach your
                            finish exactly
                            to win.
                        </p>

                        <p>
                            🚫 If the number
                            is bigger than
                            the remaining
                            distance, you
                            lose the turn.
                        </p>

                        <p>
                            ❌ X means SKIP.
                        </p>

                        <p>
                            💲 WILD randomly
                            gives a special
                            effect.
                        </p>

                        <p>
                            ✨ X2 doubles
                            the number.
                        </p>

                        <p>
                            ➖ -8 moves back
                            8 spaces.
                        </p>

                        <p>
                            ➖ -4 moves back
                            4 spaces.
                        </p>

                        <p>
                            🔥 2+ gives
                            2 number draws.
                        </p>

                        <p>
                            🔥 3+ gives
                            3 number draws.
                        </p>

                        <p>
                            Hold the back
                            button for
                            2 seconds to exit.
                        </p>
                    </div>
                </div>
            )}
        </main>
    );
}

export default LoopbackGame;