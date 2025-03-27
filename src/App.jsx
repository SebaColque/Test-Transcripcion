import React, { useState } from "react";
import "./App.css";

function App() {
  const [transcription, setTranscription] = useState("");
  const [isListening, setIsListening] = useState(false);

  const startRecognition = () => {
    // Verificar si el navegador soporta la Web Speech API
    if (!("webkitSpeechRecognition" in window)) {
      alert("Tu navegador no soporta la API de Reconocimiento de Voz.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = true; // Escuchar de forma continua
    recognition.interimResults = true; // Mostrar resultados intermedios

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      // Recoger solo el último resultado completo
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      // Solo actualizar la transcripción si el resultado es final
      if (event.results[event.results.length - 1].isFinal) {
        // Lógica para agregar puntuación
        const punctuatedTranscript = addPunctuation(transcript);

        setTranscription((prevTranscription) => {
          // Verificar si la transcripción final es diferente a la anterior
          if (prevTranscription !== punctuatedTranscript) {
            return prevTranscription + " " + punctuatedTranscript; // Acumular solo si es nuevo
          }
          return prevTranscription; // No agregar si ya es igual
        });
      }
    };

    recognition.onerror = (event) => {
      console.error("Error en el reconocimiento de voz:", event.error);
    };

    recognition.onend = () => {
      // Si el reconocimiento termina inesperadamente, reiniciamos el proceso
      if (isListening) {
        console.log("Reconocimiento terminado. Reiniciando...");
        recognition.start(); // Reinicia la escucha para que continúe
      } else {
        setIsListening(false); // Dejar de escuchar cuando el usuario lo detiene
      }
    };

    recognition.start(); // Inicia el reconocimiento
  };

  const stopRecognition = () => {
    setIsListening(false);
    setTranscription("Reconocimiento detenido.");
  };

  // Función para agregar puntuación de forma simple
  const addPunctuation = (text) => {
    let punctuatedText = text;

    // Regla para detectar preguntas y agregar signos de pregunta
    if (punctuatedText.toLowerCase().includes("¿") || punctuatedText.toLowerCase().includes("qué")) {
      punctuatedText += "?";
    }

    // Regla para detectar exclamaciones y agregar signos de exclamación
    if (punctuatedText.toLowerCase().includes("¡")) {
      punctuatedText += "!";
    }

    // Añadir punto si no hay puntuación final
    if (!punctuatedText.endsWith("?") && !punctuatedText.endsWith("!") && !punctuatedText.endsWith(".")) {
      punctuatedText += ".";
    }

    return punctuatedText;
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
      <div className="output">
        <p>{transcription || "Lo que digas aparecerá aquí..."}</p>
      </div>
    </div>
  );
}

export default App;
