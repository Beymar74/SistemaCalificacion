'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ClipboardList,
  CheckCircle2,
  LayoutGrid,
  Clock,
  LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../../lib/supabase';
import { fetchAsignacionesDocente } from '@/lib/db';
import type { ProyectoAsignado } from '@/lib/data';
import { useRouter } from 'next/navigation';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface Persona {
  nombre_completo: string;
  grado: string;
}

export default function DocenteHome() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [proyectos, setProyectos] = useState<ProyectoAsignado[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const cargarDatos = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: personaData } = await supabase
        .from('personas')
        .select('nombre_completo, grado')
        .eq('id_usuario', user.id)
        .single();

      setPersona(personaData);

      const data = await fetchAsignacionesDocente(user.id);
      setProyectos(data);
      setLoading(false);
    };

    cargarDatos();
  }, []);

  const handleCerrarSesion = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const calificados = proyectos.filter(p => p.estado === 'Calificado').length;
  const pendientes = proyectos.filter(p => p.estado === 'Pendiente').length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-100/40 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-100/40 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src="/logo/logocarrera.png" alt="Logo Carrera" className="w-10 h-10 object-contain" />
            <span className="text-lg font-black text-[#162748] tracking-tight">SCEITI</span>
          </motion.div>

          <button
            onClick={handleCerrarSesion}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-xl border border-red-200 transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-6 py-8 max-w-4xl mx-auto">
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-end justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-[#162748] tracking-tight">
                Hola, <span className="text-blue-600">
                  {persona?.grado} {persona?.nombre_completo}
                </span>
              </h1>
              <p className="text-slate-500 mt-2 font-medium">
                Tienes <span className="text-slate-900 font-bold">{pendientes} evaluaciones pendientes</span>.
              </p>
            </div>

            <div className="flex gap-3">
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-slate-600">{calificados} Calificados</span>
              </div>
              <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-slate-600">{pendientes} Pendientes</span>
              </div>
            </div>
          </motion.div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            className="col-span-full mb-2 flex items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              Proyectos Asignados
            </h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 gap-6 col-span-full"
          >
            {proyectos.map(p => (
              <motion.div
                key={p.id}
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                className="group bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col h-full transition-all"
              >
                <div className={`h-2 w-full ${p.estado === 'Calificado' ? 'bg-emerald-500' : 'bg-blue-600'}`} />

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`px-4 py-2 text-base font-black rounded-xl uppercase tracking-wider ${p.estado === 'Calificado'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-[#162748] text-white'
                      }`}>
                      {p.stand}
                    </span>
                    {p.estado === 'Calificado' ? (
                      <span className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-emerald-100">
                        <CheckCircle2 className="w-3 h-3" />
                        Completado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-blue-600 bg-blue-50 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border border-blue-100">
                        <Clock className="w-3 h-3" />
                        Pendiente
                      </span>
                    )}
                  </div>

                  {p.categoria && (
                    <p className="text-[11px] font-bold text-blue-500 uppercase tracking-widest mb-1">
                      {p.categoria}
                    </p>
                  )}

                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-4 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {p.nombre}
                  </h3>

                  <div className="mt-auto pt-6 border-t border-slate-50">
                    {p.estado === 'Calificado' ? (
                      <button
                        disabled
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-50 text-slate-400 rounded-2xl text-xs font-bold transition-all border border-slate-100"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        RESULTADO ENVIADO
                      </button>
                    ) : (
                      <Link
                        href={`/docente/evaluar/${p.id}`}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#162748] text-white rounded-2xl text-xs font-bold transition-all hover:bg-[#1e3460] hover:shadow-xl hover:shadow-blue-900/20 active:scale-[0.98]"
                      >
                        <ClipboardList className="w-4 h-4" />
                        INICIAR EVALUACIÓN
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>

      <footer className="mt-auto px-6 py-10 text-center opacity-40">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Feria de Innovación Tecnológica · 2026
        </p>
      </footer>
    </div>
  );
}