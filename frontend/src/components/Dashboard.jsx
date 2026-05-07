import { useEffect, useState } from 'react'
import { tickets as ticketsApi, equipos as equiposApi, labs as labsApi } from '../utils/api'
import { Link } from 'react-router-dom'

/* ── SVG icons ──────────────────────────────────────────────────── */
const TicketIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M15 5v2M15 11v2M15 17v2M5 5h14a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7a2 2 0 0 1 2-2z"/></svg>
const ClockIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const RefreshIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
const CheckIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
const MonitorIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
const WrenchIcon    = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
const XCircleIcon   = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
const AlertIcon     = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
const ZapIcon       = () => <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
const ChartBarIcon  = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>
const PieIcon       = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>

/* ── Stat card ──────────────────────────────────────────────────── */
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

/* ── Donut chart (SVG puro) ─────────────────────────────────────── */
function DonutChart({ data }) {
  const R    = 50
  const SW   = 18   // stroke width
  const GAP  = 3    // gap between segments (px)
  const SIZE = 148
  const cx   = SIZE / 2
  const cy   = SIZE / 2
  const C    = 2 * Math.PI * R

  const total   = data.reduce((s, d) => s + d.value, 0)
  const nonZero = data.filter(d => d.value > 0)

  let cumFrac = 0
  const segments = nonZero.map(d => {
    const frac      = d.value / total
    const arcLen    = Math.max(0, C * frac - GAP)
    const dashOffset = C * (1 - cumFrac)
    cumFrac += frac
    return { ...d, arcLen, dashOffset }
  })

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {/* SVG ring */}
      <div className="relative flex-shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}
          style={{ transform: 'rotate(-90deg)' }}>
          {/* track */}
          <circle cx={cx} cy={cy} r={R} fill="none" stroke="#f1f5f9" strokeWidth={SW} />
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={R} fill="none" stroke="#e2e8f0" strokeWidth={SW} />
          ) : segments.map((s, i) => (
            <circle key={i} cx={cx} cy={cy} r={R} fill="none"
              stroke={s.color} strokeWidth={SW}
              strokeDasharray={`${s.arcLen} ${Math.max(0, C - s.arcLen)}`}
              strokeDashoffset={s.dashOffset}
            />
          ))}
        </svg>
        {/* Centro (no rotado) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
          <span className="text-2xl font-bold text-slate-800 leading-none font-mono">{total}</span>
          <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">total</span>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex-1 min-w-[120px] space-y-2.5">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
              <span className="text-xs text-slate-600 truncate">{d.label}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-bold text-slate-800 font-mono">{d.value}</span>
              {total > 0 && (
                <span className="text-[10px] text-slate-400">
                  ({Math.round(d.value / total * 100)}%)
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Barras horizontales ────────────────────────────────────────── */
function HBars({ data, emptyText = 'Sin datos aún' }) {
  const max = Math.max(...data.map(d => d.value), 1)
  if (data.length === 0) return <p className="text-sm text-slate-400 py-2">{emptyText}</p>
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between mb-1 gap-2">
            <span className="text-xs text-slate-600 truncate" title={d.label}>{d.label}</span>
            <span className="text-xs font-bold font-mono text-slate-700 flex-shrink-0">{d.value}</span>
          </div>
          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${Math.max(2, (d.value / max) * 100)}%`,
                backgroundColor: d.color,
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Paleta de colores para barras ──────────────────────────────── */
const PALETTE = [
  '#3b82f6','#f59e0b','#22c55e','#a855f7',
  '#06b6d4','#10b981','#ef4444','#f97316','#ec4899','#84cc16',
]

/* ── Dashboard principal ────────────────────────────────────────── */
export default function Dashboard() {
  const [stats, setStats]           = useState(null)
  const [equiposList, setEquiposList] = useState([])
  const [labsList, setLabsList]     = useState([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      ticketsApi.getStats(),
      equiposApi.getAll(),
      labsApi.getAll().catch(() => ({ data: [] })),
    ]).then(([s, e, l]) => {
      setStats(s.data)
      setEquiposList(e.data)
      setLabsList(l.data || [])
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-primary-600" />
    </div>
  )

  /* ── Datos de equipos ── */
  const funcionales   = equiposList.filter(e => e.estado === 'funcional').length
  const mantenimiento = equiposList.filter(e => e.estado === 'en mantenimiento').length
  const fueraServicio = equiposList.filter(e => e.estado === 'fuera de servicio').length
  const totalEq       = equiposList.length

  /* ── Equipos por laboratorio (para las barras) ── */
  const eqPorLab = labsList.map((lab, i) => ({
    label: lab.nombre,
    value: equiposList.filter(e => e.laboratorio === lab.nombre).length,
    color: lab.color || PALETTE[i % PALETTE.length],
  })).filter(d => d.value > 0).sort((a, b) => b.value - a.value)

  /* ── Colores para tickets por laboratorio ── */
  const ticketsPorLab = (stats?.porLaboratorio || []).map((d, i) => {
    const lab = labsList.find(l => l.nombre === d.laboratorio)
    return {
      label: d.laboratorio,
      value: d.total,
      color: lab?.color || PALETTE[i % PALETTE.length],
    }
  })

  /* ── Tipos de falla ── */
  const tiposFalla = (stats?.porTipo || []).map((d, i) => ({
    label: d.tipo_falla,
    value: d.total,
    color: PALETTE[i % PALETTE.length],
  }))

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Resumen general del sistema de mantenimiento</p>
      </div>

      {/* ── Stat cards — Tickets ── */}
      <div>
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">Tickets</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total"      value={stats?.total      ?? 0} Icon={TicketIcon}  iconBg="bg-primary-50"  iconColor="text-primary-600" />
          <StatCard label="Pendientes" value={stats?.pendientes  ?? 0} Icon={ClockIcon}   iconBg="bg-amber-50"    iconColor="text-amber-600" />
          <StatCard label="En proceso" value={stats?.enProceso   ?? 0} Icon={RefreshIcon} iconBg="bg-blue-50"     iconColor="text-blue-600" />
          <StatCard label="Resueltos"  value={stats?.resueltos   ?? 0} Icon={CheckIcon}   iconBg="bg-green-50"    iconColor="text-green-600" />
        </div>
      </div>

      {/* ── Stat cards — Equipos ── */}
      <div>
        <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-3">
          Equipos · {totalEq} en total
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Funcionales"       value={funcionales}   Icon={MonitorIcon} iconBg="bg-emerald-50" iconColor="text-emerald-600" />
          <StatCard label="En mantenimiento"  value={mantenimiento} Icon={WrenchIcon}  iconBg="bg-amber-50"   iconColor="text-amber-600" />
          <StatCard label="Fuera de servicio" value={fueraServicio} Icon={XCircleIcon} iconBg="bg-red-50"     iconColor="text-red-600" />
        </div>
      </div>

      {/* ── Gráficas fila 1: 2 Donuts ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Donut — tickets por estado */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-primary-500"><PieIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Tickets por estado</h2>
          </div>
          <DonutChart data={[
            { label: 'Pendientes', value: stats?.pendientes ?? 0, color: '#f59e0b' },
            { label: 'En proceso', value: stats?.enProceso  ?? 0, color: '#3b82f6' },
            { label: 'Resueltos',  value: stats?.resueltos  ?? 0, color: '#22c55e' },
          ]} />
        </div>

        {/* Donut — equipos por estado */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-slate-500"><MonitorIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Equipos por estado</h2>
          </div>
          <DonutChart data={[
            { label: 'Funcionales',        value: funcionales,   color: '#10b981' },
            { label: 'En mantenimiento',   value: mantenimiento, color: '#f59e0b' },
            { label: 'Fuera de servicio',  value: fueraServicio, color: '#ef4444' },
          ]} />
        </div>
      </div>

      {/* ── Gráficas fila 2: 2 barras ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Barras — tickets por laboratorio */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-primary-500"><ChartBarIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Tickets por laboratorio</h2>
          </div>
          <HBars data={ticketsPorLab} emptyText="Sin tickets registrados aún" />
        </div>

        {/* Barras — tipos de falla */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-red-400"><AlertIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Tipos de falla más frecuentes</h2>
          </div>
          <HBars data={tiposFalla} emptyText="Sin fallas registradas aún" />
        </div>
      </div>

      {/* ── Gráficas fila 3: equipos por lab + equipos con más fallas ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Barras — equipos por laboratorio */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <span className="text-emerald-500"><MonitorIcon /></span>
            <h2 className="font-semibold text-slate-800 text-sm">Equipos por laboratorio</h2>
          </div>
          <HBars data={eqPorLab} emptyText="Sin equipos registrados" />
        </div>

        {/* Equipos con más fallas activas */}
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
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
      </div>

      {/* ── Acciones rápidas ── */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-primary-500"><ZapIcon /></span>
          <h2 className="font-semibold text-slate-800 text-sm">Acciones rápidas</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/reportar" className="btn-primary hover:scale-105 active:scale-95 transition-transform duration-150">
            <AlertIcon /> Reportar falla
          </Link>
          <Link to="/equipos" className="btn-secondary hover:scale-105 active:scale-95 transition-transform duration-150">
            <MonitorIcon /> Ver equipos
          </Link>
          <Link to="/tickets" className="btn-secondary hover:scale-105 active:scale-95 transition-transform duration-150">
            <TicketIcon /> Ver tickets
          </Link>
        </div>
      </div>
    </div>
  )
}
