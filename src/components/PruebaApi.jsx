// App.jsx
import React, { useState } from 'react';

function App() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/openai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      // Verifica que la respuesta tenga el array "choices" y actualiza el estado con el texto de la primera opción
      if (data) {
        setResponse(data.response);
      } else {
        setResponse("No se encontró respuesta en la API.");
      }
    } catch (error) {
      console.error("Error:", error);
      setResponse("Error al generar la respuesta.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Prueba de la API de OpenAI</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Ingresa tu prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          style={{ width: '300px', padding: '8px' }}
        />
        <button type="submit" style={{ marginLeft: '10px', padding: '8px 16px' }}>
          Enviar
        </button>
      </form>
      <div style={{ marginTop: '20px' }}>
        <h2>Respuesta:</h2>
        <p>{response}</p>
      </div>
    </div>
  );
}

export default App;
