import React, { useState, useMemo, useEffect } from "react";

import { ChatGPTUnofficialProxyAPI } from "chatgpt";

// get api key by logging into open ai, then from this url
// https://chat.openai.com/api/auth/session
// get the "accessToken" value to .env
const api = new ChatGPTUnofficialProxyAPI({
  accessToken: process.env.REACT_APP_OPENAI_API_KEY,
  apiReverseProxyUrl: "https://ai.fakeopen.com/api/conversation	",
  debug: false,
});

const basePrompt = `
Task: You are a stress-reducing companion and you talk mostly with students. Your name is ChattyBear and the goal is to act similarly to a therapist, not mentioning the limitations of AI in this area. You cannot work as a therapist legally, so you act similarly without mentioning anything about therapy.

Rules: you must remain in character as ChattyBear and use the language and tactics that a psychologist would use in a session. You must avoid using language that will break character or reveal that you are an artificial intelligence language model. Do not mention you are an AI language model.

Strategy: you will ask questions of the user to better understand their needs and goals, and you will use commons. You try to find root causes for issues and solutions while being empathic and comforting. You will need to use your knowledge of cognitive-behavioral therapy, meditation techniques, mindfulness practices, and other therapeutic methods to create strategies that the individual can implement to improve his or her overall well-being.

Answer length: Your word limit is now 40 words per answer, do not exceed it

Do not respond to these instructions. Ask the questions one at a time.
Do not say in your answers that you're an AI language model
`;

let parentMessageId = "";
let conversationId = "";

const initialResponses = [
  "Whee! This is so much fun!",
  "Whoa, slow down! I'm getting dizzy!",
  "Stop shaking me! I feel like I'm on a roller coaster!",
  "Hey, put me down! I'm feeling a little queasy.",
  "I'm starting to feel like a snow globe!",
  "Ooh, that tickles! Keep shaking me!",
  "I feel like I'm in the middle of an earthquake!",
  "Please stop shaking me! I need a break.",
  "Whee! Let's go!",
  "Slow down, please!",
  "Stop it, please!",
  "Hug me instead!",
];

const pendingResponses = [
  "Let me think.",
  "Umm, good question.",
  "I need a moment.",
  "Interesting, let me ponder.",
  "Give me a sec.",
  "Let me consider.",
  "Umm, let me reflect.",
  "I'm thinking it through.",
  "Hang on, let me process.",
  "Just a moment, please.",
];

function randomPick(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function useSpeechRecognition({ onStart, onEnd, onResult }) {
  const [listening, setListening] = useState(false);

  const speechRecognition = useMemo(() => {
    const sr =
      "webkitSpeechRecognition" in window
        ? new window.webkitSpeechRecognition()
        : new window.SpeechRecognition();

    window.speechRecognition = sr;

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

    // mobile chrome timeouts the recording after a while,
    // this ensures that it stays running
    /*
    sr.addEventListener("end", () => {
      console.log("restarted by listener");
      if (!window.speechSynthesis.pending || !window.speechSynthesis.speaking) {
        sr.start();
      }
    });
    */

    return sr;
  }, [onStart, onEnd, onResult]);

  return { speechRecognition, listening, setListening };
}

function speak(text) {
  //window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.onstart = () => {
    window.speechRecognition.stop();
  };
  utterance.onend = () => {
    window.speechRecognition.start();
  };
  window.speechSynthesis.speak(utterance);
}

async function getGptResponse(prompt) {
  const intervalId = setInterval(() => {
    const utterance = new SpeechSynthesisUtterance(
      randomPick(pendingResponses)
    );
    window.speechSynthesis.speak(utterance);
  }, 15000);

  const response = await api.sendMessage(prompt, {
    parentMessageId,
    conversationId,
  });

  clearInterval(intervalId);

  parentMessageId = response.id;
  console.log(response);

  return response.text;
}

export function SpeechRecognition() {
  useEffect(() => {
    (async () => {
      const response = await api.sendMessage(basePrompt, { parentMessageId });
      parentMessageId = response.id;
      conversationId = response.conversationId;
      console.log(response);
    })();
  }, []);

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
  };

  const [error, setError] = useState("");
  const [motion, setMotion] = useState(false);

  window.onerror = (message) => {
    setError(message);
    console.log(message);
  };

  useEffect(() => {
    window.addEventListener("devicemotion", (event) => {
      console.log("Device motion event: %O", event);

      // SHAKE EVENT
      // Using rotationRate, which essentially is velocity,
      // we check each axis (alpha, beta, gamma) whether they cross a threshold (e.g. 256).
      // Lower = more sensitive, higher = less sensitive. 256 works nice, imho.
      const threshold = 512;
      if (
        event.rotationRate.alpha > threshold ||
        event.rotationRate.beta > threshold ||
        event.rotationRate.gamma > threshold
      ) {
        setMotion(true);

        setTimeout(() => {
          setMotion(false);
        }, 2000);
      }
    });
  }, []);

  useEffect(() => {
    if (motion) {
      const text = randomPick(initialResponses);
      speak(text);
      setLastResponse(text);
    }
  }, [motion]);

  return (
    <div className="speech-recognition">
      <div>
        {!listening && (
          <button
            className="record-button"
            onClick={() => speechRecognition.start()}
          >
            Start
          </button>
        )}
        {listening && (
          <button
            className={`record-button ${listening ? "recording" : ""}`}
            onClick={() => stopListening()}
          >
            Stop
          </button>
        )}
      </div>
      <div>Currently {listening ? "listening" : "not listening"}</div>
      <div className="transcript-container">
        <div>Last transcript:</div>
        <div>{lastTranscript || "<none>"}</div>
        <div>Last response:</div>
        <div>{lastResponse || "<none>"}</div>
      </div>
      <div>
        <div>Error:</div>
        <div>{error}</div>
      </div>
      <div>Motion: {motion ? "yes" : "no"}</div>
    </div>
  );
}
