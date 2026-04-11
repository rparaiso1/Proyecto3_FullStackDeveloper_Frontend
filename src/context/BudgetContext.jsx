import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { statsAPI, budgetsAPI, regionsAPI, categoriesAPI } from '../services/api';
import { BudgetContext } from './budgetContextDef';

/**
 * =====================================================================
 *  BudgetContext
 * =====================================================================
 *
 * Contexto central del Dashboard de Transparencia.
 *
 * FLUJO DE DATOS:
 * ───────────────
 *  1. Al montar el Provider se dispara `loadInitialData`:
 *     - Descarga la lista de CCAA (regiones), categorías de gasto y
 *       años disponibles en los PGE.
 *     - Selecciona automáticamente el año más reciente.
 *
 *  2. Cada vez que el usuario cambia un filtro (año, sector o CCAA)
 *     se dispara `loadFilteredData`, que pide al backend 6 endpoints
 *     en paralelo y actualiza todo el estado derivado.
 *
 * FILTROS:
 * ────────
 *  - selectedYear   → Filtra todos los datos por ejercicio presupuestario.
 *  - selectedSector → Filtra el resumen, mapa, ranking de CCAA y sectores.
 *  - selectedRegion → Filtra el resumen, mapa, ranking y sectores por CCAA.
 *                     (Se usa para que los componentes puedan resaltar una
 *                      comunidad concreta en el mapa o en gráficas.)
 *
 * DATOS CALCULADOS (useMemo):
 * ────────────────────────────
 *  - totalBudget       → Presupuesto nacional agregado del resumen.
 *  - topSector         → Sector con mayor importe.
 *  - sectorPercentages → Sectores con su % sobre el total.
 *  - regionsSorted     → CCAA ordenadas de mayor a menor presupuesto.
 *  - ccaaRegions       → Solo regiones de tipo 'comunidad_autonoma'.
 *
 * =====================================================================
 */

