import { useEffect, useState } from 'react'
import { tickets as ticketsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const ESTADOS = ['pendiente', 'en proceso', 'resuelto']
const PRIORIDADES = ['baja', 'media', 'alta']
const PRIORIDAD_ORDER = { alta: 0, media: 1, baja: 2 }
const ESTADO_ORDER = { pendiente: 0, 'en proceso': 1, resuelto: 2 }

function Badge({ text, type }) {
  const map = {
    pendiente: 'badge-pendiente',
    'en proceso': 'badge-en-proceso',
    resuelto: 'badge-resuelto',
    baja: 'bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full',
    media: 'bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
    alta: 'bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full',
  }
  return <span className={map[text] || map[type]}>{text}</span>
}

function TicketModal({ ticket, onClose, onUpdate, isAdmin }) {
  const [estado, setEstado] = useState(ticket.estado)
  const [prioridad, setPrioridad] = useState(ticket.prioridad)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const updated = await ticketsApi.update(ticket.id, { estado, prioridad })
    onUpdate(updated.data)
    onClose()
    setSaving(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h3 className="font-bold text-white">Ticket #{ticket.id}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none transition-colors">&times;</button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Equipo</p><p className="font-medium text-white">{ticket.equipo_nombre}</p></div>
            <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Laboratorio</p><p className="font-medium text-white">{ticket.laboratorio}</p></div>
            <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Tipo de falla</p><p className="font-medium text-white">{ticket.tipo_falla}</p></div>
            <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Reportado por</p><p className="font-medium text-white">{ticket.usuario_nombre}</p></div>
            <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Fecha</p><p className="font-medium text-white">{new Date(ticket.fecha).toLocaleDateString('es-MX')}</p></div>
            {ticket.fecha_resolucion && (
              <div><p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Resuelto</p><p className="font-medium text-white">{new Date(ticket.fecha_resolucion).toLocaleDateString('es-MX')}</p></div>
            )}
          </div>
          <div>
            <p className="text-slate-400 text-xs mb-1 uppercase tracking-wider">Descripción</p>
            <p className="text-sm text-slate-200 bg-white/8 rounded-lg p-3 leading-relaxed">{ticket.descripcion}</p>
          </div>
          {isAdmin && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/10">
              <div>
                <label className="label">Estado</label>
                <select className="input" value={estado} onChange={e => setEstado(e.target.value)}>
                  {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Prioridad</label>
                <select className="input" value={prioridad} onChange={e => setPrioridad(e.target.value)}>
                  {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
          )}
        </div>
        {isAdmin && (
          <div className="px-6 py-4 border-t border-white/10 flex gap-3 justify-end">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Tickets() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [soloMios, setSoloMios] = useState(!isAdmin)
  const [selected, setSelected] = useState(null)
  const [sortPrioridad, setSortPrioridad] = useState(false)
  const [sortEstado, setSortEstado] = useState(false)

  useEffect(() => {
    const fn = soloMios ? ticketsApi.getMios : ticketsApi.getAll
    fn().then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [soloMios])

  let filtrado = lista.filter(t => {
    const matchEstado = !filtroEstado || t.estado === filtroEstado
    const matchPrioridad = !filtroPrioridad || t.prioridad === filtroPrioridad
    return matchEstado && matchPrioridad
  })

  if (sortPrioridad) {
    filtrado = [...filtrado].sort((a, b) => PRIORIDAD_ORDER[a.prioridad] - PRIORIDAD_ORDER[b.prioridad])
  } else if (sortEstado) {
    filtrado = [...filtrado].sort((a, b) => ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado])
  }

  const handleUpdate = (updated) => {
    setLista(prev => prev.map(t => t.id === updated.id ? updated : t))
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Tickets de Mantenimiento</h1>
        <p className="page-subtitle">{filtrado.length} ticket{filtrado.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filtros */}
      <div className="card py-3">
        <div className="flex flex-wrap gap-3 items-center">
          {isAdmin && (
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input type="checkbox" checked={!soloMios} onChange={e => setSoloMios(!e.target.checked)} className="rounded" />
              Ver todos los tickets
            </label>
          )}
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input max-w-[180px]">
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroPrioridad} onChange={e => setFiltroPrioridad(e.target.value)} className="input max-w-[180px]">
            <option value="">Todas las prioridades</option>
            {PRIORIDADES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Tabla */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Equipo</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Laboratorio</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Tipo</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider cursor-pointer select-none hover:bg-primary-100 transition-colors group"
                  onClick={() => { setSortEstado(s => !s); setSortPrioridad(false) }}
                  title={sortEstado ? 'Clic para restablecer orden' : 'Clic para ordenar: pendiente → en proceso → resuelto'}
                >
                  Estado <span className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity">{sortEstado ? '↑' : '⇅'}</span>
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider cursor-pointer select-none hover:bg-primary-100 transition-colors group"
                  onClick={() => { setSortPrioridad(s => !s); setSortEstado(false) }}
                  title={sortPrioridad ? 'Clic para restablecer orden' : 'Clic para ordenar: alta → media → baja'}
                >
                  Prioridad <span className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity">{sortPrioridad ? '↑' : '⇅'}</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Fecha</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Reportado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrado.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Sin tickets</td></tr>
              ) : filtrado.map((t, i) => (
                <tr
                  key={t.id}
                  onClick={() => setSelected(t)}
                  className={`cursor-pointer hover:bg-blue-50/50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                >
                  <td className="px-4 py-3 text-gray-400 font-mono">#{t.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.equipo_nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{t.laboratorio}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{t.tipo_falla}</td>
                  <td className="px-4 py-3"><Badge text={t.estado} /></td>
                  <td className="px-4 py-3"><Badge text={t.prioridad} type={t.prioridad} /></td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(t.fecha).toLocaleDateString('es-MX')}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px] truncate">{t.usuario_nombre}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <TicketModal
          ticket={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          isAdmin={isAdmin}
        />
      )}
    </div>
  )
}
