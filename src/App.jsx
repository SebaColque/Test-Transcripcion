import React, { useState, useEffect } from "react";
import "./App.css";

function App() {
  const [transcription, setTranscription] = useState(""); // Transcripción acumulada
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
    recognition.continuous = true; // Continuar reconociendo
    recognition.interimResults = true; // Mostrar resultados intermedios
    recognition.lang = "es-ES"; // Configura el idioma (español de España en este caso)
    recognition.maxAlternatives = 1; // Solo tomar la primera alternativa

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let newTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newTranscript += event.results[i][0].transcript;
        }
      }

      if (newTranscript && !transcription.includes(newTranscript)) {
        setTranscription((prevTranscription) => prevTranscription + " " + newTranscript);
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
    };

    recognition.onend = () => {
      if (isListening) {
        console.log("Reconocimiento terminado. Reiniciando...");
        recognition.start(); // Reiniciar reconocimiento en caso de que se termine inesperadamente
      } else {
        setIsListening(false);
      }
    };

    // Ajuste del tiempo de inactividad y timeout
    recognition.start();

    // Obtener el micrófono y pasar la señal de audio al contexto de audio
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const microphoneStream = audioContext.createMediaStreamSource(stream);
        microphoneStream.connect(gainNode);
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

  const clearTranscription = () => {
    setTranscription(""); // Limpiar la transcripción
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
          max="3.0"
          step="0.1"
          value={gainValue}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
        <span>{gainValue}</span>
      </div>

      {/* Botón para borrar la transcripción */}
      <div className="clear-btn">
        <button onClick={clearTranscription}>Borrar Transcripción</button>
      </div>

      <div className="output">
        <p>{transcription || "Lo que digas aparecerá aquí..."}</p>
      </div>
    </div>
  );
}

export default App;
