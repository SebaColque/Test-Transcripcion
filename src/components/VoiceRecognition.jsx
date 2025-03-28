// VoiceRecognition.jsx
import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from 'react-markdown';
import "./VoiceRecognition.css";
import MermaidDiagram from "./MermaidDiagram";

function VoiceRecognition() {
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [refinedTranscript, setRefinedTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [gainValue, setGainValue] = useState(1.5);
  const [audioContext, setAudioContext] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [diagram, setDiagram] = useState("");
  const recognitionRef = useRef(null);

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);
    const gain = context.createGain();
    gain.gain.value = gainValue;
    setGainNode(gain);
  }, []);

  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = gainValue;
    }
  }, [gainValue, gainNode]);

  // Función para refinar la transcripción
  const refineTranscript = async (text) => {
    try {
      const res = await fetch("http://localhost:5000/api/refine-transcript", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: text }),
      });
      const data = await res.json();
      setRefinedTranscript(data.refinedText);
    } catch (error) {
      console.error("Error refinando transcripción:", error);
    }
  };

  // Uso de debounce: si finalTranscript cambia, espera 5 segundos de inactividad para refinar
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (finalTranscript.trim().length > 0) {
        refineTranscript(finalTranscript);
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [finalTranscript]);

  const startRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta la API de Reconocimiento de Voz.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "es-ES";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      setFinalTranscript("");
      setInterimTranscript("");
      setRefinedTranscript("");
      setDiagram("");
    };

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setFinalTranscript((prev) => prev + " " + final);
      }
      setInterimTranscript(interim);
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
      if (event.error === "no-speech") {
        setTimeout(() => {
          if (isListening) {
            recognition.start();
          }
        }, 500);
      }
    };

    recognition.onend = () => {
      if (isListening) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    })
      .then((stream) => {
        const microphoneStream = audioContext.createMediaStreamSource(stream);
        microphoneStream.connect(gainNode);
      })
      .catch((err) => {
        console.error("Error al acceder al micrófono:", err);
      });
  };

  const generateDiagram = async (transcriptText) => {
    try {
      const res = await fetch("http://localhost:5000/api/generate-diagram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ transcript: transcriptText }),
      });
      const data = await res.json();
      setDiagram(data.diagram);
    } catch (error) {
      console.error("Error generando diagrama:", error);
      setDiagram("Error generando diagrama.");
    }
  };

  const stopRecognition = async () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (finalTranscript.trim().length > 0) {
      await refineTranscript(finalTranscript);
    //   await generateDiagram(finalTranscript);
    }
  };

  const clearTranscription = () => {
    setFinalTranscript("");
    setInterimTranscript("");
    setRefinedTranscript("");
    setDiagram("");
  };

  const handleVolumeChange = (e) => {
    setGainValue(parseFloat(e.target.value));
  };

  return (
    <div className="voice-container">
      <header>
        <h1>Transcripción en Tiempo Real</h1>
      </header>
      <div className="controls">
        <button onClick={startRecognition} disabled={isListening} className="btn start">
          {isListening ? "Escuchando..." : "Iniciar"}
        </button>
        <button onClick={stopRecognition} disabled={!isListening} className="btn stop">
          Detener
        </button>
        <button onClick={clearTranscription} className="btn clear">
          Borrar
        </button>
      </div>
      <div className="volume-control">
        <label htmlFor="volume">Volumen del Micrófono:</label>
        <input
          id="volume"
          type="range"
          min="0.5"
          max="3.0"
          step="0.1"
          value={gainValue}
          onChange={handleVolumeChange}
        />
        <span>{gainValue}</span>
      </div>
      <div className="transcript-box">
        <p>
          <strong>Transcripción cruda:</strong> {finalTranscript}{" "}
          <span className="interim">{interimTranscript}</span>
        </p>
      </div>
      {refinedTranscript && (
        <div className="refined-transcript-box">
          <h2>Transcripción Refinada</h2>
          <ReactMarkdown>{refinedTranscript}</ReactMarkdown>
        </div>
      )}
      {diagram && (
        <div className="diagram-box">
          <h2>Diagrama Generado</h2>
          <MermaidDiagram chart={diagram} />
        </div>
      )}
    </div>
  );
}

export default VoiceRecognition;
