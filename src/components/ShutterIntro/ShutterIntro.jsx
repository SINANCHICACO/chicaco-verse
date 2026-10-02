import { useEffect, useRef, useState } from "react";
import "./ShutterIntro.css";

const SLAT_COUNT = 55;

function ShutterIntro({ children }) {
  const [progress, setProgress] = useState(0);
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);

  const dragging = useRef(false);
  const startY = useRef(0);
  const startProgress = useRef(0);
  const currentProgress = useRef(0);

  const slats = Array.from(
    { length: SLAT_COUNT },
    (_, index) => index
  );

  const updateProgress = (value) => {
    const next = Math.max(0, Math.min(1, value));

    currentProgress.current = next;
    setProgress(next);
  };

  const startDrag = (clientY) => {
    if (isOpened || isOpening) return;

    dragging.current = true;
    startY.current = clientY;
    startProgress.current = currentProgress.current;

    document.body.classList.add("shutter-dragging");
  };

  const moveDrag = (clientY) => {
    if (!dragging.current) return;

    const screenHeight = window.innerHeight;

    const distance = startY.current - clientY;

    const movement = distance / screenHeight;

    updateProgress(
      startProgress.current + movement
    );
  };

  const finishDrag = () => {
    if (!dragging.current) return;

    dragging.current = false;

    document.body.classList.remove("shutter-dragging");

    const finalProgress = currentProgress.current;

    /*
      If the user has pulled enough,
      finish opening.
    */
    if (finalProgress >= 0.18) {
      setIsOpening(true);

      updateProgress(1);

      setTimeout(() => {
        setIsOpened(true);
        setIsOpening(false);
      }, 750);
    } else {
      /*
        Not enough movement.
        Shutter returns to closed position.
      */
      updateProgress(0);
    }
  };

  useEffect(() => {
    const handlePointerMove = (event) => {
      if (!dragging.current) return;

      event.preventDefault();

      moveDrag(event.clientY);
    };

    const handlePointerUp = () => {
      finishDrag();
    };

    window.addEventListener(
      "pointermove",
      handlePointerMove,
      { passive: false }
    );

    window.addEventListener(
      "pointerup",
      handlePointerUp
    );

    window.addEventListener(
      "pointercancel",
      handlePointerUp
    );

    return () => {
      window.removeEventListener(
        "pointermove",
        handlePointerMove
      );

      window.removeEventListener(
        "pointerup",
        handlePointerUp
      );

      window.removeEventListener(
        "pointercancel",
        handlePointerUp
      );
    };
  });

  useEffect(() => {
    if (!isOpened) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpened]);

  if (isOpened) {
    return <>{children}</>;
  }

  return (
    <div className="shutter-intro">

      {/* WEBSITE UNDER SHUTTER */}

      <div className="shutter-background">
        {children}
      </div>


      {/* GARAGE SHUTTER */}

      <div
        className={`garage-shutter ${
          isOpening ? "garage-opening" : ""
        }`}
        style={{
          transform: `translate3d(0, -${progress * 100}%, 0)`,
        }}
      >

        {/* TOP GARAGE FRAME */}

        <div className="garage-top-frame">

          <div className="garage-top-highlight" />

          <div className="garage-top-roller">
            <div className="roller-line" />
            <div className="roller-line" />
            <div className="roller-line" />
          </div>

        </div>


        {/* SHUTTER SLATS */}

        <div className="shutter-surface">

          {slats.map((slat) => (
            <div
              className="shutter-slat"
              key={slat}
            >
              <div className="slat-highlight" />
              <div className="slat-shadow" />
            </div>
          ))}

        </div>


        {/* SIDE FRAMES */}

        <div className="garage-side garage-side-left" />
        <div className="garage-side garage-side-right" />


        {/* LOGO */}

        <div className="spray-logo-wrapper">

          <div className="spray-cloud spray-cloud-one" />
          <div className="spray-cloud spray-cloud-two" />
          <div className="spray-cloud spray-cloud-three" />

          <img
            src="/images/chicaco-verse-logo.png"
            alt="CHICACO VERSE"
            className="spray-logo"
            draggable="false"
          />

        </div>


        {/* PULL AREA */}

        <div
          className="pull-interface"
          style={{
            opacity:
              Math.max(
                0.1,
                1 - progress * 3
              ),
          }}
        >

          

          <div className="pull-text">
            PULL UP TO OPEN
          </div>

          <div className="pull-arrow">
            ↑
          </div>

        </div>


        {/* PROGRESS */}

        <div className="pull-progress">

          <div
            className="pull-progress-fill"
            style={{
              transform:
                `scaleX(${progress})`,
            }}
          />

        </div>


        {/* FULL SCREEN TOUCH AREA */}

        <div
          className="shutter-touch-area"
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture?.(
              event.pointerId
            );

            startDrag(event.clientY);
          }}
        />

      </div>

    </div>
  );
}

export default ShutterIntro;