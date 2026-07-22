import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment.");
}

// Fallback product recommendations in Chilean Pesos (CLP) when Gemini API is rate-limited or unconfigured.
function getFallbackRecommendations(category: string, budget: number, currency: string = "CLP") {
  const cleanCategory = category.trim();
  const clpBudget = budget;

  let products: any[] = [];
  let generalAdvice = "";
  
  // Dynamic scaling helper to ensure recommendations are within budget
  const scalePrice = (pct: number, min: number, max: number) => {
    let val = Math.round(clpBudget * pct);
    if (val < min) val = min;
    if (val > max) val = max;
    if (val > clpBudget) {
      val = Math.round(clpBudget * 0.3); // force staying well under budget
    }
    return Math.max(1000, val); // at least 1,000 CLP
  };

  const formatCLP = (val: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(val);
  };

  switch (cleanCategory) {
    case "Comida": {
      const p1 = scalePrice(0.45, 15000, 120000);
      const p2 = scalePrice(0.25, 8000, 50000);
      const p3 = scalePrice(0.15, 4000, 25000);
      
      products = [
        {
          name: p1 >= 50000 ? "Canasta de Mercadería Familiar Mayorista" : "Canasta de Abarrotes Básicos Semanal",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Selección óptima de legumbres, arroz, fideos, aceite y latas de conserva comprando en formato mayorista o marcas propias.",
          reason: "Permite abastecer la cocina con los carbohidratos y proteínas esenciales rindiendo al máximo tu presupuesto.",
          link: "https://www.lider.cl"
        },
        {
          name: p2 >= 20000 ? "Surtido Familiar de Frutas y Verduras en Feria" : "Canasta Frutas y Verduras de Estación",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Compra directa de vegetales frescos en ferias libres locales o centros de abastecimiento como La Vega Central.",
          reason: "Comprar productos de temporada directamente en ferias locales reduce el gasto hasta un 45% en comparación con grandes cadenas.",
          link: "https://www.lovalledor.cl"
        },
        {
          name: p3 >= 12000 ? "Pack de Lácteos y Huevos (Formato Ahorro)" : "Compra de Proteínas Complementarias",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Packs de huevos de tamaño grande y productos lácteos o de marca propia del supermercado.",
          reason: "Los huevos son una de las fuentes de proteína más económicas y versátiles para complementar tus almuerzos y desayunos.",
          link: "https://www.mayorista10.cl"
        }
      ];
      generalAdvice = "Planifica tu menú semanal con base en las ofertas vigentes y prefiere las marcas propias del supermercado. Evita comprar comida preparada y lleva tu colación hecha en casa al trabajo.";
      break;
    }
    case "Educación": {
      const p1 = scalePrice(0.40, 10000, 80000);
      const p2 = scalePrice(0.30, 5000, 40000);
      const p3 = scalePrice(0.15, 3000, 20000);
      
      products = [
        {
          name: p1 >= 30000 ? "Kit de Útiles Escolares Completos" : "Set de Cuadernos y Lápices Formato Pack",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Kit esencial con mochilas, cuadernos universitarios, bolígrafos, archivadores y block de dibujo comprados en librerías mayoristas del centro de Santiago.",
          reason: "Comprar packs escolares pre-armados en época de cotizaciones te ayuda a ahorrar significativamente.",
          link: "https://www.dimerc.cl"
        },
        {
          name: p2 >= 15000 ? "Libros de Texto y Lectura Usados en Feria" : "Libros Digitales o de Segunda Mano",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Adquisición de libros de lectura complementaria obligatoria en portales de segunda mano o librerías del persa de San Diego.",
          reason: "Los libros de lectura escolar usados se encuentran en perfecto estado a menos del 30% de su precio original en librerías tradicionales.",
          link: "https://www.mercadolibre.cl"
        },
        {
          name: p3 >= 8000 ? "Suscripción a Plataforma de Cursos Online" : "Material de Apoyo y Guías de Estudio",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Acceso a guías de preparación escolar, material didáctico digital interactivo o cursos en línea auto-instruccionales.",
          reason: "Complementa la educación formal usando recursos digitales de bajo costo que optimizan el rendimiento académico.",
          link: "https://www.domestika.org"
        }
      ];
      generalAdvice = "Prefiere comprar útiles escolares y de oficina en ferias mayoristas o distribuidoras del centro de la ciudad. Considera intercambiar libros complementarios con otros apoderados.";
      break;
    }
    case "Salud": {
      const p1 = scalePrice(0.35, 5000, 45000);
      const p2 = scalePrice(0.30, 4000, 35000);
      const p3 = scalePrice(0.20, 2000, 20000);
      
      products = [
        {
          name: p1 >= 15000 ? "Medicamentos Bioequivalentes (Farmacia Comunal)" : "Remedios Genéricos Bioequivalentes",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Adquisición de tus fármacos recurrentes en farmacias populares, comunales o municipales usando tu receta médica.",
          reason: "Las farmacias municipales ofrecen medicamentos hasta un 70% más económicos que las cadenas tradicionales.",
          link: "https://www.minsal.cl"
        },
        {
          name: "Seguro SOAP y Auxilio de Salud Complementario",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Seguro de cobertura ambulatoria o de farmacia básico complementario contratado de forma digital.",
          reason: "Previene gastos catastróficos ante pequeños accidentes recurrentes mediante coberturas de bajo costo mensual.",
          link: "https://www.comparaonline.cl"
        },
        {
          name: "Kit Familiar de Primeros Auxilios y Vitaminas",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Surtido de gasas, desinfectantes, paracetamol, termómetro y suplementos multivitamínicos básicos de marcas recomendadas.",
          reason: "Tener un botiquín bien equipado evita visitas costosas de urgencia para curaciones menores.",
          link: "https://www.drsimi.cl"
        }
      ];
      generalAdvice = "Inscríbete en el CESFAM de tu comuna para acceder a medicamentos, leche y vacunas gratuitas. Para remedios, cotiza siempre la alternativa bioequivalente aprobada por el ISP.";
      break;
    }
    case "Higiene": {
      const p1 = scalePrice(0.40, 6000, 40000);
      const p2 = scalePrice(0.30, 4000, 25000);
      const p3 = scalePrice(0.15, 2000, 15000);
      
      products = [
        {
          name: p1 >= 20000 ? "Pack Familiar de Limpieza Recargable (Eco-carga)" : "Set de Higiene del Hogar Formato Recarga",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Detergente, lavaloza, cloro y suavizante comprados en formatos recargables o bidones de 5 litros en distribuidoras locales.",
          reason: "Comprar líquidos de limpieza a granel o bidones reduce el costo por litro a la mitad, eliminando el costo del envase plástico.",
          link: "https://www.mercadolibre.cl"
        },
        {
          name: p2 >= 12000 ? "Pack de Cuidado Personal (Marcas Propias)" : "Kit de Cuidado Personal Esencial",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Champú, jabón, pasta dental, desodorante y máquinas de afeitar comprados en packs ahorro de marcas propias de supermercados.",
          reason: "Los productos de marca propia ofrecen exactamente la misma formulación química que marcas famosas a un precio 40% menor.",
          link: "https://www.preunic.cl"
        },
        {
          name: "Pack de Papel Higiénico y Toalla de Papel (XXL)",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Pack de papel higiénico de doble hoja de metraje largo comprado en distribuidoras de papel o distribuidoras de abarrotes.",
          reason: "El papel higiénico comprado en bolsas de 24 o 40 rollos de metraje extendido rinde el doble en presupuesto.",
          link: "https://www.fruna.cl"
        }
      ];
      generalAdvice = "Evita comprar artículos de higiene individualizados. Prefiere distribuidoras comunales, farmacias de descuento, o el pasillo mayorista del supermercado para comprar bidones recargables.";
      break;
    }
    case "Vivienda": {
      const p1 = scalePrice(0.50, 20000, 350000);
      const p2 = scalePrice(0.20, 8000, 50000);
      const p3 = scalePrice(0.15, 5000, 30000);
      
      products = [
        {
          name: "Fondo para Mantenciones Preventivas del Hogar",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Aporte mensual destinado a reparaciones menores, limpieza de calefonts, revisión de llaves de paso o mantención de estufas antes de invierno.",
          reason: "La mantención oportuna evita emergencias costosas como fugas de agua o fallas eléctricas críticas.",
          link: "https://www.sodimac.cl"
        },
        {
          name: "Kit de Eficiencia Energética (Focos LED e Interruptores)",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Pack de ampolletas LED de bajo consumo (A+) para recambiar los focos incandescentes del hogar y burletes para puertas y ventanas.",
          reason: "Aislar térmicamente puertas con burletes y usar ampolletas de bajo consumo reduce tu cuenta de luz y calefacción hasta un 25% mensual.",
          link: "https://www.easy.cl"
        },
        {
          name: "Regulador de Flujo de Agua para Llaves y Duchas",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Aireadores y difusores de agua de fácil instalación en llaves de cocina, baño y cabezal de ducha para reducir el caudal.",
          reason: "Reduce el consumo de agua por minuto en un 50% sin perder presión de salida, optimizando las boletas mensuales de agua y gas.",
          link: "https://www.sodimac.cl"
        }
      ];
      generalAdvice = "Revisa mensualmente que no existan goteras en las llaves ni filtraciones en el inodoro. Desconecta los artefactos que no uses para evitar el consumo fantasma de electricidad.";
      break;
    }
    case "Transporte": {
      const p1 = scalePrice(0.55, 10000, 75000);
      const p2 = scalePrice(0.20, 5000, 30000);
      const p3 = scalePrice(0.15, 3000, 20000);
      
      products = [
        {
          name: p1 >= 30000 ? "Carga Planificada Mensual de Tarjeta bip!" : "Carga de Tarjeta bip! Quincenal",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Presupuesto cargado a principio de mes en tu tarjeta de transporte público para cubrir todos tus viajes en Metro y buses Red.",
          reason: "Tener el presupuesto de transporte precargado e inamovible evita que gastes ese dinero en antojos o transportes de emergencia.",
          link: "https://www.tarjetabip.cl"
        },
        {
          name: "Suscripción Anual/Mensual a Bicicletas Compartidas",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Suscripción mensual o anual al sistema de bicicletas compartidas de Santiago (Tembici) para tramos cortos e intermedios.",
          reason: "Reemplazar viajes de corta distancia por trayectos en bicicleta no solo ahorra pasajes, sino que promueve un estilo de vida saludable.",
          link: "https://www.tembici.cl"
        },
        {
          name: "Kit de Reparación Básica para Bicicleta o Scooter",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Parches, inflador de mano, desmontadores de llantas y lubricante para cadenas de bicicleta o scooter eléctrico.",
          reason: "Mantener tu propia bicicleta o scooter evita pagar servicios técnicos costosos para fallas simples.",
          link: "https://www.sodimac.cl"
        }
      ];
      generalAdvice = "Planifica tus viajes usando la app de Red para optimizar las combinaciones gratuitas dentro del rango de 2 horas. Si usas auto, mantén la presión correcta de los neumáticos para ahorrar combustible.";
      break;
    }
    case "Servicios": {
      const p1 = scalePrice(0.50, 15000, 60000);
      const p2 = scalePrice(0.30, 8000, 35000);
      const p3 = scalePrice(0.15, 4000, 15000);
      
      products = [
        {
          name: "Plan Hogar Fibra Óptica (Básico / Promoción Portabilidad)",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Plan básico de internet fibra de alta velocidad negociado mediante portabilidad o promociones especiales para el hogar.",
          reason: "Llamar a tu operador y solicitar ofertas de retención o portabilidad reduce tu boleta hasta un 40% mensual por el mismo servicio.",
          link: "https://www.wom.cl"
        },
        {
          name: "Plan Móvil Prepago o Cuenta Controlada (Portabilidad)",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Plan de telefonía móvil de bajo costo contratado bajo portabilidad con gigas libres de navegación en redes sociales y llamadas libres.",
          reason: "Hoy existen planes de portabilidad extremadamente económicos que evitan pagar contratos mensuales sobrevalorados.",
          link: "https://www.entel.cl"
        },
        {
          name: "Packs de Servicios de Streaming Compartido o Familiar",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Suscripciones compartidas de plataformas básicas consolidadas en planes familiares de televisión por internet o música.",
          reason: "Agrupar suscripciones en planes familiares compartidos disminuye drásticamente el costo unitario por persona.",
          link: "https://www.netflix.com"
        }
      ];
      generalAdvice = "Monitorea constantemente tus consumos. Llama a tus proveedores de internet y telefonía cada 6 meses para preguntar por nuevos planes vigentes de menor valor o promociones de portabilidad.";
      break;
    }
    case "Entretenimiento": {
      const p1 = scalePrice(0.40, 5000, 35000);
      const p2 = scalePrice(0.35, 4000, 30000);
      const p3 = scalePrice(0.15, 2000, 15000);
      
      products = [
        {
          name: "Juego de Mesa Familiar de Alta Durabilidad y Rejugabilidad",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Adquisición de juegos de mesa modernos (tipo Catan, Carcassonne o dId) que garantizan decenas de horas de diversión en casa con amigos o familia.",
          reason: "Es una inversión única que reemplaza múltiples salidas costosas a restaurantes, cines o centros comerciales.",
          link: "https://www.devir.cl"
        },
        {
          name: "Entradas Planificadas en Días de Promoción de Cine",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Compra de entradas de cine digitalizadas aprovechando convenios bancarios, de cajas de compensación o días de descuento (lunes a miércoles).",
          reason: "Ir al cine usando códigos de descuento reduce el precio del boleto a la mitad, permitiéndote disfrutar sin salirte del presupuesto.",
          link: "https://www.cinehoyts.cl"
        },
        {
          name: "Suscripción Mensual Compartida a Biblioteca Digital",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Acceso ilimitado a miles de libros, audiolibros y revistas interactivas en español para toda la familia.",
          reason: "Proporciona entretenimiento cultural infinito por un valor mínimo al mes comparado con comprar libros individuales.",
          link: "https://www.bpdigital.cl"
        }
      ];
      generalAdvice = "Aprovecha la agenda cultural gratuita de tu municipalidad, los museos estatales los días domingo y los parques metropolitanos que no cobran entrada. Disfruta del aire libre y haz picnics caseros.";
      break;
    }
    default: {
      const p1 = scalePrice(0.45, 10000, 80000);
      const p2 = scalePrice(0.30, 6000, 50000);
      const p3 = scalePrice(0.15, 3000, 25000);
      
      products = [
        {
          name: "Fondo de Emergencia para Pequeños Imprevistos",
          price: p1,
          priceFormatted: formatCLP(p1),
          description: "Reserva de dinero guardada en una cuenta de ahorro de fácil acceso para cubrir gastos inesperados como una ampolleta de auto o una llave rota.",
          reason: "Contar con un fondo dedicado previene tener que endeudarse con tarjetas de crédito ante gastos menores repentinos.",
          link: "https://www.bancoestado.cl"
        },
        {
          name: p2 >= 15000 ? "Set de Herramientas Básicas para Reparaciones" : "Set de Herramientas de Uso Frecuente",
          price: p2,
          priceFormatted: formatCLP(p2),
          description: "Destornilladores, martillo, alicates, cinta aisladora y de teflón para solucionar problemas menores tú mismo.",
          reason: "Aprender a hacer reparaciones domésticas básicas te ahorra el costo de mano de obra de técnicos externos.",
          link: "https://www.sodimac.cl"
        },
        {
          name: "Suscripción de Almacenamiento Seguro en la Nube",
          price: p3,
          priceFormatted: formatCLP(p3),
          description: "Plan de almacenamiento digital para respaldar fotos familiares, documentos importantes y planillas de control financiero.",
          reason: "Evita la pérdida de datos y el gasto elevado que significa recuperar información de un disco duro dañado.",
          link: "https://one.google.com"
        }
      ];
      generalAdvice = "Antes de gastar en esta categoría, pregúntate si la compra es una necesidad real o un deseo pasajero. Dormir la decisión por 48 horas elimina el 80% de las compras impulsivas.";
      break;
    }
  }

  return {
    success: true,
    category,
    budget,
    currency,
    products,
    generalAdvice,
    sources: [
      { title: "Sodimac Chile - Soluciones para el Hogar", uri: "https://www.sodimac.cl" },
      { title: "Lider Supermercados - Formato Ahorro", uri: "https://www.lider.cl" },
      { title: "Ministerio de Salud Chile - Farmacias Municipales", uri: "https://www.minsal.cl" }
    ],
    isFallback: true
  };
}

