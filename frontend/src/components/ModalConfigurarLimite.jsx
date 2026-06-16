import React, { useState } from 'react';
import '../css/ModalConfigurarLimite.css';

const ModalConfigurarLimite = ({ estaAbierto, alCerrar, limiteActual }) => {
  // 'montoLimite' es la variable que guarda lo que el usuario escribe
  const [montoLimite, setMontoLimite] = useState(limiteActual || '');

  if (!estaAbierto) return null;

  const guardarCambios = () => {
    console.log("Guardando nuevo límite:", montoLimite);
    // Aquí es donde en el futuro pondrás tu conexión al servidor
    alCerrar();
  };

  return (
    <div className="configurar-limite-overlay">
      <div className="configurar-limite-content">
        <div className="configurar-limite-header">
          <h2>Configurar límite de facturación empresarial</h2>
          <button className="boton-cerrar" onClick={alCerrar}>×</button>
        </div>

        <div className="grupo-formulario">
          <label>MONTO LÍMITE *</label>
          <div className="entrada-con-simbolo">
            <span>$</span>
            <input 
              type="number" 
              value={montoLimite} 
              onChange={(e) => setMontoLimite(e.target.value)} 
              placeholder="1000000"
            />
          </div>
          <small className="texto-ayuda">Este límite notificará al administrador al alcanzar el 90%.</small>
        </div>

        <div className="caja-info-limite">
          <p>ⓘ Configurar un límite ayuda a mantener el control fiscal sobre los gastos operativos mensuales y previene excesos presupuestarios.</p>
        </div>

        <div className="acciones-modal">
          <button className="boton-cancelar" onClick={alCerrar}>Cancelar</button>
          <button className="boton-guardar" onClick={guardarCambios}>Guardar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalConfigurarLimite;