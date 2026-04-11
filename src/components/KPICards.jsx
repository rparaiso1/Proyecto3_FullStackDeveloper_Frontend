import { useMemo } from 'react';
import { useBudget } from '../hooks/useBudget';
import { formatCurrency } from '../utils/format';
import { FiDollarSign, FiPieChart, FiMapPin, FiUsers } from 'react-icons/fi';
import InfoTip from './InfoTip';
import './KPICards.css';

function KPICards() {
  const { summary, totalBudget, topSector, regionsSorted, selectedYear, loading } = useBudget();

  const kpis = useMemo(() => {
    if (!summary) return [];

    const topRegion = regionsSorted.length > 0 ? regionsSorted[0] : null;
    const avgPerCapita = regionsSorted.length > 0
      ? Math.round(regionsSorted.reduce((s, r) => s + r.perCapita, 0) / regionsSorted.length)
      : 0;

    return [
      {
        title: 'Presupuesto Nacional',
        value: formatCurrency(totalBudget),
        subtitle: `Año ${selectedYear || 'todos'}`,
        icon: <FiDollarSign size={24} />,
        color: 'var(--kpi-blue)',
        tip: 'Total de las Obligaciones Reconocidas Netas del conjunto de las CCAA según la liquidación de los PGE.',
      },
      {
        title: 'Mayor Sector',
        value: topSector?.name || '-',
        subtitle: topSector ? formatCurrency(topSector.amount) : '',
        icon: <FiPieChart size={24} />,
        color: 'var(--kpi-purple)',
        tip: 'El sector con mayor importe presupuestado del total de las comunidades autónomas.',
      },
      {
        title: 'Mayor Inversión CCAA',
        value: topRegion?.name || '-',
        subtitle: topRegion ? formatCurrency(topRegion.total) : '',
        icon: <FiMapPin size={24} />,
        color: 'var(--kpi-green)',
        tip: 'Comunidad Autónoma con el mayor presupuesto total asignado en el año seleccionado.',
      },
      {
        title: 'Gasto Per Cápita Medio',
        value: `${avgPerCapita.toLocaleString('es-ES')} €`,
        subtitle: 'Por habitante (CCAA)',
        icon: <FiUsers size={24} />,
        color: 'var(--kpi-orange)',
        tip: 'Media del gasto por habitante de todas las CCAA. Se calcula dividiendo el presupuesto de cada comunidad entre su población oficial (INE).',
      },
    ];
  }, [summary, totalBudget, topSector, regionsSorted, selectedYear]);

  if (loading && !summary) {
    return (
      <div className="kpi-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="kpi-card kpi-skeleton">
            <div className="skeleton-line" />
            <div className="skeleton-line short" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="kpi-grid">
      {kpis.map((kpi, idx) => (
        <div key={idx} className="kpi-card" style={{ '--kpi-accent': kpi.color }}>
          <div className="kpi-icon">{kpi.icon}</div>
          <div className="kpi-content">
            <span className="kpi-title">{kpi.title} <InfoTip text={kpi.tip} size={15} /></span>
            <span className="kpi-value">{kpi.value}</span>
            <span className="kpi-subtitle">{kpi.subtitle}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default KPICards;
