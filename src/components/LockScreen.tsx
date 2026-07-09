import React, { useState, useEffect } from "react";
import { Lock, Unlock, Eye, EyeOff, ShieldAlert, KeyRound, Check, X, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface LockScreenProps {
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ onUnlock }) => {
  const [hasPassword, setHasPassword] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [shake, setShake] = useState<boolean>(false);
  const [isSetup, setIsSetup] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem("hogar_app_password");
    if (saved) {
      setHasPassword(true);
      setIsSetup(false);
    } else {
      setHasPassword(false);
      setIsSetup(true);
    }
  }, []);

  const handleSetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 4) {
      setError("La clave debe tener al menos 4 caracteres.");
      triggerShake();
      return;
    }

    if (password !== confirmPassword) {
      setError("Las claves no coinciden.");
      triggerShake();
      return;
    }

    localStorage.setItem("hogar_app_password", password);
    setHasPassword(true);
    setIsSetup(false);
    setPassword("");
    setConfirmPassword("");
    onUnlock();
  };

  const handleVerifyPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError("");

    const saved = localStorage.getItem("hogar_app_password");
    if (password === saved) {
      onUnlock();
    } else {
      setError("Clave incorrecta. Intente nuevamente.");
      setPassword("");
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleKeypadPress = (val: string) => {
    setError("");
    setPassword((prev) => prev + val);
  };

  const handleBackspace = () => {
    setPassword((prev) => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPassword("");
    setError("");
  };

  // Watch for numeric keypad submissions or auto-unlock for 4-digit codes if exact match
  useEffect(() => {
    if (!isSetup && hasPassword) {
      const saved = localStorage.getItem("hogar_app_password");
      // If the saved password is a 4-digit PIN and user typed 4 digits, attempt auto-unlock
      if (saved && saved.length === 4 && password.length === 4) {
        if (password === saved) {
          onUnlock();
        } else {
          setError("Clave incorrecta.");
          setPassword("");
          triggerShake();
        }
      }
    }
  }, [password, isSetup, hasPassword, onUnlock]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950">
      {/* Decorative radial gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/40 via-slate-900 to-purple-950/40 pointer-events-none z-0"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`w-full max-w-md bg-slate-900/80 border border-slate-800 backdrop-blur-xl p-8 rounded-3xl shadow-2xl relative z-10 transition-transform ${
          shake ? "animate-bounce" : ""
        }`}
        style={{
          animationIterationCount: shake ? 2 : undefined,
          transform: shake ? "translateX(10px)" : undefined,
        }}
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-4 shadow-inner">
            {isSetup ? <KeyRound size={28} /> : <Lock size={28} className="animate-pulse" />}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {isSetup ? "Configurar Acceso Seguro" : "Finanzas DF"}
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">
            {isSetup
              ? "Crea una clave para proteger tu información financiera local en este dispositivo."
              : "Ingresa tu clave de acceso para ver y gestionar tus presupuestos."}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
            <ShieldAlert size={16} className="text-rose-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isSetup ? (
          /* SETUP SCREEN FORM */
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Nueva Clave (mínimo 4 dígitos o letras)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ej: 1234"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-mono tracking-widest text-center"
                  maxLength={16}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Confirmar Clave
              </label>
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir clave"
                className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-600 font-mono tracking-widest text-center"
                maxLength={16}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-3 text-xs font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              Guardar y Desbloquear
            </button>
          </form>
        ) : (
          /* ENTER PIN/PASSWORD SCREEN */
          <div className="space-y-6">
            <form onSubmit={handleVerifyPassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-2xl px-4 py-3.5 text-lg text-white focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-slate-700 font-mono tracking-widest text-center"
                  maxLength={16}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsSetup(true);
                    setPassword("");
                    setError("");
                  }}
                  className="w-full bg-slate-800/40 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-xl py-3 text-[11px] font-semibold transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  Restablecer Clave
                </button>
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-xl py-3 text-[11px] font-semibold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Unlock size={14} />
                  Ingresar
                </button>
              </div>
            </form>

            {/* MECHANICAL NUMERIC KEYPAD */}
            <div className="pt-2">
              <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="aspect-square bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-center text-lg font-bold text-slate-100 hover:bg-slate-800 hover:text-white hover:border-indigo-500/50 active:scale-95 transition-all cursor-pointer shadow-sm font-mono"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="aspect-square bg-slate-950/20 rounded-2xl flex items-center justify-center text-[10px] font-semibold text-slate-500 hover:text-slate-300 active:scale-95 transition-all cursor-pointer font-mono"
                >
                  LIMPIAR
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress("0")}
                  className="aspect-square bg-slate-950/40 border border-slate-800/80 rounded-2xl flex items-center justify-center text-lg font-bold text-slate-100 hover:bg-slate-800 hover:text-white hover:border-indigo-500/50 active:scale-95 transition-all cursor-pointer font-mono"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="aspect-square bg-slate-950/20 rounded-2xl flex items-center justify-center text-slate-400 hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-slate-800/60 text-center text-[10px] text-slate-500">
          Clave encriptada localmente en tu propio dispositivo.
        </div>
      </motion.div>
    </div>
  );
};
