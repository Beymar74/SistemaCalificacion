'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutList, GraduationCap, BarChart3, Trophy, Download, LogOut } from 'lucide-react';

const navItems = [
  { href: '/admin/proyectos', label: 'Proyectos', icon: LayoutList },
  { href: '/admin/docentes', label: 'Docentes', icon: GraduationCap },
  { href: '/admin/gestion-proyectos', label: 'Gestión de Proyectos', icon: BarChart3 },
  { href: '/admin/resultados', label: 'Resultados', icon: Trophy },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

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
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#e8eef5] text-[#162748]'
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
          <button className="w-full flex items-center justify-center gap-2 bg-[#162748] hover:bg-[#1e3460] text-white text-sm font-medium py-2.5 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Exportar Reportes
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
