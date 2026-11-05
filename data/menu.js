// Carta Fortunella (copiada del fallback de la carta original).
// Para cambiar precios o productos, editá este archivo. Estructura por módulo:
//   name, subtitle, layout_type (pizza-grid | list | emp-table | postre-cards | bebidas-grid), title_variant
//   items: [{ name, description, prices: [{label, value}], note, featured, subgroup }]
// note con formato "+ algo $600" se ofrece como adicional opcional en el carrito.
window.FORTUNELLA_MENU = {
 "modules": [
  {
   "name": "Pizzas",
   "subtitle": "Masa madre · Horno de barro · Todas incluyen tomates asados y aceitunas",
   "layout_type": "pizza-grid",
   "title_variant": "default",
   "items": [
    {
     "name": "Muzzarella",
     "description": "Salsa, muzarrella, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 7500
      },
      {
       "label": "GRANDE",
       "value": 14000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Doble Muzzarella",
     "description": "Salsa, doble muzarrella, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 8300
      },
      {
       "label": "GRANDE",
       "value": 16100
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Margarita",
     "description": "Salsa, muzarrella, aceite de albahaca, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 7700
      },
      {
       "label": "GRANDE",
       "value": 15100
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Fugazza",
     "description": "Salsa, muzarrella, cebolla caramelizada, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 7700
      },
      {
       "label": "GRANDE",
       "value": 15200
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Fugazza con Jamón",
     "description": "Salsa, muzarrella, cebolla caramelizada, jamón cocido, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 8200
      },
      {
       "label": "GRANDE",
       "value": 15900
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Jamón Crudo y Rúcula",
     "description": "Salsa, muzarrella, jamón crudo, rúcula, tomates asados y aceitunas negras",
     "prices": [
      {
       "label": "CHICA",
       "value": 9500
      },
      {
       "label": "GRANDE",
       "value": 17500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Napolitana",
     "description": "Salsa, muzarrella, tomate, ajo y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 8000
      },
      {
       "label": "GRANDE",
       "value": 15700
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Napolitana con Jamón",
     "description": "Salsa, muzarrella, tomate, ajo, jamón cocido y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9400
      },
      {
       "label": "GRANDE",
       "value": 16700
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Capresse",
     "description": "Salsa, muzarrella, tomate, aceite de albahaca y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 8500
      },
      {
       "label": "GRANDE",
       "value": 16300
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Calabresa",
     "description": "Salsa, muzarrella, calabresa, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9200
      },
      {
       "label": "GRANDE",
       "value": 16800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Jamón y Morrón",
     "description": "Salsa, muzarrella, jamón cocido, morrones asados, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9300
      },
      {
       "label": "GRANDE",
       "value": 16500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Especial",
     "description": "Salsa, muzarrella, jamón cocido, huevo frito, morrones asados, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9500
      },
      {
       "label": "GRANDE",
       "value": 18200
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "4 Quesos",
     "description": "Salsa, muzarrella, roquefort, provolone, parmesano, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9600
      },
      {
       "label": "GRANDE",
       "value": 18400
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Roquefort y Nuez",
     "description": "Salsa, muzarrella, roquefort, nuez, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9200
      },
      {
       "label": "GRANDE",
       "value": 17100
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Roquefort con Peras y Nuez",
     "description": "Salsa, muzarrella, roquefort, peras, miel, nuez, tomates asados y aceitunas verdes",
     "prices": [
      {
       "label": "CHICA",
       "value": 10100
      },
      {
       "label": "GRANDE",
       "value": 18000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Anchoas",
     "description": "Salsa, muzarrella, anchoas, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9500
      },
      {
       "label": "GRANDE",
       "value": 17200
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Cantimpalo",
     "description": "Salsa, muzarrella, cantimpalo, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9700
      },
      {
       "label": "GRANDE",
       "value": 16900
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Brócoli y Jamón",
     "description": "Salsa, muzarrella, brócoli, jamón cocido, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9600
      },
      {
       "label": "GRANDE",
       "value": 17400
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Brócoli y Panceta",
     "description": "Salsa, muzarrella, brócoli, panceta, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9800
      },
      {
       "label": "GRANDE",
       "value": 17800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Choclo Asado",
     "description": "Salsa, muzarrella, choclo asado, aceite de albahaca, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 8700
      },
      {
       "label": "GRANDE",
       "value": 15900
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Choclo Asado y Queso Cremoso",
     "description": "Salsa, muzarrella, choclo asado, queso cremoso, aceite de albahaca, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9100
      },
      {
       "label": "GRANDE",
       "value": 16600
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Panceta Ahumada",
     "description": "Salsa, muzarrella, panceta ahumada, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9300
      },
      {
       "label": "GRANDE",
       "value": 17900
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Provolone",
     "description": "Salsa, muzarrella, provolone, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9400
      },
      {
       "label": "GRANDE",
       "value": 18000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Provolone con Jamón",
     "description": "Salsa, muzarrella, provolone, jamón cocido, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 10000
      },
      {
       "label": "GRANDE",
       "value": 19200
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Ananás y Cerezas",
     "description": "Salsa, muzarrella, ananás, cerezas, azúcar negra, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9800
      },
      {
       "label": "GRANDE",
       "value": 18800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Ananás y Jamón",
     "description": "Salsa, muzarrella, ananás, jamón cocido, azúcar negra, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 11200
      },
      {
       "label": "GRANDE",
       "value": 19900
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Champiñones",
     "description": "Salsa, muzarrella, champiñones salteados, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 10600
      },
      {
       "label": "GRANDE",
       "value": 20200
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Palmitos",
     "description": "Salsa, muzarrella, palmitos, salsa golf, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 10900
      },
      {
       "label": "GRANDE",
       "value": 21000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Picante",
     "description": "Salsa, muzarrella, ají preparado, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 7700
      },
      {
       "label": "GRANDE",
       "value": 14800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Veggie",
     "description": "Salsa, muzarrella, brócoli, choclo asado, cebolla caramelizada, champiñones, morrones asados, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 10800
      },
      {
       "label": "GRANDE",
       "value": 19000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Popeye",
     "description": "Salsa, muzarrella, espinaca con aceite de ajo suave, manteca en cubitos, cebolla crocante, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9400
      },
      {
       "label": "GRANDE",
       "value": 17500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Porteña",
     "description": "Pizza de molde, salsa, ½ kg muzarrella, tomates asados y aceitunas",
     "prices": [
      {
       "label": "GRANDE",
       "value": 20500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "A Puro Huevo",
     "description": "Salsa, muzarrella, rodajas de huevo, panceta crocante, cebolla morada, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 10000
      },
      {
       "label": "GRANDE",
       "value": 19000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Un Viaje de Papas",
     "description": "Salsa, muzarrella, mini papas pay, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 9000
      },
      {
       "label": "GRANDE",
       "value": 15300
      }
     ],
     "note": "+ alioli $600",
     "featured": false
    },
    {
     "name": "Burrata y Mortadela",
     "description": "Salsa, muzarrella, mortadela con pistacho, burrata, tomates asados y aceitunas negras",
     "prices": [
      {
       "label": "CHICA",
       "value": 11800
      },
      {
       "label": "GRANDE",
       "value": 21000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Burrata y Jamón Crudo",
     "description": "Salsa, muzarrella, jamón crudo, burrata, rúcula, tomates asados y aceitunas negras",
     "prices": [
      {
       "label": "CHICA",
       "value": 12800
      },
      {
       "label": "GRANDE",
       "value": 23600
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Carne",
     "description": "Salsa, muzarrella, carne braseada, cebolla caramelizada, hierbas, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 12400
      },
      {
       "label": "GRANDE",
       "value": 22600
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Cherry Bocconcinos",
     "description": "Salsa, muzarrella, cherrys asados, bocconcinos, pesto de albahaca y nuez, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 12400
      },
      {
       "label": "GRANDE",
       "value": 22800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Chayera",
     "description": "Salsa, muzarrella, tomates cherry, aceite de albahaca, bolitas de muzzarella crocantes, tomates asados y aceitunas",
     "prices": [
      {
       "label": "CHICA",
       "value": 10700
      },
      {
       "label": "GRANDE",
       "value": 18500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Box Degustación de Pizzas",
     "description": "9 pizzetas para compartir: Napolitana · Calabresa · Muzza · Capresse · Fugazza · Cantimpalo · 4 Quesos · Jamón y Morrón · Panceta",
     "prices": [
      {
       "label": "",
       "value": 20800
      }
     ],
     "note": null,
     "featured": true
    }
   ]
  },
  {
   "name": "Sandwich Solo para Valientes",
   "subtitle": "Masa de pizza · Con papas fritas · Comen entre 7 y 8 personas · Aderezo Fortunella",
   "layout_type": "list",
   "title_variant": "valientes",
   "items": [
    {
     "name": "Milanesa de Carne",
     "description": "Masa de pizza, tomate, lechuga, huevo frito, jamón, queso, milanesa de carne y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 75000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Milanesa de Pollo",
     "description": "Masa de pizza, tomate, lechuga, huevo frito, jamón, queso, milanesa de pollo y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 70000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Lomito",
     "description": "Masa de pizza, tomate, lechuga, huevo frito, jamón, queso, lomo y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 85000
      }
     ],
     "note": null,
     "featured": false
    }
   ]
  },
  {
   "name": "Focacceria",
   "subtitle": "Sandwiches con masa de focaccia artesanal",
   "layout_type": "list",
   "title_variant": "orange",
   "items": [
    {
     "subgroup": "Clásicos",
     "name": "Jamón Crudo",
     "description": "Jamón crudo, queso tybo, lechuga o rúcula y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 10000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Clásicos",
     "name": "Jamón Cocido",
     "description": "Jamón cocido, queso tybo, lechuga, tomate y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 9300
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Clásicos",
     "name": "Milanesa de Carne",
     "description": "Milanesa de carne, jamón cocido, lechuga, tomate y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 11000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Clásicos",
     "name": "Milanesa de Pollo",
     "description": "Milanesa de pollo, queso tybo, lechuga, tomate y aderezo Fortunella",
     "prices": [
      {
       "label": "",
       "value": 10000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Mortadela",
     "description": "Mortadela con pistachos, stracciatella, pesto, tomates asados, pickles de pepino, rúcula",
     "prices": [
      {
       "label": "",
       "value": 13000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Jamón Crudo Especial",
     "description": "Jamón crudo, stracciatella, rúcula, tomates asados, aderezo Fortunella y gotas de limón fresco",
     "prices": [
      {
       "label": "",
       "value": 15500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Porcheta",
     "description": "Arrollado de cerdo con limón y hierbas, berenjenas al escabeche, cebollas en pickles y aderezo de mostaza",
     "prices": [
      {
       "label": "",
       "value": 10800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Carne",
     "description": "Carne, cebolla en pickles, tomates asados, morrones asados, rúcula y aderezo de chimichurri",
     "prices": [
      {
       "label": "",
       "value": 11500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Panceta Ahumada",
     "description": "Panceta ahumada, cebolla morada con limón, repollo morado y aderezo de tomate",
     "prices": [
      {
       "label": "",
       "value": 10500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Veggie",
     "description": "Stracciatella, escabeche de berenjenas, rúcula, tomates asados y pesto",
     "prices": [
      {
       "label": "",
       "value": 11000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Especiales",
     "name": "Bondiola Braseada",
     "description": "Cerdo desmenuzado con salsa barbacoa, repollo blanco y morado al limón, pickles de cebolla morada, panceta crocante y aderezo de mostaza",
     "prices": [
      {
       "label": "",
       "value": 13000
      }
     ],
     "note": null,
     "featured": false
    }
   ]
  },
  {
   "name": "Empanadas",
   "subtitle": null,
   "layout_type": "emp-table",
   "title_variant": "default",
   "items": [
    {
     "name": "Verduras",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 1500
      },
      {
       "label": "½ DOC.",
       "value": 7500
      },
      {
       "label": "DOC.",
       "value": 13000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Jamón y Queso",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 1700
      },
      {
       "label": "½ DOC.",
       "value": 9000
      },
      {
       "label": "DOC.",
       "value": 17000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Pollo",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 1800
      },
      {
       "label": "½ DOC.",
       "value": 9500
      },
      {
       "label": "DOC.",
       "value": 17000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Carne",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 2000
      },
      {
       "label": "½ DOC.",
       "value": 10000
      },
      {
       "label": "DOC.",
       "value": 19000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Carne Fritas",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 2000
      },
      {
       "label": "½ DOC.",
       "value": 10000
      },
      {
       "label": "DOC.",
       "value": 19000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Capresse",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 1700
      },
      {
       "label": "½ DOC.",
       "value": 9000
      },
      {
       "label": "DOC.",
       "value": 17000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Árabes",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 2500
      },
      {
       "label": "½ DOC.",
       "value": 15000
      },
      {
       "label": "DOC.",
       "value": 27000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Carne a Cuchillo",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 2300
      },
      {
       "label": "½ DOC.",
       "value": 12000
      },
      {
       "label": "DOC.",
       "value": 23000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Cebolla y Muzza",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 2300
      },
      {
       "label": "½ DOC.",
       "value": 8500
      },
      {
       "label": "DOC.",
       "value": 15000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Acelga y Provolone",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 1700
      },
      {
       "label": "½ DOC.",
       "value": 8000
      },
      {
       "label": "DOC.",
       "value": 15000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Humita",
     "description": null,
     "prices": [
      {
       "label": "UNID.",
       "value": 1900
      },
      {
       "label": "½ DOC.",
       "value": 9800
      },
      {
       "label": "DOC.",
       "value": 17500
      }
     ],
     "note": null,
     "featured": false
    }
   ]
  },
  {
   "name": "Ensalada",
   "subtitle": null,
   "layout_type": "list",
   "title_variant": "default",
   "items": [
    {
     "name": "Ensalada César",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 9800
      }
     ],
     "note": null,
     "featured": false
    }
   ]
  },
  {
   "name": "Postres",
   "subtitle": null,
   "layout_type": "postre-cards",
   "title_variant": "default",
   "items": [
    {
     "name": "Flan",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "name": "Tiramisú",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 6500
      }
     ],
     "note": null,
     "featured": false
    }
   ]
  },
  {
   "name": "Bebidas",
   "subtitle": null,
   "layout_type": "bebidas-grid",
   "title_variant": "default",
   "items": [
    {
     "subgroup": "Sin Alcohol",
     "name": "Agua",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 2000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Agua saborizada",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Coca Zero 500ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Coca Común 500ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Fanta 500ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Sprite 500ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3800
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Coca Común 1,5L",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 6000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Coca Zero 1,5L",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 6000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Fanta 1,5L",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 6000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Sin Alcohol",
     "name": "Sprite 1,5L",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 6000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Cervezas",
     "name": "Budweiser lata 473ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 3500
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Cervezas",
     "name": "Corona 330ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 4000
      }
     ],
     "note": null,
     "featured": false
    },
    {
     "subgroup": "Cervezas",
     "name": "Corona 710ml",
     "description": null,
     "prices": [
      {
       "label": "",
       "value": 7000
      }
     ],
     "note": null,
     "featured": false
    }
   ]
  }
 ]
};
