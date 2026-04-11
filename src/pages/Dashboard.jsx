import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BudgetProvider } from '../context/BudgetContext';
import { useBudget } from '../hooks/useBudget';
import { FiBarChart2, FiAlertCircle } from 'react-icons/fi';
import KPICards from '../components/KPICards';
import Filters from '../components/Filters';
import MapSpain from '../components/MapSpain';
import SectorChart from '../components/Charts/SectorChart';
import EvolutionChart from '../components/Charts/EvolutionChart';
import DistributionChart from '../components/Charts/DistributionChart';
import RegionChart from '../components/Charts/RegionChart';
import SectorDetailChart from '../components/Charts/SectorDetailChart';
import FiscalSummary from '../components/Charts/FiscalSummary';
import InfoTip from '../components/InfoTip';
import LazyRenderOnView from '../components/LazyRenderOnView';
import './Dashboard.css';

function DashboardContent() {
  const navigate = useNavigate();
  const { error } = useBudget();

  const handleRegionClick = useCallback((regionData) => {
    navigate(`/regiones/${regionData.id}`);
  }, [navigate]);

  return (
    <div className="page-container">
      <header className="page-header">
        <h1><FiBarChart2 size={24} /><span>Dashboard de Transparencia</span></h1>
        <p>Visualización interactiva del gasto público de España basada en datos oficiales (PGE)</p>
        <p className="page-source">
          Fuente:&nbsp;
          <a href="https://www.sepg.pap.hacienda.gob.es/sitios/sepg/es-ES/Presupuestos/PGE/Paginas/PGE.aspx" target="_blank" rel="noopener noreferrer">PGE</a>
          &nbsp;·&nbsp;
          <a href="https://www.igae.pap.hacienda.gob.es/" target="_blank" rel="noopener noreferrer">IGAE</a>
          &nbsp;·&nbsp;
          <a href="https://datos.gob.es/" target="_blank" rel="noopener noreferrer">datos.gob.es</a>
          &nbsp;·&nbsp;
          <a href="https://www.bde.es/" target="_blank" rel="noopener noreferrer">Banco de España</a>
        </p>
      </header>

      {error && (
        <div className="auth-error" role="alert" style={{ marginBottom: '1.5rem' }}>
          <FiAlertCircle size={16} /> {error}
        </div>
      )}

      {/* Resumen rápido — primero los KPIs para visión general */}
      <KPICards />

      {/* Filtros — el usuario controla qué datos se muestran */}
      <Filters />

      {/* ── Sección 1: Distribución geográfica y sectorial ── */}
      <section className="dashboard-section" style={{ '--section-delay': '0.05s' }}>
        <h2 className="section-title">
          Distribución del Gasto
          <InfoTip text="Cómo se reparte el presupuesto entre las 17 comunidades autónomas y los distintos sectores de gasto (Sanidad, Educación, Defensa…). El mapa muestra la intensidad por CCAA y la tarta el peso de cada sector." />
        </h2>
        <LazyRenderOnView placeholderHeight={520}>
          <div className="dashboard-grid two-cols">
            <MapSpain onRegionClick={handleRegionClick} />
            <DistributionChart />
          </div>
        </LazyRenderOnView>
      </section>

      {/* ── Sección 2: Análisis por sector ── */}
      <section className="dashboard-section" style={{ '--section-delay': '0.1s' }}>
        <h2 className="section-title">
          Análisis Sectorial
          <InfoTip text="Comparativa de importes entre los sectores de gasto y su evolución año a año. Permite detectar qué áreas reciben más inversión y cómo cambian con el tiempo." />
        </h2>
        <LazyRenderOnView placeholderHeight={680}>
          <div className="dashboard-grid two-cols">
            <SectorChart />
            <EvolutionChart />
          </div>
          <SectorDetailChart />
        </LazyRenderOnView>
      </section>

      {/* ── Sección 3: Ranking de CCAA ── */}
      <section className="dashboard-section" style={{ '--section-delay': '0.15s' }}>
        <h2 className="section-title">
          Ranking por Comunidades Autónomas
          <InfoTip text="Clasificación de las 17 CCAA ordenadas por presupuesto total. Pasa el ratón por cada barra para ver el gasto per cápita (por habitante)." />
        </h2>
        <LazyRenderOnView placeholderHeight={420}>
          <RegionChart />
        </LazyRenderOnView>
      </section>

      {/* ── Sección 4: Contexto fiscal de España ── */}
      <section className="dashboard-section" style={{ '--section-delay': '0.2s' }}>
        <h2 className="section-title">
          Contexto Fiscal de España
          <InfoTip text="Vista macroeconómica: PIB, deuda pública, déficit/superávit e ingresos vs gastos del Estado. Datos oficiales del Banco de España e IGAE." />
        </h2>
        <LazyRenderOnView placeholderHeight={520}>
          <FiscalSummary />
        </LazyRenderOnView>
      </section>

      {/* Nota sobre los datos — al final como referencia */}
      <div className="data-disclaimer methodology-disclaimer">
        <FiAlertCircle size={16} />
        <div className="methodology-text">
          <p>
            Los datos de las secciones de España y Financiación por sector y CCAA son <strong>estimaciones representativas</strong> basadas en distribuciones de los PGE; las cifras a nivel de programa dentro de cada CCAA son aproximaciones proporcionales, no liquidaciones por partida.
          </p>
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <BudgetProvider>
      <DashboardContent />
    </BudgetProvider>
  );
}

export default Dashboard;
