import React from 'react';
import '../css/ModalCerrarSesion.css'



function ModalCerrarSesion({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="logout-modal-overlay" onClick={onClose}>
      <div className="logout-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="logout-modal-header">
          {/* Espacio para diseño o icono opcional */}
        </div>
        
        <div className="logout-modal-body">
          <h2>¿Deseas cerrar sesión?</h2>
        </div>

        <div className="logout-modal-actions">
          <button className="btn-logout-cancelar" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn-logout-aceptar" onClick={onConfirm}>
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalCerrarSesion;