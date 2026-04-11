import {
  ComposedChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, Cell,
} from 'recharts';
import { FiActivity } from 'react-icons/fi';
import InfoTip from '../InfoTip';
import { formatMillions } from '../../utils/format';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div className="chart-tooltip" style={{ minWidth: 200 }}>
      <p className="tooltip-label" style={{ marginBottom: 8, fontWeight: 700 }}>{label}</p>
      <p style={{ color: '#34D399', margin: '4px 0', fontSize: '0.85rem' }}>
        Ingresos: <strong>{formatMillions(d.ingresos)}</strong>
      </p>
      <p style={{ color: '#4F9EFF', margin: '4px 0', fontSize: '0.85rem' }}>
        Gasto: <strong>{formatMillions(d.gasto)}</strong>
      </p>
      <p style={{ color: d.balance >= 0 ? '#34D399' : '#F87171', margin: '4px 0', borderTop: '1px solid var(--border-color)', paddingTop: 4, fontSize: '0.85rem' }}>
        {d.balance >= 0 ? 'Superávit' : 'Déficit'}: <strong>{formatMillions(d.balance)}</strong>
      </p>
      <p style={{ color: 'var(--text-secondary)', fontSize: 11, margin: '4px 0' }}>
        Cobertura: {d.ratio_cobertura}%
      </p>
    </div>
  );
};

function BalanceSkeleton() {
  const bars = [90, 85, 78, 72, 65, 58, 52, 45, 40, 35, 30, 25, 20, 15, 12, 8, 5];
  return (
    <div className="chart-skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-line-h w-3of4" style={{ marginBottom: 16 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '8px 0' }}>
        {bars.map((w, i) => (
          <div key={i} className="skeleton-line-h" style={{ width: `${w}%`, height: 14, animationDelay: `${i * 0.04}s` }} />
        ))}
      </div>
    </div>
  );
}

function BalanceChart({ data, loading }) {
  if (loading) return <BalanceSkeleton />;
  if (!data?.length) return <div className="chart-loading">Sin datos disponibles</div>;

  const chartData = data.map(d => ({
    ...d,
    shortName: d.region.length > 13 ? d.region.substring(0, 11) + '…' : d.region,
  }));

  return (
    <div className="chart-container">
      <h3 className="chart-title"><FiActivity size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Balance Presupuestario por Comunidad Autónoma <InfoTip text="Comparación entre los ingresos (DRN) y el gasto (Obligaciones Reconocidas) de cada CCAA. Un balance positivo indica superávit; negativo, déficit." /></h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 12, marginTop: -4 }}>
        Ingresos (DRN) vs Gasto (Obligaciones Reconocidas). Fuente: IGAE
      </p>
      <ResponsiveContainer width="100%" height={Math.max(420, chartData.length * 30)}>
        <ComposedChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
          <XAxis
            type="number"
            tickFormatter={formatMillions}
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="shortName"
            tick={{ fill: 'var(--text-secondary)', fontSize: 10 }}
            width={95}
          />
          <ReferenceLine x={0} stroke="var(--text-muted)" strokeWidth={1} strokeDasharray="3 3" />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(v) => (
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                {v === 'ingresos' ? 'Ingresos (M€)' : v === 'gasto' ? 'Gasto (M€)' : 'Balance (M€)'}
              </span>
            )}
            wrapperStyle={{ paddingTop: 6 }}
          />
          <Bar dataKey="ingresos" name="ingresos" fill="#34D399" opacity={0.8} barSize={8} />
          <Bar dataKey="gasto" name="gasto" fill="#4F9EFF" opacity={0.8} barSize={8} />
          <Bar dataKey="balance" name="balance" barSize={8}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.balance >= 0 ? '#34D399' : '#F87171'} />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BalanceChart;
