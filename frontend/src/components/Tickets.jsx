import { useEffect, useState } from 'react'
import { tickets as ticketsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useVisual } from '../context/VisualContext'

const PRIORIDADES = ['baja', 'media', 'alta']
const ESTADOS_ACTIVOS = ['pendiente', 'en proceso']
const PRIORIDAD_ORDER = { alta: 0, media: 1, baja: 2 }
const ESTADO_ORDER = { pendiente: 0, 'en proceso': 1 }

const SORT_OPTIONS = [
  { key: 'fecha',       label: 'Fecha' },
  { key: 'prioridad',   label: 'Prioridad' },
  { key: 'estado',      label: 'Estado' },
  { key: 'tipo',        label: 'Tipo' },
  { key: 'laboratorio', label: 'Laboratorio' },
]

function sortTickets(arr, sortBy) {
  if (!sortBy) return arr
  return [...arr].sort((a, b) => {
    if (sortBy === 'prioridad')   return PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad]
    if (sortBy === 'estado')      return (ESTADO_ORDER[a.estado] ?? 99) - (ESTADO_ORDER[b.estado] ?? 99)
    if (sortBy === 'fecha')       return new Date(b.fecha) - new Date(a.fecha)
    if (sortBy === 'tipo')        return (a.tipo_falla || '').localeCompare(b.tipo_falla || '')
    if (sortBy === 'laboratorio') return (a.laboratorio || '').localeCompare(b.laboratorio || '')
    return 0
  })
}

