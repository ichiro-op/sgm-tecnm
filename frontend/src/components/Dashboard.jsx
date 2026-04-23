import { useEffect, useState } from 'react'
import { tickets as ticketsApi, equipos as equiposApi } from '../utils/api'
import { Link } from 'react-router-dom'

/* ── SVG icons ──────────────────────────────────────────────────── */
const TicketIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/>
  </svg>
)
const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const RefreshIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
  </svg>
)
const CheckCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
)
const MonitorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
  </svg>
)
const WrenchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
  </svg>
)
const XCircleIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
)
const AlertIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const ZapIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

function StatCard({ label, value, Icon, iconBg, iconColor }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconBg}`}>
        <span className={iconColor}><Icon /></span>
      </div>
      <div>
        <p className="text-slate-500 text-xs font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-800 font-mono leading-tight">{value}</p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [equiposList, setEquiposList] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([ticketsApi.getStats(), equiposApi.getAll()])
      .then(([s, e]) => {
        setStats(s.data)
        setEquiposList(e.data)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600" />
    </div>
  )

  const funcionales    = equiposList.filter(e => e.estado === 'funcional').length
  const mantenimiento  = equiposList.filter(e => e.estado === 'en mantenimiento').length
  const fueraServicio  = equiposList.filter(e => e.estado === 'fuera de servicio').length
  const total          = equiposList.length

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general del sistema de mantenimiento</p>
      </div>

      {/* Tickets stats */}
      <div>
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">Tickets</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total"      value={stats?.total     ?? 0} Icon={TicketIcon}    iconBg="bg-primary-50"  iconColor="text-primary-600" />
          <StatCard label="Pendientes" value={stats?.pendientes ?? 0} Icon={ClockIcon}     iconBg="bg-amber-50"    iconColor="text-amber-600" />
          <StatCard label="En proceso" value={stats?.enProceso  ?? 0} Icon={RefreshIcon}   iconBg="bg-blue-50"     iconColor="text-blue-600" />
          <StatCard label="Resueltos"  value={stats?.resueltos  ?? 0} Icon={CheckCircleIcon} iconBg="bg-green-50"  iconColor="text-green-600" />
        </div>
      </div>

      {/* Equipment stats */}
      <div>
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">Equipos · {total} en total</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Funcionales"       value={funcionales}   Icon={MonitorIcon}    iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="En mantenimiento"  value={mantenimiento} Icon={WrenchIcon}     iconBg="bg-amber-50"   iconColor="text-amber-600" />
          <StatCard label="Fuera de servicio" value={fueraServicio} Icon={XCircleIcon}    iconBg="bg-red-50"     iconColor="text-red-600" />
        </div>
      </div>

      {/* Two-col section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Top failing equipment */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-red-500"><AlertIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Equipos con más fallas activas</h2>
          </div>
          {!stats?.porEquipo?.length ? (
            <p className="text-slate-400 text-sm">Sin registros aún</p>
          ) : (
            <div className="space-y-3">
              {stats.porEquipo.map((e, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-700 text-sm truncate">{e.equipo_nombre}</p>
                    <p className="text-xs text-slate-400 truncate">{e.laboratorio}</p>
                  </div>
                  <span className="badge badge-fuera flex-shrink-0">
                    {e.total} falla{e.total !== 1 ? 's' : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Equipment status bars */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-slate-500"><MonitorIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Estado de equipos</h2>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Funcional',          count: funcionales,   bar: 'bg-emerald-500', text: 'text-emerald-700' },
              { label: 'En mantenimiento',   count: mantenimiento, bar: 'bg-amber-500',   text: 'text-amber-700' },
              { label: 'Fuera de servicio',  count: fueraServicio, bar: 'bg-red-500',     text: 'text-red-700' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-slate-600 text-xs font-medium">{item.label}</span>
                  <span className={`font-bold text-xs font-mono ${item.text}`}>{item.count}</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${item.bar}`}
                    style={{ width: total ? `${(item.count / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary-500"><ZapIcon /></span>
          <h2 className="font-semibold text-slate-800 text-sm">Acciones rápidas</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/reportar" className="btn-primary hover:scale-105 active:scale-95 transition-transform duration-150">
            <AlertIcon />
            Reportar falla
          </Link>
          <Link to="/equipos" className="btn-secondary hover:scale-105 active:scale-95 transition-transform duration-150">
            <MonitorIcon />
            Ver equipos
          </Link>
          <Link to="/tickets" className="btn-secondary hover:scale-105 active:scale-95 transition-transform duration-150">
            <TicketIcon />
            Ver tickets
          </Link>
        </div>
      </div>
    </div>
  )
}
