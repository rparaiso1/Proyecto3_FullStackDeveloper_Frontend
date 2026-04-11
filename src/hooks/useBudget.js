import { useContext } from 'react';
import { BudgetContext } from '../context/budgetContextDef';

/**
 * Hook para consumir el BudgetContext.
 * IMPORTANTE: solo funciona dentro de un <BudgetProvider>.
 */
export function useBudget() {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error(
      'useBudget() debe usarse dentro de <BudgetProvider>. ' +
      'Asegúrate de envolver tu componente con <BudgetProvider>.'
    );
  }
  return context;
}
