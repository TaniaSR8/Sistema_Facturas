import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import FrontAdminPrincipal from "./pages/front_adminPrincipal.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FrontAdminPrincipal />} />
        <Route path="/admin" element={<FrontAdminPrincipal />} />
      </Routes>
    </Router>
  );
}

export default App;
