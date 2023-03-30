import React, { useState, useMemo } from "react";

function useSpeechRecognition({ onStart, onEnd, onResult }) {
  const [listening, setListening] = useState(false);

  const speechRecognition = useMemo(() => {
    const sr =
      "webkitSpeechRecognition" in window
        ? new window.webkitSpeechRecognition()
        : new window.SpeechRecognition();

    sr.continuous = false;
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

  return { speechRecognition, listening, setListening };
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

  const { speechRecognition, listening, setListening } = useSpeechRecognition({
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

  const stopListening = () => {
    speechRecognition.stop();
    setListening(false);
  }

  return (
    <div className="speech-recognition">
      <div>
        {!listening &&
          <button className="record-button" onClick={() => speechRecognition.start()}>Start</button>
        }
        {listening &&
          <button className={`record-button ${listening ? "recording" : ""}`} onClick={() => stopListening()}>Stop</button>
        }
      </div>
      <div>Currently {listening ? "listening" : "not listening"}</div>
      <div className="transcript-container">
        <div>Last transcript:</div>
        <div>{lastTranscript || "<none>"}</div>
        <div>Last response:</div>
        <div>{lastResponse || "<none>"}</div>
      </div>
    </div>
  );
}
