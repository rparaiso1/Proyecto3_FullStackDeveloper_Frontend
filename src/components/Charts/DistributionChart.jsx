import { useMemo, useState } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, Sector,
} from 'recharts';
import { useBudget } from '../../hooks/useBudget';
import { formatCurrency } from '../../utils/format';
import { FiPieChart } from 'react-icons/fi';
import InfoTip from '../InfoTip';

const COLORS = [
  '#4F9EFF', '#F87171', '#34D399', '#FBBF24', '#A78BFA',
  '#F472B6', '#818CF8', '#2DD4BF', '#FB923C', '#DC2626',
];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const data = payload[0];
  const pct = ((data.value / data.payload.total) * 100).toFixed(1);
  return (
    <div className="chart-tooltip">
      <p className="tooltip-label">{data.name}</p>
      <p className="tooltip-value">{formatCurrency(data.value)}</p>
      <p className="tooltip-pct">{pct}% del total</p>
    </div>
  );
};

const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector cx={cx} cy={cy} innerRadius={innerRadius - 3} outerRadius={outerRadius + 6}
      startAngle={startAngle} endAngle={endAngle} fill={fill} />
  );
};

function DistributionSkeleton() {
  return (
    <div className="chart-skeleton">
      <div className="skeleton-title" />
      <div className="skeleton-circle" style={{ width: 200, height: 200 }} />
      <div style={{ marginTop: 16 }}>
        {[100, 80, 90, 70, 60].map((w, i) => (
          <div key={i} className="skeleton-line-h" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
        ))}
      </div>
    </div>
  );
}

function DistributionChart() {
  const { sectorPercentages, loading } = useBudget();
  const [activeIndex, setActiveIndex] = useState(-1);

  const chartData = useMemo(() => {
    if (!sectorPercentages.length) return [];
    const total = sectorPercentages.reduce((s, d) => s + d.total, 0);
    return sectorPercentages.map(s => ({
      name: s.sector,
      value: s.total,
      total,
      pct: total > 0 ? ((s.total / total) * 100).toFixed(1) : '0.0',
    }));
  }, [sectorPercentages]);

  if (loading && !chartData.length) return <DistributionSkeleton />;

  return (
    <div className="chart-container">
      <h3 className="chart-title"><FiPieChart size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Distribución Presupuestaria <InfoTip text="Porcentaje que representa cada sector sobre el total del presupuesto. Permite ver cómo se reparte el gasto público." /></h3>
      <ResponsiveContainer width="100%" height={440}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            innerRadius={70}
            outerRadius={145}
            paddingAngle={2}
            dataKey="value"
            label={false}
            labelLine={false}
            activeIndex={activeIndex}
            activeShape={renderActiveShape}
            onMouseEnter={(_, index) => setActiveIndex(index)}
            onMouseLeave={() => setActiveIndex(-1)}
          >
            {chartData.map((_, idx) => (
              <Cell key={idx} fill={COLORS[idx % COLORS.length]} style={{ cursor: 'pointer' }} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            layout="horizontal"
            align="center"
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: '11px', paddingTop: '12px', lineHeight: '2.2' }}
            formatter={(value, entry) => {
              const item = chartData.find(d => d.name === value);
              const pct = item ? item.pct : '';
              return (
                <span style={{ color: 'var(--text-secondary)' }}>
                  {value.length > 16 ? value.substring(0, 14) + '…' : value}
                  {' '}<span style={{ color: entry.color, fontWeight: 600 }}>{pct}%</span>
                </span>
              );
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DistributionChart;
