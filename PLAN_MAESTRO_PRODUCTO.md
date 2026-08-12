# CRISDAL Catalog — Plan maestro del producto

Este documento explica la idea completa en lenguaje de negocio y técnico. Sirve como fuente de verdad para continuar el desarrollo con una IA, un freelance o un equipo.

## 1. Visión

CRISDAL Catalog permite a una agencia crear y mantener catálogos digitales para negocios de distintos rubros. Cada cliente recibe un enlace permanente y un código QR; la agencia puede actualizar productos, fotos, precios y disponibilidad sin cambiar el enlace ni volver a imprimir el QR.

La propuesta de valor es: **“Un catálogo que siempre está actualizado, se ve profesional en el teléfono y convierte consultas desordenadas en pedidos claros.”**

## 2. Usuarios

### Administrador de CRISDAL Agency

- Crea clientes y catálogos.
- Configura logo, colores, textos, moneda y WhatsApp.
- Crea categorías y productos.
- Carga varias imágenes por producto, elige portada y ordena la galería.
- Publica u oculta catálogos y productos.
- Importa inventarios por CSV.

### Negocio cliente

- Entrega información y fotos a la agencia.
- Comparte su link o QR en redes, mesas, empaques, vitrinas o impresos.
- Solicita cambios a la agencia.
- Recibe pedidos o consultas por WhatsApp.

### Comprador final

- Entra desde link o QR sin instalar una aplicación.
- Busca y filtra productos.
- Revisa fotos, precio, descripción, tallas y colores.
- Arma un pedido y ajusta cantidades.
- Comparte un PDF del pedido directamente desde el teléfono o lo descarga para adjuntarlo desde una computadora.

## 3. Arquitectura actual

```text
Landing comercial + Storefront público (Next.js / Vercel)
  ├─ /
  ├─ /c/{slug-del-cliente}
  ├─ /c/{slug-del-cliente}/producto/{id}
  └─ /api/orders/generate-pdf

Panel administrativo privado (Next.js / Vercel)
  ├─ Supabase Auth
  ├─ Catálogos
  ├─ Categorías
  ├─ Productos + galerías
  └─ Importación CSV

Supabase
  ├─ PostgreSQL
  ├─ Row Level Security
  └─ Storage: catalog-assets
```

Se mantienen dos aplicaciones para separar la zona pública de la zona privada. Ambas usan el mismo proyecto Supabase.

## 4. Módulos funcionales

### Landing comercial

- Explica el beneficio sin jerga técnica.
- Muestra modelos para moda, restaurantes, catálogos minimalistas y marcas premium.
- Explica el proceso de trabajo de la agencia.
- Enlaza a una demostración real.
- Presenta la función de pedido en PDF.

### Storefront multi-cliente

- Una sola aplicación soporta muchos catálogos mediante `/c/{slug}`.
- Branding por catálogo mediante variables de color y tipografía.
- Diseño mobile-first.
- Categorías, búsqueda y estados de stock.
- Página individual de producto con galería.
- Variantes de talla y color.
- Carrito persistente en el dispositivo.
- Datos opcionales del comprador: nombre, teléfono e indicaciones.
- PDF con código de pedido, productos, variantes, cantidades, subtotales y total.

### Panel administrativo

- Login mediante Supabase Auth y lista blanca `admin_users`.
- Dashboard de catálogos.
- Editor de marca y publicación.
- Gestión de categorías.
- Gestión de productos.
- Carga de hasta 8 imágenes por producto.
- Validación de JPG, PNG, WebP y AVIF; máximo 8 MB por archivo.
- Elección de portada, reordenamiento y eliminación visual antes de guardar.
- Importador CSV que reconoce comas dentro de campos entre comillas.

## 5. Modelo de datos

### `catalogs`

- Identidad: `id`, `name`, `slug`, `description`.
- Presentación: `logo_url`, `hero_title`, `hero_subtitle`.
- Diseño: colores, tipografía y `layout_style`.
- Venta: moneda, WhatsApp y redes.
- Estado: `is_published`.

### `categories`

- Pertenecen a un catálogo.
- Tienen nombre, slug, orden y estado activo.

### `products`

- Pertenecen a un catálogo y opcionalmente a una categoría.
- Tienen nombre, SKU, descripciones, precios y estado de stock.
- `image_url` es la portada.
- `gallery` contiene la portada y el resto de imágenes en el orden visible.
- `variants` contiene listas de tallas y colores.
- Tienen orden, estado activo y opción de destacado.

## 6. Flujo del pedido en documento

1. El comprador elige producto, talla y color.
2. El pedido se conserva en el navegador aunque recargue la página.
3. El comprador puede colocar nombre, teléfono e indicaciones.
4. El servidor genera un PDF real; no necesita una clave privada de Supabase.
5. En teléfonos compatibles se usa Web Share API para compartir el archivo. El usuario puede elegir WhatsApp y el PDF viaja adjunto.
6. En computadoras o navegadores sin soporte, el PDF se descarga y se abre WhatsApp con el resumen; el usuario adjunta el archivo descargado.

