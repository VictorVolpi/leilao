import { useState, useEffect, ReactNode } from 'react';
import {
  Bell,
  ChevronDown,
  Menu,
  Moon,
  Sun,
  X,
  Store,
  Radio,
  Wallet,
  Trophy,
  ShieldCheck,
  LayoutDashboard,
  User,
} from '@/components/Icons';
import type { DemoUser } from '../types';

export type View = 'vitrine' | 'sala' | 'carteira' | 'arremates' | 'auditoria' | 'painel';

const navItems: { id: View; label: string; short: string; icon: any }[] = [
  { id: 'vitrine', label: 'Vitrine', short: '01', icon: Store },
  { id: 'sala', label: 'Sala ao vivo', short: '02', icon: Radio },
  { id: 'carteira', label: 'Carteira', short: '03', icon: Wallet },
  { id: 'arremates', label: 'Meus arremates', short: '04', icon: Trophy },
  { id: 'auditoria', label: 'Auditoria pública', short: '05', icon: ShieldCheck },
  { id: 'painel', label: 'Painel do leiloeiro', short: '06', icon: LayoutDashboard },
];

interface ShellProps {
  view: View;
  setView: (view: View) => void;
  user: DemoUser;
  setUser: (user: DemoUser) => void;
  children: ReactNode;
}

export function Shell({ view, setView, user, setUser, children }: ShellProps) {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('aurora_theme') === 'dark';
  });

  // Alterna a classe 'dark' no elemento <html> e guarda no localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('aurora_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('aurora_theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 antialiased transition-colors duration-200">
      {/* Overlay Mobile */}
      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Lateral Premium */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between border-r border-slate-800/60 bg-[#0a0f1d] px-5 py-6 text-white backdrop-blur-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          open ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Topo / Logo Header */}
        <div>
          <div className="flex items-center justify-between px-2">
            <button
              onClick={() => {
                setView('vitrine');
                setOpen(false);
              }}
              className="group flex items-center gap-3.5 text-left transition-all"
            >
              <div className="relative">
                <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-slate-900 shadow-lg shadow-blue-500/20 ring-1 ring-slate-800 transition-transform group-hover:scale-105">
                  <img
                    src="/logo.png"
                    alt="Aurora Logo"
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#0a0f1d] bg-emerald-500" />
              </div>
              <div>
                <strong className="block text-base font-black tracking-wider text-white group-hover:text-blue-400 transition-colors">
                  VOLPI HOUSE
                </strong>
                <small className="text-[9px] font-bold uppercase tracking-[0.28em] text-slate-400">
                  CASA DO LEILÃO ONLINE
                </small>
              </div>
            </button>

            <button
              onClick={() => setOpen(false)}
              className="rounded-xl p-2 text-slate-400 hover:bg-slate-800/80 hover:text-white lg:hidden"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navegação Principal */}
          <div className="mt-9">
            <p className="mb-3 px-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-400">
              Menu Principal
            </p>
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive = view === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setView(item.id);
                      setOpen(false);
                    }}
                    className={`group relative flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-xs font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600/90 text-white shadow-lg shadow-blue-600/25 backdrop-blur-md'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <IconComponent
                        size={17}
                        className={`transition-colors ${
                          isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    <span
                      className={`font-mono text-[10px] tracking-tight transition-colors ${
                        isActive ? 'text-blue-100 font-bold' : 'text-slate-500 group-hover:text-slate-400'
                      }`}
                    >
                      {item.short}
                    </span>

                    {isActive && (
                      <span className="absolute -left-5 top-2 bottom-2 w-1 rounded-r-full bg-blue-500" />
                    )}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Rodapé da Sidebar */}
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3.5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2 text-[11px] font-bold text-slate-200">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Servidor Ao Vivo
              </span>
              <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold text-emerald-400">
                100ms
              </span>
            </div>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              Lances e carteira sincronizados em tempo real via Supabase.
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-900/40 p-2.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
                <User size={15} />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-slate-200">{user}</p>
                <p className="text-[10px] font-semibold text-slate-400">Sessão Ativa</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Conteúdo Principal */}
      <div className="lg:pl-72">
        {/* Header Superior */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-900/90 px-5 backdrop-blur-md sm:px-8 transition-colors duration-200">
          <button
            onClick={() => setOpen(true)}
            className="rounded-xl border border-slate-200 p-2.5 text-slate-600 dark:border-slate-700 dark:text-slate-300 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden"
          >
            <Menu size={20} />
          </button>

          <div className="hidden text-xs font-semibold text-slate-500 dark:text-slate-400 lg:block">
            Leilões especiais <span className="mx-2 text-slate-300 dark:text-slate-700">/</span> Verzel Elite Dev
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* Botão de Alternar Tema (Dark / Light Mode) */}
            <button
              onClick={() => setDarkMode((prev) => !prev)}
              className="rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-400 transition-colors hover:border-slate-300 dark:hover:border-slate-600"
              title={darkMode ? 'Mudar para Tema Claro' : 'Mudar para Tema Escuro'}
            >
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <button className="relative rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 transition-colors hover:border-slate-300 dark:hover:border-slate-600">
              <Bell size={17} />
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-rose-500" />
            </button>

            {/* Alternador de Usuários da Demonstração */}
            <div className="relative">
              <select
                value={user}
                onChange={(event) => setUser(event.target.value as DemoUser)}
                className="appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-3.5 pr-9 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 outline-none transition-colors hover:border-slate-300 dark:hover:border-slate-600 focus:border-blue-500"
              >
                <option value="Leiloeiro">Leiloeiro</option>
                <option value="Licitante 1">Licitante 1 (Cliente)</option>
                <option value="Licitante 2">Licitante 2 (Cliente)</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-3.5 text-slate-400" size={14} />
            </div>

            <div className="hidden h-9 w-9 place-items-center rounded-xl bg-blue-600 text-xs font-extrabold text-white shadow-md shadow-blue-500/20 sm:grid">
              {user === 'Leiloeiro' ? 'L' : user.slice(-1)}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1480px] px-5 py-8 sm:px-8 lg:px-10">{children}</main>
      </div>
    </div>
  );
}

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div>
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-blue-600 dark:text-blue-400">{eyebrow}</p>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-xs font-medium leading-relaxed text-slate-500 dark:text-slate-400">{description}</p>
      </div>
      {action}
    </div>
  );
}