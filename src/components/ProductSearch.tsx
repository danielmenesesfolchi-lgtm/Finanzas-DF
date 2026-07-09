import React, { useState, useEffect } from "react";
import { CATEGORIES, ProductRecommendation, SearchResult, CATEGORY_COLORS } from "../types";
import { Search, Sparkle, ExternalLink, RefreshCw, Info, DollarSign } from "./CategoryIcon";

interface ProductSearchProps {
  initialCategory?: string;
  initialBudget?: number;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  initialCategory,
  initialBudget
}) => {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [budget, setBudget] = useState("100");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  const loadingMessages = [
    "Consultando Gemini AI con Google Search...",
    "Buscando productos reales en línea...",
    "Alineando opciones con tu presupuesto disponible...",
    "Filtrando recomendaciones inteligentes para el hogar...",
    "Cargando consejos prácticos de ahorro..."
  ];

  // Update when props from external triggers change
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
    if (initialBudget !== undefined) {
      setBudget(Math.round(initialBudget).toString());
    }
  }, [initialCategory, initialBudget]);

  // Loading message rotator
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      let index = 0;
      setLoadingMessage(loadingMessages[0]);
      interval = setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 2500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category || !budget || parseFloat(budget) <= 0) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search-products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          category,
          budget: parseFloat(budget),
          currency: "CLP" // Defaulting to CLP for Chile
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error al buscar recomendaciones.");
      }

      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "No se pudo conectar con el servidor de búsqueda de productos.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const color = CATEGORY_COLORS[category] || "#64748b";

  return (
    <div id="product-search-card" className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 flex flex-col h-full text-white shadow-xl relative overflow-hidden">
      <div className="shrink-0 mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Sparkle className="text-indigo-400 animate-pulse" size={20} />
          Buscador de Compras Inteligente (Gemini AI)
        </h3>
        <p className="text-xs text-slate-400 mt-1">
          Encuentra productos y canastas recomendadas en internet que se ajusten a tu presupuesto mensual disponible.
        </p>
      </div>

      {/* Form Section */}
      <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 bg-white/5 border border-white/5 rounded-xl shrink-0">
        <div>
          <label htmlFor="search-category" className="block text-xs font-medium text-slate-400 mb-1">
            Categoría
          </label>
          <select
            id="search-category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-xs bg-white/5 text-slate-200 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22rgba(255,255,255,0.4)%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:0.8rem_0.8rem] bg-[right_0.8rem_center] bg-no-repeat transition-all"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="search-budget" className="block text-xs font-medium text-slate-400 mb-1">
            Presupuesto Máximo
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">
              $
            </span>
            <input
              type="number"
              id="search-budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Presupuesto"
              min="1"
              className="w-full pl-7 pr-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 text-xs bg-white/5 text-white placeholder-slate-400 transition-all"
              required
            />
          </div>
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 cursor-pointer h-[34px]"
          >
            {loading ? (
              <RefreshCw className="animate-spin" size={14} />
            ) : (
              <Search size={14} />
            )}
            Buscar Opciones
          </button>
        </div>
      </form>

      {/* Results / States Section */}
      <div className="flex-1 overflow-y-auto pr-1">
        {loading && (
          <div className="h-full flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-white/10 border-t-indigo-500 animate-spin mb-4" />
            <p className="text-sm font-medium text-slate-200 animate-pulse">{loadingMessage}</p>
            <p className="text-xs text-slate-400 mt-2 max-w-xs">
              Gemini está buscando en tiendas locales en tiempo real para encontrar los mejores precios y ofertas.
            </p>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-200 rounded-xl text-xs flex items-start gap-2.5">
            <Info className="text-rose-400 shrink-0 mt-0.5" size={16} />
            <div>
              <span className="font-bold">Error en la búsqueda: </span>
              {error}
              <p className="mt-1 text-rose-300/80">
                Asegúrate de tener configurado tu GEMINI_API_KEY en la sección Secrets si estás en el modo de desarrollo.
              </p>
            </div>
          </div>
        )}

        {!loading && !error && !result && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-10 text-center">
            <div className="w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-3">
              <Sparkle size={20} />
            </div>
            <p className="text-sm font-medium text-slate-300">¿No sabes qué comprar o cómo ahorrar?</p>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Selecciona una categoría arriba (o pulsa "Buscar productos" en el listado de límites) y pulsa Buscar para obtener recomendaciones basadas en tu presupuesto real actual.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-5 animate-fadeIn">
            {result.isFallback && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-start gap-2.5 text-xs text-amber-200">
                <Info size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold block mb-0.5 text-amber-300">Modo de Contingencia Activo</span>
                  <p className="leading-relaxed text-amber-200/90 text-[11px]">
                    Debido a una alta demanda temporal en la API de Gemini, estamos sirviendo recomendaciones inteligentes locales y canastas optimizadas en Pesos Chilenos (CLP) para tu presupuesto actual.
                  </p>
                </div>
              </div>
            )}

            {/* Savings Tip / Advice Banner */}
            {result.generalAdvice && (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl">
                <h4 className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5 mb-1.5">
                  <Sparkle size={14} className="text-indigo-400 animate-pulse" />
                  Consejo de Ahorro para {result.category}:
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {result.generalAdvice}
                </p>
              </div>
            )}

            {/* Product Recommendations List */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Productos y Canastas sugeridos para {formatCurrency(result.budget)}
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {result.products?.map((p, idx) => (
                  <div
                    key={idx}
                    className="bg-white/5 border border-white/10 hover:border-indigo-500/40 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 text-white group/prod"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <h5 className="text-sm font-semibold text-white group-hover/prod:text-indigo-300 transition-colors">
                          {p.name}
                        </h5>
                        <span className="text-xs font-bold font-mono text-emerald-400 shrink-0 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          {p.priceFormatted || formatCurrency(p.price)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-400 leading-relaxed mb-2.5">
                        {p.description}
                      </p>

                      <div className="text-[11px] bg-white/5 border border-white/5 p-2 rounded-lg text-slate-300 mb-3.5">
                        <span className="font-semibold text-indigo-300">Por qué:</span> {p.reason}
                      </div>
                    </div>

                    {p.link && (
                      <a
                        href={p.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] font-semibold text-indigo-300 hover:text-indigo-200 flex items-center gap-1 mt-auto shrink-0 group/link cursor-pointer"
                      >
                        Ver referencia de compra
                        <ExternalLink size={10} className="group-hover/link:translate-x-0.5 transition-transform" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sources / References Section */}
            {result.sources && result.sources.length > 0 && (
              <div className="border-t border-white/10 pt-3 text-[10px] text-slate-400">
                <span className="font-semibold block mb-1">Fuentes y Referencias:</span>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {result.sources.slice(0, 3).map((src, sIdx) => (
                    <a
                      key={sIdx}
                      href={src.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-indigo-400 underline flex items-center gap-0.5 shrink-0"
                    >
                      {src.title || "Resultado web"}
                      <ExternalLink size={8} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
