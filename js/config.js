// Configuración del pedido online de Fortunella.
window.FORTUNELLA_CONFIG = {
  // Número de WhatsApp que recibe los pedidos, en formato internacional sin "+" ni espacios.
  // En Argentina los celulares llevan un 9 después del 54: +54 9 380 439-9338.
  whatsapp: "5493804399338",

  // Cómo se cobra una pizza mitad y mitad: "max" = precio de la mitad más cara,
  // "avg" = promedio de ambas mitades.
  halfAndHalfPrice: "max",

  // Tamaño en el que se puede pedir mitad y mitad (media pizza sola = pizza chica).
  halfAndHalfSize: "GRANDE",

  // Costo de envío. null = "a confirmar por WhatsApp". Un número (ej. 1500) se suma al total.
  deliveryFee: null,

  // Formas de pago que se ofrecen al finalizar.
  paymentMethods: ["Efectivo", "Transferencia"],

  // Datos que se muestran al elegir "Transferencia" (null para no mostrarlos).
  transfer: {
    alias: "FORTUNELLAPIZZAS",
    holder: "MARÍA BELEN HASSAN",
    cuit: "23-36829557-4",
    bank: "Mercado Pago",
  },

  // Local (para retiro).
  store: {
    address: "Av. Ángel Vicente Peñaloza",
    mapsUrl: "https://maps.app.goo.gl/74M78h9RAYQD4cr3A",
  },

  // Horarios de atención (hora de Argentina). Días: 0 = domingo, 1 = lunes … 6 = sábado.
  // Si un turno cierra después de medianoche, pertenece al día en que abre.
  hours: [
    { label: "Jueves a martes", days: [4, 5, 6, 0, 1, 2], open: "20:30", close: "01:30" },
    { label: "Sábados y domingos", days: [6, 0], open: "12:00", close: "15:00" },
  ],
  timeZone: "America/Argentina/Buenos_Aires",

  // Minutos mínimos entre el pedido y el primer horario de retiro que se ofrece.
  pickupLeadMinutes: 30,

  // Sugerencias del carrito ("¿Le sumás algo?"), por nombre exacto del producto.
  // Se muestran las de bebidas o postres si el pedido todavía no tiene de esa categoría.
  suggestions: ["Coca Común 1,5L", "Coca Zero 1,5L", "Corona 710ml", "Tiramisú", "Flan"],

  // Opcional: leer la carta en vivo desde Supabase (la misma base que usa el panel admin
  // de la carta original). Si queda vacío, se usa data/menu.js.
  supabaseUrl: "",
  supabaseAnonKey: "",
  menuName: "fortunella",
};
