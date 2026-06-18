import { useState } from 'react';
import { NAV_ITEMS } from '../../constants/facturas.js';
import { IconLogo, IconLogout, NavIcon, IconMenu, IconClose } from '../ui/Icons.jsx';

export default function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  const toggleMenu = () => setMenuAbierto((prev) => !prev);
  const cerrarMenu = () => setMenuAbierto(false);

  return (
    <>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleMenu}
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={menuAbierto}
      >
        {menuAbierto ? <IconClose /> : <IconMenu />}
      </button>

      {menuAbierto && (
        <div className="sidebar-overlay" onClick={cerrarMenu} aria-hidden="true" />
      )}

      <aside className={`sidebar ${menuAbierto ? 'sidebar--open' : ''}`}>
        <div className="sidebar-header">
          <span className="icon-logo"><IconLogo /></span>
          <span className="sidebar-title">Sistema de Control de Facturas</span>
        </div>

        <nav className="sidebar-nav" aria-label="Navegación principal">
          <ul>
            {NAV_ITEMS.map((item) => (
              <li
                key={item.id}
                className={item.active ? 'active' : ''}
                onClick={cerrarMenu}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && cerrarMenu()}
              >
                <span className="icon-nav"><NavIcon name={item.icon} /></span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button type="button" className="logout-btn" onClick={cerrarMenu}>
            <span className="icon-nav"><IconLogout /></span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
