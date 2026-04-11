import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de auth
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

// =====================================================
// AUTH API
// =====================================================
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/me'),
};

// =====================================================
// BUDGETS API
// =====================================================
export const budgetsAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getById: (id) => api.get(`/budgets/${id}`),
  byYear: (params) => api.get('/budgets/by-year', { params }),
  bySector: (params) => api.get('/budgets/by-sector', { params }),
  byProgram: (params) => api.get('/budgets/by-program', { params }),
  byRegion: (params) => api.get('/budgets/by-region', { params }),
  evolution: (params) => api.get('/budgets/evolution', { params }),
};

// =====================================================
// REGIONS API
// =====================================================
export const regionsAPI = {
  getAll: (params) => api.get('/regions', { params }),
  getById: (id) => api.get(`/regions/${id}`),
};

// =====================================================
// CATEGORIES API
// =====================================================
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
};

// =====================================================
// STATS API
// =====================================================
export const statsAPI = {
  summary: (params) => api.get('/stats/summary', { params }),
  mapData: (params) => api.get('/stats/map-data', { params }),
  years: () => api.get('/stats/years'),
  fiscal: (params) => api.get('/stats/fiscal', { params }),
};

// =====================================================
// INGRESOS API (IGAE - Liquidación CCAA)
// =====================================================
export const ingresosAPI = {
  getAll: (params) => api.get('/ingresos', { params }),
  byYear: (params) => api.get('/ingresos/by-year', { params }),
  byRegion: (params) => api.get('/ingresos/by-region', { params }),
  balance: (params) => api.get('/ingresos/balance', { params }),
  evolucion: (params) => api.get('/ingresos/evolucion', { params }),
  estructura: (params) => api.get('/ingresos/estructura', { params }),
};

// =====================================================
// EUROSTAT API (Comparativa Europea)
// =====================================================
export const eurostatAPI = {
  expenditure: (params) => api.get('/eurostat/expenditure', { params }),
  fiscal: (params) => api.get('/eurostat/fiscal', { params }),
  meta: () => api.get('/eurostat/meta'),
};

export default api;
