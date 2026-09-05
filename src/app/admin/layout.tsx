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
  MessageSquare,
  Radio,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import VersionWelcomeModal from '@/components/VersionWelcomeModal';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  isLive?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'GENERAL',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/admin/proyectos', label: 'Proyectos', icon: LayoutList },
      { href: '/admin/docentes', label: 'Docentes / Jurados', icon: GraduationCap },
    ]
  },
  {
    title: 'EVALUACIONES',
    items: [
      { href: '/admin/gestion-proyectos', label: 'Gestión de Proyectos', icon: BarChart3 },
      { href: '/admin/asignaciones', label: 'Evaluaciones', icon: MessageSquare },
    ]
  },
  {
    title: 'RESULTADOS & AUDITORÍA',
    items: [
      { href: '/admin/resultados', label: 'Resultados & Podio', icon: Trophy },
      { href: '/admin/resultados-live', label: 'Resultados en Vivo', icon: Radio, isLive: true },
      { href: '/admin/reportes', label: 'Centro de Reportes', icon: Download },
    ]
  }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-white font-sans antialiased selection:bg-[#094e8f] selection:text-white">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 82 : 270 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="bg-white border-r border-slate-200/80 flex flex-col fixed left-0 top-0 bottom-0 z-50 overflow-hidden select-none shadow-[2px_0_12px_rgba(0,0,0,0.03)]"
      >
        {/* Header / Logos */}
        <div className="px-5 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <img 
                src="/logo/Emi logo.png" 
                alt="Logo EMI" 
                className="w-7 h-7 object-contain flex-shrink-0"
              />
              <img 
                src="/logo/uicyt-logo.png" 
                alt="Logo UICYT" 
                className="w-8 h-8 rounded-lg object-contain flex-shrink-0"
              />
            </div>
            {!isCollapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col min-w-0"
              >
                <div className="flex items-center gap-1">
                  <span className="text-base font-black text-[#094e8f] tracking-tight leading-none">
                    UICYT
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#f0d114]" />
                </div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tight truncate mt-0.5">
                  Gestión 2026
                </span>
              </motion.div>
            )}
          </div>
          
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expandir menú lateral' : 'Colapsar menú lateral'}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-[#094e8f] transition-all active:scale-95"
          >
            {isCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* Role Indicator */}
        {!isCollapsed ? (
          <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rol</span>
            <span className="px-3 py-1 rounded-full text-[11px] font-black bg-[#094e8f] text-white shadow-sm tracking-wide uppercase">
              Administrador
            </span>
          </div>
        ) : (
          <div className="py-2.5 border-b border-slate-100 text-center">
            <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-blue-50 text-[#094e8f] border border-blue-100 uppercase">
              ADM
            </span>
          </div>
        )}

        {/* Nav list */}
        <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto overflow-x-hidden custom-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {!isCollapsed && section.title && (
                <p className="px-3 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1.5">
                  {section.title}
                </p>
              )}

              {section.items.map(({ href, label, icon: Icon, isLive }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    title={isCollapsed ? label : ''}
                    className={`group relative flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-[#094e8f] text-white shadow-md shadow-blue-900/25'
                        : 'text-slate-600 hover:bg-blue-50/60 hover:text-[#094e8f]'
                    }`}
                  >
                    {/* Active Accent Bar on Left (only when active and collapsed) */}
                    {isActive && isCollapsed && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#f0d114] rounded-r-full" />
                    )}

                    <div className="flex items-center justify-center flex-shrink-0">
                      <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                        isActive ? 'text-[#f0d114]' : 'text-slate-500 group-hover:text-[#094e8f]'
                      }`} />
                    </div>

                    {!isCollapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="whitespace-nowrap flex-1"
                      >
                        {label}
                      </motion.span>
                    )}

                    {/* Live Badge */}
                    {!isCollapsed && isLive && (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-black bg-rose-500 text-white tracking-widest uppercase animate-pulse">
                        LIVE
                      </span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#094e8f] text-white text-[11px] font-black rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-150 whitespace-nowrap z-50 shadow-xl border border-blue-400/30 flex items-center gap-1.5">
                        <span>{label}</span>
                        {isLive && (
                          <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        )}
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-slate-100 bg-white">
          <button
            onClick={() => router.push('/login')}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-2xl text-xs font-black transition-all overflow-hidden active:scale-95 ${
              isCollapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-slate-400 group-hover:text-rose-600" />
            {!isCollapsed && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <motion.main 
        initial={false}
        animate={{ marginLeft: isCollapsed ? 82 : 270 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex-1 min-h-screen bg-slate-50/50"
      >
        {children}
      </motion.main>

      {/* Modal de Bienvenida Versión 2.0 (Una sola vez) */}
      <VersionWelcomeModal />
    </div>
  );
}

