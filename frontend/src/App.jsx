import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from './pages/Login'


function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigir la raíz a login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Pantalla de login */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;