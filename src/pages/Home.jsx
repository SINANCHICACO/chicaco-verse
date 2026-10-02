import "./Home.css";
import games from "../data/games";
import GameCard from "../components/GameCard";

function Home() {
  return (
    <main className="home">

      {/* NAVIGATION */}

      <header className="home-header">

        <div className="brand">
          <span>CHICACO</span>
          <span className="brand-verse">
            VERSE
          </span>
        </div>

        <button
          className="menu-button"
          aria-label="Open menu"
        >
          ☰
        </button>

      </header>


      {/* HERO */}

      <section className="hero">

        <div className="hero-decoration decoration-one">
          ✦
        </div>

        <div className="hero-decoration decoration-two">
          ✦
        </div>

        <div className="hero-content">

          <p className="hero-small">
            WELCOME TO THE
          </p>

          <h1>
            CHICACO
            <span>VERSE</span>
          </h1>

          <p className="hero-description">
            Games. Chaos. Endless Fun.
          </p>

          <button className="explore-button">
            EXPLORE GAMES
            <span>↓</span>
          </button>

        </div>

        <div className="hero-orbit">
          <div className="orbit-dot"></div>
        </div>

      </section>


      {/* GAMES */}

      <section className="games-preview">

        <div className="section-heading">

          <p>THE UNIVERSE</p>

          <h2>
            CHOOSE YOUR GAME
          </h2>

        </div>


        <div className="games-grid">

          {games.map((game) => (
            <GameCard
              key={game.id}
              game={game}
            />
          ))}

        </div>

      </section>

    </main>
  );
}

export default Home;