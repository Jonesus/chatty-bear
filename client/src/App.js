import { SpeechRecognition } from "./SpeechRecognition";
import "./App.css";

function App() {
  return (
    <div className="main">
      <header className="header">
        <h1>Chatty bear</h1>
      </header>
      <SpeechRecognition />
    </div>
  );
}

export default App;
