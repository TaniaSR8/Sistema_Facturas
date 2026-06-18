/**
 * Genera el arreglo de números de página con elipsis.
 * @param {number} paginaActual
 * @param {number} totalPaginas
 */
function generarPaginas(paginaActual, totalPaginas) {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }

  const paginas = [1];

  if (paginaActual > 3) paginas.push('...');

  const inicio = Math.max(2, paginaActual - 1);
  const fin = Math.min(totalPaginas - 1, paginaActual + 1);

  for (let i = inicio; i <= fin; i++) {
    paginas.push(i);
  }

  if (paginaActual < totalPaginas - 2) paginas.push('...');

  paginas.push(totalPaginas);
  return paginas;
}

/**
 * @param {{
 *   pagina: number,
 *   total: number,
 *   porPagina: number,
 *   totalPaginas: number,
 *   onPageChange: (pagina: number) => void
 * }} props
 */
export default function FacturasPagination({ pagina, total, porPagina, totalPaginas, onPageChange }) {
  const inicio = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const fin = Math.min(pagina * porPagina, total);
  const paginas = generarPaginas(pagina, totalPaginas);

  return (
    <footer className="pagination-footer">
      <span className="pagination-info">
        Mostrando {inicio} - {fin} de {total} registros
      </span>

      <div className="pagination-controls">
        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(pagina - 1)}
          disabled={pagina <= 1}
          aria-label="Página anterior"
        >
          «
        </button>

        {paginas.map((p, idx) =>
          p === '...' ? (
            <span key={`ellipsis-${idx}`} className="pagination-ellipsis">…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={`pagination-btn ${p === pagina ? 'active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-label={`Página ${p}`}
              aria-current={p === pagina ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(pagina + 1)}
          disabled={pagina >= totalPaginas}
          aria-label="Página siguiente"
        >
          »
        </button>
      </div>
    </footer>
  );
}
