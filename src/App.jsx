import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import './App.css';

// Lazy load de páginas pesadas para reducir el bundle inicial
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Regions = lazy(() => import('./pages/Regions'));
const RegionDetail = lazy(() => import('./pages/RegionDetail'));
const About = lazy(() => import('./pages/About'));
const Financiacion = lazy(() => import('./pages/Financiacion'));
const Europa = lazy(() => import('./pages/Europa'));

const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner" />
  </div>
);

/* Redirige a / si el usuario ya está autenticado */
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
      <Router>
        <AppShell />
      </Router>
    </AuthProvider>
    </ErrorBoundary>
  );
}

function AppShell() {
  const location = useLocation();

  return (
    <div className="app">
      <a href="#main-content" className="skip-link">Saltar al contenido principal</a>
      <Navbar />
      <main id="main-content" className="main-content">
        <div key={location.pathname} className="route-transition">
          <Suspense fallback={<PageLoader />}>
            <Routes location={location}>
              {/* Rutas públicas — redirigen a / si ya autenticado */}
              <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
              <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

              {/* Rutas protegidas — requieren autenticación */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/regiones" element={<ProtectedRoute><Regions /></ProtectedRoute>} />
              <Route path="/regiones/:id" element={<ProtectedRoute><RegionDetail /></ProtectedRoute>} />
              <Route path="/about" element={<ProtectedRoute><About /></ProtectedRoute>} />
              <Route path="/financiacion" element={<ProtectedRoute><Financiacion /></ProtectedRoute>} />
              <Route path="/europa" element={<ProtectedRoute><Europa /></ProtectedRoute>} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
}

export default App;
