import { useState, useEffect, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { FiDollarSign, FiPieChart, FiTrendingUp, FiList, FiActivity, FiArrowUpCircle, FiArrowDownCircle, FiBookmark, FiAlertCircle } from 'react-icons/fi';
import InfoTip from '../components/InfoTip';
import { ingresosAPI } from '../services/api';
import { formatMillions, formatEuros } from '../utils/format';
import BalanceChart from '../components/Charts/BalanceChart';
import './Financiacion.css';

const ESTRUCTURA_COLORS = ['#4F9EFF', '#A78BFA', '#34D399', '#FBBF24', '#F87171', '#F472B6'];

const CustomPieTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{payload[0].name}</p>
      <p className="tooltip-value">{formatMillions(payload[0].value)}</p>
      <p className="tooltip-pct">{payload[0].payload.porcentaje}% del total</p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, maxWidth: 200 }}>
        {payload[0].payload.descripcion}
      </p>
    </div>
  );
};

/* ---- Skeletons ---- */
const EstructuraSkeleton = () => (
  <div className="chart-skeleton">
    <div className="skeleton-title" />
    <div className="estructura-skeleton-layout">
      <div className="skeleton-circle" />
      <div className="estructura-skeleton-lines">
        <div className="skeleton-line-h w-full" />
        <div className="skeleton-line-h w-3of4" />
        <div className="skeleton-line-h w-full" />
        <div className="skeleton-line-h w-half" />
        <div className="skeleton-line-h w-full" />
        <div className="skeleton-line-h w-2of3" />
      </div>
    </div>
  </div>
);

