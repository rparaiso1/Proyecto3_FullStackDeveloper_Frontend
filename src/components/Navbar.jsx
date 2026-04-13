import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FiBarChart2, FiMap, FiDollarSign, FiGlobe, FiInfo, FiUser, FiLogOut } from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import './Navbar.css';

function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setMenuOpen(false);
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div className="navbar-content">
        <NavLink to="/" className="navbar-brand" onClick={closeMenu} aria-label="Inicio — Transparencia del Gasto Público">
          <span className="brand-icon" aria-hidden="true"><HiOutlineBuildingLibrary size={24} /></span>
          <div className="brand-text">
            <span className="brand-title">Transparencia</span>
            <span className="brand-subtitle">Gasto Público</span>
          </div>
        </NavLink>

        {/* Hamburger button */}
        <button
          className={`hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menú de navegación"
          aria-expanded={menuOpen}
          aria-controls="main-nav-links"
        >
          <span />
          <span />
          <span />
        </button>

        <div id="main-nav-links" className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {isAuthenticated && (
            <>
              {/* ── Sección España ── */}
              <div className="nav-group">
                <span className="nav-group-label">🇪🇸 España</span>
                <div className="nav-group-links">
                  <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                    <FiBarChart2 size={15} /> Dashboard
                  </NavLink>
                  <NavLink to="/regiones" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                    <FiMap size={15} /> Regiones
                  </NavLink>
                  <NavLink to="/financiacion" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                    <FiDollarSign size={15} /> Financiación
                  </NavLink>
                </div>
              </div>

              <span className="nav-divider" />

              {/* ── Sección Europa ── */}
              <div className="nav-group">
                <span className="nav-group-label">🇪🇺 Europa</span>
                <div className="nav-group-links">
                  <NavLink to="/europa" className={({ isActive }) => isActive ? 'nav-link active eu-link' : 'nav-link eu-link'} onClick={closeMenu}>
                    <FiGlobe size={15} /> Comparativa UE
                  </NavLink>
                </div>
              </div>

              <span className="nav-divider" />

              <NavLink to="/about" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'} onClick={closeMenu}>
                <FiInfo size={15} /> Info
              </NavLink>
            </>
          )}

          {/* Auth mobile (dentro del menú desplegable) */}
          <div className="navbar-auth mobile-auth">
            {isAuthenticated ? (
              <div className="auth-info">
                <span className="user-name"><FiUser size={14} /> {user?.name}</span>
                {user?.role && user.role !== 'user' && (
                  <span className={`role-badge role-${user.role}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                )}
                <button className="btn-logout" onClick={handleLogout}><FiLogOut size={14} /> Salir</button>
              </div>
            ) : (
              <div className="auth-buttons">
                <NavLink to="/login" className="btn-login" onClick={closeMenu}>Iniciar sesión</NavLink>
                <NavLink to="/register" className="btn-register" onClick={closeMenu}>Registrarse</NavLink>
              </div>
            )}
          </div>
        </div>

        {/* Auth desktop (fuera del menú) */}
        <div className="navbar-auth desktop-auth">
          {isAuthenticated ? (
            <div className="auth-info">
              <span className="user-name"><FiUser size={14} /> {user?.name}</span>
              {user?.role && user.role !== 'user' && (
                <span className={`role-badge role-${user.role}`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
              <button className="btn-logout" onClick={handleLogout}><FiLogOut size={14} /> Salir</button>
            </div>
          ) : (
            <div className="auth-buttons">
              <NavLink to="/login" className="btn-login">Iniciar sesión</NavLink>
              <NavLink to="/register" className="btn-register">Registrarse</NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
