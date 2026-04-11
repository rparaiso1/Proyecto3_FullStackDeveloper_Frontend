import { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { FiChevronDown, FiLayers } from 'react-icons/fi';
import { budgetsAPI } from '../../services/api';
import { useBudget } from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/format';
import InfoTip from '../InfoTip';

const SECTOR_COLORS = {
  'Deuda Pública': '#DC2626',
  'Servicios Sociales': '#A78BFA',
  'Defensa': '#6B7280',
  'Infraestructuras': '#FBBF24',
  'Sanidad': '#F87171',
  'Seguridad': '#3B82F6',
  'Economía y Empleo': '#FB923C',
  'Educación': '#4F9EFF',
  'Medio Ambiente': '#34D399',
  'Cultura y Deporte': '#F472B6',
};

const SECTOR_DESC = {
  'Deuda Pública': 'Pago de intereses y amortización de la deuda del Estado. Incluye intereses de letras, bonos y obligaciones del Tesoro, así como la devolución del principal.',
  'Servicios Sociales': 'Pensiones contributivas y no contributivas, prestaciones por dependencia y discapacidad, servicios sociales básicos (atención a mayores, menores, exclusión social) y vivienda social.',
  'Defensa': 'Fuerzas Armadas (Ejército de Tierra, Armada, Ejército del Aire), adquisición y mantenimiento de material militar, y participación en misiones internacionales (OTAN, UE, ONU).',
  'Infraestructuras': 'Red de carreteras y autopistas del Estado, ferrocarriles (AVE, Cercanías, mantenimiento de vías), puertos y aeropuertos de interés general, e infraestructura hidráulica (embalses, canalizaciones).',
  'Sanidad': 'Atención primaria (centros de salud), hospitales y atención especializada, salud pública y prevención epidemiológica, farmacia y prestaciones farmacéuticas, e investigación sanitaria.',
  'Seguridad': 'Policía Nacional, Guardia Civil, Protección Civil (emergencias y catástrofes) e Instituciones Penitenciarias (gestión de centros penitenciarios).',
  'Economía y Empleo': 'Políticas activas de empleo (formación, intermediación), apoyo a industria y PYMES, promoción del comercio y turismo, e inversión en investigación, desarrollo e innovación (I+D+i).',
  'Educación': 'Educación infantil y primaria, educación secundaria obligatoria y bachillerato, formación profesional, universidades públicas, y becas y ayudas al estudio.',
  'Medio Ambiente': 'Gestión de residuos sólidos urbanos, protección de espacios naturales y biodiversidad, control de calidad del aire y tratamiento de aguas, y fomento de energías renovables.',
  'Cultura y Deporte': 'Conservación del patrimonio cultural (monumentos, yacimientos), bibliotecas y museos públicos, fomento del deporte y actividad física, y apoyo a artes escénicas y música.',
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{d.program}</p>
      <p className="tooltip-value">{formatCurrency(d.total)}</p>
      <p className="tooltip-pct">{d.pct}% del sector</p>
    </div>
  );
};

function SectorDetailChart() {
  const { selectedYear } = useBudget();
  const [programData, setProgramData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSector, setExpandedSector] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = { territory: 'España' };
        if (selectedYear) params.year = selectedYear;
        const res = await budgetsAPI.byProgram(params);
        setProgramData(res.data);
      } catch (err) {
        console.error('Error cargando programas:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedYear]);

  const sortedSectors = useMemo(() => {
    return [...programData].sort((a, b) => b.total - a.total);
  }, [programData]);

  const toggleSector = (sector) => {
    setExpandedSector(prev => prev === sector ? null : sector);
  };

  if (loading && !programData.length) {
    return (
      <div className="chart-container">
        <div className="chart-skeleton">
          <div className="skeleton-title" />
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-line-h w-full" style={{ height: 48, marginBottom: 8 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">
        <FiLayers size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />
        Detalle por Sector y Programa
        <InfoTip text="Desglose detallado de cada sector presupuestario en sus programas específicos. Haz clic en un sector para ver exactamente en qué se gasta cada partida." />
      </h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 16, marginTop: -4 }}>
        Haz clic en un sector para ver el desglose de sus programas · {selectedYear || 'Todos los años'} · Territorio: España
      </p>

      <div className="sector-detail-list">
        {sortedSectors.map((sectorItem) => {
          const isExpanded = expandedSector === sectorItem.sector;
          const color = SECTOR_COLORS[sectorItem.sector] || '#4F9EFF';
          const grandTotal = sortedSectors.reduce((s, x) => s + x.total, 0);
          const sectorPct = grandTotal > 0 ? ((sectorItem.total / grandTotal) * 100).toFixed(1) : '0.0';

          const programs = sectorItem.programs.map(p => ({
            ...p,
            pct: sectorItem.total > 0 ? ((p.total / sectorItem.total) * 100).toFixed(1) : '0.0',
          }));

          return (
            <div key={sectorItem.sector} className="sector-detail-item">
              <button
                className={`sector-detail-header ${isExpanded ? 'expanded' : ''}`}
                onClick={() => toggleSector(sectorItem.sector)}
                style={{ '--sector-color': color }}
              >
                <div className="sector-header-left">
                  <span className="sector-color-dot" style={{ background: color }} />
                  <span className="sector-name">{sectorItem.sector}</span>
                  <span className="sector-pct">{sectorPct}%</span>
                </div>
                <div className="sector-header-right">
                  <span className="sector-amount">{formatCurrency(sectorItem.total)}</span>
                  <FiChevronDown size={16} className={`sector-chevron ${isExpanded ? 'rotated' : ''}`} />
                </div>
              </button>

              <div className={`sector-detail-body-wrapper ${isExpanded ? 'open' : ''}`}>
                <div className="sector-detail-body-inner">
                  <div className="sector-detail-body">
                    {SECTOR_DESC[sectorItem.sector] && (
                      <p className="sector-description">{SECTOR_DESC[sectorItem.sector]}</p>
                    )}
                    {isExpanded && (
                      <ResponsiveContainer width="100%" height={Math.max(180, programs.length * 44)}>
                        <BarChart data={programs} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                          <XAxis
                            type="number"
                            tickFormatter={(v) => formatCurrency(v)}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
                          />
                          <YAxis
                            type="category"
                            dataKey="program"
                            width={180}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="total" barSize={20} radius={[0, 4, 4, 0]}>
                            {programs.map((_, i) => (
                              <Cell key={i} fill={color} opacity={0.7 + (i * 0.06)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                    <div className="program-list-detail">
                      {programs.map((p, i) => (
                        <div key={i} className="program-item">
                          <span className="program-name">{p.program}</span>
                          <span className="program-values">
                            <span className="program-amount">{formatCurrency(p.total)}</span>
                            <span className="program-pct" style={{ color }}>{p.pct}%</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SectorDetailChart;
