# Frontend — Transparencia del Gasto Público

SPA en React para visualización interactiva del gasto público de España y comparativa europea.

## Demo

https://transparencia-gasto.netlify.app

### Credenciales de prueba

| Email | Contraseña | Rol |
|---|---|---|
| `admin@transparencia.es` | `Admin1234!` | admin |
| `demo@transparencia.es` | `Demo1234!` | user |

## Stack

- React 18 · Vite 5 · React Router 7
- Recharts (gráficos) · react-simple-maps (mapa)
- Axios · react-icons

## Instalación

```bash
npm install
cp .env.example .env   # Ajustar VITE_API_URL si procede
npm run dev
```

## Scripts

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 5173) |
| `npm run build` | Build de producción en `dist/` |
| `npm run preview` | Previsualiza el build |
| `npm run lint` | Lint con ESLint |

## Variable de entorno

| Variable | Valor por defecto |
|---|---|
| `VITE_API_URL` | `http://localhost:5000/api` |

## Estructura

```
src/
├── components/       # Navbar, Filters, MapSpain, Charts/...
├── context/          # AuthContext, BudgetContext
├── hooks/            # useAuth, useBudget
├── pages/            # Dashboard, Regions, RegionDetail, Europa, Financiacion, Login, Register, About
├── services/         # api.js (cliente Axios)
└── utils/            # format.js
```
