import { useState, useEffect } from 'react';
import {
  FiTarget, FiFolder, FiTool, FiZap, FiMap, FiLock, FiBarChart2,
  FiCode, FiServer, FiDatabase, FiPackage, FiNavigation, FiClock,
  FiLayers, FiShield, FiExternalLink, FiCheckCircle, FiInfo,
  FiCpu, FiGitBranch,
} from 'react-icons/fi';
import { HiOutlineBuildingLibrary } from 'react-icons/hi2';
import { statsAPI, regionsAPI, categoriesAPI } from '../services/api';
import './About.css';

const DATA_SOURCES = [
  {
    name: 'Presupuestos Generales del Estado (PGE)',
    org: 'Ministerio de Hacienda',
    url: 'https://www.sepg.pap.hacienda.gob.es/sitios/sepg/es-ES/Presupuestos/PGE/Paginas/PGE.aspx',
    desc: 'Presupuestos nacionales desglosados por sector y programa.',
    scope: 'España · Nacional',
  },
  {
    name: 'Liquidación CCAA (IGAE)',
    org: 'Intervención General de la Administración del Estado',
    url: 'https://www.igae.pap.hacienda.gob.es/',
    desc: 'Derechos reconocidos netos no financieros (DRN) de las 17 CCAA por capítulo económico.',
    scope: 'España · Autonómico',
  },
  {
    name: 'datos.gob.es',
    org: 'Gobierno de España',
    url: 'https://datos.gob.es/',
    desc: 'Portal oficial de datos abiertos. Fuente complementaria y validación cruzada.',
    scope: 'España · Multiadministración',
  },
  {
    name: 'Eurostat — gov_10a_exp (COFOG)',
    org: 'Oficina Estadística de la UE',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10a_exp/default/table',
    desc: 'Gasto público por función (clasificación COFOG) en porcentaje del PIB de cada Estado miembro.',
    scope: 'Europa · UE-27',
  },
  {
    name: 'Eurostat — gov_10dd_edpt1',
    org: 'Oficina Estadística de la UE',
    url: 'https://ec.europa.eu/eurostat/databrowser/view/gov_10dd_edpt1/default/table',
    desc: 'Deuda pública y déficit/superávit de los Estados miembros de la UE.',
    scope: 'Europa · UE-27',
  },
];

const TECH_STACK = [
  { icon: <FiCode size={18} color="#61DAFB" />,       label: 'React 19 + Vite 5' },
  { icon: <FiNavigation size={18} color="#CA4245" />,  label: 'React Router 7' },
  { icon: <FiServer size={18} color="#68A063" />,      label: 'Node.js + Express 4' },
  { icon: <FiDatabase size={18} color="#47A248" />,    label: 'MongoDB Atlas + Mongoose 8' },
  { icon: <FiBarChart2 size={18} color="#8884d8" />,   label: 'Recharts 3' },
  { icon: <FiMap size={18} color="#4F9EFF" />,         label: 'React Simple Maps + D3-Geo' },
  { icon: <FiLock size={18} color="#FBBF24" />,        label: 'JWT + bcrypt (autenticación)' },
  { icon: <FiClock size={18} color="#34D399" />,       label: 'node-cron (actualización automática)' },
  { icon: <FiLayers size={18} color="#A78BFA" />,      label: 'Code Splitting + Lazy Loading' },
  { icon: <FiCpu size={18} color="#FB923C" />,         label: 'LightningCSS + ES2020 target' },
];

const ROADMAP = [
  { phase: 1, title: 'España',     desc: 'Presupuestos nacionales y por CCAA',                   status: 'done' },
  { phase: 2, title: 'Europa',     desc: 'Comparativa UE-27 con datos Eurostat (COFOG + deuda)',  status: 'done' },
  { phase: 3, title: 'Municipios', desc: 'Desglose a nivel municipal',                            status: 'planned' },
];

