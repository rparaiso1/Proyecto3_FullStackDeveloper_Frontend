import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis,
  ReferenceLine, Legend,
} from 'recharts';
import {
  FiGlobe, FiAlertCircle,
  FiBarChart2, FiPieChart, FiActivity, FiArrowUpCircle, FiArrowDownCircle,
} from 'react-icons/fi';
import { eurostatAPI } from '../services/api';
import InfoTip from '../components/InfoTip';
import './Europa.css';

/* ─── Colores y constantes ──────────────────────────────────── */
const SPAIN_CODE    = 'ES';
const EU_AGG_CODE   = 'EU27_2020';
const SPAIN_COLOR   = '#F87171';
const EU_COLOR      = '#4F9EFF';
const DEFAULT_COLOR = '#475569';
const PALETTE = ['#34D399', '#FBBF24', '#A78BFA', '#FB923C', '#F472B6', '#818CF8'];

/* ─── Tooltip — Ranking ──────────────────────────────────────── */
const RankingTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d.countryName}</p>
      <p className="tooltip-value">{d.totalPctGDP?.toFixed(1)} % del PIB</p>
      {d.rank && <p className="tooltip-pct">#{d.rank} de 27 Estados</p>}
    </div>
  );
};

/* ─── Tooltip — Sectores ─────────────────────────────────────── */
const SectorTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="tooltip-value">
          {p.name}: {p.value != null ? p.value.toFixed(1) : '—'} %
        </p>
      ))}
    </div>
  );
};

/* ─── Tooltip — Scatter ──────────────────────────────────────── */
const DebtTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d.countryName}</p>
      <p className="tooltip-value">Deuda: {d.debtPctGDP?.toFixed(1)} % PIB</p>
      <p className="tooltip-value">Déficit: {d.deficitPctGDP?.toFixed(1)} % PIB</p>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════ */
