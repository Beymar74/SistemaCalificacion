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
  Settings,
  LayoutDashboard,
  Users
} from 'lucide-react';

import { exportToExcel } from '@/lib/export';
import { fetchResultadosTop } from '@/lib/db';
import { useState } from 'react';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/proyectos', label: 'Proyectos', icon: LayoutList },
  { href: '/admin/docentes', label: 'Docentes', icon: GraduationCap },
  { href: '/admin/gestion-proyectos', label: 'Gestión de Proyectos', icon: BarChart3 },
  { href: '/admin/asignaciones', label: 'Revisión de Jurados', icon: Users },
  { href: '/admin/resultados', label: 'Resultados', icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const data = await fetchResultadosTop(100);
      const exportData = data.map(r => ({
        Posición: r.posicion,
        Proyecto: r.nombre,
        'Puntaje Final': r.puntajeFinal,
        Evaluaciones: r.evaluaciones,
        ...Object.fromEntries((r.criterios || []).map(c => [c.nombre, c.puntaje]))
      }));
      
      await exportToExcel(exportData, `Reporte_Resultados_${new Date().toISOString().split('T')[0]}`);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <aside className="w-60 min-h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0 bottom-0 z-10">
        {/* Brand */}
        <div className="px-5 py-6 border-b border-slate-100 flex items-center gap-3">
          <img 
            src="/logo/logocarrera.png" 
            alt="Logo Carrera" 
            className="w-10 h-10 object-contain"
          />
          <span className="text-lg font-black text-[#162748] tracking-tight">IE TechFair</span>
        </div>

        {/* User info */}
        <div className="px-5 py-4 flex items-center gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-full bg-[#162748] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            UA
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">Portal Admin</p>
            <p className="text-xs text-slate-500 truncate">Depto. de Ingeniería</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-4 border-t border-slate-100 pt-3 space-y-1">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 bg-[#162748] hover:bg-blue-600 text-white text-sm font-medium py-2.5 rounded-lg transition-all active:scale-95 disabled:opacity-50"
          >
            {isExporting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar Reportes'}
          </button>
          <button
            onClick={() => router.push('/login')}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-slate-600 hover:bg-slate-100 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 ml-60 min-h-screen">{children}</main>
    </div>
  );
}
