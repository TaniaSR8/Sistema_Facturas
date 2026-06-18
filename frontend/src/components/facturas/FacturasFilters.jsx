import { ESTADOS_FACTURA, TIPOS_GASTO } from '../../constants/facturas.js';

/**
 * @param {{
 *   filtros: import('../../types/factura.js').FiltrosFacturas,
 *   onChange: (filtros: Partial<import('../../types/factura.js').FiltrosFacturas>) => void
 * }} props
 */
export default function FacturasFilters({ filtros, onChange }) {
  return (
    <section className="filters-section" aria-label="Filtros de búsqueda">
      <div className="filter-group">
        <label htmlFor="filtro-estado">Estado</label>
        <select
          id="filtro-estado"
          className="filter-select"
          value={filtros.estado}
          onChange={(e) => onChange({ estado: e.target.value })}
        >
          {ESTADOS_FACTURA.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="filtro-gasto">Tipo de Gasto</label>
        <select
          id="filtro-gasto"
          className="filter-select"
          value={filtros.tipoGasto}
          onChange={(e) => onChange({ tipoGasto: e.target.value })}
        >
          {TIPOS_GASTO.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label>Rango de Fechas</label>
        <div className="date-range-container">
          <input
            type="date"
            className="filter-date"
            value={filtros.fechaDesde}
            onChange={(e) => onChange({ fechaDesde: e.target.value })}
            aria-label="Fecha desde"
          />
          <span className="date-separator">a</span>
          <input
            type="date"
            className="filter-date"
            value={filtros.fechaHasta}
            onChange={(e) => onChange({ fechaHasta: e.target.value })}
            aria-label="Fecha hasta"
          />
        </div>
      </div>
    </section>
  );
}