// API Endpoint to classify bank descriptions into categories using Gemini or fallback
app.post("/api/bank/categorize", async (req, res) => {
  const { descriptions } = req.body;

  if (!descriptions || !Array.isArray(descriptions)) {
    return res.status(400).json({ error: "Debe proporcionar un arreglo de descripciones" });
  }

  // Fallback function for local matching
  const localMatchCategory = (desc: string): string => {
    const d = desc.toLowerCase();
    if (d.includes("jumbo") || d.includes("lider") || d.includes("unimarc") || d.includes("tottus") || d.includes("supermercado") || d.includes("comida") || d.includes("restaurant") || d.includes("mcdonald") || d.includes("burger") || d.includes("starbucks") || d.includes("sushi") || d.includes("pizza") || d.includes("panaderia") || d.includes("ccu")) {
      return "Comida";
    }
    if (d.includes("metro") || d.includes("copec") || d.includes("shell") || d.includes("petrobras") || d.includes("uber") || d.includes("cabify") || d.includes("didi") || d.includes("bip") || d.includes("peaje") || d.includes("transantiago") || d.includes("autopista") || d.includes("vespucio") || d.includes("costanera") || d.includes("turbus") || d.includes("latam")) {
      return "Transporte";
    }
    if (d.includes("clinica") || d.includes("hospital") || d.includes("doctor") || d.includes("medico") || d.includes("dentista") || d.includes("ahumada") || d.includes("cruz verde") || d.includes("salcobrand") || d.includes("farmacia") || d.includes("isapre") || d.includes("fonasa") || d.includes("psicologo") || d.includes("optica")) {
      return "Salud";
    }
    if (d.includes("enel") || d.includes("metrogas") || d.includes("vtr") || d.includes("movistar") || d.includes("entel") || d.includes("claro") || d.includes("aguas andinas") || d.includes("luz") || d.includes("agua") || d.includes("gas") || d.includes("sencillito") || d.includes("servipag") || d.includes("arriendo") || d.includes("gasto comun")) {
      return "Servicios";
    }
    if (d.includes("cine") || d.includes("netflix") || d.includes("spotify") || d.includes("disney") || d.includes("amazon prime") || d.includes("hbo") || d.includes("juego") || d.includes("steam") || d.includes("playstation") || d.includes("concierto") || d.includes("teatro") || d.includes("bar") || d.includes("pub") || d.includes("discoteca")) {
      return "Entretenimiento";
    }
    return "Otros";
  };

  try {
    if (!ai) {
      // Use fallback matching if Gemini is not loaded
      const results = descriptions.map((desc) => ({
        description: desc,
        category: localMatchCategory(desc),
      }));
      return res.json({ success: true, categories: results, isFallback: true });
    }

    const descriptionsList = descriptions.map((d, idx) => `${idx + 1}. "${d}"`).join("\n");
    const prompt = `Asigna cada descripción de movimiento bancario a exactamente UNA de estas categorías: "Comida", "Transporte", "Salud", "Servicios", "Entretenimiento", "Otros".
Movimientos a clasificar:
${descriptionsList}

Responde en formato JSON con la estructura especificada en el esquema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  description: { type: Type.STRING },
                  category: { 
                    type: Type.STRING, 
                    description: 'Debe ser exactamente uno de: "Comida", "Transporte", "Salud", "Servicios", "Entretenimiento" u "Otros"' 
                  }
                },
                required: ["description", "category"]
              }
            }
          },
          required: ["categories"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response text from Gemini in bank categorizer");
    }

    const data = JSON.parse(text.trim());
    return res.json({ success: true, categories: data.categories || [], isFallback: false });

  } catch (error: any) {
    console.error("Error running Gemini bank categorizer, using local fallback:", error);
    const results = descriptions.map((desc) => ({
      description: desc,
      category: localMatchCategory(desc),
    }));
    return res.json({ success: true, categories: results, isFallback: true });
  }
});


// El endpoint de Fintoc fue removido a petición del usuario para utilizar carga directa de archivos de cartola.


// API Endpoint to scan boletas / receipts using Gemini Vision
app.post("/api/scan-receipt", async (req, res) => {
  const { imageBase64, mimeType = "image/jpeg" } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: "No se proporcionó la imagen de la boleta." });
  }

  try {
    if (!ai) {
      return res.status(500).json({ 
        error: "El cliente Gemini AI no está inicializado. Asegúrate de tener GEMINI_API_KEY configurado." 
      });
    }

    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const promptText = `Analiza detalladamente esta imagen de boleta, ticket o recibo de compra.
Extrae la siguiente información relevante para registrar el gasto:
1. description: Nombre del establecimiento, tienda o supermercado y una breve descripción o lista resumida de lo comprado (ej: "Líder - Abarrotes y Verduras" o "Farmacia Cruz Verde").
2. amount: El monto total final pagado como número entero o decimal sin símbolos ni puntos de miles (ej: 18990). Si no está claro, busca el total o suma principal.
3. date: La fecha de la boleta en formato YYYY-MM-DD. Si no es visible, usa la fecha actual.
4. category: Asigna una de estas categorías: "Comida", "Transporte", "Salud", "Servicios", "Entretenimiento", "Higiene", "Vivienda", "Educación", "Otros".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: cleanBase64,
            },
          },
          { text: promptText },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Establecimiento y resumen de la compra" },
            amount: { type: Type.NUMBER, description: "Monto total pagado" },
            date: { type: Type.STRING, description: "Fecha YYYY-MM-DD" },
            category: { type: Type.STRING, description: "Categoría asignada" },
          },
          required: ["description", "amount", "date", "category"],
        },
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No se obtuvo respuesta de Gemini al escanear la boleta.");
    }

    const data = JSON.parse(responseText.trim());
    return res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error al escanear boleta con Gemini:", error);
    return res.status(500).json({
      error: "Ocurrió un error al analizar la boleta con Inteligencia Artificial.",
      details: error.message,
    });
  }
});

