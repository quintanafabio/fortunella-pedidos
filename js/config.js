// Configuración del pedido online de Fortunella.
window.FORTUNELLA_CONFIG = {
  // Número de WhatsApp que recibe los pedidos, en formato internacional sin "+" ni espacios.
  // En Argentina los celulares llevan un 9 después del 54: +54 9 380 439-9338.
  whatsapp: "5493804399338",

  // Cómo se cobra una pizza mitad y mitad: "max" = precio de la mitad más cara,
  // "avg" = promedio de ambas mitades.
  halfAndHalfPrice: "max",

  // Costo de envío. null = "a confirmar por WhatsApp". Un número (ej. 1500) se suma al total.
  deliveryFee: null,

  // Formas de pago que se ofrecen al finalizar.
  paymentMethods: ["Efectivo", "Transferencia"],

  // Opcional: leer la carta en vivo desde Supabase (la misma base que usa el panel admin
  // de la carta original). Si queda vacío, se usa data/menu.js.
  supabaseUrl: "",
  supabaseAnonKey: "",
  menuName: "fortunella",
};
