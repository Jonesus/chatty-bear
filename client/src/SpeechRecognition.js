import React, { useState, useMemo } from "react";

export function useSpeechRecognition({ onStart, onEnd, onResult }) {
  const [listening, setListening] = useState(false);

  const speechRecognition = useMemo(() => {
    const sr =
      "webkitSpeechRecognition" in window
        ? new window.webkitSpeechRecognition()
        : new window.SpeechRecognition();

    sr.continuous = true;
    sr.onstart = () => {
      setListening(true);
      onStart?.();
    };
    sr.onend = () => {
      setListening(false);
      onEnd?.();
    };
    sr.onresult = (event) => {
      onResult?.(event.results[event.resultIndex][0].transcript);
    };
    sr.lang = "en-US";

    return sr;
  }, [onStart, onEnd, onResult, setListening]);

  return { speechRecognition, listening };
}

export function SpeechRecognition() {
  const [lastTranscript, setLastTranscript] = useState("");

  const { speechRecognition, listening } = useSpeechRecognition({
    onResult: (result) => setLastTranscript(result),
  });

  return (
    <div style={{ marginTop: "4rem" }}>
      <div>Currently {listening ? "listening" : "not listening"}.</div>
      <div>
        <button onClick={() => speechRecognition.start()}>Start</button>
        <button onClick={() => speechRecognition.stop()}>Stop</button>
      </div>
      <div style={{ marginTop: "1rem" }}>Last transcript:</div>
      <div>{lastTranscript || "<none>"}</div>
    </div>
  );
}
