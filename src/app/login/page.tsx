'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, HelpCircle, LogIn, ChevronRight, Sparkles, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { data: persona, error: personaError } = await supabase
        .from('personas')
        .select('email, rol, estado')
        .eq('username', username.trim().toLowerCase())
        .single();

      if (personaError || !persona?.email) {
        setError('Usuario o contraseña incorrectos.');
        setIsLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: persona.email,
        password: password,
      });

      if (authError || !authData.user) {
        setError('Usuario o contraseña incorrectos.');
        setIsLoading(false);
        return;
      }

      if (persona.rol === 'administrador') {
        router.push('/admin');
      } else if (persona.rol === 'docente' && !persona.estado) {
        router.push('/visitante');
      } else {
        router.push('/docente');
      }

    } catch {
      setError('Ocurrió un error inesperado. Intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-[#f3f6fb] to-slate-100 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden selection:bg-[#094e8f]/20 selection:text-[#094e8f]">
      {/* Background Ambient Lights */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] bg-blue-100/70 rounded-full blur-[140px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[55vw] h-[55vw] max-w-[650px] max-h-[650px] bg-amber-50/70 rounded-full blur-[140px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40vw] h-[40vw] max-w-[500px] max-h-[500px] bg-indigo-50/50 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-[440px] md:max-w-3xl lg:max-w-4xl relative z-10"
      >
        {/* Main Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl md:rounded-[2.5rem] border border-slate-200/80 shadow-[0_24px_50px_-12px_rgba(9,78,143,0.09)] overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-12">
            
            {/* Left Column: Branding / Identity */}
            <div className="md:col-span-5 bg-gradient-to-b from-slate-50/80 via-[#f8fafc] to-blue-50/30 p-5 sm:p-7 md:p-10 lg:p-12 flex flex-col justify-between items-center text-center border-b md:border-b-0 md:border-r border-slate-100 relative">

              {/* Logos a los costados, sin caja, tamaño real */}
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
                className="absolute top-7 left-7 sm:top-8 sm:left-8 md:top-9 md:left-9 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              >
                <Image
                  src="/logo/Emi logo.png"
                  alt="Logo EMI"
                  width={160}
                  height={160}
                  className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(9,78,143,0.15)]"
                  priority
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 220 }}
                className="absolute top-7 right-7 sm:top-8 sm:right-8 md:top-9 md:right-9 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              >
                <Image
                  src="/logo/uicyt-logo-transparent.png"
                  alt="Logo UICYT"
                  width={160}
                  height={160}
                  className="w-full h-full object-contain drop-shadow-[0_4px_10px_rgba(9,78,143,0.15)]"
                  priority
                />
              </motion.div>

              <div className="flex flex-col items-center my-auto w-full pt-28 sm:pt-32 md:pt-36">
                {/* Typography */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center"
                >
                  <p className="text-slate-800 text-sm sm:text-base md:text-lg font-extrabold uppercase tracking-wide max-w-[320px] md:max-w-[360px] leading-tight sm:leading-snug">
                    Unidad de Investigación Ciencia y Tecnología
                  </p>
                  <p className="text-slate-400 text-[10px] sm:text-[11px] font-semibold tracking-normal mt-0.5 sm:mt-1">
                    Sistema de Calificación y Evaluación
                  </p>
                </motion.div>
              </div>

              {/* Institutional Badge Desktop */}
              <div className="hidden md:flex items-center gap-2 px-4 py-1.5 bg-white/90 shadow-sm border border-slate-200/70 rounded-full mt-6">
                <Sparkles className="w-3.5 h-3.5 text-[#f0d114]" />
                <span className="text-[11px] text-slate-700 font-bold tracking-wide">
                  Gestión <span className="text-[#094e8f] font-black">2026</span>
                </span>
              </div>
            </div>

            {/* Right Column: Login Form */}
            <div className="md:col-span-7 p-5 sm:p-7 md:p-10 lg:p-12 flex flex-col justify-between">
              <div>
                <div className="mb-5 sm:mb-6 md:mb-8">
                  <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Iniciar Sesión
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium mt-0.5 sm:mt-1">
                    Ingresa con tus credenciales asignadas
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
                  {/* Username Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                      Usuario
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-100 group-focus-within:bg-blue-50 flex items-center justify-center transition-colors">
                        <User className="w-4 h-4 text-slate-400 group-focus-within:text-[#094e8f] transition-colors" />
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="Ingresa tu usuario"
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        className="w-full pl-14 pr-4 py-3.5 sm:py-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094e8f]/50 focus:bg-white focus:ring-4 focus:ring-[#094e8f]/10 transition-all font-medium text-sm shadow-xs"
                      />
                    </div>
                  </motion.div>

                  {/* Password Field */}
                  <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-2 ml-1">
                      Contraseña
                    </label>
                    <div className="relative group">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-slate-100 group-focus-within:bg-blue-50 flex items-center justify-center transition-colors">
                        <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-[#094e8f] transition-colors" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        placeholder="Ingresa tu contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full pl-14 pr-12 py-3.5 sm:py-4 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/90 rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#094e8f]/50 focus:bg-white focus:ring-4 focus:ring-[#094e8f]/10 transition-all font-medium text-sm shadow-xs"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#094e8f] hover:bg-slate-100 transition-colors p-2 rounded-xl cursor-pointer"
                        title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </motion.div>

                  {/* Error Notification */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        className="bg-red-50/90 border border-red-200 text-red-600 text-xs font-semibold rounded-2xl px-4 py-3 flex items-center gap-2.5"
                      >
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="pt-2"
                  >
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full relative group overflow-hidden bg-gradient-to-r from-[#094e8f] to-[#0d5ca8] hover:from-[#08427a] hover:to-[#094e8f] text-white font-bold py-4 rounded-2xl shadow-[0_12px_24px_-8px_rgba(9,78,143,0.35)] hover:shadow-[0_16px_32px_-8px_rgba(9,78,143,0.45)] transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer text-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                      <AnimatePresence mode="wait">
                        {isLoading ? (
                          <motion.div
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2.5"
                          >
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="uppercase tracking-wider text-xs">Ingresando...</span>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="idle"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex items-center justify-center gap-2.5"
                          >
                            <span className="tracking-wide">Ingresar al Sistema</span>
                            <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                </form>
              </div>

              {/* Support WhatsApp Link */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-8 pt-5 border-t border-slate-100 flex flex-col items-center gap-3.5"
              >
                <a
                  href="https://wa.me/59179163612?text=Hola,%20necesito%20ayuda%20con%20mi%20cuenta%20en%20el%20Sistema%20UICYT"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-slate-500 hover:text-[#094e8f] hover:bg-slate-50 transition-all font-medium text-xs group cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-[#094e8f] transition-colors" />
                  <span>¿Necesitas ayuda con tu acceso?</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-[#094e8f] group-hover:translate-x-0.5 transition-all" />
                </a>

                <div className="flex md:hidden items-center gap-2 px-3 py-1 bg-slate-100/70 border border-slate-200/60 rounded-full">
                  <Sparkles className="w-3 h-3 text-[#f0d114]" />
                  <span className="text-[10px] text-slate-700 font-bold">
                    UICYT · Gestión 2026
                  </span>
                </div>
              </motion.div>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-[11px] text-slate-400 font-medium tracking-wide"
        >
          © 2026 Carrera de Ingeniería de Sistemas · Escuela Militar de Ingeniería
        </motion.p>
      </motion.div>
    </div>
  );
}