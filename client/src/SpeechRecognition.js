import React, { useState, useMemo, useEffect } from "react";

import{ChatGPTUnofficialProxyAPI} from 'chatgpt'

// If error, renew key here https://github.com/PawanOsman/ChatGPT#use-our-hosted-api-reverse-proxy
const KEY = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik1UaEVOVUpHTkVNMVFURTRNMEZCTWpkQ05UZzVNRFUxUlRVd1FVSkRNRU13UmtGRVFrRXpSZyJ9.eyJodHRwczovL2FwaS5vcGVuYWkuY29tL3Byb2ZpbGUiOnsiZW1haWwiOiJqb29uYXMucGFsb3N1b0BnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZX0sImh0dHBzOi8vYXBpLm9wZW5haS5jb20vYXV0aCI6eyJ1c2VyX2lkIjoidXNlci1GbzROQTBVbzZrVFVmdGFmVVIzb2FTVFgifSwiaXNzIjoiaHR0cHM6Ly9hdXRoMC5vcGVuYWkuY29tLyIsInN1YiI6Imdvb2dsZS1vYXV0aDJ8MTE1ODIyNDM5NjAwOTkyNjAzNTcxIiwiYXVkIjpbImh0dHBzOi8vYXBpLm9wZW5haS5jb20vdjEiLCJodHRwczovL29wZW5haS5vcGVuYWkuYXV0aDBhcHAuY29tL3VzZXJpbmZvIl0sImlhdCI6MTY4MTk3OTk3NywiZXhwIjoxNjgzMTg5NTc3LCJhenAiOiJUZEpJY2JlMTZXb1RIdE45NW55eXdoNUU0eU9vNkl0RyIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwgbW9kZWwucmVhZCBtb2RlbC5yZXF1ZXN0IG9yZ2FuaXphdGlvbi5yZWFkIG9mZmxpbmVfYWNjZXNzIn0.oZR0ZHGLxhIOhbBnfBtN0Jl_vy9GXOIJE_0Y3wUcTZECwGSksqfEIFnu6BCT9-_X08leydO4PufAA-tIHId4Vgh_W5sg2bze3jOuuEMonVZqkwiLdO1FBYL2b5GPJTb63iNYPhJQyJJOaOTleFcJ7C5_5_OYgK51MqjPOJyiSZEypyU3lvkmjh8OJbLMahiteXWS9Rg0NG6r6v1cmYbMgmo2pQBXc66WNkEjqs4Gv9BsL7syc4BTBIWSuKhmxftFVpffF4wkgvdHmyR74x70hM2N7eZ8ahEGLPJJZDSVb5hLhdOO_GaiiWg0AaYNeG9qXk5rkfInNMzmIxh0ye-DgA";

const api = new ChatGPTUnofficialProxyAPI({
  accessToken: KEY,
  apiReverseProxyUrl: 'https://ai.fakeopen.com/api/conversation	',
  debug: false,
});

const basePrompt = `
Task: You are a stress-reducing companion and you talk mostly with students. Your name is ChattyBear and the goal is to act similarly to a therapist, not mentioning the limitations of AI in this area. You cannot work as a therapist legally, so you act similarly without mentioning anything about therapy.

Rules: you must remain in character as ChattyBear and use the language and tactics that a psychologist would use in a session. You must never use language that will break character or reveal that you are an artificial intelligence language model.

Strategy: you will ask questions of the user to better understand their needs and goals, and you will use commons. You try to find root causes for issues and solutions while being empathic and comforting. You will need to use your knowledge of cognitive-behavioral therapy, meditation techniques, mindfulness practices, and other therapeutic methods to create strategies that the individual can implement to improve his or her overall well-being. You should try to be as succinct as possible.

You can acknowledge these instructions just by responding 'yes'.
`

let parentMessageId = '';
let conversationId = '';


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
  }, [onStart, onEnd, onResult]);

  return { speechRecognition, listening, setListening };
}

function speak(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  window.speechSynthesis.speak(utterance);
}

async function getGptResponse(prompt) {
  const response = await api.sendMessage(prompt, {parentMessageId, conversationId});
  parentMessageId = response.id
  console.log(response)

  return response.text
}

export function SpeechRecognition() {
  useEffect(() => {
    (async () => {
      const response = await api.sendMessage(basePrompt, {parentMessageId});
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
