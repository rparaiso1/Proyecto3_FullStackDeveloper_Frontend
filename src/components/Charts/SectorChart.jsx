import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useBudget } from '../../hooks/useBudget';
import { formatAxisAmount } from '../../utils/format';
import { FiBarChart } from 'react-icons/fi';
import InfoTip from '../InfoTip';

const COLORS = [
  '#4F9EFF', '#F87171', '#34D399', '#FBBF24', '#A78BFA',
  '#F472B6', '#818CF8', '#2DD4BF', '#FB923C', '#DC2626',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{data.sector}</p>
      <p className="tooltip-value">{formatAxisAmount(data.total)}</p>
      {data.percentage && <p className="tooltip-pct">{data.percentage}% del total</p>}
    </div>
  );
};

function SectorChartSkeleton() {
  const bars = [80, 55, 70, 45, 90, 40, 60, 35, 75, 50];
  return (
    <div className="chart-skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-bar-group" style={{ flexDirection: 'column', height: 'auto', gap: 6, padding: 0 }}>
        {bars.map((w, i) => (
          <div key={i} className="skeleton-bar" style={{ height: 22, width: `${w}%`, borderRadius: 4, animationDelay: `${i * 0.08}s` }} />
        ))}
      </div>
    </div>
  );
}

function SectorChart() {
  const { sectorPercentages, loading } = useBudget();

  const chartData = useMemo(() => {
    return [...sectorPercentages].sort((a, b) => a.total - b.total);
  }, [sectorPercentages]);

  const chartHeight = Math.max(320, chartData.length * 38);

  if (loading && !chartData.length) return <SectorChartSkeleton />;

  return (
    <div className="chart-container">
      <h3 className="chart-title"><FiBarChart size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Gasto por Sectores <InfoTip text="Importe total presupuestado por cada sector de gasto (Sanidad, Educación, etc.) del conjunto de las CCAA para el año seleccionado." /></h3>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatAxisAmount}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="sector"
            width={140}
            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
            interval={0}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(79,158,255,0.06)' }} />
          <Bar dataKey="total" radius={[0, 4, 4, 0]} maxBarSize={28} barSize={22}>
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SectorChart;
