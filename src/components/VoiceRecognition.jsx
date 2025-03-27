import React, { useState, useEffect, useRef } from "react";
import "./VoiceRecognition.css";

function VoiceRecognition() {
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [gainValue, setGainValue] = useState(1.5);
  const [audioContext, setAudioContext] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const recognitionRef = useRef(null);

  // Detección simple de dispositivo móvil
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  useEffect(() => {
    // Crear AudioContext y nodo de ganancia
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

  const startRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta la API de Reconocimiento de Voz.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    // En móviles se desactiva el modo continuo para forzar la finalización de cada frase
    recognition.continuous = !isMobile;
    recognition.interimResults = true;
    recognition.lang = "es-ES";
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
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
        // Reiniciar después de un breve delay si no se detecta voz
        setTimeout(() => {
          if (isListening) {
            recognition.start();
          }
        }, 500);
      }
    };

    recognition.onend = () => {
      // En móviles, se detiene al final de cada frase, por lo que reiniciamos si aún se quiere escuchar
      if (isListening) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;

    // Solicitar acceso al micrófono con mejoras para ambientes ruidosos
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
        // No conectamos a audioContext.destination para evitar retroalimentación.
      })
      .catch((err) => {
        console.error("Error al acceder al micrófono:", err);
      });
  };

  const stopRecognition = () => {
    setIsListening(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  };

  const clearTranscription = () => {
    setFinalTranscript("");
    setInterimTranscript("");
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
        <button
          onClick={startRecognition}
          disabled={isListening}
          className="btn start"
        >
          {isListening ? "Escuchando..." : "Iniciar"}
        </button>
        <button
          onClick={stopRecognition}
          disabled={!isListening}
          className="btn stop"
        >
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
          {finalTranscript} <span className="interim">{interimTranscript}</span>
        </p>
      </div>
    </div>
  );
}

export default VoiceRecognition;
