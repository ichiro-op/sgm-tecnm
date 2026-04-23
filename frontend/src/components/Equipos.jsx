import { useEffect, useState, useRef, useMemo } from 'react'
import { equipos as equiposApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import FormatoModal from './FormatoModal'

const LABS_DEFAULT = ['Gastronomía', 'Básicas', 'Electromecánica', 'Industrial', 'Impresoras 3D', 'Química Orgánica']
const ESTADOS = ['funcional', 'en mantenimiento', 'fuera de servicio']
const ESTADO_ORDER = { 'fuera de servicio': 0, 'en mantenimiento': 1, 'funcional': 2 }

const LAB_COLORS = {
  'Gastronomía':     { dot: 'bg-amber-400',    row: 'border-l-amber-400',    header: 'bg-amber-50 text-amber-800',    badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  'Básicas':         { dot: 'bg-blue-400',     row: 'border-l-blue-400',     header: 'bg-blue-50 text-blue-800',     badge: 'bg-blue-100 text-blue-700 border-blue-200' },
  'Electromecánica': { dot: 'bg-green-500',    row: 'border-l-green-500',    header: 'bg-green-50 text-green-800',   badge: 'bg-green-100 text-green-700 border-green-200' },
  'Industrial':      { dot: 'bg-purple-400',   row: 'border-l-purple-400',   header: 'bg-purple-50 text-purple-800', badge: 'bg-purple-100 text-purple-700 border-purple-200' },
  'Impresoras 3D':   { dot: 'bg-cyan-400',     row: 'border-l-cyan-400',     header: 'bg-cyan-50 text-cyan-800',     badge: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  'Química Orgánica':{ dot: 'bg-emerald-500',  row: 'border-l-emerald-500',  header: 'bg-emerald-50 text-emerald-800', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

const LAB_PREFIXES = {
  'Gastronomía': 'GAS', 'Básicas': 'BAS', 'Electromecánica': 'ELC',
  'Industrial': 'IND', 'Impresoras 3D': 'IMP', 'Química Orgánica': 'QOR',
}

const EXTRA_COLOR_PALETTE = [
  { dot: 'bg-rose-400',   row: 'border-l-rose-400',   header: 'bg-rose-50 text-rose-800',    badge: 'bg-rose-100 text-rose-700 border-rose-200' },
  { dot: 'bg-violet-400', row: 'border-l-violet-400', header: 'bg-violet-50 text-violet-800', badge: 'bg-violet-100 text-violet-700 border-violet-200' },
  { dot: 'bg-orange-400', row: 'border-l-orange-400', header: 'bg-orange-50 text-orange-800', badge: 'bg-orange-100 text-orange-700 border-orange-200' },
  { dot: 'bg-teal-400',   row: 'border-l-teal-400',   header: 'bg-teal-50 text-teal-800',     badge: 'bg-teal-100 text-teal-700 border-teal-200' },
  { dot: 'bg-pink-400',   row: 'border-l-pink-400',   header: 'bg-pink-50 text-pink-800',    badge: 'bg-pink-100 text-pink-700 border-pink-200' },
  { dot: 'bg-sky-400',    row: 'border-l-sky-400',    header: 'bg-sky-50 text-sky-800',      badge: 'bg-sky-100 text-sky-700 border-sky-200' },
  { dot: 'bg-lime-500',   row: 'border-l-lime-500',   header: 'bg-lime-50 text-lime-800',    badge: 'bg-lime-100 text-lime-700 border-lime-200' },
]

const FORMATOS = [
  { id: '01', nombre: 'Lista de Verificación de Infraestructura y Equipo', codigo: 'TecNM-AD-PO-001-01' },
  { id: '02', nombre: 'Solicitud de Mantenimiento Correctivo',              codigo: 'TecNM-AD-PO-001-02' },
  { id: '03', nombre: 'Programa de Mantenimiento Preventivo',               codigo: 'TecNM-AD-PO-001-03' },
  { id: '04', nombre: 'Orden de Trabajo de Mantenimiento',                  codigo: 'TecNM-AD-PO-001-04' },
  { id: '05', nombre: 'Orden de Compra del Bien o Servicio',                codigo: 'TecNM-AD-IT-001-05' },
]

function buildColorMap(labs) {
  const map = {}
  const extras = labs.filter(l => !LAB_COLORS[l])
  labs.forEach(lab => {
    if (LAB_COLORS[lab]) {
      map[lab] = LAB_COLORS[lab]
    } else {
      const idx = extras.indexOf(lab)
      map[lab] = EXTRA_COLOR_PALETTE[idx % EXTRA_COLOR_PALETTE.length]
    }
  })
  return map
}

function BadgeEstado({ estado }) {
  const map = { 'funcional': 'badge-funcional', 'en mantenimiento': 'badge-mantenimiento', 'fuera de servicio': 'badge-fuera' }
  return <span className={map[estado] || 'badge-funcional'}>{estado}</span>
}

function NombreTooltip({ nombre, imagen, children }) {
  const [show, setShow] = useState(false)
  return (
    <div
      className="relative"
      onMouseEnter={() => imagen && setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && imagen && (
        <div className="absolute z-50 left-0 top-7 bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 pointer-events-none">
          <img src={imagen} alt={nombre} className="w-28 h-28 object-cover rounded-lg" />
        </div>
      )}
    </div>
  )
}

function SolicitudDropdown({ equipo, onSelectFormato }) {
  const [open, setOpen] = useState(false)
  const ref = useRef()

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(s => !s) }}
        className="text-xs px-2.5 py-1 bg-primary-50 text-primary-700 rounded-lg hover:bg-primary-100 border border-primary-200 font-medium whitespace-nowrap transition-colors cursor-pointer"
      >
        Solicitar ▾
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-1 w-76 min-w-[300px] bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl py-1">
          <p className="px-4 py-2 text-xs text-slate-400 font-semibold uppercase tracking-wider border-b border-white/10 truncate">
            {equipo.nombre}
          </p>
          {FORMATOS.map(f => (
            <button
              key={f.id}
              onClick={() => { onSelectFormato(f.id); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <div className="text-sm font-medium text-white">{f.nombre}</div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{f.codigo}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function CeldaEditable({ value, options, onChange, readOnly }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const ref = useRef()

  useEffect(() => { setLocal(value) }, [value])

  const commit = () => { setEditing(false); if (local !== value) onChange(local) }

  if (readOnly) return <span className="text-sm text-gray-700">{value}</span>

  if (!editing) {
    return (
      <span
        className="text-sm text-gray-700 cursor-pointer hover:bg-primary-50 px-1 rounded"
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 50) }}
      >
        {value || <span className="text-gray-300 italic">Clic para editar</span>}
      </span>
    )
  }

  if (options) {
    return (
      <select ref={ref} value={local} onChange={e => setLocal(e.target.value)} onBlur={commit} autoFocus
        className="text-sm border border-primary-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  return (
    <input ref={ref} value={local} onChange={e => setLocal(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLocal(value); setEditing(false) } }}
      autoFocus className="text-sm border border-primary-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full" />
  )
}

export default function Equipos() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroLab, setFiltroLab] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [sortEstado, setSortEstado] = useState(false)
  const [nuevoLab, setNuevoLab] = useState('')
  const [mostrarNuevoLab, setMostrarNuevoLab] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', laboratorio: LABS_DEFAULT[0], estado: 'funcional', numero_serie: '', imagen: '' })

  const [formatoModal, setFormatoModal] = useState(null) // { equipo, formatoId }

  const labsDisponibles = [...new Set([...LABS_DEFAULT, ...lista.map(e => e.laboratorio)])].sort()
  const colorMap = useMemo(() => buildColorMap(labsDisponibles), [labsDisponibles])
  const getColor = (lab) => colorMap[lab] || EXTRA_COLOR_PALETTE[0]

  useEffect(() => {
    equiposApi.getAll().then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [])

  const autoSerial = (lab) => {
    const prefix = LAB_PREFIXES[lab] || lab.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
    const count = lista.filter(e => e.laboratorio === lab).length + 1
    return `${prefix}-${String(count).padStart(3, '0')}`
  }

  const actualizar = async (id, campo, valor) => {
    const eq = lista.find(e => e.id === id)
    const updated = { ...eq, [campo]: valor }
    await equiposApi.update(id, updated)
    setLista(prev => prev.map(e => e.id === id ? updated : e))
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await equiposApi.delete(id)
    setLista(prev => prev.filter(e => e.id !== id))
  }

  const crearEquipo = async (e) => {
    e.preventDefault()
    const labFinal = mostrarNuevoLab ? nuevoLab.trim() : nuevo.laboratorio
    const data = { ...nuevo, laboratorio: labFinal }
    if (!data.numero_serie) data.numero_serie = autoSerial(labFinal)
    const r = await equiposApi.create(data)
    setLista(prev => [...prev, r.data])
    setShowForm(false)
    setNuevo({ nombre: '', laboratorio: LABS_DEFAULT[0], estado: 'funcional', numero_serie: '', imagen: '' })
    setNuevoLab('')
    setMostrarNuevoLab(false)
  }

  let filtrado = lista.filter(e => {
    const q = busqueda.toLowerCase()
    return (e.nombre.toLowerCase().includes(q) || (e.numero_serie || '').toLowerCase().includes(q))
      && (!filtroLab || e.laboratorio === filtroLab)
      && (!filtroEstado || e.estado === filtroEstado)
  })

  filtrado = [...filtrado].sort((a, b) => {
    const labCmp = a.laboratorio.localeCompare(b.laboratorio)
    if (labCmp !== 0) return labCmp
    if (sortEstado) return ESTADO_ORDER[a.estado] - ESTADO_ORDER[b.estado]
    return 0
  })

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  )

  // Filas con encabezados de grupo
  const rows = []
  let currentLab = null
  filtrado.forEach(eq => {
    if (eq.laboratorio !== currentLab) {
      currentLab = eq.laboratorio
      const count = filtrado.filter(e => e.laboratorio === currentLab).length
      rows.push({ type: 'header', lab: currentLab, count })
    }
    rows.push({ type: 'row', eq })
  })

  const colSpan = isAdmin ? 7 : 6

  return (
    <div className="space-y-4">
      {/* Encabezado */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">Equipos</h1>
          <p className="page-subtitle">
            {lista.length} equipos registrados{isAdmin && ' · Clic en celda para editar'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(s => !s)} className="btn-primary">
            {showForm ? '✕ Cancelar' : '+ Agregar equipo'}
          </button>
        )}
      </div>

      {/* Leyenda / filtro rápido por lab */}
      <div className="flex flex-wrap gap-2">
        {labsDisponibles.map(lab => {
          const c = getColor(lab)
          const active = filtroLab === lab
          return (
            <button
              key={lab}
              onClick={() => setFiltroLab(active ? '' : lab)}
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-all cursor-pointer ${c.badge} ${active ? 'ring-2 ring-offset-1 ring-primary-400 shadow-sm' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${c.dot}`}></span>
              {lab}
            </button>
          )
        })}
      </div>
      {/* Filtros */}
      <div className="card py-3 no-zoom">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Buscar por nombre o serie..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            className="input max-w-xs"
          />
          <select value={filtroLab} onChange={e => setFiltroLab(e.target.value)} className="input max-w-xs">
            <option value="">Todos los laboratorios</option>
            {labsDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
          <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)} className="input max-w-xs">
            <option value="">Todos los estados</option>
            {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Formulario nuevo equipo */}
      {showForm && isAdmin && (
        <div className="card border-2 border-primary-200 no-zoom">
          <h3 className="font-semibold text-slate-800 mb-4">Nuevo equipo</h3>
          <form onSubmit={crearEquipo} className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input" required value={nuevo.nombre}
                onChange={e => setNuevo(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: Torno CNC" />
            </div>
            <div>
              <label className="label">Laboratorio *</label>
              {mostrarNuevoLab ? (
                <div className="flex gap-2">
                  <input
                    className="input flex-1"
                    required
                    value={nuevoLab}
                    onChange={e => setNuevoLab(e.target.value)}
                    placeholder="Nombre del laboratorio"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => { setMostrarNuevoLab(false); setNuevoLab('') }}
                    className="text-gray-400 hover:text-gray-600 px-2 text-sm"
                  >✕</button>
                </div>
              ) : (
                <select className="input" value={nuevo.laboratorio} onChange={e => {
                  if (e.target.value === '__nuevo__') { setMostrarNuevoLab(true) }
                  else { setNuevo(p => ({ ...p, laboratorio: e.target.value, numero_serie: '' })) }
                }}>
                  {labsDisponibles.map(l => <option key={l} value={l}>{l}</option>)}
                  <option value="__nuevo__">+ Agregar laboratorio...</option>
                </select>
              )}
            </div>
            <div>
              <label className="label">Estado</label>
              <select className="input" value={nuevo.estado} onChange={e => setNuevo(p => ({ ...p, estado: e.target.value }))}>
                {ESTADOS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="label">
                Nº Serie <span className="text-gray-400 font-normal text-xs">(auto si vacío)</span>
              </label>
              <input
                className="input"
                value={nuevo.numero_serie}
                onChange={e => setNuevo(p => ({ ...p, numero_serie: e.target.value }))}
                placeholder={autoSerial(mostrarNuevoLab ? (nuevoLab || 'EQ') : nuevo.laboratorio)}
              />
            </div>
            <div className="flex items-end">
              <button type="submit" className="btn-primary w-full">Guardar equipo</button>
            </div>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="card p-0 overflow-hidden no-zoom">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50 border-b border-gray-200">
              <tr>
                <th className="w-1 p-0"></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Laboratorio</th>
                <th
                  className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider cursor-pointer select-none hover:bg-primary-100 transition-colors group"
                  onClick={() => setSortEstado(s => !s)}
                  title={sortEstado ? 'Clic para restablecer orden' : 'Clic para ordenar: fuera de servicio → mantenimiento → funcional'}
                >
                  Estado <span className="ml-1 opacity-40 group-hover:opacity-100 transition-opacity">{sortEstado ? '↑' : '⇅'}</span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Nº Serie</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider w-28">Solicitar</th>
                {isAdmin && <th className="px-4 py-3 w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrado.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">Sin equipos encontrados</td>
                </tr>
              ) : rows.map((row, idx) => {
                if (row.type === 'header') {
                  const c = getColor(row.lab)
                  return (
                    <tr key={`h-${row.lab}`} className={c.header}>
                      <td colSpan={colSpan} className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`}></span>
                          <span className="font-semibold text-xs uppercase tracking-wider">{row.lab}</span>
                          <span className="text-xs opacity-50">{row.count} equipo{row.count !== 1 ? 's' : ''}</span>
                        </div>
                      </td>
                    </tr>
                  )
                }

                const { eq } = row
                const c = getColor(eq.laboratorio)
                return (
                  <tr key={eq.id} className="hover:bg-blue-50/40 transition-colors bg-white">
                    <td className={`w-1 p-0 border-l-4 ${c.row}`}></td>
                    <td className="px-4 py-2.5 min-w-[180px]">
                      <NombreTooltip nombre={eq.nombre} imagen={eq.imagen}>
                        <CeldaEditable
                          value={eq.nombre}
                          onChange={v => actualizar(eq.id, 'nombre', v)}
                          readOnly={!isAdmin}
                        />
                      </NombreTooltip>
                    </td>
                    <td className="px-4 py-2.5 min-w-[150px]">
                      <CeldaEditable
                        value={eq.laboratorio}
                        options={labsDisponibles}
                        onChange={v => actualizar(eq.id, 'laboratorio', v)}
                        readOnly={!isAdmin}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      {isAdmin
                        ? <CeldaEditable value={eq.estado} options={ESTADOS} onChange={v => actualizar(eq.id, 'estado', v)} />
                        : <BadgeEstado estado={eq.estado} />}
                    </td>
                    <td className="px-4 py-2.5 min-w-[120px]">
                      <CeldaEditable
                        value={eq.numero_serie}
                        onChange={v => actualizar(eq.id, 'numero_serie', v)}
                        readOnly={!isAdmin}
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <SolicitudDropdown
                        equipo={eq}
                        onSelectFormato={(fid) => setFormatoModal({ equipo: eq, formatoId: fid })}
                      />
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-2.5">
                        <button
                          onClick={() => eliminar(eq.id)}
                          className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                          title="Eliminar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        </button>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
          {filtrado.length} de {lista.length} equipos
        </div>
      </div>

      {/* Formato modal */}
      {formatoModal && (
        <FormatoModal
          equipo={formatoModal.equipo}
          formatoId={formatoModal.formatoId}
          onClose={() => setFormatoModal(null)}
        />
      )}
    </div>
  )
}
