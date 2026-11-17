# Fortunella — carta con pedido por WhatsApp

Carta online de Patio Fortunella (La Rioja). El cliente arma su pedido (tamaño, cantidad, mitad y mitad,
adicionales, observaciones), elige delivery o retiro, y al confirmar se abre WhatsApp con el mensaje listo
para enviar al local. Es un sitio estático: sin backend ni dependencias.

El diseño, las ilustraciones y los productos siguen la carta del local: https://fortunella-pizzas.github.io/

## Archivos

- `index.html`, `css/styles.css`, `js/app.js`: la página de pedidos.
- `admin.html`, `css/admin.css`, `js/admin.js`: el panel para cambiar precios y productos.
- `js/config.js`: número de WhatsApp, regla de precio de mitad y mitad, costo de envío, formas de pago,
  horarios, carta de día, sugerencias de "¿Le sumás algo?" y el repo de GitHub donde vive la carta.
- `data/menu.json`: productos y precios (lo edita el panel).
- `data/admin-key.json`: llave del panel, cifrada con la contraseña (la crea el panel; sin la contraseña no sirve).
- `assets/patio/`: ilustraciones y fotos de la carta del local (toldo, guirnalda, bondi, secciones, pizzas).
- `icons/`: ícono de la pestaña y de la pantalla de inicio (el bondi).

## Panel para cambiar precios (`/admin.html`)

Desde `https://fortunellapizzas.vercel.app/admin.html` (o el link de GitHub Pages + `/admin.html`) se
editan nombres, descripciones y precios, se agregan o eliminan productos, se cambia el orden y se marca un
producto como **no disponible** (por ejemplo, sin stock: deja de aparecer en la carta sin borrarlo).
Al tocar **Guardar y publicar**, el cambio se guarda en GitHub y la carta lo muestra en unos minutos
(hasta 5), en los dos links, sin volver a publicar la página.

Arriba de todo está **Datos del local**: el WhatsApp que recibe los pedidos y los datos para transferir
(alias, titular, CUIT/CUIL, banco). Se guardan en `data/menu.json` (`settings`) y mandan sobre los de
`js/config.js`, que quedan como respaldo.

**Primera vez (configurar el acceso):** el panel guarda en GitHub, así que necesita una llave de la
cuenta dueña del repo. La pantalla explica los pasos:

1. En GitHub: *Settings → Developer settings → Fine-grained tokens → Generate new token*
   (https://github.com/settings/personal-access-tokens/new).
2. *Repository access*: **Only select repositories** → solo este repo.
3. *Permissions → Repository permissions → Contents*: **Read and write**. Nada más.
4. Vencimiento: el más largo que permita. Cuando venza, se repite este paso con una llave nueva.
5. En el panel: pegar la llave y elegir una contraseña (mínimo 10 caracteres).

La llave se guarda en el repo cifrada con esa contraseña. Después, desde cualquier compu o celular,
se entra **solo con la contraseña**. Para cambiar la contraseña, se vuelve a "Configurar el acceso".

Si el repo pasa a otra cuenta (por ejemplo, al entregárselo al local), cambiá `github.owner` y
`github.repo` en `js/config.js` y configurá el acceso de nuevo con una llave de esa cuenta.

## Carta de día

Los fines de semana, hasta que abre la noche (20:30), se muestra solo la carta de día (empanadas), con un
botón "Ver carta de noche" para ver todo. Se configura en `dayMenu` de `js/config.js` (días, horario y
secciones). Si el pedido lleva cosas de la carta de noche, el mensaje de WhatsApp lo avisa.

## Dónde está publicado

- https://fortunellapizzas.vercel.app (link principal, proyecto `fortunellapizzas` en Vercel).
- https://quintanafabio.github.io/fortunella-pedidos/ (GitHub Pages, se actualiza con cada push).

Los precios se leen de GitHub, así que los cambios del panel se ven en los dos links. Los cambios de
diseño o funcionamiento (archivos HTML, CSS, JS) sí hay que publicarlos: si Vercel no tiene acceso al
repo de GitHub, se publica a mano con `vercel deploy --prod`. `.vercelignore` deja afuera los archivos
que no son del sitio.

## Al publicar cambios de diseño o funcionamiento

En `index.html` y `admin.html`, los archivos CSS y JS se cargan con `?v=N` (por ejemplo
`js/app.js?v=11`). Subí ese número en todas las referencias cada vez que publiques, así los celulares no
usan la versión vieja guardada en caché. (Para cambiar precios no hace falta: lo hace el panel.)
