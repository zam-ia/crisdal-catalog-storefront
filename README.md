# CRISDAL Catalog Storefront

Consulta [PLAN_MAESTRO_PRODUCTO.md](./PLAN_MAESTRO_PRODUCTO.md) para la visión, arquitectura, criterios de aceptación y roadmap.
Frontend público multi-catálogo. Ruta: `/c/{slug}`.

## Plantilla restaurante

- Demo pública: `/demo/restaurante?mesa=08`
- Los catálogos con `layout_style = restaurant` usan navegación sticky, plato estrella, etiquetas, maridajes, pedido por WhatsApp y mesa tomada desde `?mesa=`.
- La carta sigue siendo una Web App; el PDF permanece disponible únicamente para los catálogos comerciales que lo requieran.

## Inicio rápido
1. `npm install`
2. Copia `.env.example` a `.env.local` y completa Supabase.
3. `npm run dev -- --port 3001`
4. Abre `http://localhost:3001/c/crisdal-shop`

Lee `DOCUMENTACION_MAESTRA.md` para el despliegue completo.
