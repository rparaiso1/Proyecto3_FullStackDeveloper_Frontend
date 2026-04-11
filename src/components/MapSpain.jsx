import { useState, useMemo, useCallback } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { useBudget } from '../hooks/useBudget';
import { formatCurrency } from '../utils/format';
import { FiMap } from 'react-icons/fi';
import InfoTip from './InfoTip';
import './MapSpain.css';

// GeoJSON simplificado de España (comunidades autónomas)
// Usamos el TopoJSON de España de las fuentes oficiales
const GEO_URL = 'https://raw.githubusercontent.com/codeforgermany/click_that_hood/main/public/data/spain-communities.geojson';

// Mapeo de nombres del GeoJSON a nombres de la base de datos
const NAME_MAP = {
  'Andalucía': 'Andalucía',
  'Aragón': 'Aragón',
  'Asturias': 'Asturias',
  'Principado de Asturias': 'Asturias',
  'Islas Baleares': 'Islas Baleares',
  'Illes Balears': 'Islas Baleares',
  'Canarias': 'Canarias',
  'Cantabria': 'Cantabria',
  'Castilla y León': 'Castilla y León',
  'Castilla-La Mancha': 'Castilla-La Mancha',
  'Cataluña': 'Cataluña',
  'Catalunya': 'Cataluña',
  'Comunidad Valenciana': 'Comunidad Valenciana',
  'Comunitat Valenciana': 'Comunidad Valenciana',
  'Valencia': 'Comunidad Valenciana',
  'Extremadura': 'Extremadura',
  'Galicia': 'Galicia',
  'Comunidad de Madrid': 'Comunidad de Madrid',
  'Madrid': 'Comunidad de Madrid',
  'Región de Murcia': 'Región de Murcia',
  'Murcia': 'Región de Murcia',
  'Navarra': 'Navarra',
  'Comunidad Foral de Navarra': 'Navarra',
  'País Vasco': 'País Vasco',
  'Euskadi': 'País Vasco',
  'La Rioja': 'La Rioja',
  'Ceuta': null,
  'Melilla': null,
};

