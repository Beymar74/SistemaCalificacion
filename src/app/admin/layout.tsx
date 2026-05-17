'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutList,
  GraduationCap,
  BarChart3,
  Trophy,
  Download,
  LogOut,
  LayoutDashboard,
  Users,
  MessageSquare,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
} from 'lucide-react';

import { useState } from 'react';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/proyectos', label: 'Proyectos', icon: LayoutList },
  { href: '/admin/docentes', label: 'Docentes / Jurados', icon: GraduationCap },
  { href: '/admin/gestion-proyectos', label: 'Gestión de Proyectos', icon: BarChart3 },
  { href: '/admin/asignaciones', label: 'Evaluaciones', icon: MessageSquare },
  { href: '/admin/resultados', label: 'Resultados', icon: Trophy },
  { href: '/admin/resultados-live', label: 'Resultados en Vivo', icon: Radio },
  { href: '/admin/reportes', label: 'Reportes', icon: Download },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 240 }}
        className="bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 bottom-0 z-50 overflow-hidden"
      >
        {/* Brand */}
        <div className="px-5 py-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <img 
              src="/logo/logocarrera.png" 
              alt="Logo Carrera" 
              className="w-8 h-8 object-contain flex-shrink-0"
            />
            {!isCollapsed && (
              <motion.span 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-lg font-black text-[#162748] tracking-tight whitespace-nowrap"
              >
                SCEITII
              </motion.span>
            )}
          </div>
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-[#162748] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            UA
          </div>
          {!isCollapsed && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-w-0"
            >
              <p className="text-sm font-semibold text-slate-800 truncate">Portal Admin</p>
              <p className="text-xs text-slate-500 truncate">Depto. de Ingeniería</p>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                title={isCollapsed ? label : ''}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors relative group ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="whitespace-nowrap"
                  >
                    {label}
                  </motion.span>
                )}
                {isCollapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#162748] text-white text-[10px] font-bold rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-1">
          <button
            onClick={() => router.push('/login')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors overflow-hidden ${isCollapsed ? 'justify-center' : ''}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? 80 : 240 }}
        className="flex-1 min-h-screen bg-white"
      >
        {children}
      </motion.main>
    </div>
  );
}