function Badge({ text, type }) {
  const map = {
    pendiente:    'badge-pendiente',
    'en proceso': 'badge-en-proceso',
    resuelto:     'badge-resuelto',
    baja:  'bg-gray-200 text-black text-xs font-semibold px-2.5 py-0.5 rounded-full',
    media: 'bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
    alta:  'bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  }
  return <span className={map[text] || map[type] || ''}>{text}</span>
}

/* ── Modal de detalle ─────────────────────────────────────────── */
function TicketModal({ ticket, onClose, onUpdate, onResolve, isAdmin, esResuelto }) {
  const { isVisual } = useVisual()
  const [estado, setEstado]     = useState(ticket.estado)
  const [prioridad, setPrioridad] = useState(ticket.prioridad)
  const [nota, setNota]         = useState('')
  const [saving, setSaving]     = useState(false)

  // Tema visual / lite
  const bg    = isVisual ? 'bg-slate-900/95 backdrop-blur-md border border-white/15' : 'bg-white border border-gray-200'
  const bdr   = isVisual ? 'border-white/10'  : 'border-gray-100'
  const lbl   = isVisual ? 'text-slate-400'   : 'text-slate-500'
  const val   = isVisual ? 'text-white'       : 'text-slate-800'
  const descBg = isVisual ? 'bg-white/8 text-slate-200' : 'bg-gray-50 text-slate-700'
  const selSty = isVisual ? { background: '#1e293b', color: '#fff' } : {}

  const handleSave = async () => {
    setSaving(true)
    const patch = { estado, prioridad }
    if (estado === 'resuelto') {
      if (nota.trim()) patch.nota_resolucion = nota.trim()
      if (!ticket.fecha_resolucion) patch.fecha_resolucion = new Date().toISOString()
    }
    const updated = await ticketsApi.update(ticket.id, patch)
    onUpdate(updated.data)
    if (onResolve && estado === 'resuelto') onResolve()
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className={`${bg} rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col`} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${bdr} flex-shrink-0`}>
          <div className="flex items-center gap-2">
            <h3 className={`font-bold ${val}`}>Ticket #{ticket.id}</h3>
            {esResuelto && <span className="text-xs bg-green-500/20 text-green-600 px-2 py-0.5 rounded-full border border-green-200">Resuelto</span>}
          </div>
          <button onClick={onClose} className={`${lbl} hover:${val} text-xl leading-none transition-colors`}>&times;</button>
        </div>

        {/* Body — scrollable */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Equipo</p><p className={`font-medium ${val}`}>{ticket.equipo_nombre}</p></div>
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Laboratorio</p><p className={`font-medium ${val}`}>{ticket.laboratorio}</p></div>
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Tipo de falla</p><p className={`font-medium ${val}`}>{ticket.tipo_falla}</p></div>
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Reportado por</p><p className={`font-medium ${val}`}>{ticket.usuario_nombre}</p></div>
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Fecha</p><p className={`font-medium ${val}`}>{new Date(ticket.fecha).toLocaleDateString('es-MX')}</p></div>
            {ticket.fecha_resolucion && (
              <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Resuelto el</p><p className={`font-medium ${val}`}>{new Date(ticket.fecha_resolucion).toLocaleDateString('es-MX')}</p></div>
            )}
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Estado</p><Badge text={ticket.estado} /></div>
            <div><p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Prioridad</p><Badge text={ticket.prioridad} type={ticket.prioridad} /></div>
          </div>

          {/* Descripción */}
          <div>
            <p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Descripción</p>
            <p className={`text-sm rounded-lg p-3 leading-relaxed ${descBg}`}>{ticket.descripcion}</p>
          </div>

          {/* Nota de resolución (siempre visible en tickets resueltos) */}
          {esResuelto && (
            <div>
              <p className={`${lbl} text-xs mb-1 uppercase tracking-wider`}>Solución aplicada</p>
              {ticket.nota_resolucion ? (
                <p className={`text-sm rounded-lg p-3 leading-relaxed border ${isVisual ? 'bg-green-500/10 border-green-500/20 text-green-200' : 'bg-green-50 border-green-200 text-green-800'}`}>
                  {ticket.nota_resolucion}
                </p>
              ) : (
                <p className={`text-sm rounded-lg p-3 leading-relaxed border italic ${isVisual ? 'bg-white/5 border-white/10 text-slate-500' : 'bg-gray-50 border-gray-200 text-gray-400'}`}>
                  Sin nota de resolución registrada.
                </p>
              )}
            </div>
          )}

          {/* Formulario de edición (solo admin + no resuelto) */}
          {isAdmin && !esResuelto && (
            <div className={`space-y-3 pt-2 border-t ${bdr}`}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Estado</label>
                  <select className="input" value={estado} onChange={e => setEstado(e.target.value)} style={selSty}>
                    {[...ESTADOS_ACTIVOS, 'resuelto'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Prioridad</label>
                  <select className="input" value={prioridad} onChange={e => setPrioridad(e.target.value)} style={selSty}>
                    {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Nota de resolución (aparece al seleccionar "resuelto") */}
              {estado === 'resuelto' && (
                <div>
                  <label className="label">Nota de resolución <span className={`${lbl} font-normal normal-case`}>(opcional)</span></label>
                  <textarea
                    value={nota}
                    onChange={e => setNota(e.target.value)}
                    placeholder="¿Qué se hizo para resolver el problema?"
                    rows={3}
                    className="input resize-none"
                    style={selSty}
                  />
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        {isAdmin && !esResuelto && (
          <div className={`px-6 py-4 border-t ${bdr} flex gap-3 justify-end flex-shrink-0`}>
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className={estado === 'resuelto' ? 'btn-primary bg-green-600 hover:bg-green-700' : 'btn-primary'}>
              {saving ? 'Guardando...' : estado === 'resuelto' ? '✓ Marcar como resuelto' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Modal de resolución rápida (desde la tabla) ─────────────── */
function ResolverModal({ ticket, onConfirm, onCancel }) {
  const [nota, setNota]     = useState('')
  const [saving, setSaving] = useState(false)
  const handleConfirm = async () => {
    setSaving(true)
    await onConfirm(ticket, nota)
    setSaving(false)
  }
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Resolver ticket #{ticket.id}</h3>
              <p className="text-sm text-slate-500">{ticket.equipo_nombre} — {ticket.laboratorio}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0 text-xl leading-none">✕</button>
        </div>
        <div>
          <label className="label">Nota de resolución <span className="text-slate-400 font-normal normal-case">(opcional)</span></label>
          <textarea
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="¿Qué se hizo para resolver el problema?"
            rows={3}
            className="input resize-none"
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 btn-secondary">Cancelar</button>
          <button onClick={handleConfirm} disabled={saving} className="flex-1 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-colors">
            {saving ? 'Guardando...' : '✓ Marcar como resuelto'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Confirmación de borrado ─────────────────────────────────── */
function ConfirmDeleteModal({ ticket, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Eliminar ticket #{ticket.id}</h3>
            <p className="text-sm text-slate-500">Esta acción no se puede deshacer.</p>
          </div>
        </div>
        <div className="flex gap-3 pt-1">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} disabled={loading} className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
            {loading ? 'Eliminando…' : 'Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Tabla de tickets ────────────────────────────────────────── */
function TicketsTable({ tickets, isAdmin, esResueltos, onSelect, onResolve, onReactivar, onDelete }) {
  const headers = ['#', 'Equipo', 'Laboratorio', 'Tipo', 'Estado', 'Prioridad', esResueltos ? 'Resuelto el' : 'Fecha', 'Reportado por']
  if (isAdmin) headers.push('Acciones')

  return (
    <div className="card p-0 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className={`border-b border-gray-200 ${esResueltos ? 'bg-green-50' : 'bg-primary-50'}`}>
            <tr>
              {headers.map(h => (
                <th key={h} className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider ${esResueltos ? 'text-green-800' : 'text-primary-800'}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tickets.length === 0 ? (
              <tr><td colSpan={headers.length} className="px-4 py-8 text-center text-gray-400">Sin tickets</td></tr>
            ) : tickets.map((t, i) => (
              <tr
                key={t.id}
                onClick={() => onSelect(t)}
                className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${esResueltos ? 'opacity-80' : ''}`}
              >
                <td className="px-4 py-3 text-gray-400 font-mono">#{t.id}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{t.equipo_nombre}</td>
                <td className="px-4 py-3 text-gray-600">{t.laboratorio}</td>
                <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{t.tipo_falla}</td>
                <td className="px-4 py-3"><Badge text={t.estado} /></td>
                <td className="px-4 py-3"><Badge text={t.prioridad} type={t.prioridad} /></td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {esResueltos && t.fecha_resolucion
                    ? new Date(t.fecha_resolucion).toLocaleDateString('es-MX')
                    : new Date(t.fecha).toLocaleDateString('es-MX')}
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{t.usuario_nombre}</td>
                {isAdmin && (
                  <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center gap-1.5">
                      {!esResueltos ? (
                        <button
                          onClick={() => onResolve(t)}
                          title="Marcar como resuelto"
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                          Resolver
                        </button>
                      ) : (
                        <button
                          onClick={() => onReactivar(t)}
                          title="Mover de vuelta a activos"
                          className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors whitespace-nowrap"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.86"/></svg>
                          Reactivar
                        </button>
                      )}
                      <button
                        onClick={() => onDelete(t)}
                        title="Eliminar ticket"
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Página principal ────────────────────────────────────────── */
export default function Tickets() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [selected, setSelected] = useState(null)
  const [sortBy, setSortBy] = useState('')
  const [pendingDelete, setPendingDelete]   = useState(null)
  const [pendingResolve, setPendingResolve] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [mostrarResueltos, setMostrarResueltos] = useState(true)

  useEffect(() => {
    const fn = isAdmin ? ticketsApi.getAll : ticketsApi.getMios
    fn().then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [isAdmin])

  const activos   = lista.filter(t => t.estado !== 'resuelto')
  const resueltos = lista.filter(t => t.estado === 'resuelto')

  const activosFiltrados   = sortTickets(activos.filter(t => !filtroPrioridad || t.prioridad === filtroPrioridad), sortBy)
  const resueltosFiltrados = sortTickets(resueltos.filter(t => !filtroPrioridad || t.prioridad === filtroPrioridad), sortBy)

  const handleUpdate = (updated) => {
    setLista(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  const handleResolve = async (ticket, nota = '') => {
    const patch = {
      estado: 'resuelto',
      prioridad: ticket.prioridad,
      nota_resolucion: nota.trim() || '',
      fecha_resolucion: ticket.fecha_resolucion || new Date().toISOString(),
    }
    const updated = await ticketsApi.update(ticket.id, patch)
    handleUpdate(updated.data)
  }

  const handleReactivar = async (ticket) => {
    const updated = await ticketsApi.update(ticket.id, { estado: 'pendiente', prioridad: ticket.prioridad })
    handleUpdate(updated.data)
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    await ticketsApi.delete(pendingDelete.id)
    setLista(prev => prev.filter(t => t.id !== pendingDelete.id))
    setPendingDelete(null)
    setDeleting(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div>
        <h1 className="page-title">Tickets de Mantenimiento</h1>
        <p className="page-subtitle">{activosFiltrados.length} activo{activosFiltrados.length !== 1 ? 's' : ''} · {resueltosFiltrados.length} resuelto{resueltosFiltrados.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filtros y ordenamiento */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3 items-center">
          <select
            value={filtroPrioridad}
            onChange={e => setFiltroPrioridad(e.target.value)}
            className="input max-w-[180px]"
            style={{ background: '#fff', color: '#1e293b' }}
          >
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-400 font-medium uppercase tracking-wider hidden sm:inline">Ordenar:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => setSortBy(s => s === opt.key ? '' : opt.key)}
                className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-150
                  ${sortBy === opt.key
                    ? 'bg-primary-600 border-primary-600 text-white shadow-sm'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300 hover:text-primary-700'
                  }`}
              >
                {opt.label}
                {sortBy === opt.key
                  ? <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
                  : <svg className="w-3 h-3 opacity-50" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
                }
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tickets activos ── */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
          Tickets activos ({activosFiltrados.length})
        </h2>
        <TicketsTable
          tickets={activosFiltrados}
          isAdmin={isAdmin}
          esResueltos={false}
          onSelect={setSelected}
          onResolve={setPendingResolve}
          onReactivar={handleReactivar}
          onDelete={setPendingDelete}
        />
      </div>

      {/* ── Tickets resueltos (colapsable con animación) ── */}
      <div className="space-y-2">
        <button
          onClick={() => setMostrarResueltos(o => !o)}
          className="flex items-center gap-2 text-sm font-semibold text-white uppercase tracking-wider hover:text-white/80 transition-colors w-full text-left select-none"
        >
          <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
          Tickets resueltos ({resueltosFiltrados.length})
          <svg
            className={`w-4 h-4 ml-1 transition-transform duration-300 ${mostrarResueltos ? 'rotate-180' : 'rotate-0'}`}
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
          >
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>

        {/* Wrapper animado — siempre en el DOM, animado con grid-template-rows */}
        <div
          className="grid transition-[grid-template-rows,opacity] duration-300 ease-in-out"
          style={{
            gridTemplateRows: mostrarResueltos ? '1fr' : '0fr',
            opacity: mostrarResueltos ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <TicketsTable
              tickets={resueltosFiltrados}
              isAdmin={isAdmin}
              esResueltos={true}
              onSelect={setSelected}
              onResolve={handleResolve}
              onReactivar={handleReactivar}
              onDelete={setPendingDelete}
            />
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {selected && (
        <TicketModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onResolve={() => setSelected(null)}
          isAdmin={isAdmin}
          esResuelto={selected.estado === 'resuelto'}
        />
      )}

      {/* Modal de resolución rápida */}
      {pendingResolve && (
        <ResolverModal
          ticket={pendingResolve}
          onConfirm={async (t, nota) => { await handleResolve(t, nota); setPendingResolve(null) }}
          onCancel={() => setPendingResolve(null)}
        />
      )}

      {/* Modal de confirmación de borrado */}
      {pendingDelete && (
        <ConfirmDeleteModal
          ticket={pendingDelete}
          onConfirm={handleDelete}
          onCancel={() => setPendingDelete(null)}
          loading={deleting}
        />
      )}
    </div>
  )
}