// API Endpoint to search products and activities using Google Search grounding
app.post("/api/search-products", async (req, res) => {
  const { category, budget, searchQuery, currency = "CLP" } = req.body;

  try {
    if (!category || budget === undefined) {
      return res.status(400).json({ error: "Missing category or budget" });
    }

    // If Gemini client is not initialized, seamlessly use the local fallback engine!
    if (!ai) {
      console.warn("Gemini Client not initialized. Returning high-quality local recommendations.");
      const fallback = getFallbackRecommendations(category, budget, currency);
      return res.json(fallback);
    }

    const customTopicPrompt = searchQuery ? `Enfoque específico o búsqueda deseada del usuario: "${searchQuery}".` : "";

    const prompt = `Actúa como un asistente y guía financiero experto para el hogar y actividades de ocio/compras en Chile.
Realiza una BÚSQUEDA WEB REAL en tiempo real con Google Search para encontrar actividades, panoramas, eventos, lugares, productos o servicios REALES y VIGENTES con un presupuesto máximo de ${budget} ${currency}.
Categoría principal: "${category}". ${customTopicPrompt}

Necesito que me des una lista de 3 a 5 opciones REALES y ESPECÍFICAS (con nombres reales de tiendas, parques, cines, restaurantes, panoramas o marcas) que se ajusten a este presupuesto de $${budget} ${currency}, detallando el precio estimado por persona o total.
También proporciona un consejo útil de ahorro o recomendación práctica para esta actividad o categoría.
Tu respuesta debe incluir nombres precisos y detalles web de referencia reales obtenidos de tus resultados de búsqueda para que el usuario pueda visitar o contratar.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "Nombre de la actividad, panorama, producto o servicio real" },
                  price: { type: Type.NUMBER, description: "Precio estimado numérico en CLP" },
                  priceFormatted: { type: Type.STRING, description: "Precio formateado con símbolo, ej: $15.000 CLP" },
                  description: { type: Type.STRING, description: "Descripción detallada de la actividad o producto y dónde realizarlo o comprarlo" },
                  reason: { type: Type.STRING, description: "Por qué es una excelente opción dentro de este presupuesto" },
                  link: { type: Type.STRING, description: "Enlace web real o de búsqueda relacionado con la opción" }
                },
                required: ["name", "price", "priceFormatted", "description", "reason", "link"]
              }
            },
            generalAdvice: { 
              type: Type.STRING, 
              description: "Un consejo práctico y detallado para disfrutar o ahorrar específicamente en esta actividad o categoría con este presupuesto." 
            }
          },
          required: ["products", "generalAdvice"]
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("No response text from Gemini");
    }

    const data = JSON.parse(responseText.trim());

    // Extract grounding chunks if available, to enrich links or check sources
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    const sources = groundingChunks?.map((chunk: any) => ({
      title: chunk.web?.title,
      uri: chunk.web?.uri
    })).filter((s: any) => s.title && s.uri) || [];

    res.json({
      success: true,
      category,
      budget,
      currency,
      products: data.products || [],
      generalAdvice: data.generalAdvice || "",
      sources,
      isFallback: false
    });

  } catch (error: any) {
    console.error("Error or Quota limit in Gemini API call, falling back gracefully:", error);
    
    // Seamless fallback to high quality CLP recommendations so the feature always works perfectly!
    try {
      const fallback = getFallbackRecommendations(category, budget, currency);
      res.json(fallback);
    } catch (fallbackError: any) {
      res.status(500).json({ 
        error: "Ocurrió un error al procesar la búsqueda inteligente de productos y actividades.",
        details: error.message 
      });
    }
  }
});

// Configure Vite or Serve Static Files
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support SPA routing - send index.html for other requests
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
