# Fortunella — carta con pedido por WhatsApp

Carta online de Fortunella Pizzas (La Rioja). El cliente arma su pedido (tamaño, cantidad, mitad y mitad,
adicionales, observaciones), elige delivery o retiro, y al confirmar se abre WhatsApp con el mensaje listo
para enviar al local. Es un sitio estático: sin backend ni dependencias.

## Archivos

- `index.html`, `css/styles.css`, `js/app.js`: la página.
- `js/config.js`: número de WhatsApp, regla de precio de mitad y mitad, costo de envío, formas de pago y
  conexión opcional a Supabase.
- `data/menu.js`: productos y precios (se usa si no hay Supabase configurado).

## Cambiar precios

Editá `data/menu.js` y subí el cambio; GitHub Pages lo publica en uno o dos minutos.