/*                         COMPONENTE                            */
/* ══════════════════════════════════════════════════════════════ */
function Europa() {
  /* ── Estado ─────────────────────────────────────────────── */
  const [expenditure, setExpenditure] = useState([]);
  const [fiscal, setFiscal]           = useState([]);
  const [meta, setMeta]               = useState({ countries: {}, cofogMap: {}, availableYears: [] });
  const [year, setYear]               = useState(null);
  const [compareCountries, setCompareCountries] = useState([SPAIN_CODE, 'DE', 'FR', 'IT']);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [activeTab, setActiveTab]     = useState('ranking');
  const [isMobile, setIsMobile]       = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  /* ── Carga inicial ──────────────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [expRes, fiscRes, metaRes] = await Promise.all([
          eurostatAPI.expenditure(),
          eurostatAPI.fiscal(),
          eurostatAPI.meta(),
        ]);
        setExpenditure(expRes.data.data);
        setFiscal(fiscRes.data.data);
        setMeta(metaRes.data);
      } catch (err) {
        console.error('Error cargando datos Eurostat:', err);
        setError('No se pudieron cargar los datos de Eurostat. Inténtalo de nuevo más tarde.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const validYears = useMemo(() => {
    const metaYears = meta.availableYears || [];
    if (!metaYears.length) return [];

    const expStats = new Map();
    const fiscStats = new Map();

    expenditure.forEach((row) => {
      const current = expStats.get(row.year) || { countries: 0, hasES: false, hasEU: false };
      if (!row.isAggregate) current.countries += 1;
      if (row.country === SPAIN_CODE && row.totalPctGDP != null) current.hasES = true;
      if (row.country === EU_AGG_CODE && row.totalPctGDP != null) current.hasEU = true;
      expStats.set(row.year, current);
    });

    fiscal.forEach((row) => {
      const current = fiscStats.get(row.year) || { hasES: false, hasEU: false };
      if (row.country === SPAIN_CODE && row.debtPctGDP != null && row.deficitPctGDP != null) current.hasES = true;
      if (row.country === EU_AGG_CODE && row.debtPctGDP != null && row.deficitPctGDP != null) current.hasEU = true;
      fiscStats.set(row.year, current);
    });

    return [...metaYears]
      .filter((y) => {
        const exp = expStats.get(y);
        const fisc = fiscStats.get(y);
        // Requiere: >=15 países con datos de gasto + datos de España.
        // El agregado UE y el fiscal UE son opcionales (Eurostat puede no publicarlos).
        return exp && exp.countries >= 15 && exp.hasES
          && fisc && fisc.hasES;
      })
      .sort((a, b) => a - b);
  }, [meta.availableYears, expenditure, fiscal]);

  useEffect(() => {
    if (!validYears.length) return;
    if (!year || !validYears.includes(year)) {
      setYear(validYears[validYears.length - 1]);
    }
  }, [validYears, year]);

  /* ── Datos filtrados por año ────────────────────────────── */
  const expYear = useMemo(
    () => expenditure.filter(d => d.year === year),
    [expenditure, year],
  );
  const fiscalYear = useMemo(
    () => fiscal.filter(d => d.year === year),
    [fiscal, year],
  );

  /* ── RANKING — todos los países por gasto total desc ───── */
  const rankingData = useMemo(() => {
    return [...expYear]
      .filter(d => !d.isAggregate)
      .sort((a, b) => (b.totalPctGDP || 0) - (a.totalPctGDP || 0))
      .map((d, i) => ({ ...d, rank: i + 1 }));
  }, [expYear]);

  /* ── Posición de España en el ranking ──────────────────── */
  const spainRank = useMemo(() => {
    const idx = rankingData.findIndex(d => d.country === SPAIN_CODE);
    return idx >= 0 ? idx + 1 : null;
  }, [rankingData]);

  /* ── SECTORIAL — comparar países seleccionados ──────────── */
  const sectorData = useMemo(() => {
    const codes = Object.keys(meta.cofogMap || {});
    return codes.map(code => {
      const row = { sector: meta.cofogMap[code]?.es || code };
      for (const cc of compareCountries) {
        const entry = expYear.find(d => d.country === cc);
        row[cc] = entry?.sectors?.[code] ?? null;
      }
      const euEntry = expYear.find(d => d.country === EU_AGG_CODE);
      row[EU_AGG_CODE] = euEntry?.sectors?.[code] ?? null;
      return row;
    });
  }, [expYear, compareCountries, meta.cofogMap]);

  const formatSectorTick = useCallback((label) => {
    if (!label) return '';
    return label.length > 18 ? `${label.slice(0, 18)}…` : label;
  }, []);

  /* ── DEUDA/DÉFICIT scatter ──────────────────────────────── */
  const debtData = useMemo(() => {
    return fiscalYear
      .filter(d => !d.isAggregate && d.debtPctGDP != null && d.deficitPctGDP != null);
  }, [fiscalYear]);

  /* ── KPI Spain vs EU-27 ─────────────────────────────────── */
  const kpis = useMemo(() => {
    const es  = expYear.find(d => d.country === SPAIN_CODE);
    const eu  = expYear.find(d => d.country === EU_AGG_CODE);
    const esF = fiscalYear.find(d => d.country === SPAIN_CODE);
    const euF = fiscalYear.find(d => d.country === EU_AGG_CODE);

    const topSpender = rankingData.length ? rankingData[0] : null;
    const lowSpender = rankingData.length ? rankingData[rankingData.length - 1] : null;

    return {
      esGasto: es?.totalPctGDP, euGasto: eu?.totalPctGDP,
      esDeuda: esF?.debtPctGDP, euDeuda: euF?.debtPctGDP,
      esDeficit: esF?.deficitPctGDP, euDeficit: euF?.deficitPctGDP,
      topSpender, lowSpender,
    };
  }, [expYear, fiscalYear, rankingData]);

  /* ── Handlers ───────────────────────────────────────────── */
  const toggleCountry = useCallback((code) => {
    setCompareCountries(prev =>
      prev.includes(code)
        ? prev.filter(c => c !== code)
        : prev.length < 6 ? [...prev, code] : prev,
    );
  }, []);

  const countryColor = useCallback((code) => {
    if (code === SPAIN_CODE)  return SPAIN_COLOR;
    if (code === EU_AGG_CODE) return EU_COLOR;
    const idx = compareCountries.indexOf(code);
    return idx >= 0 ? PALETTE[idx % PALETTE.length] : DEFAULT_COLOR;
  }, [compareCountries]);

  const getDebtPointStyle = useCallback((countryData) => {
    const isSpain = countryData.country === SPAIN_CODE;
    const exceedsLimits = countryData.debtPctGDP > 60 || countryData.deficitPctGDP < -3;

    if (isSpain) {
      return {
        fill: SPAIN_COLOR,
        radius: 7,
        haloRadius: 14,
        haloOpacity: 0.24,
      };
    }

    return {
      fill: exceedsLimits ? '#F59E0B' : DEFAULT_COLOR,
      radius: 5.6,
      haloRadius: 9,
      haloOpacity: 0.16,
    };
  }, []);

  /* ── Render ─────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="page-container">
        <div className="europa-loading">
          <div className="spinner" />
          <p>Cargando datos de Eurostat…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="europa-error">
          <FiAlertCircle size={32} />
          <p>{error}</p>
          <button style={{ marginTop: 12, padding: '8px 20px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }} onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  }

  if (!validYears.length) {
    return (
      <div className="page-container">
        <div className="europa-error">
          <FiAlertCircle size={32} />
          <p>No hay datos disponibles de Eurostat para los años consultados. Inténtalo más tarde.</p>
        </div>
      </div>
    );
  }

  const gastoDiff = (kpis.esGasto != null && kpis.euGasto != null)
    ? kpis.esGasto - kpis.euGasto : null;
  const deudaDiff = (kpis.esDeuda != null && kpis.euDeuda != null)
    ? kpis.esDeuda - kpis.euDeuda : null;
  const deficitDiff = (kpis.esDeficit != null && kpis.euDeficit != null)
    ? kpis.esDeficit - kpis.euDeficit : null;
  const euAvgRanking = expYear.find(d => d.country === EU_AGG_CODE)?.totalPctGDP;

  return (
    <div className="page-container">
      {/* ─── HEADER ─── */}
      <header className="eu-header">
        <div className="eu-header-text">
          <h1><FiGlobe size={24} /> Comparativa Europea</h1>
          <p>
            Gasto público, deuda y déficit de los 27 países de la UE (% del PIB)
            <br />
            <span className="eu-source">Fuente: Eurostat — gov_10a_exp (COFOG) · gov_10dd_edpt1</span>
          </p>
        </div>
        <select
          value={year || ''}
          onChange={e => setYear(Number(e.target.value))}
          className="eu-year-select"
        >
          {validYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </header>

      {/* ─── KPIs ─── */}
      <div className="europa-kpi-grid">
        <div className="eu-kpi-card" style={{ '--kpi-accent': 'var(--kpi-blue)' }}>
          <div className="eu-kpi-icon"><FiBarChart2 size={24} /></div>
          <div className="eu-kpi-content">
            <span className="eu-kpi-title">
              Gasto España
              <InfoTip text="Gasto público total de España como % del PIB, comparado con la media de la UE-27." size={14} />
            </span>
            <span className="eu-kpi-value">{kpis.esGasto != null ? `${kpis.esGasto.toFixed(1)}%` : '—'}</span>
            <span className="eu-kpi-sub">
              UE-27: {kpis.euGasto != null ? `${kpis.euGasto.toFixed(1)}%` : '—'}
              {gastoDiff != null && (
                <span className={`eu-kpi-diff ${gastoDiff > 0 ? 'above' : 'below'}`}>
                  {gastoDiff > 0 ? '+' : ''}{gastoDiff.toFixed(1)} pp
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="eu-kpi-card" style={{ '--kpi-accent': 'var(--kpi-purple)' }}>
          <div className="eu-kpi-icon"><FiActivity size={24} /></div>
          <div className="eu-kpi-content">
            <span className="eu-kpi-title">
              Deuda España
              <InfoTip text="Deuda pública bruta de España como % del PIB. El límite del Pacto de Estabilidad es 60%." size={14} />
            </span>
            <span className="eu-kpi-value">{kpis.esDeuda != null ? `${kpis.esDeuda.toFixed(1)}%` : '—'}</span>
            <span className="eu-kpi-sub">
              UE-27: {kpis.euDeuda != null ? `${kpis.euDeuda.toFixed(1)}%` : '—'}
              {deudaDiff != null && (
                <span className={`eu-kpi-diff ${deudaDiff > 0 ? 'above' : 'below'}`}>
                  {deudaDiff > 0 ? '+' : ''}{deudaDiff.toFixed(1)} pp
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="eu-kpi-card" style={{ '--kpi-accent': 'var(--kpi-green)' }}>
          <div className="eu-kpi-icon"><FiPieChart size={24} /></div>
          <div className="eu-kpi-content">
            <span className="eu-kpi-title">
              Déficit / Superávit
              <InfoTip text="Capacidad (+) o necesidad (−) de financiación del gobierno. Límite UE: −3% PIB." size={14} />
            </span>
            <span className="eu-kpi-value" style={{ color: kpis.esDeficit != null && kpis.esDeficit >= 0 ? '#10B981' : '#EF4444' }}>
              {kpis.esDeficit != null ? `${kpis.esDeficit.toFixed(1)}%` : '—'}
            </span>
            <span className="eu-kpi-sub">
              UE-27: {kpis.euDeficit != null ? `${kpis.euDeficit.toFixed(1)}%` : '—'}
              {deficitDiff != null && (
                <span className={`eu-kpi-diff ${deficitDiff > 0 ? 'above' : 'below'}`}>
                  {deficitDiff > 0 ? '+' : ''}{deficitDiff.toFixed(1)} pp
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="eu-kpi-card" style={{ '--kpi-accent': 'var(--kpi-orange)' }}>
          <div className="eu-kpi-icon"><FiGlobe size={24} /></div>
          <div className="eu-kpi-content">
            <span className="eu-kpi-title">
              Posición UE
              <InfoTip text="Posición de España en el ranking de gasto público total sobre PIB, de mayor a menor." size={14} />
            </span>
            <span className="eu-kpi-value">{spainRank != null ? `#${spainRank}` : '—'}</span>
            <span className="eu-kpi-sub">de {rankingData.length} Estados miembros</span>
          </div>
        </div>
      </div>

      {/* ─── HIGHLIGHTS ─── */}
      {kpis.topSpender && kpis.lowSpender && (
        <div className="eu-highlights">
          <div className="eu-highlight top-spender">
            <span className="highlight-icon"><FiArrowUpCircle size={22} color="#EF4444" /></span>
            <div>
              <p className="highlight-title">Mayor gasto público</p>
              <p className="highlight-region">{kpis.topSpender.countryName}</p>
              <p className="highlight-val">{kpis.topSpender.totalPctGDP?.toFixed(1)}% PIB</p>
            </div>
          </div>
          <div className="eu-highlight low-spender">
            <span className="highlight-icon"><FiArrowDownCircle size={22} color="#10B981" /></span>
            <div>
              <p className="highlight-title">Menor gasto público</p>
              <p className="highlight-region">{kpis.lowSpender.countryName}</p>
              <p className="highlight-val">{kpis.lowSpender.totalPctGDP?.toFixed(1)}% PIB</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── TABS ─── */}
      <div className="eu-tabs">
        {[
          { id: 'ranking', label: 'Ranking UE', icon: <FiBarChart2 size={14} /> },
          { id: 'sectores', label: 'Sectores (COFOG)', icon: <FiPieChart size={14} /> },
          { id: 'deuda', label: 'Deuda vs Déficit', icon: <FiActivity size={14} /> },
        ].map(tab => (
          <button
            key={tab.id}
            className={`eu-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════ TAB: RANKING ═══════════ */}
      {activeTab === 'ranking' && (
        <section className="europa-section fadeInSection">
          <h2 className="section-title">
            Ranking de Gasto Público en la UE
            <InfoTip text="Gasto total del gobierno como % del PIB por Estado miembro. España en rojo. La línea azul punteada es la media UE-27." />
          </h2>
          {euAvgRanking != null && (
            <p className="eu-avg-note">Media UE-27: {euAvgRanking.toFixed(1)}%</p>
          )}
          <div className="chart-container eu-ranking-chart">
            <ResponsiveContainer width="100%" height={rankingData.length * 32 + 40}>
              <BarChart data={rankingData} layout="vertical" margin={{ top: 18, right: 40, left: 5, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                  domain={[0, 'dataMax + 5']}
                  axisLine={{ stroke: 'var(--border-color)' }}
                />
                <YAxis
                  type="category"
                  dataKey="countryName"
                  tick={({ x, y, payload }) => {
                    const d = rankingData.find(r => r.countryName === payload.value);
                    const isSpain = d?.country === SPAIN_CODE;
                    return (
                      <text x={x - 4} y={y} dy={4} textAnchor="end" fontSize={12}
                        fill={isSpain ? SPAIN_COLOR : 'var(--text-secondary)'}
                        fontWeight={isSpain ? 700 : 400}>
                        {payload.value}
                      </text>
                    );
                  }}
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<RankingTooltip />} cursor={{ fill: 'rgba(79,158,255,0.06)' }} />
                {euAvgRanking != null && (
                  <ReferenceLine x={euAvgRanking} stroke={EU_COLOR} strokeDasharray="4 4" strokeWidth={2} />
                )}
                <Bar dataKey="totalPctGDP" radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={800}>
                  {rankingData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.country === SPAIN_CODE ? SPAIN_COLOR : DEFAULT_COLOR}
                      fillOpacity={entry.country === SPAIN_CODE ? 1 : 0.65}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* ═══════════ TAB: SECTORES ═══════════ */}
      {activeTab === 'sectores' && (
        <section className="europa-section fadeInSection">
          <h2 className="section-title">
            Comparativa por Sector (COFOG)
            <InfoTip text="Gasto desglosado por las 10 funciones COFOG. Selecciona hasta 6 países para comparar. La barra azul es la media UE-27." />
          </h2>

          {/* Selector de países */}
          <div className="eu-country-selector">
            <span className="eu-selector-label">Comparar países <span className="eu-selector-hint">(máx. 6)</span></span>
            <div className="country-chips">
              {Object.entries(meta.countries || {}).filter(([c]) => c !== EU_AGG_CODE).map(([code, name]) => (
                <button
                  key={code}
                  className={`country-chip ${compareCountries.includes(code) ? 'selected' : ''} ${code === SPAIN_CODE ? 'spain' : ''}`}
                  onClick={() => toggleCountry(code)}
                >
                  {name}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-container eu-sector-chart">
            <div className="eu-chart-scroll">
              <div className={`eu-chart-inner ${isMobile ? 'mobile-sector' : ''}`}>
                <ResponsiveContainer width="100%" height={isMobile ? 620 : 560}>
                  <BarChart
                    data={sectorData}
                    layout="vertical"
                    barGap={2}
                    barCategoryGap="22%"
                    margin={{ top: 10, right: 20, left: isMobile ? 10 : 26, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                      tickFormatter={(v) => `${v}%`}
                      axisLine={{ stroke: 'var(--border-color)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="sector"
                      width={isMobile ? 138 : 190}
                      tick={{ fill: 'var(--text-secondary)', fontSize: isMobile ? 10 : 11 }}
                      tickFormatter={(value) => (isMobile ? formatSectorTick(value) : value)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<SectorTooltip />} cursor={{ fill: 'rgba(79,158,255,0.06)' }} />
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                      formatter={(value) => meta.countries[value] || value}
                      iconType="circle"
                      iconSize={8}
                    />
                    {compareCountries.map((cc) => (
                      <Bar
                        key={cc}
                        dataKey={cc}
                        name={meta.countries[cc] || cc}
                        fill={countryColor(cc)}
                        radius={[0, 4, 4, 0]}
                        barSize={cc === SPAIN_CODE ? 14 : 11}
                        fillOpacity={cc === SPAIN_CODE ? 1 : 0.88}
                        stroke={cc === SPAIN_CODE ? '#FFFFFF' : undefined}
                        strokeWidth={cc === SPAIN_CODE ? 1.4 : 0}
                        animationDuration={800}
                      />
                    ))}
                    <Bar
                      dataKey={EU_AGG_CODE}
                      name="UE-27 (Media)"
                      fill={EU_COLOR}
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                      fillOpacity={0.52}
                      stroke={EU_COLOR}
                      strokeWidth={2.4}
                      strokeDasharray="4 2"
                      animationDuration={800}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla España vs UE-27 por sector */}
          <div className="eu-sector-table-wrap">
            <h3>España vs UE-27 por sector</h3>
            <table className="eu-sector-table">
              <thead>
                <tr><th>Sector</th><th>🇪🇸 España</th><th>🇪🇺 UE-27</th><th>Diferencia</th></tr>
              </thead>
              <tbody>
                {sectorData.map((row, i) => {
                  const esVal = row[SPAIN_CODE];
                  const euVal = row[EU_AGG_CODE];
                  const diff = (esVal != null && euVal != null) ? esVal - euVal : null;
                  return (
                    <tr key={i} className="row-spain">
                      <td>{row.sector}</td>
                      <td>{esVal != null ? `${esVal.toFixed(1)}%` : '—'}</td>
                      <td>{euVal != null ? `${euVal.toFixed(1)}%` : '—'}</td>
                      <td className={diff != null ? (diff > 0 ? 'above' : 'below') : ''}>
                        {diff != null ? `${diff > 0 ? '+' : ''}${diff.toFixed(1)} pp` : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ═══════════ TAB: DEUDA ═══════════ */}
      {activeTab === 'deuda' && (
        <section className="europa-section fadeInSection">
          <h2 className="section-title">
            Deuda vs Déficit
            <InfoTip text="Cada punto es un país. Eje X: deuda (% PIB), eje Y: déficit/superávit. Líneas rojas: límites del Pacto de Estabilidad (60% deuda, −3% déficit)." />
          </h2>
          <div className="chart-container eu-scatter-chart">
            <div className="eu-chart-scroll">
              <div className={`eu-chart-inner ${isMobile ? 'mobile-scatter' : ''}`}>
                <ResponsiveContainer width="100%" height={isMobile ? 520 : 480}>
                  <ScatterChart margin={{ top: 20, right: isMobile ? 20 : 40, left: isMobile ? 8 : 15, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                <XAxis
                  dataKey="debtPctGDP" type="number" name="Deuda"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                  domain={['dataMin - 10', 'dataMax + 10']}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  label={isMobile ? undefined : { value: 'Deuda pública (% PIB) →', position: 'insideBottomRight', offset: -5, fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <YAxis
                  dataKey="deficitPctGDP" type="number" name="Déficit"
                  tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                  tickFormatter={v => `${v}%`}
                  axisLine={{ stroke: 'var(--border-color)' }}
                  label={isMobile ? undefined : { value: '← Superávit / Déficit →', angle: -90, position: 'insideLeft', offset: 10, fill: 'var(--text-muted)', fontSize: 11 }}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip content={<DebtTooltip />} cursor={{ strokeDasharray: '3 3', stroke: 'var(--text-muted)' }} />
                <ReferenceLine x={60} stroke="rgba(248,113,113,0.6)" strokeDasharray="6 3" strokeWidth={1.5}
                  label={{ value: 'Límite deuda 60%', position: 'top', fill: 'rgba(248,113,113,0.8)', fontSize: 10 }} />
                <ReferenceLine y={-3} stroke="rgba(248,113,113,0.6)" strokeDasharray="6 3" strokeWidth={1.5}
                  label={{ value: 'Límite déficit −3%', position: 'right', fill: 'rgba(248,113,113,0.8)', fontSize: 10 }} />
                <ReferenceLine y={0} stroke="var(--text-muted)" strokeWidth={0.5} strokeOpacity={0.5} />
                <Scatter
                  data={debtData}
                  animationDuration={800}
                  shape={(props) => {
                    const { cx, cy, payload } = props;
                    const isSpain = payload.country === SPAIN_CODE;
                    const pointStyle = getDebtPointStyle(payload);

                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={pointStyle.haloRadius}
                          fill={pointStyle.fill}
                          fillOpacity={pointStyle.haloOpacity}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={pointStyle.radius}
                          fill={pointStyle.fill}
                          stroke="#FFFFFF"
                          strokeOpacity={0.92}
                          strokeWidth={isSpain ? 2.2 : 1.25}
                        />
                        {isSpain && (
                          <text x={cx + 14} y={cy - 2} fill={SPAIN_COLOR} fontSize={12} fontWeight={700}>
                            🇪🇸 España
                          </text>
                        )}
                      </g>
                    );
                  }}
                  activeShape={(props) => {
                    const { cx, cy, payload } = props;
                    const isSpain = payload.country === SPAIN_CODE;
                    const pointStyle = getDebtPointStyle(payload);

                    return (
                      <g>
                        <circle
                          cx={cx}
                          cy={cy}
                          r={pointStyle.haloRadius + 3}
                          fill={pointStyle.fill}
                          fillOpacity={0.28}
                        />
                        <circle
                          cx={cx}
                          cy={cy}
                          r={pointStyle.radius + 1.4}
                          fill={pointStyle.fill}
                          stroke="#FFFFFF"
                          strokeWidth={isSpain ? 2.6 : 1.8}
                        />
                      </g>
                    );
                  }}
                />
              </ScatterChart>
            </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Leyenda scatter */}
          <div className="eu-scatter-legend">
            <div className="scatter-legend-item">
              <span className="scatter-dot" style={{ background: SPAIN_COLOR, width: 12, height: 12 }} />
              <span>España</span>
            </div>
            <div className="scatter-legend-item">
              <span className="scatter-dot" style={{ background: DEFAULT_COLOR, width: 10, height: 10, opacity: 0.8 }} />
              <span>Resto UE (cumple límites)</span>
            </div>
            <div className="scatter-legend-item">
              <span className="scatter-dot" style={{ background: '#F59E0B', width: 10, height: 10, opacity: 0.9 }} />
              <span>Resto UE (excede límites)</span>
            </div>
            <div className="scatter-legend-item">
              <span className="scatter-line" />
              <span>Límites Pacto de Estabilidad</span>
            </div>
          </div>

          {/* Tabla deuda/déficit */}
          <div className="eu-sector-table-wrap">
            <h3>Deuda y Déficit por País</h3>
            <table className="eu-sector-table">
              <thead>
                <tr><th>País</th><th>Deuda (% PIB)</th><th>Déficit (% PIB)</th><th>Estado</th></tr>
              </thead>
              <tbody>
                {[...debtData].sort((a, b) => (b.debtPctGDP || 0) - (a.debtPctGDP || 0)).map((d, i) => {
                  const overDebt = d.debtPctGDP > 60;
                  const overDeficit = d.deficitPctGDP < -3;
                  return (
                    <tr key={i} className={d.country === SPAIN_CODE ? 'row-spain' : ''}>
                      <td>{d.countryName}</td>
                      <td className={overDebt ? 'cell-warning' : ''}>{d.debtPctGDP?.toFixed(1)}%</td>
                      <td className={overDeficit ? 'cell-warning' : ''}>{d.deficitPctGDP?.toFixed(1)}%</td>
                      <td>
                        {overDebt || overDeficit ? (
                          <span className="eu-status-badge warning">Excede límite</span>
                        ) : (
                          <span className="eu-status-badge ok">Dentro de límites</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <div className="data-disclaimer europa-disclaimer">
        <FiAlertCircle size={16} />
        <span>
          Datos procedentes de <strong>Eurostat</strong> (Oficina Estadística de la UE).
          Las cifras se expresan como <strong>porcentaje del PIB</strong> y pueden tener
          hasta 2 años de retraso respecto al año actual. Se actualizan trimestralmente.
        </span>
      </div>
    </div>
  );
}

export default Europa;