function MapSpain({ onRegionClick }) {
  const { mapData, loading } = useBudget();
  const [tooltipContent, setTooltipContent] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Crear mapa de datos por nombre de región
  const regionDataMap = useMemo(() => {
    if (!mapData?.regions) return {};
    const map = {};
    mapData.regions.forEach(r => {
      map[r.name] = r;
    });
    return map;
  }, [mapData]);

  // Color de una comunidad basada en intensidad de gasto
  const getRegionColor = useCallback((geoName) => {
    const dbName = NAME_MAP[geoName];
    if (!dbName) return '#2a2a3e';
    const data = regionDataMap[dbName];
    if (!data) return '#2a2a3e';

    const intensity = data.intensity || 0;
    // Gradiente de azul claro a azul oscuro
    const r = Math.round(20 + (59 - 20) * intensity);
    const g = Math.round(60 + (130 - 60) * intensity);
    const b = Math.round(100 + (246 - 100) * intensity);
    return `rgb(${r},${g},${b})`;
  }, [regionDataMap]);

  const handleMouseEnter = useCallback((geo, evt) => {
    const geoName = geo.properties.name;
    const dbName = NAME_MAP[geoName];
    const data = dbName ? regionDataMap[dbName] : null;

    setTooltipContent({
      name: dbName || geoName,
      total: data ? formatCurrency(data.total) : 'Sin datos',
      perCapita: data ? `${data.perCapita.toLocaleString('es-ES')} €/hab` : '-',
      population: data ? data.population.toLocaleString('es-ES') : '-',
    });

    setTooltipPos({ x: evt.clientX, y: evt.clientY });
  }, [regionDataMap]);

  const handleMouseLeave = useCallback(() => {
    setTooltipContent(null);
  }, []);

  const handleClick = useCallback((geo) => {
    const geoName = geo.properties.name;
    const dbName = NAME_MAP[geoName];
    const data = dbName ? regionDataMap[dbName] : null;
    if (data && onRegionClick) {
      onRegionClick(data);
    }
  }, [regionDataMap, onRegionClick]);

  if (loading && !mapData) {
    return (
      <div className="map-container">
        <div className="map-skeleton">
          <div className="skeleton-title" />
          <div className="map-skeleton-shape">
            <div className="map-skeleton-blob" />
          </div>
          <div className="map-skeleton-legend">
            <div className="skeleton-line-h" style={{ width: 50, height: 10 }} />
            <div className="skeleton-line-h" style={{ width: 120, height: 10 }} />
            <div className="skeleton-line-h" style={{ width: 50, height: 10 }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <h3 className="chart-title"><FiMap size={16} style={{ verticalAlign: 'middle', marginRight: 6 }} />Mapa de Gasto por Comunidades Autónomas <InfoTip text="Mapa coroplético de España. La intensidad del color azul indica el nivel de gasto relativo de cada CCAA. Haz clic en una comunidad para ver su detalle." /></h3>
      <p className="map-subtitle">Haz clic en una comunidad para ver más detalles</p>

      <div className="map-wrapper">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            center: [-3.7, 40.0],
            scale: 2200,
          }}
          width={700}
          height={500}
          style={{ width: '100%', height: 'auto' }}
        >
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => geo.properties.name !== 'Canarias')
                  .map((geo) => (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getRegionColor(geo.properties.name)}
                    stroke="var(--border-color)"
                    strokeWidth={0.5}
                    style={{
                      default: { outline: 'none' },
                      hover: {
                        fill: '#60A5FA',
                        outline: 'none',
                        cursor: 'pointer',
                        stroke: '#fff',
                        strokeWidth: 1.5,
                      },
                      pressed: { outline: 'none', fill: '#2563EB' },
                    }}
                    onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                    onMouseLeave={handleMouseLeave}
                    onClick={() => handleClick(geo)}
                  />
                ))
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {/* Inset Islas Canarias */}
        <div className="canarias-inset">
          <span className="canarias-label">Islas Canarias</span>
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              center: [-15.5, 28.2],
              scale: 3200,
            }}
            width={200}
            height={120}
            style={{ width: '100%', height: 'auto' }}
          >
            <Geographies geography={GEO_URL}>
              {({ geographies }) =>
                geographies
                  .filter((geo) => geo.properties.name === 'Canarias')
                  .map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={getRegionColor(geo.properties.name)}
                      stroke="var(--border-color)"
                      strokeWidth={0.5}
                      style={{
                        default: { outline: 'none' },
                        hover: {
                          fill: '#60A5FA',
                          outline: 'none',
                          cursor: 'pointer',
                          stroke: '#fff',
                          strokeWidth: 1.5,
                        },
                        pressed: { outline: 'none', fill: '#2563EB' },
                      }}
                      onMouseEnter={(evt) => handleMouseEnter(geo, evt)}
                      onMouseLeave={handleMouseLeave}
                      onClick={() => handleClick(geo)}
                    />
                  ))
              }
            </Geographies>
          </ComposableMap>
        </div>
      </div>

      {/* Leyenda */}
      <div className="map-legend">
        <span className="legend-label">Menor gasto</span>
        <div className="legend-gradient" />
        <span className="legend-label">Mayor gasto</span>
      </div>

      <p className="map-disclaimer">
        Ceuta y Melilla son ciudades autónomas y no disponen de presupuestos autonómicos comparables.
        Las comunidades sin color pueden no haber publicado aún sus datos para el año seleccionado.
      </p>

      {/* Tooltip */}
      {tooltipContent && (
        <div
          className="map-tooltip"
          style={{
            left: tooltipPos.x + 15,
            top: tooltipPos.y - 10,
          }}
        >
          <strong>{tooltipContent.name}</strong>
          <div className="tooltip-row">
            <span>Presupuesto:</span>
            <span>{tooltipContent.total}</span>
          </div>
          <div className="tooltip-row">
            <span>Per cápita:</span>
            <span>{tooltipContent.perCapita}</span>
          </div>
          <div className="tooltip-row">
            <span>Población:</span>
            <span>{tooltipContent.population}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default MapSpain;
