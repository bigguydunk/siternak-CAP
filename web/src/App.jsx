import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginPage from './pages/auth/LoginPage';
import DashboardAdmin from './pages/admin/DashboardAdmin';
import DetailPermintaanAdmin from './pages/admin/DetailPermintaanAdmin';
import PetugasListPage from './pages/admin/PetugasListPage';
import SemenPage from './pages/admin/SemenPage';
import DashboardPetugas from './pages/petugas/DashboardPetugas';
import DetailTugasPetugas from './pages/petugas/DetailTugasPetugas';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Admin */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<DashboardAdmin />} />
            <Route path="/admin/permintaan/:id" element={<DetailPermintaanAdmin />} />
            <Route path="/admin/petugas" element={<PetugasListPage />} />
            <Route path="/admin/semen" element={<SemenPage />} />
          </Route>

          {/* Petugas */}
          <Route element={<ProtectedRoute requiredRole="petugas" />}>
            <Route path="/petugas" element={<DashboardPetugas />} />
            <Route path="/petugas/tugas/:laporan_id" element={<DetailTugasPetugas />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
