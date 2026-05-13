'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, User, HelpCircle, LogIn, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    router.push('/admin/proyectos');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row relative overflow-hidden font-sans">
      {/* Background soft gradients */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-50 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[100px]" />
      </div>

      {/* Left Column: Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-[55%] relative flex-col justify-between p-20 z-10">
        <div>
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-16"
          >
            <img src="/logo/logocarrera.png" alt="Logo" className="w-14 h-14 object-contain" />
            <div className="h-8 w-px bg-slate-200" />
            <span className="text-lg font-black text-[#162748] tracking-widest uppercase">IE TechFair</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="max-w-xl"
          >
            <h2 className="text-6xl font-black text-[#162748] leading-[1.1] tracking-tight mb-8">
              Simplificando la <br />
              <span className="text-blue-600 font-black">Innovación.</span>
            </h2>
            <p className="text-slate-500 text-lg font-medium leading-relaxed mb-12">
              Gestione y califique el talento de la Carrera de Ingeniería Industrial con nuestra plataforma centralizada de evaluación.
            </p>

          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-slate-300 text-[10px] font-black tracking-widest uppercase"
        >
          © 2026 Carrera de Ingeniería Industrial
        </motion.div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 relative z-10 bg-slate-50/50 lg:bg-transparent">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100">
            <div className="p-10 md:p-14">
              {/* Logo Section (Only visible on mobile as it's already on the left on desktop) */}
              <div className="flex flex-col items-center text-center mb-12 lg:hidden">
                <img 
                  src="/logo/logocarrera.png" 
                  alt="Logo Carrera" 
                  className="w-20 h-20 object-contain mb-6"
                />
                <h1 className="text-2xl font-black text-[#162748] tracking-tight leading-tight">
                  Evaluación de Proyectos
                </h1>
                <div className="h-1 w-8 bg-blue-600 rounded-full mt-4" />
              </div>

              <div className="hidden lg:block mb-10">
                <h3 className="text-3xl font-black text-[#162748] tracking-tight mb-2 text-center">Ingresar</h3>
                <p className="text-slate-400 text-sm font-bold text-center">Portal Central de Acceso</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Usuario</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type="text"
                      required
                      placeholder="Ingrese su usuario"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full pl-12 pr-4 py-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-600/10 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all font-bold text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2.5 ml-1">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-blue-600 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-12 pr-12 py-4.5 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 placeholder-slate-300 focus:outline-none focus:border-blue-600/10 focus:bg-white focus:ring-4 focus:ring-blue-600/5 transition-all font-bold text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-blue-600 transition-colors p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-3 bg-[#162748] hover:bg-blue-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-900/10 hover:shadow-blue-600/20 transition-all active:scale-[0.98] disabled:opacity-70 group"
                  >
                    <AnimatePresence mode="wait">
                      {isLoading ? (
                        <motion.div
                          key="loading"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3"
                        >
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="uppercase tracking-widest text-xs font-black">Accediendo...</span>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="idle"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-3"
                        >
                          <span className="uppercase tracking-widest text-xs font-black">Ingresar al Sistema</span>
                          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </div>
              </form>

              <div className="mt-12 pt-10 border-t border-slate-50 text-center">
                <button className="inline-flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-all font-black text-[10px] uppercase tracking-widest group">
                  <HelpCircle className="w-4 h-4" />
                  <span>Soporte Técnico</span>
                  <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 text-center lg:hidden">
            <p className="text-[10px] text-slate-400 font-black tracking-[0.4em] uppercase">
              Carrera de Ingeniería Industrial
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
