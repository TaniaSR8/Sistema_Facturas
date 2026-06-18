import MainLayout from '../components/layout/MainLayout.jsx';
import FacturasFilters from '../components/facturas/FacturasFilters.jsx';
import FacturasTable from '../components/facturas/FacturasTable.jsx';
import FacturasPagination from '../components/facturas/FacturasPagination.jsx';
import { useFacturas } from '../hooks/useFacturas.js';
import '../css/front_adminPrincipal.css';

const AdminPrincipal = () => {
  const {
    facturas,
    filtros,
    pagina,
    total,
    totalPaginas,
    porPagina,
    loading,
    error,
    actualizarFiltros,
    irAPagina,
  } = useFacturas();

  return (
    <MainLayout>
      <header className="main-header">
        <div className="welcome-banner">
          <h1>Bienvenido</h1>
        </div>
        <p className="welcome-subtitle">
          Administre y valide los comprobantes fiscales de la organización.
        </p>
      </header>

      <FacturasFilters filtros={filtros} onChange={actualizarFiltros} />

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <section className="table-card">
        <FacturasTable facturas={facturas} loading={loading} />

        {!loading && (
          <FacturasPagination
            pagina={pagina}
            total={total}
            porPagina={porPagina}
            totalPaginas={totalPaginas}
            onPageChange={irAPagina}
          />
        )}
      </section>
    </MainLayout>
  );
};

export default AdminPrincipal;
