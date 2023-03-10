import React, { useState, useMemo } from "react";

function useSpeechRecognition({ onStart, onEnd, onResult }) {
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

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

async function getGptResponse(prompt) {
  const response = await fetch("http://localhost:8080/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt: prompt }),
  });
  const data = await response.json();
  return data.choices[0].text.trim();
}

export function SpeechRecognition() {
  const [lastTranscript, setLastTranscript] = useState("");
  const [lastResponse, setLastResponse] = useState("");

  const { speechRecognition, listening } = useSpeechRecognition({
    onResult: async (result) => {
      const trimmedResult = result.trim();
      if (trimmedResult) {
        setLastTranscript(trimmedResult);
        const response = await getGptResponse(trimmedResult);
        setLastResponse(response);
        speak(response);
      }
    },
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
      <div style={{ marginTop: "1rem" }}>Last response:</div>
      <div>{lastResponse || "<none>"}</div>
    </div>
  );
}