export function BudgetProvider({ children }) {
  /* ---------------------------------------------------------------
   * 1. ESTADO — Datos crudos recibidos del backend
   * --------------------------------------------------------------- */
  const [summary, setSummary] = useState(null);       // Resumen nacional (totalBudget, topSector…)
  const [regions, setRegions] = useState([]);          // Listado completo de regiones
  const [categories, setCategories] = useState([]);    // Categorías/sectores de gasto
  const [mapData, setMapData] = useState(null);        // Datos geográficos para el mapa
  const [sectorData, setSectorData] = useState([]);    // Presupuesto agrupado por sector
  const [yearData, setYearData] = useState([]);        // Serie temporal agregada (España)
  const [evolutionData, setEvolutionData] = useState({});  // Evolución multi-sector por año
  const [regionBudgets, setRegionBudgets] = useState([]);  // Presupuesto por CCAA

  /* ---------------------------------------------------------------
   * 2. ESTADO — UI: carga y errores
   * --------------------------------------------------------------- */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /* ---------------------------------------------------------------
   * 3. ESTADO — Filtros seleccionados por el usuario
   * --------------------------------------------------------------- */
  const [selectedYear, setSelectedYear] = useState(null);    // null = todos los años
  const [selectedRegion, setSelectedRegion] = useState(null); // null = todas las CCAA
  const [selectedSector, setSelectedSector] = useState(null); // null = todos los sectores
  const [availableYears, setAvailableYears] = useState([]);   // Años con datos en el backend

  // Ref para evitar doble carga: loadInitialData pone selectedYear,
  // lo que dispararía loadFilteredData antes de que termine la carga
  // inicial. Con este flag nos aseguramos de que la primera carga
  // de datos filtrados ocurra solo cuando los datos base estén listos.
  const initializedRef = useRef(false);

  /* ---------------------------------------------------------------
   * 4. CARGA INICIAL — Se ejecuta una sola vez al montar
   * ---------------------------------------------------------------
   * Descarga en paralelo:
   *  - Todas las regiones (para los selects y el mapa)
   *  - Todas las categorías de gasto (para el filtro de sector)
   *  - Los años disponibles (para el filtro de año)
   *
   * Después selecciona el año más reciente como filtro por defecto,
   * lo que dispara la carga filtrada (paso 5).
   */
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const [regionsRes, categoriesRes, yearsRes] = await Promise.all([
          regionsAPI.getAll(),
          categoriesAPI.getAll(),
          statsAPI.years(),
        ]);

        setRegions(regionsRes.data);
        setCategories(categoriesRes.data);
        setAvailableYears(yearsRes.data);

        // El año más reciente es el predeterminado
        const latestYear = yearsRes.data.length > 0
          ? Math.max(...yearsRes.data)
          : null;
        setSelectedYear(latestYear);

        // Marca que ya se completó la inicialización
        initializedRef.current = true;
      } catch (err) {
        setError('Error al cargar datos iniciales');
        console.error('[BudgetContext] loadInitialData:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  /* ---------------------------------------------------------------
   * 5. CARGA FILTRADA — Se ejecuta al cambiar filtros
   * ---------------------------------------------------------------
   * Construye el objeto `params` con los filtros activos y lanza
   * 6 peticiones en paralelo:
   *
   *  | Endpoint              | ¿Usa filtros?       | Qué devuelve                |
   *  |-----------------------|---------------------|-----------------------------|
   *  | stats/summary         | año, sector, región | Resumen KPIs                |
   *  | stats/map-data        | año, sector, región | Datos para el mapa          |
   *  | budgets/by-sector     | año, sector, región | Barras de gasto por sector  |
   *  | budgets/by-year       | (siempre España)    | Serie temporal nacional     |
   *  | budgets/by-region     | año, sector         | Ranking CCAA                |
   *  | budgets/evolution     | (siempre España)    | Evolución multi-sector      |
   *
   * Nota: `byYear` y `evolution` siempre se piden a nivel nacional
   * para que la gráfica de evolución muestre la serie completa
   * independientemente de los filtros.
   */
  const loadFilteredData = useCallback(async () => {
    try {
      setLoading(true);

      // Construir parámetros según los filtros activos
      const params = {};
      if (selectedYear)   params.year   = selectedYear;
      if (selectedSector) params.sector  = selectedSector;
      if (selectedRegion) params.region  = selectedRegion;

      const [summaryRes, mapRes, sectorRes, yearRes, regionRes, evolutionRes] =
        await Promise.all([
          statsAPI.summary(params),                        // KPIs con filtros
          statsAPI.mapData(params),                        // Mapa con filtros
          budgetsAPI.bySector(params),                     // Sectores con filtros
          budgetsAPI.byYear({ territory: 'España' }),      // Evolución nacional (sin filtro)
          budgetsAPI.byRegion(params),                     // Ranking CCAA con filtros
          budgetsAPI.evolution({ territory: 'España' }),   // Evolución por sector (sin filtro)
        ]);

      setSummary(summaryRes.data);
      setMapData(mapRes.data);
      setSectorData(sectorRes.data);
      setYearData(yearRes.data);
      setRegionBudgets(regionRes.data);
      setEvolutionData(evolutionRes.data);
      setError(null);
    } catch (err) {
      setError('Error al cargar datos filtrados');
      console.error('[BudgetContext] loadFilteredData:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedSector, selectedRegion]);

  // Disparar la recarga cada vez que cambien los filtros,
  // pero solo después de que la carga inicial haya terminado.
  useEffect(() => {
    if (initializedRef.current) {
      loadFilteredData();
    }
  }, [loadFilteredData]);

  /* ---------------------------------------------------------------
   * 6. DATOS CALCULADOS — Derivados con useMemo
   * --------------------------------------------------------------- */

  /** Presupuesto total nacional (suma de todas las CCAA) */
  const totalBudget = useMemo(() => {
    return summary?.nationalBudget || 0;
  }, [summary]);

  /** Sector con mayor importe presupuestado */
  const topSector = useMemo(() => {
    return summary?.topSector || null;
  }, [summary]);

  /**
   * Sectores con su porcentaje sobre el total.
   * Cada elemento: { sector, total, percentage, ... }
   */
  const sectorPercentages = useMemo(() => {
    if (!sectorData.length) return [];
    const total = sectorData.reduce((sum, s) => sum + s.total, 0);
    return sectorData.map(s => ({
      ...s,
      percentage: total > 0 ? ((s.total / total) * 100).toFixed(1) : 0,
    }));
  }, [sectorData]);

  /** CCAA ordenadas de mayor a menor presupuesto */
  const regionsSorted = useMemo(() => {
    return [...regionBudgets].sort((a, b) => b.total - a.total);
  }, [regionBudgets]);

  /** Solo las regiones de tipo 'comunidad_autonoma' (excluye ciudades autónomas, etc.) */
  const ccaaRegions = useMemo(() => {
    return regions.filter(r => r.type === 'comunidad_autonoma');
  }, [regions]);

  /* ---------------------------------------------------------------
   * 7. VALOR DEL CONTEXTO — Todo lo que consumen los componentes
   * --------------------------------------------------------------- */
  const value = {
    // ── Datos crudos ──
    summary,
    regions,
    ccaaRegions,
    categories,
    mapData,
    sectorData,
    yearData,
    evolutionData,
    regionBudgets,
    regionsSorted,

    // ── Datos calculados ──
    totalBudget,
    topSector,
    sectorPercentages,

    // ── Filtros (lectura + setters) ──
    selectedYear,
    selectedRegion,
    selectedSector,
    availableYears,
    setSelectedYear,
    setSelectedRegion,
    setSelectedSector,

    // ── Estado UI ──
    loading,
    error,

    // ── Acciones ──
    refreshData: loadFilteredData,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
}


