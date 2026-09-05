'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Rocket,
  Zap,
  FileSpreadsheet,
  Users,
  ArrowRight,
  X,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const STORAGE_KEY = 'uicyt_version_2_modal_seen';

export default function VersionWelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const alreadySeen = localStorage.getItem(STORAGE_KEY);
    if (!alreadySeen) {
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsOpen(false);
  };

  const highlights = [
    {
      icon: Rocket,
      title: 'Nueva Interfaz Intuitiva 2.0',
      desc: 'Diseño institucional limpio, mayor legibilidad y navegación optimizada.',
      iconBg: 'bg-blue-50 text-[#094e8f]',
    },
    {
      icon: Zap,
      title: 'Cómputo & Podio en Vivo',
      desc: 'Monitoreo en tiempo real de notas y premiación de ganadores instantánea.',
      iconBg: 'bg-amber-50 text-amber-600',
    },
    {
      icon: FileSpreadsheet,
      title: 'Reportes Oficiales Excel y PDF',
      desc: 'Descarga de listas, asistencias y jurados con encabezados formales.',
      iconBg: 'bg-emerald-50 text-emerald-600',
    },
    {
      icon: Users,
      title: 'Gestión Inteligente de Jurados',
      desc: 'Asignación ágil por docente y auditoría de calificaciones individual.',
      iconBg: 'bg-indigo-50 text-indigo-600',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-slate-900/65 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="relative w-full max-w-2xl sm:max-w-3xl lg:max-w-4xl bg-white rounded-3xl sm:rounded-[2.5rem] border border-slate-200/90 shadow-[0_28px_60px_-15px_rgba(9,78,143,0.25)] overflow-hidden z-10"
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute right-5 top-5 z-20 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white md:text-slate-400 md:bg-slate-100 md:hover:bg-slate-200 md:hover:text-slate-700 transition-all cursor-pointer"
              title="Cerrar modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Left Column: Hero Branding */}
              <div className="md:col-span-5 bg-gradient-to-br from-[#094e8f] via-[#0b5aa6] to-[#162748] p-8 sm:p-10 flex flex-col justify-between text-white relative overflow-hidden text-center md:text-left">
                {/* Decorative background blurs */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-36 h-36 bg-[#f0d114]/15 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <div className="relative z-10">
                  {/* Logos Header */}
                  <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
                    <div className="p-2 bg-white rounded-2xl shadow-sm">
                      <Image
                        src="/logo/Emi logo.png"
                        alt="Logo EMI"
                        width={44}
                        height={44}
                        className="w-10 h-10 object-contain"
                        priority
                      />
                    </div>
                    <div className="w-[1.5px] h-8 bg-white/20" />
                    <div className="p-2 bg-white rounded-2xl shadow-sm">
                      <Image
                        src="/logo/uicyt-logo.png"
                        alt="Logo UICYT"
                        width={44}
                        height={44}
                        className="w-10 h-10 object-contain rounded-xl"
                        priority
                      />
                    </div>
                  </div>

                  {/* Badge */}
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#f0d114] text-[11px] font-black uppercase tracking-widest mb-3 shadow-inner">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>VERSIÓN 2.0</span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                    ¡Bienvenido a <br />
                    <span className="text-[#f0d114]">UICYT 2.0!</span>
                  </h2>

                  <p className="text-xs text-blue-100/90 font-medium mt-2 leading-relaxed">
                    Sistema Oficial de Calificación y Evaluación de Proyectos · Gestión 2026
                  </p>
                </div>

                <div className="hidden md:block relative z-10 pt-6 border-t border-white/10">
                  <p className="text-[10px] text-blue-200/70 uppercase tracking-widest font-bold">
                    Escuela Militar de Ingeniería · Ingeniería de Sistemas
                  </p>
                </div>
              </div>

              {/* Right Column: Highlights & Action */}
              <div className="md:col-span-7 p-7 sm:p-9 md:p-10 flex flex-col justify-between">
                <div>
                  <div className="mb-5">
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">
                      Principales Novedades
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Explora las nuevas herramientas disponibles en tu panel de control:
                    </p>
                  </div>

                  {/* Grid of 4 features */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {highlights.map((h, i) => {
                      const Icon = h.icon;
                      return (
                        <div
                          key={i}
                          className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-100 hover:border-slate-200 transition-all flex flex-col justify-between"
                        >
                          <div className={`w-8 h-8 rounded-xl ${h.iconBg} flex items-center justify-center mb-2.5 font-bold shadow-2xs`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-slate-800 leading-snug">
                              {h.title}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-medium leading-normal mt-1">
                              {h.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer / Action Button */}
                <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full sm:flex-1 group flex items-center justify-center gap-2.5 py-4 px-6 bg-gradient-to-r from-[#094e8f] to-[#0d5ca8] hover:from-[#08427a] hover:to-[#094e8f] text-white font-black text-xs sm:text-sm uppercase tracking-wider rounded-2xl shadow-[0_12px_24px_-8px_rgba(9,78,143,0.4)] hover:shadow-[0_16px_32px_-8px_rgba(9,78,143,0.5)] transition-all active:scale-[0.99] cursor-pointer"
                  >
                    <span>Comenzar a Usar UICYT 2.0</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