Los navegadores no permiten adjuntar silenciosamente un archivo a WhatsApp Web. La alternativa implementada es la más segura y compatible sin crear una integración empresarial de WhatsApp.

## 7. Principios de UX/UI

- Estética limpia, espacios amplios y jerarquía inspirada en productos Apple, sin copiar su identidad.
- Una acción principal clara por pantalla.
- Texto mínimo y entendible para usuarios no técnicos.
- Objetivos táctiles de al menos 42 px.
- Una columna de producto en teléfonos pequeños; dos o más solo cuando el ancho lo permite.
- Barra de pedido fija en móvil con espacio inferior reservado para no ocultar el final del contenido.
- Galerías con miniaturas, contador y navegación por flechas.
- Estados visibles: cargando, éxito, error, vacío, agotado y últimas unidades.
- Respeto de `prefers-reduced-motion`.

## 8. Seguridad

- Nunca exponer `service_role` en variables `NEXT_PUBLIC_*`.
- Mantener RLS activa.
- La lectura pública se limita a catálogos publicados y productos activos.
- La escritura en base de datos y Storage se limita a administradores autorizados.
- Validar tipo, tamaño y cantidad de imágenes antes de subirlas.
- No confiar en precios enviados por el navegador para cobros automáticos. Si se agregan pagos, el servidor debe volver a consultar los precios en la base de datos.

## 9. Criterios de aceptación de la versión actual

- La landing carga sin errores en escritorio y móvil.
- El catálogo no tiene desplazamiento horizontal a 390 px.
- Las tarjetas usan una columna en teléfonos pequeños.
- La búsqueda y las categorías filtran sin recargar.
- Las fichas individuales ya no devuelven “Catálogo no disponible”.
- Una galería admite varias imágenes y permite elegir portada en el admin.
- El carrito distingue el mismo producto con diferentes variantes.
- El PDF muestra datos del cliente, productos, variantes, cantidades y total.
- PDFs extensos repiten encabezado de tabla y muestran numeración de páginas.
- `npm run lint` y `npm run build` pasan en ambos proyectos.

## 10. Roadmap recomendado

### Fase 1 — Operación comercial

- Desplegar los cambios actuales.
- Completar la marca y datos reales de CRISDAL Agency.
- Crear 3 catálogos demo: restaurante, moda e imprenta/servicios.
- Definir paquetes comerciales y tiempos de actualización.
- Generar un QR descargable por catálogo.

### Fase 2 — Medición y pedidos

- Analítica de vistas, productos abiertos y clics a WhatsApp.
- Bandeja opcional de pedidos en el admin.
- Estados de pedido: nuevo, contactado, confirmado y cerrado.
- Instrucciones de pago configurables por catálogo.
- Exportación de pedidos a CSV.

### Fase 3 — Escala de agencia

- Roles: propietario, editor y solo lectura.
- Registro de cambios y restauración.
- Dominios personalizados por cliente.
- Reordenamiento drag-and-drop de categorías y productos.
- Duplicar catálogos y guardar plantillas por rubro.
- Portal limitado para que cada cliente edite solo su catálogo.

### Fase 4 — Integraciones

- WhatsApp Business API para mensajes automatizados con plantillas aprobadas.
- Pagos con enlace o checkout.
- Sincronización de inventario mediante API o webhooks.
- Importación desde Google Sheets, POS o ecommerce.

## 11. Lista de despliegue

1. Confirmar que ambos repositorios apuntan al mismo proyecto Supabase.
2. Usar la URL raíz `https://PROYECTO.supabase.co`; el código también corrige automáticamente una URL pegada con `/rest/v1/`.
3. Configurar en ambas aplicaciones `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
4. Configurar en el admin `NEXT_PUBLIC_STOREFRONT_URL`.
5. Ejecutar build de producción.
6. Desplegar primero storefront y luego admin.
7. Probar login, carga múltiple, portada, catálogo móvil, ficha de producto y PDF.
8. Revisar las políticas RLS antes de incorporar otro administrador.

## 12. Instrucción breve para continuar con otra IA

> Trabaja sobre los dos proyectos Next.js existentes sin desactivar RLS ni exponer claves privadas. Conserva la arquitectura multi-catálogo por slug. Antes de modificar, ejecuta lint y build. Después de cada cambio de UI prueba 390 px, 768 px y escritorio. Para imágenes usa `image_url` como portada y `gallery` como lista ordenada sin duplicados. Para pedidos conserva la generación de PDF en servidor y el uso de Web Share API con descarga como fallback. Actualiza este plan si cambia una decisión de producto.
