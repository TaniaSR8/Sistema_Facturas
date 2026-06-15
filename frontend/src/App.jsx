import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import PrincipalSuperAdmin from './pages/PrincipalSuperAdmin';
import PerfilSuperAdmin from './pages/PerfilSuperAdmin';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/usuarios" replace />} />
        <Route path="/usuarios" element={<PrincipalSuperAdmin />} />
        <Route path="/perfil" element={<PerfilSuperAdmin />} />
      </Routes>
    </Router>
  );
}

export default App;