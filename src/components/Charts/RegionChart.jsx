import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useBudget } from '../../hooks/useBudget';
import { formatAxisAmount } from '../../utils/format';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import InfoTip from '../InfoTip';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{data.name}</p>
      <p className="tooltip-value">{formatAxisAmount(data.total)}</p>
      <p className="tooltip-pct">{data.perCapita.toLocaleString('es-ES')} €/hab</p>
    </div>
  );
};

function RegionSkeleton() {
  const bars = [95, 88, 82, 75, 68, 60, 55, 50, 44, 38, 32, 26, 22, 18, 14, 10, 8];
  return (
    <div className="chart-skeleton">
      <div className="skeleton-title" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' }}>
        {bars.map((w, i) => (
          <div key={i} className="skeleton-line-h" style={{ width: `${w}%`, height: 16, animationDelay: `${i * 0.05}s` }} />
        ))}
      </div>
    </div>
  );
}

function RegionChart() {
  const { regionsSorted, loading } = useBudget();

  const chartData = useMemo(() => {
    return regionsSorted.slice(0, 17).map(r => ({
      ...r,
      shortName: r.name.length > 14 ? r.name.substring(0, 12) + '…' : r.name,
    }));
  }, [regionsSorted]);

  const maxVal = useMemo(() => {
    if (!chartData.length) return 1;
    return Math.max(...chartData.map(d => d.total));
  }, [chartData]);

  if (loading && !chartData.length) return <RegionSkeleton />;

  return (
    <div className="chart-container">
      <h3 className="chart-title"><HiOutlineBuildingLibrary size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Gasto por Comunidad Autónoma <InfoTip text="Ranking de las 17 CCAA ordenadas por presupuesto total. El color indica la intensidad relativa del gasto." /></h3>
      <ResponsiveContainer width="100%" height={Math.max(400, chartData.length * 28)}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatAxisAmount}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            width={100}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,158,255,0.06)' }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={22}>
            {chartData.map((entry, idx) => {
              const intensity = entry.total / maxVal;
              const r = Math.round(30 + (79 - 30) * intensity);
              const g = Math.round(80 + (158 - 80) * intensity);
              const b = Math.round(140 + (255 - 140) * intensity);
              return <Cell key={idx} fill={`rgb(${r},${g},${b})`} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RegionChart;
