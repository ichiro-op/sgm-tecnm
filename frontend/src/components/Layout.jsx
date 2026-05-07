import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useVisual } from '../context/VisualContext'
import { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { notificaciones as notiApi } from '../utils/api'

/* ── Inyectar CSS de transición una sola vez ────────────────────── */
if (typeof document !== 'undefined' && !document.getElementById('page-transition-css')) {
  const _s = document.createElement('style')
  _s.id = 'page-transition-css'
  _s.textContent = `
    @keyframes page-fade-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    .page-enter {
      animation: page-fade-in 0.25s ease-out both;
    }
  `
  document.head.appendChild(_s)
}

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
  Bell: () => (
    <svg className="w-[18px] h-[18px] flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  Check: () => (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
}

const AUTO_CLOSE_MS = 8000

/* ── Color accent per notification type ─────────────────────── */
const TIPO_META = {
  nuevo_ticket:     { border: 'border-orange-400',  dot: 'bg-orange-400',  dotDark: 'bg-orange-400'  },
  ticket_creado:    { border: 'border-blue-400',    dot: 'bg-blue-400',    dotDark: 'bg-blue-400'    },
  ticket_en_proceso:{ border: 'border-amber-400',   dot: 'bg-amber-400',   dotDark: 'bg-amber-400'   },
  ticket_resuelto:  { border: 'border-emerald-400', dot: 'bg-emerald-500', dotDark: 'bg-emerald-400' },
  solicitud_formato:{ border: 'border-violet-400',  dot: 'bg-violet-500',  dotDark: 'bg-violet-400'  },
}
const defaultMeta = { border: 'border-gray-300', dot: 'bg-gray-400', dotDark: 'bg-gray-500' }

/* ── Shared notification item renderer ──────────────────────── */
function NotifItem({ n, onMark, fmtFecha, isVisual }) {
  const accent  = isVisual ? 'text-primary-300' : 'text-primary-600'
  const success = isVisual ? 'text-emerald-400' : 'text-emerald-600'
  const meta    = TIPO_META[n.tipo] ?? defaultMeta

  const content = n.tipo === 'nuevo_ticket'
    ? <>
        <span className="font-semibold">{n.usuarioNombre}</span>{' '}reportó una falla:{' '}
        <span className={accent}>{n.tipo_falla}</span>
      </>
    : n.tipo === 'ticket_creado'
    ? <>
        Tu falla en{' '}
        <span className={accent}>{n.equipoNombre}</span>{' '}fue{' '}
        <span className="font-semibold text-blue-400">registrada</span>
      </>
    : n.tipo === 'ticket_en_proceso'
    ? <>
        Tu ticket de{' '}
        <span className={accent}>{n.equipoNombre}</span>{' '}está{' '}
        <span className="font-semibold text-amber-400">en proceso</span>
      </>
    : n.tipo === 'ticket_resuelto'
    ? <>
        Tu ticket de{' '}
        <span className={accent}>{n.equipoNombre}</span>{' '}fue{' '}
        <span className={`font-semibold ${success}`}>resuelto</span>
      </>
    : /* solicitud_formato (default) */ <>
        <span className="font-semibold">{n.usuarioNombre}</span>{' '}solicitó{' '}
        <span className={accent}>{n.formatoNombre}</span>
      </>

  const sub = n.tipo === 'nuevo_ticket'
    ? `${n.equipoNombre} · ${n.laboratorio}`
    : n.equipoNombre ?? n.laboratorio ?? ''

  return (
    <div
      className={`pl-0 pr-3 py-2 transition-colors flex items-stretch
        ${isVisual
          ? `border-b border-white/5 hover:bg-white/5 ${!n.visto ? 'bg-primary-900/20 cursor-pointer' : ''}`
          : `border-b border-gray-100 hover:bg-gray-50 ${!n.visto ? 'bg-primary-50 cursor-pointer' : ''}`
        }`}
      onClick={() => !n.visto && onMark(n.id)}
    >
      {/* colored left border */}
      <span className={`w-[3px] rounded-full flex-shrink-0 mr-2.5 self-stretch ${meta.border.replace('border-', 'bg-')}`} />
      <div className="flex items-start gap-2 flex-1 min-w-0">
        {!n.visto
          ? <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1 ${isVisual ? meta.dotDark : meta.dot}`} />
          : <span className="w-1.5 h-1.5 flex-shrink-0 mt-1" />}
        <div className="min-w-0">
          <p className={`text-xs leading-snug ${isVisual ? 'text-white' : 'text-gray-900'}`}>{content}</p>
          <p className={`text-[11px] truncate ${isVisual ? 'text-slate-400' : 'text-gray-500'}`}>{sub}</p>
          <p className={`text-[10px] ${isVisual ? 'text-slate-400' : 'text-gray-400'}`}>{fmtFecha(n.fecha)}</p>
        </div>
      </div>
    </div>
  )
}

/* ── "Ver todas" modal ───────────────────────────────────────── */
function NotifAllModal({ items, onMark, onMarcarTodas, noLeidas, fmtFecha, onClose }) {
  const [closing, setClosing] = useState(false)
  const { isVisual } = useVisual()

  const close = () => { setClosing(true); setTimeout(onClose, 180) }

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [])

  return createPortal(
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${isVisual ? 'bg-black/60 backdrop-blur-sm' : 'bg-black/40'} ${closing ? 'animate-modal-out' : 'animate-modal-in'}`}
      onClick={e => e.target === e.currentTarget && close()}
    >
      <div className={`rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[80vh]
        ${isVisual
          ? 'bg-slate-900/98 backdrop-blur-xl border border-white/15'
          : 'bg-white border border-gray-200'
        }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isVisual ? 'border-white/10' : 'border-gray-100'}`}>
          <span className={`font-bold text-sm ${isVisual ? 'text-white' : 'text-gray-900'}`}>Todas las notificaciones</span>
          <div className="flex items-center gap-3">
            {noLeidas > 0 && (
              <button onClick={onMarcarTodas} className={`text-xs flex items-center gap-1 ${isVisual ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}>
                <Icons.Check /> Marcar todas
              </button>
            )}
            <button onClick={close} className={`transition-colors text-lg leading-none ${isVisual ? 'text-slate-500 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}>✕</button>
          </div>
        </div>
        {/* List */}
        <div className="overflow-y-auto flex-1">
          {items.length === 0
            ? <p className={`py-12 text-center text-sm ${isVisual ? 'text-slate-500' : 'text-gray-400'}`}>Sin notificaciones</p>
            : items.map(n => <NotifItem key={n.id} n={n} onMark={onMark} fmtFecha={fmtFecha} isVisual={isVisual} />)
          }
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ── Notification mini panel (portal) ───────────────────────── */
function NotifPanel({ anchorRef, onClose, onVerTodas }) {
  const { isVisual } = useVisual()
  const [data, setData]         = useState({ items: [], noLeidas: 0 })
  const [loading, setLoading]   = useState(true)
  const [pos, setPos]           = useState({ top: 0, left: 0 })
  const [progress, setProgress] = useState(100)
  const [closing, setClosing]   = useState(false)
  const panelRef  = useRef()
  const timerRef  = useRef()
  const startRef  = useRef()
  const pausedRef = useRef(false)
  const progRef   = useRef(100)

  // rAF position sync — follows sidebar animation frame by frame
  useEffect(() => {
    let rafId
    const sync = () => {
      if (anchorRef.current) {
        const r = anchorRef.current.getBoundingClientRect()
        setPos(p => {
          const t = r.top, l = r.right + 8
          return (p.top === t && p.left === l) ? p : { top: t, left: l }
        })
      }
      rafId = requestAnimationFrame(sync)
    }
    rafId = requestAnimationFrame(sync)
    return () => cancelAnimationFrame(rafId)
  }, [anchorRef])

  // Animated close helper
  const doClose = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 150)
  }, [closing, onClose])

  // Auto-close countdown via rAF
  useEffect(() => {
    startRef.current = Date.now()
    const tick = () => {
      if (!pausedRef.current) {
        const elapsed    = Date.now() - startRef.current
        const remaining  = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100)
        progRef.current  = remaining
        setProgress(remaining)
        if (remaining <= 0) { doClose(); return }
      }
      timerRef.current = requestAnimationFrame(tick)
    }
    timerRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(timerRef.current)
  }, [doClose])

  const pauseTimer  = () => { pausedRef.current = true }
  const resumeTimer = () => {
    pausedRef.current  = false
    startRef.current   = Date.now() - ((100 - progRef.current) / 100) * AUTO_CLOSE_MS
  }

  const load = useCallback(async () => {
    try { const r = await notiApi.getAll(); setData(r.data) }
    catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const h = (e) => {
      if (panelRef.current?.contains(e.target)) return
      if (anchorRef.current?.contains(e.target)) return
      doClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [doClose, anchorRef])

  const marcarTodas = async () => {
    await notiApi.marcarTodas()
    setData(p => ({ ...p, noLeidas: 0, items: p.items.map(n => ({ ...n, visto: true })) }))
  }
  const marcarUna = async (id) => {
    await notiApi.marcarVista(id)
    setData(p => ({
      ...p,
      noLeidas: Math.max(0, p.noLeidas - 1),
      items: p.items.map(n => n.id === id ? { ...n, visto: true } : n),
    }))
  }
  const fmtFecha = (iso) => new Date(iso).toLocaleDateString('es-MX',
    { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

  // Prioritise unread, then newest — show max 4
  const displayed = [...data.items]
    .sort((a, b) => {
      if (!a.visto && b.visto) return -1
      if (a.visto && !b.visto) return  1
      return new Date(b.fecha) - new Date(a.fecha)
    })
    .slice(0, 4)

  const hasMore = data.items.length > 4

  return createPortal(
    <div
      ref={panelRef}
      style={{
        position: 'fixed',
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: 320,
        maxHeight: `calc(100vh - ${pos.top}px - 16px)`,
        display: 'flex',
        flexDirection: 'column',
      }}
      className={`rounded-xl shadow-2xl overflow-hidden ${closing ? 'animate-popup-out' : 'animate-popup-in'}
        ${isVisual
          ? 'bg-slate-900/98 backdrop-blur-xl border border-white/15'
          : 'bg-white border border-gray-200'
        }`}
      onMouseEnter={pauseTimer}
      onMouseLeave={resumeTimer}
    >
      {/* Progress bar */}
      <div className={`h-0.5 flex-shrink-0 ${isVisual ? 'bg-white/5' : 'bg-gray-100'}`}>
        <div className="h-full bg-primary-500 transition-none" style={{ width: `${progress}%` }} />
      </div>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b flex-shrink-0 ${isVisual ? 'border-white/10' : 'border-gray-100'}`}>
        <span className={`text-sm font-semibold ${isVisual ? 'text-white' : 'text-gray-900'}`}>Notificaciones</span>
        {data.noLeidas > 0 && (
          <button onClick={marcarTodas} className={`text-xs transition-colors flex items-center gap-1 ${isVisual ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-700'}`}>
            <Icons.Check /> Marcar todas
          </button>
        )}
      </div>
      {/* Items — scrollable si hay muchos */}
      <div className="overflow-y-auto flex-1">
        {loading
          ? <p className={`py-8 text-center text-sm ${isVisual ? 'text-slate-500' : 'text-gray-400'}`}>Cargando…</p>
          : displayed.length === 0
            ? <p className={`py-8 text-center text-sm ${isVisual ? 'text-slate-500' : 'text-gray-400'}`}>Sin notificaciones</p>
            : displayed.map(n => <NotifItem key={n.id} n={n} onMark={marcarUna} fmtFecha={fmtFecha} isVisual={isVisual} />)
        }
      </div>
      {/* Ver todas */}
      {!loading && (hasMore || data.items.length > 0) && (
        <button
          onClick={() => { pauseTimer(); onVerTodas(data, marcarUna, marcarTodas, fmtFecha) }}
          className={`w-full py-2 text-xs transition-colors border-t font-medium flex-shrink-0
            ${isVisual
              ? 'text-primary-400 hover:text-primary-300 hover:bg-white/5 border-white/10'
              : 'text-primary-600 hover:text-primary-700 hover:bg-gray-50 border-gray-100'
            }`}
        >
          Ver todas ({data.items.length})
        </button>
      )}
    </div>,
    document.body
  )
}

/* ── Bell button ─────────────────────────────────────────────── */
function NotifBell({ expanded }) {
  const [open, setOpen]     = useState(false)
  const [count, setCount]   = useState(0)
  const [allModal, setAllModal] = useState(null) // { items, noLeidas, ... }
  const btnRef              = useRef()

  useEffect(() => {
    const load = () => notiApi.getCount().then(r => setCount(r.data.noLeidas)).catch(() => {})
    load()
    const id = setInterval(load, 30000)
    return () => clearInterval(id)
  }, [])

  const handleClose = useCallback(() => {
    setOpen(false)
    notiApi.getCount().then(r => setCount(r.data.noLeidas)).catch(() => {})
  }, [])

  const handleVerTodas = useCallback((data, marcarUna, marcarTodas, fmtFecha) => {
    setAllModal({ data, marcarUna, marcarTodas, fmtFecha })
    setOpen(false)
  }, [])

  return (
    <div className="px-2 pb-1">
      <button
        ref={btnRef}
        onClick={() => setOpen(s => !s)}
        title={!expanded ? 'Notificaciones' : undefined}
        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors duration-150 cursor-pointer text-slate-400 hover:text-white"
      >
        <div className="relative flex-shrink-0">
          <Icons.Bell />
          {count > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center leading-none">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </div>
        <span className="text-sm font-medium overflow-hidden">Notificaciones</span>
      </button>
      {open && (
        <NotifPanel
          anchorRef={btnRef}
          onClose={handleClose}
          onVerTodas={handleVerTodas}
        />
      )}
      {allModal && (
        <NotifAllModal
          items={allModal.data.items}
          noLeidas={allModal.data.noLeidas}
          onMark={allModal.marcarUna}
          onMarcarTodas={allModal.marcarTodas}
          fmtFecha={allModal.fmtFecha}
          onClose={() => {
            setAllModal(null)
            notiApi.getCount().then(r => setCount(r.data.noLeidas)).catch(() => {})
          }}
        />
      )}
    </div>
  )
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
  const { user, logout }          = useAuth()
  const { isVisual, setIsVisual } = useVisual()
  const navigate                  = useNavigate()
  const location                  = useLocation()

  /* Mobile sidebar toggle */
  const [sidebarOpen, setSidebarOpen] = useState(false)
  /* Desktop hover-expand */
  const [expanded, setExpanded]       = useState(false)
  /* Visual mode warning modal */
  const [showWarn, setShowWarn]       = useState(false)
  /* Scroll-to-top */
  const mainRef                        = useRef()
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    const el = mainRef.current
    if (!el) return
    const onScroll = () => setShowScrollTop(el.scrollTop > 200)
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [])

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
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-widest">Administración</p>
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

        {/* Notifications bell (all users) */}
        <div className="border-t border-white/10 overflow-hidden whitespace-nowrap">
          <NotifBell expanded={expanded} />
        </div>

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

        <main ref={mainRef} className="flex-1 overflow-y-auto p-4 md:p-6">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </main>

        {/* ── Botón ir arriba ───────────────────────────── */}
        {showScrollTop && (
          <button
            onClick={() => mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            title="Ir arriba"
            aria-label="Ir arriba"
            className="fixed bottom-20 right-6 z-[90] w-11 h-11 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-lg flex items-center justify-center transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="18 15 12 9 6 15"/>
            </svg>
          </button>
        )}
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
