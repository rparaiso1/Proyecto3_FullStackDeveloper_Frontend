/**
 * Utilidades de formato compartidas para todo el Dashboard.
 *
 * Centraliza las funciones de formateo de moneda y números que
 * se usan en KPICards, SectorChart, EvolutionChart, DistributionChart
 * y RegionChart, eliminando duplicación y garantizando consistencia.
 */

/**
 * Formatea una cantidad monetaria a formato legible español.
 * Usa sufijos para cantidades grandes:
 *   >= 1.000 millones  →  "X.X MM€"  (miles de millones)
 *   >= 1 millón        →  "X.X M€"   (millones)
 *   >= 1.000           →  "X.X K€"   (miles)
 *   < 1.000            →  "X €"
 *
 * @param {number} amount — Cantidad en euros
 * @param {object} [options]
 * @param {boolean} [options.compact=false] — Si true, omite decimales en rangos M€
 * @returns {string} Texto formateado
 *
 * @example
 *   formatCurrency(133_000_000_000)   // "133.0 MM€"
 *   formatCurrency(36_400_000_000)    // "36.4 MM€"
 *   formatCurrency(2_500_000)         // "2.5 M€"
 *   formatCurrency(1335)              // "1335 €"
 */
export function formatCurrency(amount, { compact = false } = {}) {
  if (amount == null || isNaN(amount)) return '— €';

  if (amount >= 1e9) return `${(amount / 1e9).toFixed(1)} MM€`;
  if (amount >= 1e6) {
    return compact
      ? `${(amount / 1e6).toFixed(0)} M€`
      : `${(amount / 1e6).toFixed(1)} M€`;
  }
  if (amount >= 1e3) return `${(amount / 1e3).toFixed(1)} K€`;
  return `${Math.round(amount).toLocaleString('es-ES')} €`;
}

/**
 * Versión compacta de formatCurrency pensada para ejes de gráficas
 * donde el espacio es limitado (sin espacios entre número y sufijo).
 *
 * @param {number} value — Cantidad en euros
 * @returns {string}
 *
 * @example
 *   formatAxisAmount(36_400_000_000)  // "36.4MM€"
 *   formatAxisAmount(2_500_000)       // "2500M€"  → "3M€" en compact
 */
export function formatAxisAmount(value) {
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}MM€`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(0)}M€`;
  return value.toLocaleString('es-ES');
}

/**
 * Formatea un importe que ya viene expresado en millones de euros.
 * Uso principal: páginas de financiación (IGAE) y balance.
 *
 * @param {number} value — Cantidad en millones de €
 * @returns {string}
 *
 * @example
 *   formatMillions(1500)   // "1.5k M€"
 *   formatMillions(300)    // "300 M€"
 *   formatMillions(-42)    // "-42 M€"
 */
export function formatMillions(value) {
  const abs = Math.abs(value);
  if (abs >= 1000) return `${(value / 1000).toFixed(1)}k M€`;
  return `${value.toFixed(0)} M€`;
}

/**
 * Formatea un importe per cápita (euros enteros).
 *
 * @param {number} value — Cantidad en euros
 * @returns {string}
 *
 * @example
 *   formatEuros(3456) // "3.456 €"
 */
export function formatEuros(value) {
  return `${Math.round(value).toLocaleString('es-ES')} €`;
}
