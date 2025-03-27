import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [transcription, setTranscription] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [gainNode, setGainNode] = useState(null);
  const [gainValue, setGainValue] = useState(1.5); // Valor inicial de amplificación

  useEffect(() => {
    // Crear el contexto de audio cuando se monta el componente
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    // Crear un nodo de ganancia para controlar el volumen
    const gain = context.createGain();
    gain.gain.value = gainValue; // Ajustamos el valor de amplificación
    setGainNode(gain);
  }, []);

  useEffect(() => {
    if (gainNode) {
      gainNode.gain.value = gainValue; // Actualizamos el valor de amplificación dinámicamente
    }
  }, [gainValue, gainNode]);

  const startRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta la API de Reconocimiento de Voz.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setTranscription(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
    };

    recognition.onend = () => {
      if (isListening) {
        console.log("Reconocimiento terminado. Reiniciando...");
        recognition.start();
      } else {
        setIsListening(false);
      }
    };

    // Empezar el proceso de reconocimiento de voz
    recognition.start();

    // Obtener el micrófono y pasar la señal de audio al contexto de audio
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        // Crear un flujo de entrada de audio
        const microphoneStream = audioContext.createMediaStreamSource(stream);

        // Conectar la entrada del micrófono al nodo de ganancia
        microphoneStream.connect(gainNode);

        // Conectar el nodo de ganancia a la salida de audio (los altavoces)
        gainNode.connect(audioContext.destination);
      })
      .catch((err) => {
        console.error("Error al acceder al micrófono:", err);
      });
  };

  const stopRecognition = () => {
    setIsListening(false);
    setTranscription("Reconocimiento detenido.");
  };

  const handleVolumeChange = (event) => {
    const value = event.target.value;
    setGainValue(value); // Cambiar el valor de amplificación
  };

  return (
    <div className="App">
      <h1>Transcripción de Voz en Tiempo Real</h1>
      <button
        onClick={startRecognition}
        disabled={isListening}
        className="start-btn"
      >
        {isListening ? "Escuchando..." : "Iniciar Reconocimiento"}
      </button>
      <button
        onClick={stopRecognition}
        disabled={!isListening}
        className="stop-btn"
      >
        Detener Reconocimiento
      </button>

      {/* Control deslizante para ajustar la amplificación */}
      <div className="volume-control">
        <label>Volumen de Micrófono: </label>
        <input
          type="range"
          min="0.5"
          max="30.0"
          step="0.1"
          value={gainValue}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span>{gainValue}</span>
      </div>

      <div className="output">
        <p>{transcription || "Lo que digas aparecerá aquí..."}</p>
      </div>
    </div>
  );
}

export default App;
