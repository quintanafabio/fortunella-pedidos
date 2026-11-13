# Fortunella — carta con pedido por WhatsApp

Carta online de Patio Fortunella (La Rioja). El cliente arma su pedido (tamaño, cantidad, mitad y mitad,
adicionales, observaciones), elige delivery o retiro, y al confirmar se abre WhatsApp con el mensaje listo
para enviar al local. Es un sitio estático: sin backend ni dependencias.

El diseño, las ilustraciones y los productos siguen la carta del local: https://fortunella-pizzas.github.io/

## Archivos

- `index.html`, `css/styles.css`, `js/app.js`: la página.
- `js/config.js`: número de WhatsApp, regla de precio de mitad y mitad, costo de envío, formas de pago,
  sugerencias de "¿Le sumás algo?" y conexión opcional a Supabase.
- `data/menu.js`: productos y precios, copiados de la carta del local.
- `assets/patio/`: ilustraciones y fotos de la carta del local (toldo, guirnalda, bondi, secciones, pizzas).

## Cambiar precios

Editá `data/menu.js` y subí el cambio; GitHub Pages lo publica en uno o dos minutos. Cuando el local
cambie su carta, hay que pasar los cambios a este archivo (los nombres y precios tienen que coincidir).

## Dónde está publicado

- https://fortunellapizzas.vercel.app (link principal, proyecto `fortunellapizzas` en Vercel).
- https://quintanafabio.github.io/fortunella-pedidos/ (GitHub Pages, se actualiza con cada push).

Si Vercel no tiene acceso al repo de GitHub, se publica a mano con `vercel deploy --prod`.
`.vercelignore` deja afuera los archivos que no son del sitio.

## Al publicar cambios

En `index.html`, los archivos CSS y JS se cargan con `?v=N` (por ejemplo `js/app.js?v=6`). Subí ese
número en las cuatro referencias cada vez que publiques, así los celulares no usan la versión vieja
guardada en caché.
