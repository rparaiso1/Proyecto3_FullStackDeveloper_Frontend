import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, LabelList,
} from 'recharts';
import { FiTrendingDown, FiAlertTriangle, FiInfo, FiArrowDown, FiArrowUp } from 'react-icons/fi';
import { statsAPI } from '../../services/api';
import { useBudget } from '../../hooks/useBudget';
import InfoTip from '../InfoTip';

function FiscalSummary() {
  const { selectedYear } = useBudget();
  const [fiscal, setFiscal] = useState(null);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Primero pedir todos para saber el último año fiscal disponible
        const allRes = await statsAPI.fiscal();
        const latestFiscalYear = allRes.data.latestYear || 2024;
        setSeries(allRes.data.series || []);

        // Pedir el año seleccionado (o el último disponible)
        const yearToFetch = selectedYear || latestFiscalYear;
        const yearRes = await statsAPI.fiscal({ year: yearToFetch });
        setFiscal(yearRes.data);
      } catch (err) {
        console.error('Error cargando datos fiscales:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedYear]);

  // Datos para la gráfica de barras simple de deuda/PIB
  const deudaChartData = useMemo(() =>
    series.map(s => ({
      year: s.year,
      deuda: s.deuda_pib_pct,
      label: `${s.deuda_pib_pct}%`,
    })), [series]);

  // Datos para la gráfica de barras de déficit
  const deficitChartData = useMemo(() =>
    series.map(s => ({
      year: s.year,
      deficit: s.deficit_pib_pct,
      label: `${s.deficit_pib_pct}%`,
      isNegative: s.deficit_pib_pct < 0,
    })), [series]);

  if (loading) {
    return (
      <div className="chart-container">
        <div className="chart-skeleton">
          <div className="skeleton-title" />
          <div className="skeleton-line-h w-full" style={{ height: 24, marginBottom: 16 }} />
          <div className="skeleton-line-h w-3of4" style={{ height: 24, marginBottom: 16 }} />
          <div className="skeleton-line-h w-full" style={{ height: 200 }} />
        </div>
      </div>
    );
  }

  if (!fiscal) return null;

  const year = fiscal.year || selectedYear || 2024;
  const isDeficit = fiscal.deficit_millones < 0;
  const deudaPct = fiscal.deuda_pib_pct;

  return (
    <div className="chart-container fiscal-summary">
      <h3 className="chart-title">
        <FiTrendingDown size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Balance Fiscal de España — {year}
        <InfoTip text="Datos fiscales oficiales de España: deuda pública, déficit/superávit y PIB. Fuente: Banco de España, IGAE, Eurostat." />
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', marginTop: -4, marginBottom: 16 }}>
        ¿España está en deuda?{' '}
        <strong style={{ color: '#F87171' }}>Sí.</strong>{' '}
        El Estado debe más de lo que produce en un año (deuda {'>'} 100% del PIB).
      </p>

      {/* KPIs fiscales - más claros */}
      <div className="fiscal-kpis">
        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">
            PIB de España
            <InfoTip text="PIB = todo lo que España produce en bienes y servicios en un año. Es como el 'sueldo' del país." size={12} />
          </span>
          <span className="fiscal-kpi-value" style={{ color: '#4F9EFF' }}>
            {(fiscal.pib_millones / 1000).toFixed(0)}.000 M€
          </span>
          <span className="fiscal-kpi-sub">Lo que España produce</span>
        </div>
        <div className="fiscal-kpi" style={{ borderColor: 'rgba(248, 113, 113, 0.3)' }}>
          <span className="fiscal-kpi-label">
            Deuda Pública Total
            <InfoTip text="Deuda pública = todo el dinero que el Estado ha pedido prestado a lo largo de los años y aún no ha devuelto." size={12} />
          </span>
          <span className="fiscal-kpi-value" style={{ color: '#F87171' }}>
            {(fiscal.deuda_publica_millones / 1000).toFixed(0)}.000 M€
          </span>
          <span className="fiscal-kpi-sub">Lo que España debe — {deudaPct}% del PIB</span>
        </div>
        <div className="fiscal-kpi" style={{ borderColor: isDeficit ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)' }}>
          <span className="fiscal-kpi-label">
            {isDeficit ? 'Déficit anual' : 'Superávit anual'}
            <InfoTip text="Déficit = el Estado gasta más de lo que ingresa. Superávit = ingresa más de lo que gasta. Es como si a final de mes te faltara o te sobrara dinero." size={12} />
          </span>
          <span className="fiscal-kpi-value" style={{ color: isDeficit ? '#EF4444' : '#10B981' }}>
            {isDeficit ? <FiArrowDown size={18} style={{ verticalAlign: 'middle' }} /> : <FiArrowUp size={18} style={{ verticalAlign: 'middle' }} />}
            {' '}{(Math.abs(fiscal.deficit_millones) / 1000).toFixed(1)}.000 M€
          </span>
          <span className="fiscal-kpi-sub">
            {isDeficit
              ? `Se gasta ${(Math.abs(fiscal.deficit_pib_pct)).toFixed(1)}% más de lo que ingresa`
              : `Ingresa ${fiscal.deficit_pib_pct}% más de lo que gasta`
            }
          </span>
        </div>
        <div className="fiscal-kpi">
          <span className="fiscal-kpi-label">
            Ingresos vs Gastos
            <InfoTip text="Los ingresos del Estado provienen de impuestos (IRPF, IVA, Sociedades...). Los gastos son servicios públicos, pensiones, sanidad, etc." size={12} />
          </span>
          <div className="fiscal-ing-vs-gas">
            <div className="ing-gas-row">
              <span className="ing-gas-label" style={{ color: '#34D399' }}>Ingresa:</span>
              <span className="ing-gas-val">{(fiscal.ingresos_estado_millones / 1000).toFixed(0)}.000 M€</span>
            </div>
            <div className="ing-gas-row">
              <span className="ing-gas-label" style={{ color: '#F87171' }}>Gasta:</span>
              <span className="ing-gas-val">{(fiscal.gastos_estado_millones / 1000).toFixed(0)}.000 M€</span>
            </div>
          </div>
        </div>
      </div>

      {/* Aviso si se muestran datos de otro año */}
      {fiscal.aviso && (
        <div className="fiscal-nota">
          <FiAlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>{fiscal.aviso}</span>
        </div>
      )}

      {/* Nota del año */}
      {fiscal.nota && (
        <div className="fiscal-nota">
          <FiAlertTriangle size={14} style={{ flexShrink: 0, marginTop: 2 }} />
          <span><strong>{fiscal.yearReal || year}:</strong> {fiscal.nota}</span>
        </div>
      )}

      {/* Barra visual: Deuda vs PIB */}
      <div className="deuda-visual">
        <h4 className="deuda-visual-title">
          ¿Cuánto debe España comparado con lo que produce?
        </h4>
        <div className="deuda-bar-container">
          <div className="deuda-bar-track">
            <div className="deuda-bar-pib" />
            <div
              className="deuda-bar-deuda"
              style={{ width: `${Math.min(deudaPct, 150)}%` }}
            />
          </div>
          <div className="deuda-bar-labels">
            <div className="deuda-bar-label">
              <span className="dbl-dot" style={{ background: '#4F9EFF' }} />
              <span>PIB (100%)</span>
            </div>
            <div className="deuda-bar-label">
              <span className="dbl-dot" style={{ background: '#F87171' }} />
              <span>Deuda ({deudaPct}% del PIB)</span>
            </div>
          </div>
          <p className="deuda-bar-explain">
            {deudaPct > 100
              ? `La deuda supera al PIB: España debe ${(deudaPct - 100).toFixed(1)}% más de lo que produce en un año.`
              : `La deuda está por debajo del PIB: el país debe ${deudaPct}% de lo que produce anualmente.`
            }
            {' '}El límite recomendado por la UE es del 60%.
          </p>
        </div>
      </div>

      {/* Dos gráficas simples en vez de una confusa */}
      {series.length > 0 && (
        <div className="fiscal-charts-grid">
          {/* Gráfica 1: Deuda/PIB por año */}
          <div className="fiscal-chart-card">
            <h4 className="fiscal-chart-subtitle">
              Deuda respecto al PIB por año
              <InfoTip text="Porcentaje que la deuda pública representa sobre el PIB. Cuanto más alto, más endeudado está el país." size={12} />
            </h4>
            <p className="fiscal-chart-explain">
              La UE recomienda no superar el <strong style={{ color: '#FBBF24' }}>60%</strong>. España lleva años por encima del 100%.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deudaChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }} />
                <YAxis domain={[0, 130]} tickFormatter={v => `${v}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={45} />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Deuda/PIB']}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                />
                <Bar dataKey="deuda" radius={[6, 6, 0, 0]} barSize={40}>
                  {deudaChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.deuda > 100 ? '#F87171' : entry.deuda > 60 ? '#FBBF24' : '#34D399'} opacity={0.85} />
                  ))}
                  <LabelList dataKey="label" position="top" fill="var(--text-secondary)" fontSize={11} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfica 2: Déficit por año */}
          <div className="fiscal-chart-card">
            <h4 className="fiscal-chart-subtitle">
              Déficit anual (% del PIB)
              <InfoTip text="Diferencia entre ingresos y gastos del Estado cada año. Rojo = déficit (se gasta más), verde = superávit (se ingresa más)." size={12} />
            </h4>
            <p className="fiscal-chart-explain">
              Cada año el Estado gasta más de lo que ingresa. La UE pide no superar el <strong style={{ color: '#FBBF24' }}>-3%</strong>.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deficitChartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }} />
                <YAxis domain={[-12, 1]} tickFormatter={v => `${v}%`} tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} width={45} />
                <Tooltip
                  formatter={(v) => [`${v}%`, v < 0 ? 'Déficit' : 'Superávit']}
                  contentStyle={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 8 }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 700 }}
                />
                <Bar dataKey="deficit" radius={[6, 6, 0, 0]} barSize={40}>
                  {deficitChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.isNegative ? '#F87171' : '#34D399'} opacity={0.85} />
                  ))}
                  <LabelList dataKey="label" position="top" fill="var(--text-secondary)" fontSize={11} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ¿Qué significa esto? - texto claro */}
      <div className="fiscal-explainer">
        <h4>¿Qué significa todo esto?</h4>
        <ul>
          <li>
            <strong>España está endeudada</strong> — debe {(fiscal.deuda_publica_millones / 1000).toFixed(0)}.000 millones de euros,
            más de lo que todo el país produce en un año ({(fiscal.pib_millones / 1000).toFixed(0)}.000 M€).
          </li>
          <li>
            <strong>Cada año se endeuda más</strong> — en {year} el Estado gastó {(fiscal.gastos_estado_millones / 1000).toFixed(0)}.000 M€
            pero solo ingresó {(fiscal.ingresos_estado_millones / 1000).toFixed(0)}.000 M€. La diferencia ({(Math.abs(fiscal.deficit_millones) / 1000).toFixed(0)}.000 M€)
            se cubre pidiendo más prestado.
          </li>
          <li>
            <strong>La deuda se paga</strong> — parte del presupuesto anual
            se dedica a pagar intereses y devolver deuda. Ese dinero no va a sanidad, educación ni pensiones.
          </li>
          <li>
            <strong>La tendencia mejora</strong> — el déficit se ha ido reduciendo progresivamente
            y la deuda/PIB baja año a año.
          </li>
        </ul>
      </div>

      {/* Fuente */}
      <p className="fiscal-source">
        <FiInfo size={12} /> Fuente: Banco de España · IGAE · Eurostat · INE — Datos oficiales y públicos.
      </p>
    </div>
  );
}

export default FiscalSummary;