const EvolucionSkeleton = () => (
  <div className="chart-skeleton">
    <div className="skeleton-title" />
    <div className="skeleton-bar-group" style={{ height: 250 }}>
      {[60, 70, 55, 80, 90].map((h, i) => (
        <div key={i} className="skeleton-bar" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

const TablaSkeleton = () => (
  <div className="chart-skeleton">
    <div className="skeleton-title" />
    {Array.from({ length: 8 }).map((_, i) => (
      <div key={i} className="skeleton-line-h w-full" style={{ height: 16, marginBottom: 12 }} />
    ))}
  </div>
);

function Financiacion() {
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableYears, setAvailableYears] = useState([]);
  const [balance, setBalance] = useState([]);
  const [estructura, setEstructura] = useState([]);
  const [evolucion, setEvolucion] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingEvolution, setLoadingEvolution] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('balance');

  useEffect(() => {
    const loadEvolution = async () => {
      try {
        setLoadingEvolution(true);
        const res = await ingresosAPI.byYear();
        const evolData = res.data.data || [];
        setEvolucion(evolData);

        const years = evolData.map((item) => item.year).sort((a, b) => b - a);
        setAvailableYears(years);
        if (years.length > 0) {
          setSelectedYear((prev) => prev || years[0]);
        }
      } catch (err) {
        console.error('Error cargando evolución de financiación:', err);
        setError('No se pudo cargar la evolución histórica de financiación.');
      } finally {
        setLoadingEvolution(false);
      }
    };

    loadEvolution();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;

    const loadData = async () => {
      setLoading(true);
      try {
        setError('');
        const [balRes, estRes] = await Promise.all([
          ingresosAPI.balance({ year: selectedYear }),
          ingresosAPI.estructura({ year: selectedYear }),
        ]);
        setBalance(balRes.data.data || []);
        setEstructura(estRes.data.data || []);
      } catch (err) {
        console.error('Error cargando financiación:', err);
        setError('No se pudieron cargar los datos de financiación para el año seleccionado.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [selectedYear]);

  const {
    totalIngresos,
    totalGasto,
    totalBalance,
    deficitCount,
    topSuperavit,
    topDeficit,
  } = useMemo(() => {
    const ingresos = balance.reduce((sum, row) => sum + row.ingresos, 0);
    const gasto = balance.reduce((sum, row) => sum + row.gasto, 0);
    const balanceTotal = ingresos - gasto;
    const countDeficit = balance.filter((row) => row.balance < 0).length;
    const topPositivo = [...balance].sort((a, b) => b.balance - a.balance)[0] || null;
    const topNegativo = [...balance].sort((a, b) => a.balance - b.balance)[0] || null;

    return {
      totalIngresos: ingresos,
      totalGasto: gasto,
      totalBalance: balanceTotal,
      deficitCount: countDeficit,
      topSuperavit: topPositivo,
      topDeficit: topNegativo,
    };
  }, [balance]);

  return (
    <div className="page-container">
      <header className="fin-header">
        <div className="fin-header-text">
          <h1><FiDollarSign size={24} />Financiación Autonómica</h1>
          <p>
            Ingresos (Derechos Reconocidos Netos) vs Gasto (Obligaciones Reconocidas Netas) por CCAA.
            <br />
            <span className="fin-source">
              Fuente:&nbsp;
              <a href="https://www.igae.pap.hacienda.gob.es/" target="_blank" rel="noopener noreferrer">IGAE</a>
              &nbsp;— Liquidación de Presupuestos de las Comunidades Autónomas
            </span>
          </p>
        </div>
        <select
          value={selectedYear || ''}
          onChange={e => setSelectedYear(Number.parseInt(e.target.value, 10))}
          className="year-select"
          disabled={!availableYears.length}
        >
          {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </header>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="data-disclaimer fin-methodology-disclaimer">
        <FiAlertCircle size={16} />
        <div className="methodology-text">
          <p>
            Los datos de las secciones de España y Financiación por sector y CCAA son <strong>estimaciones representativas</strong> basadas en distribuciones de los PGE; las cifras a nivel de programa dentro de cada CCAA son aproximaciones proporcionales, no liquidaciones por partida.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="fin-kpis">
        <div className="fin-kpi">
          <span className="fin-kpi-label">Total Ingresos CCAA</span>
          <span className="fin-kpi-value" style={{ color: '#10B981' }}>
            {loading ? '—' : formatMillions(totalIngresos)}
          </span>
          <span className="fin-kpi-sub">Derechos Reconocidos Netos <InfoTip text="Derechos Reconocidos Netos: importes que la Administración tiene derecho a cobrar, descontando anulaciones y devoluciones." size={11} /></span>
        </div>
        <div className="fin-kpi">
          <span className="fin-kpi-label">Total Gasto CCAA</span>
          <span className="fin-kpi-value" style={{ color: '#3B82F6' }}>
            {loading ? '—' : formatMillions(totalGasto)}
          </span>
          <span className="fin-kpi-sub">Obligaciones Reconocidas Netas <InfoTip text="Obligaciones Reconocidas Netas: compromisos de gasto firmes contraídos por la Administración, netos de reintegros." size={11} /></span>
        </div>
        <div className="fin-kpi">
          <span className="fin-kpi-label">Balance Agregado</span>
          <span className="fin-kpi-value" style={{ color: totalBalance >= 0 ? '#10B981' : '#EF4444' }}>
            {loading ? '—' : formatMillions(totalBalance)}
          </span>
          <span className="fin-kpi-sub">{totalBalance >= 0 ? 'Superávit' : 'Déficit'} <InfoTip text="Superávit: los ingresos superan al gasto. Déficit: el gasto supera a los ingresos." size={11} /></span>
        </div>
        <div className="fin-kpi">
          <span className="fin-kpi-label">CCAA en Déficit <InfoTip text="Número de comunidades cuyos gastos superan a sus ingresos en el ejercicio seleccionado, es decir, que presentan un balance negativo." size={11} /></span>
          <span className="fin-kpi-value" style={{ color: '#EF4444' }}>
            {loading ? '—' : deficitCount}
          </span>
          <span className="fin-kpi-sub">de {balance.length} CCAA analizadas</span>
        </div>
      </div>

      {/* Destacados */}
      {!loading && topSuperavit && topDeficit && (
        <div className="fin-highlights">
          <div className="fin-highlight superavit">
            <span className="highlight-icon"><FiArrowUpCircle size={22} color="#10B981" /></span>
            <div>
              <p className="highlight-title">Mayor superávit</p>
              <p className="highlight-region">{topSuperavit.region}</p>
              <p className="highlight-val">{formatMillions(topSuperavit.balance)}</p>
              <p className="highlight-sub">Cobertura: {topSuperavit.ratio_cobertura}% | {formatEuros(topSuperavit.per_capita_ingresos)}/hab</p>
            </div>
          </div>
          <div className="fin-highlight deficit">
            <span className="highlight-icon"><FiArrowDownCircle size={22} color="#EF4444" /></span>
            <div>
              <p className="highlight-title">Mayor déficit</p>
              <p className="highlight-region">{topDeficit.region}</p>
              <p className="highlight-val">{formatMillions(topDeficit.balance)}</p>
              <p className="highlight-sub">Cobertura: {topDeficit.ratio_cobertura}% | {formatEuros(topDeficit.per_capita_ingresos)}/hab</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="fin-tabs">
        {[
          { id: 'balance', label: 'Balance ingreso/gasto', icon: <FiActivity size={14} /> },
          { id: 'estructura', label: 'Estructura de ingresos', icon: <FiPieChart size={14} /> },
          { id: 'evolucion', label: 'Evolución histórica', icon: <FiTrendingUp size={14} /> },
          { id: 'tabla', label: 'Tabla detallada', icon: <FiList size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className={`fin-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido por tab */}
      <div className="fin-content">
        {activeTab === 'balance' && (
          <BalanceChart data={balance} loading={loading} />
        )}

        {activeTab === 'estructura' && (
          <div className="chart-container">
            <h3 className="chart-title"><FiPieChart size={16} /> Estructura de Ingresos Autonómicos {selectedYear} <InfoTip text="Desglose de las fuentes de ingreso de las CCAA: tributos propios, impuestos cedidos, transferencias del Estado y fondos europeos." /></h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Desglose por capítulos económicos. Fuente: IGAE Liquidación CCAA
            </p>
            {loading ? (
              <EstructuraSkeleton />
            ) : (
              <div className="estructura-layout">
                <div className="estructura-chart">
                  <ResponsiveContainer width="100%" height={320}>
                    <PieChart>
                      <Pie
                        data={estructura}
                        dataKey="valor"
                        nameKey="nombre"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={120}
                        paddingAngle={2}
                      >
                        {estructura.map((entry, i) => (
                          <Cell key={i} fill={ESTRUCTURA_COLORS[i % ESTRUCTURA_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="estructura-legend">
                  {estructura.map((item, i) => (
                    <div key={i} className="est-item">
                      <div className="est-color" style={{ background: ESTRUCTURA_COLORS[i] }} />
                      <div>
                        <p className="est-nombre">{item.nombre}</p>
                        <p className="est-detalle">{item.descripcion}</p>
                        <p className="est-val">
                          <strong>{formatMillions(item.valor)}</strong> — {item.porcentaje}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'evolucion' && (
          <div className="chart-container">
            <h3 className="chart-title"><FiTrendingUp size={16} /> Evolución Total de Ingresos Autonómicos (2019-2023) <InfoTip text="Progresión interanual de los ingresos de todas las CCAA desglosados por capítulos económicos." /></h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Suma de Derechos Reconocidos Netos de todas las CCAA. Fuente: IGAE
            </p>
            {loadingEvolution || evolucion.length === 0 ? (
              <EvolucionSkeleton />
            ) : (
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={evolucion} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} />
                  <YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={45} />
                  <Tooltip
                    formatter={(v, n) => [formatMillions(v), n === 'total' ? 'Total ingresos' : n]}
                    contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                    labelStyle={{ color: 'var(--text-primary)' }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                    iconSize={8}
                  />
                  <Line type="monotone" dataKey="total" name="Total ingresos" stroke="#34D399" strokeWidth={3} dot={{ r: 4, fill: '#34D399' }} />
                  <Line type="monotone" dataKey="impuestos_directos" name="Imp. directos" stroke="#4F9EFF" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="impuestos_indirectos" name="Imp. indirectos" stroke="#A78BFA" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="transferencias_corrientes" name="Transf. corrientes" stroke="#FBBF24" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === 'tabla' && (
          <div className="chart-container">
            <h3 className="chart-title"><FiList size={16} /> Tabla de Balance por CCAA — {selectedYear} <InfoTip text="Comparativa detallada de ingresos vs gasto de cada CCAA, con ratio de cobertura e indicadores per cápita." /></h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 16 }}>
              Todos los valores en millones de euros (M€). Fuente: IGAE Liquidación CCAA
            </p>
            {loading ? (
              <TablaSkeleton />
            ) : (
              <div className="fin-table-wrapper">
                <table className="fin-table">
                  <thead>
                    <tr>
                      <th>CCAA</th>
                      <th className="text-right">Ingresos (M€)</th>
                      <th className="text-right">Gasto (M€)</th>
                      <th className="text-right">Balance (M€)</th>
                      <th className="text-right">Cobertura</th>
                      <th className="text-right">Ing./hab</th>
                      <th className="text-right">Gasto/hab</th>
                    </tr>
                  </thead>
                  <tbody>
                    {balance.map((row, i) => (
                      <tr key={i} className={row.balance >= 0 ? 'row-superavit' : 'row-deficit'}>
                        <td><strong>{row.region}</strong></td>
                        <td className="text-right" style={{ color: '#10B981' }}>{row.ingresos.toFixed(0)}</td>
                        <td className="text-right" style={{ color: '#3B82F6' }}>{row.gasto.toFixed(0)}</td>
                        <td className="text-right" style={{ color: row.balance >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                          {row.balance >= 0 ? '+' : ''}{row.balance.toFixed(0)}
                        </td>
                        <td className="text-right">
                          <span className={`coverage-badge ${row.ratio_cobertura >= 100 ? 'green' : 'red'}`}>
                            {row.ratio_cobertura}%
                          </span>
                        </td>
                        <td className="text-right">{formatEuros(row.per_capita_ingresos)}</td>
                        <td className="text-right">{formatEuros(row.per_capita_gasto)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="table-total">
                      <td><strong>TOTAL</strong></td>
                      <td className="text-right" style={{ color: '#10B981' }}><strong>{totalIngresos.toFixed(0)}</strong></td>
                      <td className="text-right" style={{ color: '#3B82F6' }}><strong>{totalGasto.toFixed(0)}</strong></td>
                      <td className="text-right" style={{ color: totalBalance >= 0 ? '#10B981' : '#EF4444', fontWeight: 700 }}>
                        <strong>{totalBalance >= 0 ? '+' : ''}{totalBalance.toFixed(0)}</strong>
                      </td>
                      <td colSpan={3} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nota metodológica */}
      <div className="fin-nota">
        <h4><FiBookmark size={14} /> Nota metodológica</h4>
        <p>
          Los <strong>Ingresos</strong> corresponden a los Derechos Reconocidos Netos No Financieros
          (capítulos 1-5 y 7), que incluyen tributos propios y cedidos, tasas, transferencias del Estado
          y fondos europeos. El <strong>Gasto</strong> corresponde al gasto presupuestado real de cada CCAA
          en los sectores analizados (educación, sanidad, infraestructuras, etc.) extraído de la colección
          principal de presupuestos.
        </p>
        <p>
          <strong>País Vasco y Navarra</strong> tienen régimen foral: recaudan todos los tributos en su
          territorio y realizan una aportación/cupo al Estado, lo que explica su mayor porcentaje de
          ingresos tributarios y menor dependencia de transferencias estatales.
        </p>
        <p>
          Fuente oficial: <strong>IGAE (Intervención General de la Administración del Estado)</strong>
          &nbsp;(<a href="https://www.igae.pap.hacienda.gob.es/" target="_blank" rel="noopener noreferrer">web oficial</a>).
          Publicación: "Liquidación de los Presupuestos de las Comunidades Autónomas". Años 2019-2023.
        </p>
      </div>
    </div>
  );
}

export default Financiacion;
