// MermaidDiagram.jsx
import React, { useLayoutEffect, useRef } from 'react';
import mermaid from 'mermaid';

const MermaidDiagram = ({ chart }) => {
  const containerRef = useRef(null);

  // Inicialización de Mermaid (asegúrate de que se haga antes de renderizar)
  useLayoutEffect(() => {
    mermaid.initialize({
      startOnLoad: true, // Iniciar la librería de Mermaid cuando se carga la página
    });
  }, []);

  useLayoutEffect(() => {
    if (chart && containerRef.current) {
      try {
        // Renderizar el diagrama y asignar el SVG generado al contenedor
        mermaid.mermaidAPI.render('generatedDiagram', chart, (svgCode) => {
          if (containerRef.current) {
            containerRef.current.innerHTML = svgCode;
          }
        });
      } catch (error) {
        // Manejar el error si ocurre
        if (containerRef.current) {
          containerRef.current.innerHTML = '<p>Error al renderizar el diagrama</p>';
        }
      }
    }
  }, [chart]);

  return <div ref={containerRef} />;
};

export default MermaidDiagram;
