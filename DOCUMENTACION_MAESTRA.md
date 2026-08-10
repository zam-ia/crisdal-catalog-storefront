# CRISDAL CATALOG SYSTEM — Documentación Maestra

## 1. Qué estás desplegando

El sistema está separado en **dos aplicaciones Next.js** que comparten **un único proyecto Supabase**:

1. **CRISDAL Catalog Admin**: panel privado de CRISDAL Agency. Aquí creas clientes/catálogos, branding, categorías y productos; subes imágenes; publicas u ocultas catálogos; importas productos por CSV.
2. **CRISDAL Catalog Storefront**: web pública multi-catálogo. Cada marca vive en una ruta propia: `/c/{slug}`. Ejemplo: `/c/crisdal-shop`.

Esto te da exactamente dos proyectos/enlaces de Vercel, pero una sola base de datos y un solo repositorio de archivos en Supabase Storage.

## 2. Arquitectura

```text
CRISDAL AGENCY
   |
   +-- Admin (Vercel proyecto 1)
   |      |
   |      +-- Supabase Auth
   |      +-- CRUD catálogos / categorías / productos
   |      +-- Upload de logos y fotos a Supabase Storage
   |
   +-- Storefront (Vercel proyecto 2)
          |
          +-- /c/crisdal-shop
          +-- /c/cliente-zapatos
          +-- /c/restaurante-x
          +-- Lee únicamente contenido publicado por RLS

                 SUPABASE
          PostgreSQL + Auth + Storage
```

## 3. Por qué dos proyectos y no uno

- Separas seguridad y experiencia del administrador del sitio público.
- Puedes usar dominios independientes: `admin.tuagencia.com` y `catalogos.tuagencia.com`.
- Un fallo visual en storefront no compromete el panel admin.
- Un solo storefront sirve a cientos de clientes mediante `slug`; no necesitas un deploy por cliente.
- En el futuro puedes agregar dominios personalizados por cliente sin cambiar la base de datos.

## 4. Stack

- Next.js 16 / App Router
- React 19
- TypeScript
- Supabase Database
- Supabase Auth (email + password para administradores)
- Supabase Storage (`catalog-assets`)
- Supabase Row Level Security (RLS)
- Vercel para los dos despliegues

## 5. Modelo de datos

### `admin_users`
Lista blanca de usuarios que pueden administrar. El login de Supabase por sí solo NO basta; el usuario también debe estar aquí.

### `catalogs`
Una fila = una marca/cliente. Campos principales:
- nombre + slug
- logo
- textos hero
- colores principales/secundarios/acento/fondo/texto
- tipografía CSS
- moneda
- WhatsApp y RRSS
- tipo de layout: `fashion`, `restaurant`, `minimal`, `luxury`
- publicado/borrador

### `categories`
Categorías por catálogo: Calzado, Ropa, Entradas, Bebidas, etc.

### `products`
Producto genérico que funciona para moda, calzado, comida o servicios:
- nombre, SKU, descripciones
- precio y precio anterior
- imagen principal + galería preparada en JSON
- badge
- variantes JSON (tallas, colores)
- estado de stock
- destacado / activo
- orden

## 6. Seguridad

El storefront usa solo la **publishable key**. La seguridad real está en RLS:
- público: solo lee catálogos publicados, categorías activas y productos activos;
- admin autenticado y autorizado en `admin_users`: CRUD completo;
- Storage: lectura pública del bucket y escritura solo para admins.

No se usa `service_role` en el navegador.

## 7. Instalación paso a paso

### A. Crear Supabase
1. Crea un proyecto en Supabase.
2. Ve a **SQL Editor**.
3. Ejecuta `supabase/001_schema.sql` del ZIP admin.
4. Ejecuta `supabase/002_seed_crisdal_shop.sql` para cargar CRISDAL SHOP de prueba.
5. Ve a **Authentication > Users > Add user** y crea tu usuario admin.
6. Edita el correo en `supabase/003_make_admin.sql` y ejecútalo.
7. En **Project Settings / API** copia:
   - Project URL
   - Publishable key

### B. Subir Admin a GitHub y Vercel
1. Descomprime `crisdal-catalog-admin.zip`.
2. Crea un repositorio GitHub y sube el contenido.
3. Importa ese repo en Vercel.
4. Agrega variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `NEXT_PUBLIC_STOREFRONT_URL` = URL productiva del storefront (puedes agregarla después y redeployar).
5. Deploy.

### C. Subir Storefront a GitHub y Vercel
1. Descomprime `crisdal-catalog-storefront.zip`.
2. Nuevo repositorio GitHub.
3. Importa en Vercel.
4. Agrega las mismas dos variables Supabase.
5. Deploy.
6. Abre `/c/crisdal-shop`.

## 8. Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
```

Solo admin:

```env
NEXT_PUBLIC_STOREFRONT_URL=https://tu-storefront.vercel.app
```

## 9. Flujo operativo diario

1. Cliente nuevo → Admin → **Nuevo catálogo**.
2. Configuras branding y WhatsApp.
3. Creas categorías.
4. Cargas productos manualmente o por CSV.
5. Activas **Publicar catálogo**.
6. Entregas al cliente `https://TU-STOREFRONT/c/slug-del-cliente`.
7. Si el cliente cambia precio o producto, editas desde el admin. El storefront lee Supabase directamente y refleja el cambio.

## 10. CRISDAL SHOP incluida como piloto

Branding detectado del logo entregado:
- color principal aproximado: `#8E2043` (borgoña)
- fondo oscuro / negro como contraste
- estilo visual: fashion / urbano

La semilla incluye 3 categorías y 5 productos demo. Las imágenes de demo son SVG locales y se pueden reemplazar desde el panel.

## 11. Cómo adaptar a restaurantes

No hace falta otro sistema. Crea un nuevo catálogo y usa:
- plantilla `restaurant`
- categorías: Entradas, Platos, Bebidas, Postres
- `stock_status` como disponible/agregado/ag​otado
- variantes para tamaños o sabores
- CTA de WhatsApp para pedido/consulta

## 12. Qué falta para una versión SaaS comercial completa

Este MVP ya sirve para operar. Fase 2 recomendada:
- múltiples empleados con roles (owner/editor/viewer)
- analytics por catálogo y clics a WhatsApp
- dominio personalizado por cliente
- editor de secciones del hero
- múltiples fotos por producto desde UI
- reordenamiento drag & drop
- importador CSV robusto con comillas/comas complejas
- generación QR del catálogo
- pedidos / carrito opcional
- API/webhooks para sincronizar stock
- auditoría de cambios

## 13. Reglas importantes

- No subas claves privadas a GitHub.
- No uses `service_role` en variables `NEXT_PUBLIC_*`.
- No desactives RLS para “hacer que funcione”.
- Mantén un solo Supabase inicialmente; escala a proyectos separados por cliente solo si compliance o volumen lo exige.
- Usa slugs únicos y cortos.
