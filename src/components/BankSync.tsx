import React, { useState, useRef } from "react";
import { Transaction, CATEGORIES, CATEGORY_COLORS } from "../types";
import { 
  UploadCloud, 
  FileText, 
  ClipboardPaste, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  CheckSquare, 
  Square,
  ShieldCheck,
  ChevronRight,
  Info,
  Trash2,
  Check,
  RefreshCw,
  HelpCircle,
  ArrowRightLeft,
  ArrowUpDown,
  Building
} from "lucide-react";

interface BankSyncProps {
  existingTransactions: Transaction[];
  onImportTransactions: (transactions: Omit<Transaction, "id">[]) => void;
  formatCurrency: (amount: number) => string;
}

interface TempBankTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  date: string;
  category: string;
  isDuplicate: boolean;
  selected: boolean;
}

export const BankSync: React.FC<BankSyncProps> = ({
  existingTransactions,
  onImportTransactions,
  formatCurrency,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [selectedBank, setSelectedBank] = useState<string>("Santander");
  
  const [rawText, setRawText] = useState<string>("");
  const [parsedTransactions, setParsedTransactions] = useState<TempBankTransaction[]>([]);
  const [isCategorizing, setIsCategorizing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);

  const CHILEAN_BANKS = [
    { 
      name: "Banco Santander", 
      code: "Santander", 
      color: "#ec1c24",
      tips: "Puedes exportar tu cartola mensual en formato CSV desde tu portal Santander. O simplemente selecciona y copia las filas de la tabla de movimientos e impórtalas en la pestaña 'Pegar Texto Directo'."
    },
    { 
      name: "Banco de Chile", 
      code: "Chile", 
      color: "#002464",
      tips: "Soporta archivos TXT o CSV exportados desde Mi Banconexión. También puedes copiar la tabla de movimientos directamente de tu pantalla de Cuenta Corriente/Vista."
    },
    { 
      name: "Banco Estado / CuentaRUT", 
      code: "Estado", 
      color: "#f87c04",
      tips: "Perfecto para CuentaRUT. Copia la tabla de movimientos del portal en línea de BancoEstado o arrastra la cartola en formato de texto."
    },
    { 
      name: "BCI", 
      code: "Bci", 
      color: "#80bc00",
      tips: "Exporta la cartola en formato Excel/CSV desde tu portal BCI, o copia y pega el detalle de movimientos directamente."
    },
    { 
      name: "Banco Itaú", 
      code: "Itau", 
      color: "#ff6c04",
      tips: "Copia directamente las transacciones de tu cuenta corriente Itaú o carga el archivo CSV descargado."
    },
    { 
      name: "Scotiabank", 
      code: "Scotiabank", 
      color: "#af1c24",
      tips: "Soporta cartolas y movimientos de ScotiaWeb. Puedes copiar y pegar el historial o cargar la cartola."
    },
  ];

  // Check if a transaction is a duplicate of something already loaded
  const checkIfDuplicate = (desc: string, amount: number, date: string): boolean => {
    const normalizedDesc = desc.trim().toLowerCase();
    return existingTransactions.some(existing => {
      const extDesc = existing.description.trim().toLowerCase();
      return (
        existing.amount === amount &&
        existing.date === date &&
        (normalizedDesc.includes(extDesc) || extDesc.includes(normalizedDesc))
      );
    });
  };

  // AI-powered classification using Gemini
  const categorizeTransactions = async (txs: Omit<TempBankTransaction, "category">[]): Promise<TempBankTransaction[]> => {
    setIsCategorizing(true);
    try {
      const descriptions = txs.map(t => t.description);
      const res = await fetch("/api/bank/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descriptions }),
      });
      
      const data = await res.json();
      if (data.success && data.categories) {
        return txs.map(tx => {
          const matched = data.categories.find((c: any) => c.description === tx.description);
          return {
            ...tx,
            category: matched ? matched.category : "Otros",
          } as TempBankTransaction;
        });
      }
    } catch (e) {
      console.error("AI categorization failed, using local match:", e);
    } finally {
      setIsCategorizing(false);
    }

    // Client-side quick regex fallback
    return txs.map(tx => {
      const d = tx.description.toLowerCase();
      let cat = "Otros";
      if (d.includes("jumbo") || d.includes("lider") || d.includes("unimarc") || d.includes("supermercado") || d.includes("tottus") || d.includes("comida") || d.includes("starbucks") || d.includes("mcdonald") || d.includes("delivery") || d.includes("pedidosya") || d.includes("ubereats") || d.includes("sushi") || d.includes("pizza") || d.includes("restaurant") || d.includes("comida")) {
        cat = "Comida";
      } else if (d.includes("metro") || d.includes("copec") || d.includes("bip") || d.includes("peaje") || d.includes("uber") || d.includes("cabify") || d.includes("shell") || d.includes("petrobras") || d.includes("autopista") || d.includes("costanera") || d.includes("vespucio") || d.includes("didi")) {
        cat = "Transporte";
      } else if (d.includes("clinica") || d.includes("farmacia") || d.includes("ahumada") || d.includes("cruz verde") || d.includes("doctor") || d.includes("medico") || d.includes("salcobrand") || d.includes("fonasa") || d.includes("isapre") || d.includes("dentista") || d.includes("hospital")) {
        cat = "Salud";
      } else if (d.includes("enel") || d.includes("movistar") || d.includes("vtr") || d.includes("entel") || d.includes("agua") || d.includes("luz") || d.includes("metrogas") || d.includes("servipag") || d.includes("sencillito")) {
        cat = "Servicios";
      } else if (d.includes("cine") || d.includes("netflix") || d.includes("spotify") || d.includes("disney") || d.includes("steam") || d.includes("playstation") || d.includes("concierto") || d.includes("teatro") || d.includes("bar") || d.includes("pub") || d.includes("juego")) {
        cat = "Entretenimiento";
      }
      return { ...tx, category: cat } as TempBankTransaction;
    });
  };

  // Highly robust line-by-line parsing engine
  const processRawText = async (text: string) => {
    setErrorMessage(null);
    if (!text.trim()) {
      setErrorMessage("El texto o archivo está vacío.");
      return;
    }

    const lines = text.split(/\r?\n/);
    const tempTxs: Omit<TempBankTransaction, "category">[] = [];

    // Chilean Date matching pattern
    const dateRegex = /(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})|(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const lowercase = trimmed.toLowerCase();
      // Skip headers
      if (
        lowercase.includes("fecha de proceso") ||
        lowercase.includes("saldo contable") ||
        lowercase.includes("saldo disponible") ||
        lowercase.includes("resumen de cuenta") ||
        lowercase.includes("cartola de movimiento") ||
        lowercase.includes("monto total") ||
        lowercase.includes("fecha contable") ||
        (lowercase.includes("fecha") && lowercase.includes("glosa") && lowercase.includes("saldo")) ||
        (lowercase.includes("fecha") && lowercase.includes("detalle") && lowercase.includes("monto"))
      ) {
        return;
      }

      // Delimiter detection
      let delimiter = ",";
      if (trimmed.includes(";")) delimiter = ";";
      else if (trimmed.includes("\t")) delimiter = "\t";
      else if (trimmed.includes("   ")) delimiter = "   ";

      let columns = trimmed.split(delimiter).map(col => col.replace(/^["']|["']$/g, "").trim());
      
      if (columns.length === 1) {
        // Multi-space separation fallback
        columns = trimmed.split(/\s{2,}/).map(col => col.trim());
      }

      if (columns.length < 2) return;

      // Date identification
      let dateIndex = -1;
      let cleanDateStr = "";

      for (let i = 0; i < columns.length; i++) {
        const col = columns[i];
        const match = col.match(dateRegex);
        if (match) {
          dateIndex = i;
          
          const parts = col.split(/[-/]/);
          if (parts.length === 3) {
            if (parts[0].length === 4) { // YYYY-MM-DD
              cleanDateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
            } else { // DD-MM-YYYY or DD-MM-YY
              let year = parts[2];
              if (year.length === 2) {
                year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
              }
              cleanDateStr = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
            }
          }
          break;
        }
      }

      if (dateIndex === -1) return;

      // Description identification (longest non-numeric column)
      let description = "";
      let descIndex = -1;
      let longestLen = 0;

      columns.forEach((col, idx) => {
        if (idx === dateIndex) return;
        const cleanCol = col.replace(/\s+/g, " ");
        const isNumber = /^[+-]?\s*\$?\s*[0-9.,]+[-]?\s*$/.test(cleanCol);
        if (!isNumber && cleanCol.length > longestLen && cleanCol.length > 2) {
          longestLen = cleanCol.length;
          description = cleanCol;
          descIndex = idx;
        }
      });

      if (!description) {
        for (let i = 0; i < columns.length; i++) {
          if (i !== dateIndex) {
            description = columns[i];
            descIndex = i;
            break;
          }
        }
      }

      // Amount identification
      let amount = 0;
      let type: "income" | "expense" = "expense";
      const numbers: { val: number; idx: number; raw: string }[] = [];

      columns.forEach((col, idx) => {
        if (idx === dateIndex || idx === descIndex) return;

        let cleanCol = col.replace(/\s/g, "").replace("$", "");
        const hasComma = cleanCol.includes(",");
        const hasDot = cleanCol.includes(".");
        
        if (hasComma && hasDot) {
          cleanCol = cleanCol.replace(/\./g, "").replace(/,/g, ".");
        } else if (hasComma) {
          cleanCol = cleanCol.replace(/,/g, ".");
        } else if (hasDot) {
          const dotCount = (cleanCol.match(/\./g) || []).length;
          const lastDotIdx = cleanCol.lastIndexOf(".");
          const digitsAfterDot = cleanCol.length - lastDotIdx - 1;
          
          if (dotCount > 1 || digitsAfterDot === 3) {
            cleanCol = cleanCol.replace(/\./g, "");
          } else if (digitsAfterDot === 2) {
            // treat dot as decimal
          } else {
            cleanCol = cleanCol.replace(/\./g, "");
          }
        }

        const parsedNum = parseFloat(cleanCol);
        if (!isNaN(parsedNum) && parsedNum !== 0) {
          numbers.push({ val: parsedNum, idx, raw: col });
        }
      });

      if (numbers.length > 0) {
        let targetNumObj = numbers[0];

        // If there are multiple numbers (amount and saldo), saldo is usually at the end
        if (numbers.length >= 2) {
          const lastColIdx = columns.length - 1;
          const hasLastColSaldo = numbers.some(n => n.idx === lastColIdx);
          if (hasLastColSaldo) {
            targetNumObj = numbers.find(n => n.idx !== lastColIdx) || numbers[0];
          }
        }

        amount = Math.abs(targetNumObj.val);
        const rawStr = targetNumObj.raw.trim();
        const hasMinus = rawStr.startsWith("-") || rawStr.endsWith("-") || rawStr.includes("-");

        if (hasMinus) {
          type = "expense";
        } else {
          // Keywords heuristics for Chilean portals
          const dLower = description.toLowerCase();
          const isCommonIncome = dLower.includes("sueldo") || dLower.includes("remuneracion") || dLower.includes("deposito") || dLower.includes("reembolso") || dLower.includes("transferencia recibida") || dLower.includes("trf recibida") || dLower.includes("abono") || dLower.includes("devolucion");
          const isCommonExpense = dLower.includes("compra") || dLower.includes("pago") || dLower.includes("giro") || dLower.includes("comision") || dLower.includes("cargo") || dLower.includes("transferencia enviada") || dLower.includes("trf enviada") || dLower.includes("tef a ");

          if (isCommonIncome) {
            type = "income";
          } else if (isCommonExpense) {
            type = "expense";
          } else {
            type = "expense";
          }
        }
      }

      if (description.length > 2 && amount > 0) {
        tempTxs.push({
          id: `tx_import_${lineIdx}_${Math.random().toString(36).substring(2, 6)}`,
          description: description.toUpperCase().trim(),
          amount,
          type,
          date: cleanDateStr,
          isDuplicate: checkIfDuplicate(description, amount, cleanDateStr),
          selected: !checkIfDuplicate(description, amount, cleanDateStr)
        });
      }
    });

    if (tempTxs.length > 0) {
      const categorized = await categorizeTransactions(tempTxs);
      setParsedTransactions(categorized);
      setRawText("");
    } else {
      setErrorMessage("No se pudieron detectar movimientos válidos. Verifica que las líneas contengan la Fecha, Detalle y Monto.");
    }
  };

  // File Handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      readFileContent(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        processRawText(event.target.result as string);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processRawText(rawText);
  };

  // List Management
  const handleToggleSelect = (id: string) => {
    setParsedTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleToggleSelectAll = () => {
    const allSelected = parsedTransactions.every(t => t.selected);
    setParsedTransactions(prev =>
      prev.map(t => ({ ...t, selected: !allSelected }))
    );
  };

  const handleCategoryChange = (id: string, newCat: string) => {
    setParsedTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, category: newCat } : t))
    );
  };

  const handleDescriptionChange = (id: string, newDesc: string) => {
    setParsedTransactions(prev =>
      prev.map(t => (t.id === id ? { ...t, description: newDesc.toUpperCase() } : t))
    );
  };

  const handleImportSelected = () => {
    const selectedTxs = parsedTransactions.filter(t => t.selected);
    if (selectedTxs.length === 0) return;

    const toImport = selectedTxs.map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
    }));

    onImportTransactions(toImport);
    setSuccessMessage(`¡Se importaron exitosamente ${selectedTxs.length} transacciones de tu cartola bancaria!`);
    setParsedTransactions([]);
    
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  const handleClearParsed = () => {
    setParsedTransactions([]);
    setErrorMessage(null);
  };

  return (
    <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6 text-white shadow-xl flex flex-col h-full overflow-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <ArrowRightLeft className="text-indigo-400" size={20} />
          Importador de Cartolas Bancarias
        </h3>
        {parsedTransactions.length > 0 && (
          <button
            onClick={handleClearParsed}
            className="text-[10px] bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 rounded-lg py-1 px-2.5 transition-all cursor-pointer flex items-center gap-1"
          >
            <Trash2 size={11} />
            Limpiar Lista
          </button>
        )}
      </div>

      {successMessage && (
        <div className="mb-4 p-3.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-200 text-xs flex items-start gap-2.5 animate-fadeIn shrink-0">
          <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-bold block text-emerald-300 mb-0.5">Importación Exitosa</span>
            {successMessage}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn shrink-0">
          <AlertTriangle className="text-rose-400 shrink-0 mt-0.5" size={16} />
          <div>
            <span className="font-bold block text-rose-300 mb-0.5">Atención</span>
            {errorMessage}
          </div>
        </div>
      )}

      {parsedTransactions.length === 0 ? (
        <div className="flex flex-col flex-1 min-h-[300px]">
          {/* Bank Configuration Tips Selector */}
          <div className="mb-4 shrink-0 bg-slate-950/30 border border-white/5 rounded-xl p-3">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Consejos para Bancos Chilenos</span>
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {CHILEAN_BANKS.map(bank => (
                <button
                  key={bank.code}
                  onClick={() => setSelectedBank(bank.code)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                    selectedBank === bank.code
                      ? "bg-white/10 text-white border-white/20"
                      : "bg-white/5 text-slate-400 border-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bank.color }}></span>
                  {bank.name.replace("Banco ", "")}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-300 leading-normal bg-white/[0.02] p-2 rounded-lg border border-white/5">
              💡 {CHILEAN_BANKS.find(b => b.code === selectedBank)?.tips}
            </p>
          </div>

          {/* Selector Tab */}
          <div className="grid grid-cols-2 bg-slate-950/40 p-1 rounded-xl border border-white/5 mb-4 shrink-0">
            <button
              onClick={() => setActiveTab("upload")}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "upload"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UploadCloud size={13} />
              Cargar Cartola (CSV / TXT)
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                activeTab === "paste"
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ClipboardPaste size={13} />
              Pegar Texto Directo
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-center">
            {activeTab === "upload" ? (
              <div className="space-y-4 animate-fadeIn">
                {/* Drag zone */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[160px] ${
                    dragActive 
                      ? "border-indigo-400 bg-indigo-500/10" 
                      : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .txt, .tsv"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <UploadCloud className="text-indigo-400 mb-2.5 scale-110" size={32} />
                  <span className="text-xs font-semibold block text-slate-200">Suelta tu cartola CSV o TXT aquí</span>
                  <span className="text-[10px] text-slate-400 mt-1">O haz clic para explorar tus archivos</span>
                </div>

                <div className="bg-slate-950/30 border border-white/5 rounded-xl p-3 flex gap-2.5 items-start">
                  <Info className="text-indigo-400 shrink-0 mt-0.5" size={16} />
                  <p className="text-[10px] text-slate-400 leading-normal">
                    La cartola se procesa de forma 100% local en tu navegador. Tus datos financieros nunca se envían a servidores externos, asegurando privacidad total.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handlePasteSubmit} className="space-y-3.5 animate-fadeIn flex flex-col flex-1">
                <p className="text-[11px] text-slate-300 leading-relaxed text-center">
                  Copia los movimientos del portal bancario en tu pantalla y pégalos a continuación.
                </p>

                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={`Ejemplo de filas Santander o Chile:
02/07/2026   COMPRA EN JUMBO PROVIDENCIA   $ 24.500
03/07/2026   METRO DE SANTIAGO             $ 1.800
04/07/2026   TRANSFERENCIA SUELDO          $ 850.000`}
                  className="w-full bg-slate-950/60 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 font-mono resize-none flex-1 min-h-[140px]"
                />

                <button
                  type="submit"
                  disabled={!rawText.trim()}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/20 disabled:text-slate-500 py-2.5 rounded-xl text-xs font-semibold text-white shadow-lg cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles size={14} />
                  Procesar y Clasificar Movimientos
                </button>
              </form>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden min-h-[380px] animate-fadeIn">
          {/* Status Alert Banner */}
          <div className="mb-3 p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="text-indigo-400 shrink-0" size={15} />
              <span className="text-[11px] font-semibold text-indigo-300">
                ✓ Se detectaron {parsedTransactions.length} registros listos para revisión
              </span>
            </div>
            {isCategorizing && (
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                <RefreshCw className="animate-spin" size={11} />
                <span>AI Clasificando...</span>
              </div>
            )}
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[290px] min-h-[200px]">
            {parsedTransactions.map((tx) => (
              <div
                key={tx.id}
                className={`p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 select-none ${
                  tx.selected
                    ? "bg-white/10 border-white/20"
                    : "bg-white/5 border-white/5 opacity-50 hover:opacity-100"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Checkbox */}
                  <div className="shrink-0 cursor-pointer" onClick={() => handleToggleSelect(tx.id)}>
                    {tx.selected ? (
                      <CheckSquare className="text-indigo-400" size={16} />
                    ) : (
                      <Square className="text-slate-500" size={16} />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={tx.description}
                        onChange={(e) => handleDescriptionChange(tx.id, e.target.value)}
                        className="bg-transparent text-[11px] font-bold text-white focus:outline-none focus:border-indigo-400/50 border-b border-transparent hover:border-white/10 py-0.5 w-full truncate font-sans"
                        placeholder="Descripción del cargo"
                      />
                      {tx.isDuplicate && (
                        <span className="text-[8px] bg-rose-500/10 border border-rose-500/20 text-rose-300 px-1 py-0.2 rounded-md font-medium shrink-0 flex items-center gap-0.5">
                          <AlertTriangle size={8} />
                          Existente
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono font-medium block mt-0.5">
                      {tx.date} • {tx.type === "income" ? "Ingreso" : "Egreso"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[11px] font-bold font-mono ${tx.type === "income" ? "text-emerald-400" : "text-white"}`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </span>

                  {/* Category Selector */}
                  <div className="relative shrink-0">
                    <select
                      value={tx.category}
                      onChange={(e) => handleCategoryChange(tx.id, e.target.value)}
                      className="bg-slate-950 text-slate-300 border border-white/10 rounded-lg py-1 px-1.5 text-[9px] focus:outline-none focus:border-indigo-400 cursor-pointer font-medium"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-4 pt-3.5 border-t border-white/5 flex items-center justify-between shrink-0">
            <button
              onClick={handleToggleSelectAll}
              className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
            >
              <Check className="text-indigo-400" size={12} />
              {parsedTransactions.every(t => t.selected) ? "Deseleccionar Todos" : "Seleccionar Todos"}
            </button>

            <button
              onClick={handleImportSelected}
              disabled={parsedTransactions.filter(t => t.selected).length === 0}
              className="bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/20 disabled:text-slate-500 py-1.5 px-4 rounded-xl text-xs font-semibold text-white shadow transition-all cursor-pointer flex items-center gap-1"
            >
              <Plus size={13} />
              Importar {parsedTransactions.filter(t => t.selected).length} Transacciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
