import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line,
} from 'recharts';
import { FiDollarSign, FiUser, FiBarChart2, FiList } from 'react-icons/fi';
import { regionsAPI } from '../services/api';
import { formatCurrency, formatAxisAmount } from '../utils/format';
import './RegionDetail.css';

const SECTOR_COLORS = {
  'Sanidad': '#EF4444', 'Educación': '#3B82F6', 'Infraestructuras': '#F59E0B',
  'Servicios Sociales': '#8B5CF6', 'Cultura y Deporte': '#EC4899', 'Medio Ambiente': '#10B981',
};

function RegionDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRegion = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await regionsAPI.getById(id);
        setData(res.data);
      } catch (err) {
        console.error('Error cargando región:', err);
        setError('No se pudo cargar la comunidad autónoma. Inténtalo de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchRegion();
  }, [id]);

  // Datos por sector para el último año
  const sectorData = useMemo(() => {
    if (!data?.budgetSummary) return [];
    const latestYear = Math.max(...data.budgetSummary.map(b => b._id.year));
    return data.budgetSummary
      .filter(b => b._id.year === latestYear)
      .map(b => ({ sector: b._id.sector, total: b.total }))
      .sort((a, b) => b.total - a.total);
  }, [data]);

  // Datos de evolución anual
  const yearlyData = useMemo(() => {
    if (!data?.yearlyTotals) return [];
    return [...data.yearlyTotals].sort((a, b) => a.year - b.year);
  }, [data]);

  // Total para porcentajes de la tabla
  const sectorTotal = useMemo(() => {
    return sectorData.reduce((s, r) => s + r.total, 0);
  }, [sectorData]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="detail-loading">Cargando datos de la comunidad autónoma...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="page-container">
        {error && <p style={{ color: 'var(--danger)', marginBottom: 'var(--spacing-md)' }}>{error}</p>}
        <p>Región no encontrada</p>
        <Link to="/regiones">← Volver a regiones</Link>
      </div>
    );
  }

  const { region } = data;
  const latestTotal = yearlyData.length > 0 ? yearlyData[yearlyData.length - 1].total : 0;
  const perCapita = region.population > 0 ? Math.round(latestTotal / region.population) : 0;

  return (
    <div className="page-container">
      <Link to="/regiones" className="back-link">← Volver a comunidades</Link>

      <header className="detail-header">
        <div>
          <h1>{region.name}</h1>
          <span className="region-type-badge">{region.type === 'comunidad_autonoma' ? 'Comunidad Autónoma' : 'País'}</span>
        </div>
        <div className="detail-meta">
          <div className="meta-item">
            <span className="meta-label">Código</span>
            <span className="meta-value">{region.code}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Población</span>
            <span className="meta-value">{region.population?.toLocaleString('es-ES')}</span>
          </div>
          <div className="meta-item">
            <span className="meta-label">Superficie</span>
            <span className="meta-value">{region.area_km2?.toLocaleString('es-ES')} km²</span>
          </div>
        </div>
      </header>

      {/* KPIs de la región */}
      <div className="detail-kpis">
        <div className="detail-kpi">
          <span className="kpi-icon"><FiDollarSign size={20} /></span>
          <div>
            <span className="kpi-title">Presupuesto Total</span>
            <span className="kpi-value">{formatCurrency(latestTotal)}</span>
          </div>
        </div>
        <div className="detail-kpi">
          <span className="kpi-icon"><FiUser size={20} /></span>
          <div>
            <span className="kpi-title">Gasto Per Cápita</span>
            <span className="kpi-value">{perCapita.toLocaleString('es-ES')} €</span>
          </div>
        </div>
        <div className="detail-kpi">
          <span className="kpi-icon"><FiBarChart2 size={20} /></span>
          <div>
            <span className="kpi-title">Sectores</span>
            <span className="kpi-value">{sectorData.length}</span>
          </div>
        </div>
      </div>

      {/* Gráficas */}
      <div className="detail-charts">
        {/* Gasto por sector */}
        <div className="chart-container">
          <h3 className="chart-title">Distribución por Sector</h3>
          <ResponsiveContainer width="100%" height={Math.max(280, sectorData.length * 42)}>
            <BarChart data={sectorData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
              <XAxis type="number" tickFormatter={formatAxisAmount} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} />
              <YAxis
                type="category"
                dataKey="sector"
                width={145}
                tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                interval={0}
              />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={26}>
                {sectorData.map((entry, idx) => (
                  <Cell key={idx} fill={SECTOR_COLORS[entry.sector] || '#6366F1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Evolución temporal */}
        <div className="chart-container">
          <h3 className="chart-title">Evolución del Presupuesto</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={yearlyData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
              <YAxis tickFormatter={formatAxisAmount} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v)} />
              <Line type="monotone" dataKey="total" stroke="var(--primary)" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tabla de datos */}
      <div className="detail-table-container">
        <h3 className="chart-title"><FiList size={16} /> Desglose por Sector y Año</h3>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Sector</th>
                <th>Presupuesto</th>
                <th>% del Total</th>
              </tr>
            </thead>
            <tbody>
              {sectorData.map((row, idx) => (
                  <tr key={idx}>
                    <td>
                      <span className="sector-dot" style={{ background: SECTOR_COLORS[row.sector] || '#6366F1' }} />
                      {row.sector}
                    </td>
                    <td className="amount-cell">{formatCurrency(row.total)}</td>
                    <td className="pct-cell">{((row.total / sectorTotal) * 100).toFixed(1)}%</td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RegionDetail;
