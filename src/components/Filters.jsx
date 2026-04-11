import { useCallback } from 'react';
import { useBudget } from '../hooks/useBudget';
import { FiSearch, FiRotateCcw } from 'react-icons/fi';
import InfoTip from './InfoTip';
import './Filters.css';

function Filters() {
  const {
    availableYears,
    categories,
    ccaaRegions,
    selectedYear,
    selectedSector,
    selectedRegion,
    setSelectedYear,
    setSelectedSector,
    setSelectedRegion,
  } = useBudget();

  const handleYearChange = useCallback((e) => {
    const val = e.target.value;
    setSelectedYear(val ? parseInt(val) : null);
  }, [setSelectedYear]);

  const handleSectorChange = useCallback((e) => {
    const val = e.target.value;
    setSelectedSector(val || null);
  }, [setSelectedSector]);

  const handleRegionChange = useCallback((e) => {
    const val = e.target.value;
    setSelectedRegion(val || null);
  }, [setSelectedRegion]);

  const handleReset = useCallback(() => {
    const latestYear = availableYears.length > 0 ? Math.max(...availableYears) : null;
    setSelectedYear(latestYear);
    setSelectedSector(null);
    setSelectedRegion(null);
  }, [availableYears, setSelectedYear, setSelectedSector, setSelectedRegion]);

  return (
    <div className="filters-container">
      <div className="filters-header">
        <h3 className="filters-title">
          <span className="filters-icon"><FiSearch size={16} /></span>
          Filtros
        </h3>
        <button className="filters-reset" onClick={handleReset}>
          <FiRotateCcw size={13} /> Limpiar
        </button>
      </div>

      <div className="filters-grid">
        <div className="filter-group">
          <label htmlFor="year-filter">
            Año
            <InfoTip text="Ejercicio presupuestario. Al cambiar el año, todos los datos del dashboard se actualizan automáticamente." size={12} />
          </label>
          <select
            id="year-filter"
            value={selectedYear || ''}
            onChange={handleYearChange}
          >
            <option value="">Todos los años</option>
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sector-filter">
            Sector
            <InfoTip text="Área de gasto público (Sanidad, Educación, Defensa…). Filtra el mapa, los KPIs y todas las gráficas por el sector elegido." size={12} />
          </label>
          <select
            id="sector-filter"
            value={selectedSector || ''}
            onChange={handleSectorChange}
          >
            <option value="">Todos los sectores</option>
            {categories.map(c => (
              <option key={c._id} value={c.name}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="region-filter">
            Comunidad Autónoma
            <InfoTip text="Filtra los datos por una CCAA concreta. Útil para comparar una comunidad con el total nacional." size={12} />
          </label>
          <select
            id="region-filter"
            value={selectedRegion || ''}
            onChange={handleRegionChange}
          >
            <option value="">Todas las CCAA</option>
            {ccaaRegions.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default Filters;
