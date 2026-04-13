import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMap } from 'react-icons/fi';
import { regionsAPI, budgetsAPI, statsAPI } from '../services/api';
import { formatCurrency } from '../utils/format';
import './Regions.css';

function Regions() {
  const [regions, setRegions] = useState([]);
  const [regionBudgets, setRegionBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);

  // Carga inicial: obtener años disponibles y seleccionar el más reciente
  useEffect(() => {
    const loadYears = async () => {
      try {
        const yearsRes = await statsAPI.years();
        const years = yearsRes.data.sort((a, b) => b - a);
        setAvailableYears(years);
        if (years.length > 0) setSelectedYear(years[0]);
      } catch {
        // Fallback: rango estático
        const fallback = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
        setAvailableYears(fallback);
        setSelectedYear(fallback[0]);
      }
    };
    loadYears();
  }, []);

  // Cargar datos al cambiar año
  useEffect(() => {
    if (!selectedYear) return;
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [regionsRes, budgetsRes] = await Promise.all([
          regionsAPI.getAll({ type: 'comunidad_autonoma' }),
          budgetsAPI.byRegion({ year: selectedYear }),
        ]);
        setRegions(regionsRes.data);
        const budgets = budgetsRes.data;

        // Si no hay datos para este año, caer al siguiente con datos
        const hasData = budgets.some(b => b.total > 0);
        if (!hasData && availableYears.length > 0) {
          const fallbackYear = availableYears.find(y => y < selectedYear);
          if (fallbackYear) {
            setSelectedYear(fallbackYear);
            return;
          }
        }

        setRegionBudgets(budgets);
      } catch (err) {
        console.error('Error cargando regiones:', err);
        setError('No se pudieron cargar las comunidades autónomas. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear, availableYears]);

  // Combinar datos
  const regionsWithData = regions.map(r => {
    const budget = regionBudgets.find(b => b.name === r.name);
    return {
      ...r,
      total: budget?.total || 0,
      perCapita: budget?.perCapita || 0,
    };
  }).sort((a, b) => b.total - a.total);

  const maxTotal = regionsWithData.length > 0 ? Math.max(...regionsWithData.map(r => r.total)) : 1;

  return (
    <div className="page-container">
      <header className="regions-header">
        <div>
          <h1><FiMap size={24} /> Comunidades Autónomas</h1>
          <p>Explora el presupuesto asignado a cada comunidad autónoma</p>
        </div>
        <select
          value={selectedYear || ''}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          className="year-select"
          aria-label="Seleccionar año"
        >
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      {loading ? (
        <div className="regions-loading">Cargando comunidades autónomas...</div>
      ) : error ? (
        <div className="regions-loading" style={{ color: 'var(--danger)' }}>{error}</div>
      ) : (
        <div className="regions-grid">
          {regionsWithData.map(region => (
            <Link
              key={region._id}
              to={`/regiones/${region._id}`}
              className="region-card"
            >
              <div className="region-card-header">
                <h3>{region.name}</h3>
                <span className="region-code">{region.code}</span>
              </div>

              <div className="region-stats">
                <div className="region-stat">
                  <span className="stat-label">Presupuesto</span>
                  <span className="stat-value">{formatCurrency(region.total)}</span>
                </div>
                <div className="region-stat">
                  <span className="stat-label">Per cápita</span>
                  <span className="stat-value">{region.perCapita.toLocaleString('es-ES')} €</span>
                </div>
                <div className="region-stat">
                  <span className="stat-label">Población</span>
                  <span className="stat-value">{region.population?.toLocaleString('es-ES')}</span>
                </div>
              </div>

              <div className="region-bar-container">
                <div
                  className="region-bar"
                  style={{ width: `${(region.total / maxTotal) * 100}%` }}
                />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default Regions;