function About() {
  const [info, setInfo] = useState({ minYear: 2019, maxYear: 2024, regionCount: 17, sectorCount: 10 });

  useEffect(() => {
    const load = async () => {
      try {
        const [yearsRes, regionsRes, catsRes] = await Promise.all([
          statsAPI.years(),
          regionsAPI.getAll({ type: 'comunidad_autonoma' }),
          categoriesAPI.getAll(),
        ]);
        const years = yearsRes.data;
        const ccaa = Array.isArray(regionsRes.data) ? regionsRes.data.filter(r => r.type === 'comunidad_autonoma') : [];
        setInfo({
          minYear: years.length ? Math.min(...years) : 2019,
          maxYear: years.length ? Math.max(...years) : 2024,
          regionCount: ccaa.length || 17,
          sectorCount: Array.isArray(catsRes.data) ? catsRes.data.length : 10,
        });
      } catch {
        // Mantiene los valores por defecto
      }
    };
    load();
  }, []);

  return (
    <div className="page-container">
      <header className="about-header">
        <h1><HiOutlineBuildingLibrary size={28} aria-hidden="true" />Transparencia del Gasto Público en España</h1>
        <p className="about-subtitle">
          Plataforma interactiva de análisis de presupuestos estatales, autonómicos y europeos
          basada en datos oficiales del Gobierno de España y Eurostat
        </p>
        <span className="about-version">v2.0 · Última actualización: 2025</span>
      </header>

      <div className="about-grid">
        {/* ─── ¿Qué es? ─── */}
        <section className="about-card">
          <h2><FiBarChart2 size={18} aria-hidden="true" />¿Qué es esta plataforma?</h2>
          <p>
            Esta aplicación permite a cualquier ciudadano explorar y comprender cómo se
            distribuye el gasto público en España y los 27 Estados miembros de la UE.
            Ofrecemos una visualización clara, interactiva y transparente del presupuesto
            nacional, la financiación autonómica y la comparativa europea.
          </p>
        </section>

        {/* ─── Objetivo ─── */}
        <section className="about-card">
          <h2><FiTarget size={18} aria-hidden="true" />Objetivo</h2>
          <p>
            Promover la transparencia gubernamental permitiendo analizar el presupuesto por:
          </p>
          <ul>
            <li><FiCheckCircle size={13} aria-hidden="true" /> Año fiscal ({info.minYear}–{info.maxYear})</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> {info.sectorCount} sectores: Sanidad, Educación, Defensa…</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> {info.regionCount} Comunidades Autónomas</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> 27 países de la Unión Europea</li>
          </ul>
        </section>

        {/* ─── Fuentes de datos ─── */}
        <section className="about-card full-width">
          <h2><FiFolder size={18} aria-hidden="true" />Fuentes de Datos</h2>
          <p>
            Todos los datos provienen de fuentes oficiales y están enlazados directamente
            para que puedas verificarlos:
          </p>
          <div className="source-list">
            {DATA_SOURCES.map((src) => (
              <div className="source-item" key={src.name}>
                <div className="source-header">
                  <strong>{src.name}</strong>
                  <span className="source-scope">{src.scope}</span>
                </div>
                <p>{src.desc}</p>
                <span className="source-org">{src.org}</span>
                <a href={src.url} target="_blank" rel="noopener noreferrer" className="source-link">
                  Acceder a la fuente <FiExternalLink size={12} aria-hidden="true" />
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Metodología ─── */}
        <section className="about-card full-width">
          <h2><FiInfo size={18} aria-hidden="true" />Metodología y Tratamiento de Datos</h2>
          <div className="methodology-grid">
            <div className="method-item">
              <h3>Datos nacionales (PGE)</h3>
              <p>
                Los presupuestos se obtienen de archivos Excel oficiales del Ministerio de
                Hacienda, convertidos a CSV y cargados mediante scripts de seed automatizados.
                Las cifras reflejan los créditos presupuestarios iniciales.
              </p>
            </div>
            <div className="method-item">
              <h3>Financiación autonómica (IGAE)</h3>
              <p>
                Los ingresos de las CCAA corresponden a Derechos Reconocidos Netos No Financieros
                (DRN). La IGAE publica con 14-18 meses de retraso; cuando aún no hay datos
                oficiales, se genera una proyección provisional etiquetada y verificable.
              </p>
            </div>
            <div className="method-item">
              <h3>Datos europeos (Eurostat)</h3>
              <p>
                Se consulta la API REST de Eurostat (JSON-stat 2.0) para obtener gasto por
                función COFOG en % del PIB y deuda/déficit. Los datos se cachean 12 h
                (Eurostat actualiza trimestralmente). Años y países se detectan automáticamente.
              </p>
            </div>
            <div className="method-item">
              <h3>Actualización automática</h3>
              <p>
                Un cron programado consulta periódicamente datos.gob.es para detectar nuevas
                publicaciones. Si aún no hay datos oficiales del año esperado, se proyectan
                valores provisionales con tasas de crecimiento históricas, claramente señalizados.
              </p>
            </div>
          </div>
          <div className="about-note">
            <FiShield size={14} aria-hidden="true" />
            <p className="about-note-text">
              Los datos de las secciones de España y Financiación por sector y CCAA son <strong>estimaciones representativas</strong> basadas en distribuciones de los PGE; las cifras a nivel de programa dentro de cada CCAA son aproximaciones proporcionales, no liquidaciones por partida.
            </p>
          </div>
        </section>

        {/* ─── Tecnologías ─── */}
        <section className="about-card">
          <h2><FiTool size={18} aria-hidden="true" />Tecnologías</h2>
          <div className="tech-grid">
            {TECH_STACK.map((t) => (
              <div className="tech-item" key={t.label}>
                <span className="tech-icon" aria-hidden="true">{t.icon}</span>
                <span>{t.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ─── Seguridad y Privacidad ─── */}
        <section className="about-card">
          <h2><FiShield size={18} aria-hidden="true" />Seguridad y Privacidad</h2>
          <ul>
            <li><FiCheckCircle size={13} aria-hidden="true" /> Autenticación JWT con contraseñas cifradas (bcrypt)</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> Cabeceras de seguridad HTTP con Helmet</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> Rate limiting contra abusos</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> CORS restringido a orígenes autorizados</li>
            <li><FiCheckCircle size={13} aria-hidden="true" /> No se almacenan datos personales más allá del registro</li>
          </ul>
        </section>

        {/* ─── Escalabilidad / Roadmap ─── */}
        <section className="about-card full-width">
          <h2><FiZap size={18} aria-hidden="true" />Escalabilidad</h2>
          <div className="roadmap">
            {ROADMAP.map((r, idx) => (
              <div className={`roadmap-item ${r.status}`} key={r.phase}>
                <div className="roadmap-dot" />
                {idx < ROADMAP.length - 1 && <div className="roadmap-connector" />}
                <span className="roadmap-phase">Fase {r.phase}</span>
                <span className="roadmap-title">{r.title}</span>
                <p>{r.desc}</p>
                {r.status === 'done' && <span className="roadmap-status done"><FiCheckCircle size={12} /> Completada</span>}
                {r.status === 'planned' && <span className="roadmap-status planned"><FiClock size={12} /> Planificada</span>}
              </div>
            ))}
          </div>
        </section>

        {/* ─── Accesibilidad ─── */}
        <section className="about-card full-width">
          <h2><FiGitBranch size={18} aria-hidden="true" />Accesibilidad</h2>
          <p>
            Esta plataforma ha sido desarrollada siguiendo las pautas WCAG 2.1. Incluye
            navegación por teclado completa, skip-link al contenido principal, atributos
            ARIA en todos los controles interactivos, contrastes adecuados y diseño responsive
            optimizado para dispositivos móviles.
          </p>
        </section>
      </div>

      <footer className="about-footer">
        <p>
          Proyecto desarrollado con fines educativos y de transparencia pública.
        </p>
        <p className="about-copy">
          © 2024–{new Date().getFullYear()} Transparencia del Gasto Público en España
        </p>
      </footer>
    </div>
  );
}

export default About;
