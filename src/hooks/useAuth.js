import { useContext } from 'react';
import { AuthContext } from '../context/authContextDef';

/**
 * Hook para consumir el AuthContext.
 * Solo funciona dentro de un <AuthProvider>.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() debe usarse dentro de <AuthProvider>.');
  }
  return context;
}
