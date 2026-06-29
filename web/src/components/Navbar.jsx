import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <nav style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 20px', background: '#333', color: '#fff' }}>
      <div>
        <strong>Siternak</strong> - {user.role === 'admin' ? 'Admin Panel' : 'Petugas Panel'}
      </div>
      <div style={{ display: 'flex', gap: '15px' }}>
        {user.role === 'admin' && (
          <>
            <Link to="/admin" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
            <Link to="/admin/petugas" style={{ color: '#fff', textDecoration: 'none' }}>Petugas</Link>
            <Link to="/admin/semen" style={{ color: '#fff', textDecoration: 'none' }}>Semen</Link>
          </>
        )}
        {user.role === 'petugas' && (
          <>
            <Link to="/petugas" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          </>
        )}
        <button onClick={handleLogout} style={{ background: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', textDecoration: 'underline' }}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
