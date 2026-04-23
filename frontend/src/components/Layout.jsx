import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useVisual } from '../context/VisualContext'
import { useState } from 'react'

/* ── Inline SVG icons ─────────────────────────────────────────────── */
const Icons = {
  Dashboard: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Monitor: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Ticket: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
    </svg>
  ),
  FileText: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Users: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  LogOut: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Wrench: () => (
    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
    </svg>
  ),
  Menu: () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Sparkles: () => (
    <svg className="w-[15px] h-[15px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6z"/><path d="M5 3v4M19 17v4M3 5h4M17 19h4"/>
    </svg>
  ),
  Warning: () => (
    <svg className="w-5 h-5 flex-shrink-0 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
}

const navItems = [
  { to: '/dashboard', label: 'Dashboard',      Icon: Icons.Dashboard },
  { to: '/equipos',   label: 'Equipos',         Icon: Icons.Monitor },
  { to: '/reportar',  label: 'Reportar Falla',  Icon: Icons.AlertTriangle },
  { to: '/tickets',   label: 'Tickets',         Icon: Icons.Ticket },
]

const adminItems = [
  { to: '/formatos',  label: 'Formatos',        Icon: Icons.FileText },
  { to: '/usuarios',  label: 'Usuarios',        Icon: Icons.Users },
]

export default function Layout() {
  const { user, logout }        = useAuth()
  const { isVisual, setIsVisual } = useVisual()
  const navigate                = useNavigate()

  /* Mobile sidebar toggle */
  const [sidebarOpen, setSidebarOpen] = useState(false)
  /* Desktop hover-expand */
  const [expanded, setExpanded]       = useState(false)
  /* Visual mode warning modal */
  const [showWarn, setShowWarn]       = useState(false)

  const handleLogout = async () => { await logout(); navigate('/login') }

  const handleToggleVisual = () => {
    if (!isVisual) setShowWarn(true)
    else setIsVisual(false)
  }
  const confirmVisual = () => { setIsVisual(true); setShowWarn(false) }

  /* Desktop: expand on hover */
  const onSideEnter = () => { if (window.innerWidth >= 768) setExpanded(true)  }
  const onSideLeave = () => { if (window.innerWidth >= 768) setExpanded(false) }

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 text-sm font-medium cursor-pointer whitespace-nowrap ${
      isActive
        ? 'bg-primary-600 text-white shadow-sm'
        : 'text-slate-400 hover:text-white hover:bg-white/10'
    }`

  /* on mobile sidebar uses full w-60; on desktop it's w-14 (rail) expanding to w-60 */
  const sideW = expanded ? 'w-60' : 'w-60 md:w-14'

  return (
    <div className="flex h-screen bg-transparent relative">

      {/* ── Sidebar ───────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col overflow-hidden
          bg-slate-900/95 backdrop-blur-md border-r border-white/10
          transition-[width,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${sidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
          ${sideW}
          ${expanded ? 'shadow-2xl' : ''}
        `}
        onMouseEnter={onSideEnter}
        onMouseLeave={onSideLeave}
      >
        {/* Brand */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-white/10 whitespace-nowrap overflow-hidden min-h-[60px]">
          <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white flex-shrink-0">
            <Icons.Wrench />
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-white font-bold text-xs leading-tight tracking-wider uppercase">MANTENIMIENTO</p>
            <p className="text-slate-500 text-[11px] truncate">TecNM · Laboratorios</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={linkClass}
              title={!expanded ? label : undefined}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon />
              <span className="overflow-hidden">{label}</span>
            </NavLink>
          ))}

          {user?.rol === 'admin' && (
            <>
              <div className="pt-4 pb-1 px-3 overflow-hidden whitespace-nowrap">
                <p className="text-slate-600 text-[10px] font-bold uppercase tracking-widest">Administración</p>
              </div>
              {adminItems.map(({ to, label, Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={linkClass}
                  title={!expanded ? label : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon />
                  <span className="overflow-hidden">{label}</span>
                </NavLink>
              ))}
            </>
          )}
        </nav>

        {/* Visual mode toggle */}
        <div className="px-2 py-2 border-t border-white/10 overflow-hidden whitespace-nowrap">
          <button
            onClick={handleToggleVisual}
            title={!expanded ? (isVisual ? 'Modo Visual activo' : 'Modo Lite activo') : undefined}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-150 cursor-pointer"
          >
            <span className={isVisual ? 'text-primary-400' : 'text-slate-500'}>
              <Icons.Sparkles />
            </span>
            <span className="flex-1 text-left overflow-hidden">
              <span className="text-xs text-slate-400 font-medium">
                {isVisual ? 'Modo Visual' : 'Modo Lite'}
              </span>
            </span>
            {/* Toggle pill */}
            <div
              className={`relative w-9 h-5 rounded-full transition-colors duration-300 flex-shrink-0 ${
                isVisual ? 'bg-primary-500' : 'bg-slate-700'
              }`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${
                isVisual ? 'translate-x-4' : 'translate-x-0.5'
              }`} />
            </div>
          </button>
        </div>

        {/* User footer */}
        <div className="px-2 py-2 border-t border-white/10 overflow-hidden whitespace-nowrap">
          <div className="flex items-center gap-2.5 px-2 py-1.5 mb-0.5 rounded-lg overflow-hidden">
            {user?.foto ? (
              <img src={user.foto} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {user?.nombre?.[0]?.toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-white text-xs font-semibold truncate">{user?.nombre}</p>
              <p className="text-slate-500 text-[11px] capitalize">
                {user?.rol === 'admin' ? 'Administrador' : 'Usuario'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title={!expanded ? 'Cerrar sesión' : undefined}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors duration-150 text-xs font-medium cursor-pointer"
          >
            <Icons.LogOut />
            <span className="overflow-hidden">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Main content ─────────────────────────────── */}
      {/* md:ml-14 keeps space for the icon-rail (w-14 = 56px) */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 md:ml-14">
        {/* Mobile top bar */}
        <header className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Abrir menú"
          >
            <Icons.Menu />
          </button>
          <span className="font-bold text-white text-xs tracking-wider uppercase">MANTENIMIENTO</span>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>

      {/* ── Visual mode warning modal ─────────────────── */}
      {showWarn && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowWarn(false)}
        >
          <div
            className="bg-slate-900 border border-white/15 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Icons.Warning />
              <h3 className="text-white font-bold text-base">Activar Modo Visual</h3>
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-5">
              Este modo activa efectos visuales avanzados: partículas animadas, transparencias,
              resplandor de cursor y paralaje. <strong className="text-amber-300">En equipos con pocos
              recursos puede provocar lentitud o disminución del rendimiento.</strong> Se recomiendan
              al menos 4 GB de RAM.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowWarn(false)}
                className="flex-1 btn-secondary justify-center"
              >
                Cancelar
              </button>
              <button
                onClick={confirmVisual}
                className="flex-1 btn-primary justify-center"
              >
                Activar de todas formas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
