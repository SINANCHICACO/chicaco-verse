import { useEffect, useState } from "react";

import Home from "./pages/Home";
import FlipTen from "./pages/FlipTen/FlipTen";
import FlipTenGame from "./pages/FlipTen/FlipTenGame";

import ShutterIntro from "./components/ShutterIntro/ShutterIntro";

import Loopback from "./pages/Loopback/Loopback";
import LoopbackGame from "./pages/Loopback/LoopbackGame";
function App() {

    const path = window.location.pathname;

    /*
    =====================================================
    INTRO STATE
    =====================================================
    */

    const [
        shouldShowIntro,
        setShouldShowIntro
    ] = useState(() => {

        /*
        Check whether the intro has already
        been shown during this browser session.
        */

        const introShown =
            sessionStorage.getItem(
                "chicacoverse_intro_shown"
            );

        return (
            path === "/" &&
            introShown !== "true"
        );
    });


    /*
    =====================================================
    MARK INTRO AS SHOWN
    =====================================================

    We do this as soon as the app starts on "/".

    This is important because even if the user
    navigates away before the animation completely
    finishes, coming back to "/" will NOT trigger
    the intro again.
    */

    useEffect(() => {

        if (
            path === "/" &&
            shouldShowIntro
        ) {

            sessionStorage.setItem(
                "chicacoverse_intro_shown",
                "true"
            );

        }

    }, [path, shouldShowIntro]);


    /*
    =====================================================
    HOME
    =====================================================
    */

    if (path === "/") {

        if (shouldShowIntro) {

            return (
                <ShutterIntro>
                    <Home />
                </ShutterIntro>
            );

        }

        return <Home />;
    }


    /*
    =====================================================
    FLIPTEN SETUP
    =====================================================
    */

    if (
        path === "/games/flipten"
    ) {

        return <FlipTen />;

    }


    /*
    =====================================================
    FLIPTEN GAME
    =====================================================
    */

    if (
        path === "/games/flipten/game"
    ) {

        return <FlipTenGame />;

    }


    /* LOOPBACK SETUP */

    if (path === "/games/loopback") {

        return <Loopback />;

    }


    /* LOOPBACK GAME */

    if (path === "/games/loopback/game") {

        return <LoopbackGame />;

    }



    /*
    =====================================================
    FALLBACK
    =====================================================
    */

    return <Home />;
}


export default App;