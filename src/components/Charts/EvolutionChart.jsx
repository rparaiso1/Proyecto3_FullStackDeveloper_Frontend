import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useBudget } from '../../hooks/useBudget';
import { formatAxisAmount } from '../../utils/format';
import { FiTrendingUp } from 'react-icons/fi';
import InfoTip from '../InfoTip';

const SECTOR_COLORS = {
  'Sanidad': '#F87171',
  'Educación': '#4F9EFF',
  'Defensa': '#6B7280',
  'Infraestructuras': '#FBBF24',
  'Servicios Sociales': '#A78BFA',
  'Seguridad': '#60A5FA',
  'Cultura y Deporte': '#F472B6',
  'Medio Ambiente': '#34D399',
  'Economía y Empleo': '#FB923C',
  'Deuda Pública': '#DC2626',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">Año {label}</p>
      {payload
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map((p, i) => (
          <p key={i} style={{ color: p.color, margin: '3px 0', fontSize: '0.82rem' }}>
            {p.name}: <strong>{formatAxisAmount(p.value)}</strong>
          </p>
        ))}
    </div>
  );
};

function EvolutionSkeleton() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-title" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '20px 0' }}>
        {[100, 85, 60, 90, 75].map((w, i) => (
          <div key={i} className="skeleton-line-h" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

function EvolutionChart() {
  const { evolutionData, loading } = useBudget();

  const chartData = useMemo(() => {
    if (!evolutionData || !Object.keys(evolutionData).length) return [];
    const yearsSet = new Set();
    Object.values(evolutionData).forEach(arr => {
      arr.forEach(d => yearsSet.add(d.year));
    });
    const years = [...yearsSet].sort();
    return years.map(year => {
      const row = { year };
      Object.entries(evolutionData).forEach(([sector, data]) => {
        const entry = data.find(d => d.year === year);
        row[sector] = entry ? entry.total : 0;
      });
      return row;
    });
  }, [evolutionData]);

  const sectors = useMemo(() => Object.keys(evolutionData || {}), [evolutionData]);

  if (loading && !chartData.length) return <EvolutionSkeleton />;

  return (
    <div className="chart-container">
      <h3 className="chart-title"><FiTrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Evolución Temporal del Gasto <InfoTip text="Evolución interanual del gasto por sector entre 2019 y 2024. Permite detectar tendencias al alza o a la baja en cada partida." /></h3>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
          <XAxis dataKey="year" tick={{ fill: 'var(--text-secondary)', fontSize: 11 }} />
          <YAxis tickFormatter={formatAxisAmount} tick={{ fill: 'var(--text-secondary)', fontSize: 10 }} width={55} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '10px', paddingTop: '6px', lineHeight: '1.8' }}
            formatter={(value) => <span style={{ color: 'var(--text-secondary)' }}>{value}</span>}
          />
          {sectors.map(sector => (
            <Line
              key={sector}
              type="monotone"
              dataKey={sector}
              stroke={SECTOR_COLORS[sector] || '#888'}
              strokeWidth={2}
              dot={{ r: 2.5 }}
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default EvolutionChart;
