'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, HelpCircle, LogIn, ChevronRight, Sparkles } from 'lucide-react';
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
        .select('email, rol')
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
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4 relative overflow-hidden selection:bg-blue-500/30">
      {/* Background Elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-blue-100/60 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-slate-200/60 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-indigo-100/40 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-[480px] relative z-10"
      >
        {/* Card */}
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.12)] overflow-hidden">
          <div className="p-8 md:p-12">
            {/* Logo & Header */}
            <div className="flex flex-col items-center mb-10">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="relative mb-6"
              >
                <div className="absolute inset-0 bg-blue-900/10 blur-2xl opacity-30 rounded-full" />
                <Image
                  src="/logo/logocarrera.png"
                  alt="Logo Carrera"
                  width={80}
                  height={80}
                  className="object-contain relative z-10 drop-shadow-md"
                />
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-center"
              >
                <h1 className="text-3xl font-black text-[#1e3a5f] tracking-tight leading-tight mb-2">
                  Portal Académico
                </h1>
                <div className="flex items-center justify-center gap-2">
                  <span className="h-px w-8 bg-[#1e3a5f]/30" />
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
                    Ingeniería Industrial
                  </p>
                  <span className="h-px w-8 bg-[#1e3a5f]/30" />
                </div>
              </motion.div>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">
                  Usuario
                </label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1e3a5f] transition-colors" />
                  <input
                    type="text"
                    required
                    placeholder="Tu nombre de usuario"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[#1e3a5f] placeholder-slate-300 focus:outline-none focus:border-[#1e3a5f]/40 focus:bg-white focus:ring-4 focus:ring-[#1e3a5f]/10 transition-all font-medium text-sm"
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">
                  Contraseña
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#1e3a5f] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-[#1e3a5f] placeholder-slate-300 focus:outline-none focus:border-[#1e3a5f]/40 focus:bg-white focus:ring-4 focus:ring-[#1e3a5f]/10 transition-all font-medium text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#1e3a5f] transition-colors p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </motion.div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-red-50 border border-red-200 text-red-500 text-[11px] font-bold rounded-xl px-4 py-3 text-center flex items-center justify-center gap-2"
                  >
                    <div className="w-1 h-1 bg-red-400 rounded-full animate-ping" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="pt-2"
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full relative group overflow-hidden bg-[#1e3a5f] hover:bg-[#16304f] text-white font-black py-4.5 rounded-2xl shadow-[0_12px_24px_-8px_rgba(30,58,95,0.35)] hover:shadow-[0_16px_32px_-8px_rgba(30,58,95,0.45)] transition-all active:scale-[0.98] disabled:opacity-70"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />

                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-3"
                      >
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span className="uppercase tracking-[0.2em] text-[10px]">Verificando...</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center justify-center gap-3"
                      >
                        <span className="uppercase tracking-[0.2em] text-[10px]">Iniciar Sesión</span>
                        <LogIn className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              </motion.div>
            </form>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-4"
            >
              <button className="flex items-center gap-2 text-slate-400 hover:text-[#1e3a5f] transition-all font-bold text-[10px] uppercase tracking-widest group">
                <HelpCircle className="w-4 h-4" />
                <span>¿Necesitas ayuda con tu cuenta?</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-full">
                <Sparkles className="w-3 h-3 text-[#1e3a5f]" />
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">
                  Sistema de Evaluación v2.0
                </span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Footer info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.4em]"
        >
          © 2026 Carrera de Ingeniería Industrial
        </motion.p>
      </motion.div>
    </div>
  );
}