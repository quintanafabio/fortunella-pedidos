// Carta de Patio Fortunella (productos y precios).
// Copia de la carta publicada en https://fortunella-pizzas.github.io/ — actualizada el 13/11/2026.
// Para cambiar un precio: editá el número en "value" (sin puntos) y publicá.
//
// Cada sección (módulo) tiene un "layout_type" que define cómo se muestra:
//   "list"         tarjetas (entradas, sándwiches, papas, ensaladas, menú kids)
//   "pizza-grid"   pizzas en pestañas por "subgroup" (Clásicas, Clásicas reversionadas, Especiales)
//   "emp-table"    tabla de empanadas (una columna por presentación: UNID., ½ DOC., DOC.)
//   "postre-cards" tarjetas de postres
//   "bebidas-grid" tablas de bebidas: el tamaño va al final del nombre ("Coca Zero 350ml")
//                  y se agrupan por "subgroup" (Sin Alcohol, Porrones, Tragos…)
// Una "note" del tipo "+ alioli $600" se ofrece como adicional al agregar el producto.

(function () {
  const pz = (subgroup, name, description, chica, grande, note) => ({
    name, description, subgroup, note: note || "",
    prices: chica ? [{ label: "CHICA", value: chica }, { label: "GRANDE", value: grande }] : [{ label: "GRANDE", value: grande }],
  });
  const one = (name, value, description, subgroup) => ({ name, description: description || "", subgroup: subgroup || "", prices: [{ label: "", value }] });
  const emp = (name, unid) => ({ name, prices: [{ label: "UNID.", value: unid }] });

  window.FORTUNELLA_MENU = {
    modules: [
      {
        name: "ENTRADITAS FORTU", subtitle: "", layout_type: "list", title_variant: "default",
        items: [
          one("CROQUETAS DE JAMON CUBIERTAS CON QUESO PROVOLONE (para 2)", 13000, "crocantes, de salsa blanca, jamón y perejil"),
          one("CROCANTE PROVOLETA AL FUEGO", 16000, "con variedad de tomates y cebollas asadas, pesto de albahaca. Acompañado con tostadas y grisines"),
        ],
      },
      {
        name: "SANDWICHERIA", subtitle: "Sándwiches con masa de focaccia artesanal", layout_type: "list", title_variant: "orange",
        items: [
          one("CARNE AHUMADA", 16500, "Chimi casero, alioli de cebollas asadas y pimentón, rúcula. Sale con papas cuña"),
          one("\"EL JEFE\"", 14000, "Milanesa de carne, jamón cocido, lechuga, tomate y aderezo Fortunella. Sale con papas cuña"),
          one("BURRITOS A LA PARRI", 15000, "De carne, cilantro, tomate, muzza, cebolla morada, alioli y variedad de salsas. Sale con papas"),
        ],
      },
      {
        name: "EMPANADAS", subtitle: "Empanadas (al horno o fritas)", layout_type: "emp-table", title_variant: "default",
        items: [
          emp("Verduras", 2000),
          emp("Jamón y Queso", 2300),
          emp("Pollo", 2400),
          emp("Carne", 2600),
          emp("Carne cortada a Cuchillo", 2800),
          emp("Cebolla y Muzza", 2200),
        ],
      },
      {
        name: "NUESTRAS DELICIOSAS PIZZAS",
        subtitle: "Masa madre · Horno de barro · Todas llevan salsa, muzzarella, tomates asados y aceitunas",
        layout_type: "pizza-grid", title_variant: "default",
        items: [
          pz("Clásicas", "Muzzarella", "Salsa, muzarrella, tomates asados y aceitunas", 9000, 16500),
          pz("Clásicas", "Doble Muzzarella", "Salsa, doble muzarrella, tomates asados y aceitunas", 10500, 19000),
          pz("Clásicas", "Margarita", "Salsa, muzarrella, aceite de albahaca, tomates asados y aceitunas", 9300, 17600),
          pz("Clásicas", "Fugazza", "Salsa, muzarrella, cebolla caramelizada, tomates asados y aceitunas", 9300, 17700),
          pz("Clásicas", "Fugazza con Jamón", "Salsa, muzarrella, cebolla caramelizada, jamón cocido, tomates asados y aceitunas", 9700, 18400),
          pz("Clásicas", "Jamón Crudo y Rúcula", "Salsa, muzarrella, jamón crudo, rúcula, tomates asados y aceitunas negras", 11000, 21000),
          pz("Clásicas", "Napolitana", "Salsa, muzarrella, tomate, ajo y aceitunas", 9500, 18000),
          pz("Clásicas", "Napolitana con Jamón", "Salsa, muzarrella, tomate, ajo, jamón cocido y aceitunas", 10900, 19500),
          pz("Clásicas", "Capresse", "Salsa, muzarrella, tomate, aceite de albahaca y aceitunas", 10000, 18800),
          pz("Clásicas", "Calabresa", "Salsa, muzarrella, calabresa, tomates asados y aceitunas", 10700, 19500),
          pz("Clásicas", "Jamón y Morrón", "Salsa, muzarrella, jamón cocido, morrones asados, tomates asados y aceitunas", 10800, 19200),
          pz("Clásicas", "Especial", "Salsa, muzarrella, jamón cocido, huevo frito, morrones asados, tomates asados y aceitunas", 11000, 20700),
          pz("Clásicas", "4 Quesos", "Salsa, muzarrella, roquefort, provolone, parmesano, tomates asados y aceitunas", 11200, 20500),
          pz("Clásicas", "Roquefort y Nuez", "Salsa, muzarrella, roquefort, nuez, tomates asados y aceitunas", 10700, 19600),
          pz("Clásicas reversionadas", "Roquefort con Peras y Nuez", "Salsa, muzarrella, roquefort, peras, miel, nuez, tomates asados y aceitunas verdes", 11600, 20700),
          pz("Clásicas", "Anchoas", "Salsa, muzarrella, anchoas, tomates asados y aceitunas", 11000, 19800),
          pz("Clásicas", "Cantimpalo", "Salsa, muzarrella, cantimpalo, tomates asados y aceitunas", 11200, 19500),
          pz("Clásicas reversionadas", "Brócoli y Jamón", "Salsa, muzarrella, brócoli, jamón cocido, tomates asados y aceitunas", 11100, 20000),
          pz("Clásicas reversionadas", "Brócoli y Panceta", "Salsa, muzarrella, brócoli, panceta, tomates asados y aceitunas", 11300, 20800),
          pz("Clásicas reversionadas", "Choclo Asado", "Salsa, muzarrella, choclo asado, aceite de albahaca, tomates asados y aceitunas", 10200, 18400),
          pz("Clásicas reversionadas", "Choclo Asado y Queso Cremoso", "Salsa, muzarrella, choclo asado, queso cremoso, aceite de albahaca, tomates asados y aceitunas", 10600, 19300),
          pz("Clásicas", "Panceta Ahumada", "Salsa, muzarrella, panceta ahumada, tomates asados y aceitunas", 10800, 20400),
          pz("Clásicas", "Provolone", "Salsa, muzarrella, provolone, tomates asados y aceitunas", 10900, 20700),
          pz("Clásicas", "Provolone con Jamón", "Salsa, muzarrella, provolone, jamón cocido, tomates asados y aceitunas", 11500, 21800),
          pz("Clásicas reversionadas", "Ananás y Cerezas", "Salsa, muzarrella, ananás, cerezas, azúcar negra, tomates asados y aceitunas", 11300, 21300),
          pz("Clásicas", "Ananás y Jamón", "Salsa, muzarrella, ananás, jamón cocido, azúcar negra, tomates asados y aceitunas", 12700, 22400),
          pz("Clásicas", "Champiñones", "Salsa, muzarrella, champiñones salteados, tomates asados y aceitunas", 12500, 22800),
          pz("Clásicas", "Palmitos", "Salsa, muzarrella, palmitos, salsa golf, tomates asados y aceitunas", 12500, 23500),
          pz("Clásicas", "Picante", "Salsa, muzarrella, ají preparado, tomates asados y aceitunas", 9400, 17300),
          pz("Clásicas reversionadas", "Veggie", "Salsa, muzarrella, brócoli, choclo asado, cebolla caramelizada, champiñones, morrones asados, tomates asados y aceitunas", 12300, 21500),
          pz("Clásicas reversionadas", "Popeye", "Salsa, muzarrella, espinaca con aceite de ajo suave, manteca en cubitos, cebolla crocante, tomates asados y aceitunas", 11000, 20000),
          pz("Clásicas", "Porteña", "Pizza porteña, salsa, ½ kg muzarrella, tomates asados y aceitunas", null, 24000),
          pz("Clásicas reversionadas", "A Puro Huevo", "Salsa, muzarrella, rodajas de huevo, panceta crocante, cebolla morada, tomates asados y aceitunas", 11500, 21500),
          pz("Clásicas reversionadas", "Un Viaje de Papas", "Salsa, muzarrella, mini papas pay, tomates asados y aceitunas", 10500, 18800, "+ alioli $600"),
          pz("Especiales", "Burrata y Mortadela", "Salsa, muzarrella, mortadela con pistacho, burrata, tomates asados y aceitunas negras", 13300, 23800),
          pz("Especiales", "Burrata y Jamón Crudo", "Salsa, muzarrella, jamón crudo, burrata, rúcula, tomates asados y aceitunas negras", 14300, 26300),
          pz("Especiales", "Carne", "Salsa, muzarrella, carne braseada, cebolla caramelizada, hierbas, tomates asados y aceitunas", 13900, 25900),
          pz("Especiales", "Cherry Bocconcinos", "Salsa, muzarrella, cherrys asados, bocconcinos, pesto de albahaca y nuez, tomates asados y aceitunas", 13700, 25300),
          pz("Especiales", "Chayera", "Salsa, muzarrella, tomates cherry, aceite de albahaca, bolitas de muzzarella crocantes, tomates asados y aceitunas", 12200, 21000),
        ],
      },
      {
        name: "LAS INFALTABLES PAPAS FRITAS", subtitle: "", layout_type: "list", title_variant: "default",
        items: [
          one("PAPAS FRITAS CLASICAS", 8000, "sale con aderezo"),
          one("PAPAS FRITAS CON QUESO PROVOLONE RAYADO", 11000),
          one("PAPAS GRATINADAS CON CHEDDAR Y PANCETA", 12500),
        ],
      },
      {
        name: "ENSALADA", subtitle: "", layout_type: "list", title_variant: "default",
        items: [one("César con Pollo", 14000)],
      },
      {
        name: "MENU KIDS", subtitle: "", layout_type: "list", title_variant: "default",
        items: [one("PALITOS DE MILANESA DE POLLO CON PAPAS FRITAS", 8000)],
      },
      {
        name: "DULCE FORTUNELLA", subtitle: "", layout_type: "postre-cards", title_variant: "default",
        items: [
          one("Flan Casero con DDL y crema", 7000),
          one("El famoso tiramisu de fortu", 9000),
          one("Invertida manzana crocante con helado de crema", 10000),
          one("Helado 2 bochas (crema americana, dulce de leche, frutilla, chocolate y limon)", 8500),
          one("PANQUEQUE CROCANTE FLAMEADO RELLENO CON DDL (opcional con banana)", 9000),
        ],
      },
      {
        name: "BEBIDAS SIN ALCOHOL", subtitle: "", layout_type: "bebidas-grid", title_variant: "default",
        items: [
          one("Agua 500ml", 3000, "", "Sin Alcohol"),
          one("Soda 500ml", 3000, "", "Sin Alcohol"),
          one("Agua saborizada 1,5L", 6000, "", "Sin Alcohol"),
          one("Coca Zero 350ml", 3300, "", "Sin Alcohol"),
          one("Coca Común 350ml", 3300, "", "Sin Alcohol"),
          one("Fanta 350ml", 3300, "", "Sin Alcohol"),
          one("Sprite 350ml", 3300, "", "Sin Alcohol"),
          one("Coca Común 1L", 7000, "", "Sin Alcohol"),
          one("Coca Zero 1L", 7000, "", "Sin Alcohol"),
          one("Fanta 1L", 7000, "", "Sin Alcohol"),
          one("Sprite 1L", 7000, "", "Sin Alcohol"),
          one("Limonada", 8000, "", "Sin Alcohol"),
        ],
      },
      {
        name: "BEBIDAS CON ALCOHOL", subtitle: "", layout_type: "bebidas-grid", title_variant: "default",
        items: [
          one("CORONA 330ml", 6000, "", "Porrones"),
          one("STELLA ARTOIS 330ml", 5500, "", "Porrones"),
          one("BUDWEISER 330ml", 4500, "", "Porrones"),
          one("CORONA 710ml", 11000, "", "Porrones"),
          one("PATAGONIA 710ml", 10000, "", "Porrones"),
          one("BUDWEISER 1L", 9000, "", "Porrones"),
          one("STELLA ARTOIS 1L", 13000, "", "Porrones"),
          one("STELLA NEGRA 1L", 12000, "", "Porrones"),
          one("FERNET", 8000, "", "Tragos"),
          one("CAMPARI", 7000, "", "Tragos"),
          one("VINO MALBEC JOVEN", 13000, "", "Vinos vista larga"),
          one("VINO BONARDA JOVEN", 13000, "", "Vinos vista larga"),
          one("VINO TORRONTES DULCE NATURAL", 13000, "", "Vinos vista larga"),
          one("VINO MALBEC ORGANICO", 16500, "", "Vinos vista larga"),
          one("VINO BLEND MALBEC-BONARDA ORGANICO", 16500, "", "Vinos vista larga"),
          one("VODKA", 10000, "", "Tragos"),
        ],
      },
    ],
  };
})();
