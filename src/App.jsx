import Home from "./pages/Home";
import ShutterIntro from "./components/ShutterIntro/ShutterIntro";

function App() {
  return (
    <ShutterIntro>
      <Home />
    </ShutterIntro>
  );
}

export default App;