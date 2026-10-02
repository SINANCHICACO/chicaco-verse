import "./GameCard.css";

function GameCard({ game }) {
  const isAvailable = game.status === "available";

  return (
    <article className={`game-card ${!isAvailable ? "locked" : ""}`}>

      <div className="game-card-top">
        <span className="game-category">
          {game.category}
        </span>

        <span className="game-number">
          #{game.id === "imposter" ? "01" : "??"}
        </span>
      </div>


      <div className="game-card-content">

        <div className="game-icon">
          {isAvailable ? "?" : "✦"}
        </div>

        <h3>{game.name}</h3>

        <p>{game.description}</p>

      </div>


      <div className="game-card-bottom">

        <span className="player-count">
          👥 {game.minPlayers}–{game.maxPlayers}
        </span>

        {isAvailable ? (
          <a
            href={game.path}
            className="play-game"
          >
            PLAY →
          </a>
        ) : (
          <span className="coming-label">
            SOON
          </span>
        )}

      </div>

    </article>
  );
}

export default GameCard;