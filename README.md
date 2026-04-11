# Frontend — Transparencia del Gasto Público

SPA en React + Vite para visualización de gasto público nacional, autonómico y comparativa europea.

## Stack

- React 18
- Vite 5
- React Router 7
- Recharts + react-simple-maps
- Axios

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Variables de entorno

- `VITE_API_URL` (opcional): URL base de la API.
	- Por defecto: `http://localhost:5000/api`

## Notas de compatibilidad

- El proyecto está fijado en React 18 para compatibilidad con `react-simple-maps@3`.
- Para migrar a React 19, primero habría que actualizar/reemplazar esa librería.
