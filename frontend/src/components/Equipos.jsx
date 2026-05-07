import { useEffect, useLayoutEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { equipos as equiposApi, labs as labsApi, historial as historialApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import { useVisual } from '../context/VisualContext'
import FormatoModal from './FormatoModal'

const API_BASE = import.meta.env.VITE_API_URL || ''

const ESTADOS = ['funcional', 'en mantenimiento', 'fuera de servicio']
const ESTADO_ORDER = { 'fuera de servicio': 0, 'en mantenimiento': 1, 'funcional': 2 }

// ── Color helpers ──────────────────────────────────────────────────
function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r},${g},${b},${alpha})`
}

function makeLabStyle(hex) {
  return {
    hex,
    dotStyle:    { backgroundColor: hex },
    rowStyle:    { borderLeftColor: hex },
    headerStyle: { backgroundColor: hexToRgba(hex, 0.10), color: hex },
    badgeStyle:  { backgroundColor: hexToRgba(hex, 0.15), color: hex, borderColor: hexToRgba(hex, 0.45) },
  }
}

const FORMATOS = [
  { id: '01', nombre: 'Lista de Verificación de Infraestructura y Equipo', codigo: 'TecNM-AD-PO-001-01' },
  { id: '02', nombre: 'Solicitud de Mantenimiento Correctivo',              codigo: 'TecNM-AD-PO-001-02' },
  { id: '03', nombre: 'Programa de Mantenimiento Preventivo',               codigo: 'TecNM-AD-PO-001-03' },
  { id: '04', nombre: 'Orden de Trabajo de Mantenimiento',                  codigo: 'TecNM-AD-PO-001-04' },
  { id: '05', nombre: 'Orden de Compra del Bien o Servicio',                codigo: 'TecNM-AD-IT-001-05' },
]

// ── Lab Editor Modal ───────────────────────────────────────────────
function LabEditorModal({ labs, equipos, onSave, onClose }) {
  const [editLabs, setEditLabs] = useState(labs.map(l => ({ ...l })))
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [confirmIdx, setConfirmIdx] = useState(null) // índice pendiente de confirmar

  const update = (i, field, val) =>
    setEditLabs(prev => prev.map((l, j) => j === i ? { ...l, [field]: val } : l))

  const addLab = () => {
    setConfirmIdx(null)
    setEditLabs(prev => [...prev, { nombre: 'Nuevo laboratorio', color: '#6366f1', prefix: 'LAB' }])
  }

  const requestRemove = (i) => {
    setConfirmIdx(i)   // muestra confirmación inline
  }

  const confirmRemove = () => {
    setEditLabs(prev => prev.filter((_, j) => j !== confirmIdx))
    setConfirmIdx(null)
  }

  const cancelRemove = () => setConfirmIdx(null)

  const equiposEnLab = (labNombre) =>
    (equipos || []).filter(e => e.laboratorio === labNombre).length

  const handleSave = async () => {
    const valid = editLabs.filter(l => l.nombre.trim())
    setSaving(true)
    setError('')
    try {
      await onSave(valid)
      onClose()
    } catch (e) {
      setError('No se pudo guardar. Verifica la conexión e intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-800">Editar áreas</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">✕</button>
        </div>

        {/* Lab list */}
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          <p className="text-xs text-gray-400 mb-3">Haz clic en el color para cambiarlo. El prefijo se usa en el número de serie.</p>
          {editLabs.map((lab, i) => {
            const count    = equiposEnLab(lab.nombre)
            const tieneEq  = count > 0
            const pidiendo = confirmIdx === i

            return (
              <div key={i} className={`rounded-xl border transition-colors ${pidiendo ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'} group`}>
                {/* Fila principal */}
                <div className="flex items-center gap-2 p-2.5">
                  {/* Color picker */}
                  <label className="cursor-pointer relative flex-shrink-0" title="Cambiar color">
                    <span className="w-9 h-9 rounded-lg border-2 border-white shadow-sm block transition-transform group-hover:scale-105"
                      style={{ backgroundColor: lab.color }} />
                    <input type="color" value={lab.color}
                      onChange={e => update(i, 'color', e.target.value)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                  </label>
                  {/* Name */}
                  <input
                    className="flex-1 text-sm font-medium bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary-400"
                    value={lab.nombre}
                    onChange={e => update(i, 'nombre', e.target.value)}
                    placeholder="Nombre del área"
                  />
                  {/* Prefix */}
                  <input
                    className="w-16 text-xs font-mono bg-white border border-gray-200 rounded-lg px-2 py-1.5 text-center focus:outline-none focus:ring-1 focus:ring-primary-400 uppercase tracking-widest"
                    value={lab.prefix}
                    onChange={e => update(i, 'prefix', e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 5))}
                    placeholder="PRE"
                    title="Prefijo para número de serie"
                  />
                  {/* Delete button */}
                  {tieneEq ? (
                    <button
                      disabled
                      title={`No se puede eliminar: tiene ${count} equipo${count !== 1 ? 's' : ''}`}
                      className="p-1 rounded-lg flex-shrink-0 text-gray-300 cursor-not-allowed">
                      <IconTrash />
                    </button>
                  ) : (
                    <button
                      onClick={() => pidiendo ? cancelRemove() : requestRemove(i)}
                      className={`p-1 rounded-lg flex-shrink-0 transition-colors ${pidiendo ? 'text-red-600 bg-red-100' : 'text-red-400 hover:text-red-600 hover:bg-red-50'}`}
                      title={pidiendo ? 'Cancelar' : 'Eliminar área'}>
                      <IconTrash />
                    </button>
                  )}
                </div>

                {/* Confirmación inline */}
                {pidiendo && (
                  <div className="px-3 pb-3 flex items-center justify-between gap-2">
                    <p className="text-xs text-red-700 font-medium">¿Eliminar el área "{lab.nombre}"?</p>
                    <div className="flex gap-1.5">
                      <button onClick={cancelRemove}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 transition-colors">
                        Cancelar
                      </button>
                      <button onClick={confirmRemove}
                        className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors font-medium">
                        Sí, eliminar
                      </button>
                    </div>
                  </div>
                )}

                {/* Aviso de equipos asignados */}
                {tieneEq && (
                  <p className="px-3 pb-2 text-[11px] text-amber-600">
                    ⚠ Tiene {count} equipo{count !== 1 ? 's' : ''} asignado{count !== 1 ? 's' : ''} — reasígnalos antes de eliminar.
                  </p>
                )}
              </div>
            )
          })}
          <button onClick={addLab}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-500 text-sm font-medium transition-colors">
            + Agregar área
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-2">
          {error
            ? <p className="text-xs text-red-600">{error}</p>
            : <span />
          }
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function BadgeEstado({ estado }) {
  const map = { 'funcional': 'badge-funcional', 'en mantenimiento': 'badge-mantenimiento', 'fuera de servicio': 'badge-fuera' }
  return <span className={map[estado] || 'badge-funcional'}>{estado}</span>
}

// Solo un tooltip visible a la vez
let _activeTooltipHide = null

function NombreTooltip({ nombre, imagen, detalles, children }) {
  const [show, setShow]   = useState(false)
  const [pos,  setPos]    = useState({ top: 0, left: 0 })
  const hideTimer          = useRef()
  const triggerRef         = useRef()
  const imgSrc             = imagen ? `${API_BASE}${imagen}` : null
  const hasContent         = imgSrc || detalles?.length > 0

  const hide = useCallback(() => {
    clearTimeout(hideTimer.current)
    setShow(false)
  }, [])

  const calcAndShow = () => {
    if (!hasContent) return
    if (_activeTooltipHide && _activeTooltipHide !== hide) _activeTooltipHide()
    _activeTooltipHide = hide

    if (triggerRef.current) {
      const rect   = triggerRef.current.getBoundingClientRect()
      // Estimated tooltip height: 140px for image + ~20px per detail line + padding
      const estH   = (imgSrc ? 148 : 0) + Math.min((detalles?.length || 0) * 22, 200) + 24
      const above  = rect.bottom + estH + 8 > window.innerHeight
      setPos({
        top:  above ? rect.top - estH - 4 : rect.bottom + 4,
        left: Math.max(4, Math.min(rect.left, window.innerWidth - 296)),
      })
    }
    setShow(true)
  }

  const handleEnter = () => {
    clearTimeout(hideTimer.current)
    calcAndShow()
  }

  const handleLeave = () => {
    hideTimer.current = setTimeout(() => {
      setShow(false)
      if (_activeTooltipHide === hide) _activeTooltipHide = null
    }, 150)
  }

  const tooltip = show && hasContent && createPortal(
    <div
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, maxWidth: 288 }}
      className="bg-slate-900/95 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl p-3 animate-tooltip-in"
      onMouseEnter={() => clearTimeout(hideTimer.current)}
      onMouseLeave={handleLeave}
    >
      {imgSrc && <img src={imgSrc} alt={nombre} className="w-28 h-28 object-cover rounded-lg mb-2" />}
      {detalles?.length > 0 && (
        <ul className="text-xs text-slate-300 space-y-0.5 max-h-48 overflow-auto">
          {detalles.map((d, i) => <li key={i} className="leading-tight">• {d}</li>)}
        </ul>
      )}
    </div>,
    document.body
  )

  return (
    <div ref={triggerRef} className="select-none" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {tooltip}
    </div>
  )
}

function SolicitudDropdown({ equipo, onSelectFormato }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: -9999, left: 0 })
  const [openUp, setOpenUp] = useState(false)
  const btnRef = useRef()
  const menuRef = useRef()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (btnRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Position menu after it renders — using portal so backdrop-filter doesn't break fixed
  useLayoutEffect(() => {
    if (!open || !btnRef.current || !menuRef.current) return
    const btn   = btnRef.current.getBoundingClientRect()
    const menuH = menuRef.current.offsetHeight
    const up = btn.bottom + menuH + 8 > window.innerHeight
    setOpenUp(up)
    setPos({
      top:  up ? btn.top - menuH - 4 : btn.bottom + 4,
      left: Math.max(4, Math.min(btn.right - 220, window.innerWidth - 228)),
    })
  }, [open])

  const menu = open && createPortal(
    <div
      ref={menuRef}
      style={{ position: 'fixed', top: pos.top, left: pos.left, zIndex: 9999, width: 220 }}
      className={`bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl py-1 ${openUp ? 'animate-dropdown-in-up' : 'animate-dropdown-in'}`}
    >
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
    </div>,
    document.body
  )

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setOpen(s => !s) }}
        className="text-xs px-2.5 py-1 bg-primary-100 text-primary-800 rounded-lg hover:bg-primary-200 border border-primary-400 font-semibold whitespace-nowrap transition-colors cursor-pointer"
      >
        Solicitar ▾
      </button>
      {menu}
    </>
  )
}

function CeldaEditable({ value, options, onChange, readOnly }) {
  const [editing, setEditing] = useState(false)
  const [local, setLocal] = useState(value)
  const ref = useRef()

  useEffect(() => { setLocal(value) }, [value])

  useEffect(() => {
    if (!editing) return
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setEditing(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [editing])

  const commit = () => { setEditing(false); if (local !== value) onChange(local) }

  const ESTADO_BADGE = {
    'funcional':         'bg-emerald-200 text-emerald-900 border border-emerald-400',
    'en mantenimiento':  'bg-amber-200 text-amber-900 border border-amber-400',
    'fuera de servicio': 'bg-red-200 text-red-900 border border-red-400',
  }
  const isEstado = options?.includes('funcional')

  if (readOnly) {
    if (isEstado) return (
      <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${ESTADO_BADGE[value] || 'bg-gray-100 text-gray-700 border border-gray-300'}`}>
        {value}
      </span>
    )
    return <span className="text-sm text-gray-700">{value}</span>
  }

  if (!editing) {
    if (isEstado) return (
      <span
        className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${ESTADO_BADGE[value] || 'bg-gray-100 text-gray-700 border border-gray-300'}`}
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 50) }}
      >
        {value}
      </span>
    )
    return (
      <span
        className="text-sm text-gray-700 cursor-pointer hover:text-primary-700 hover:underline decoration-primary-400 underline-offset-2 px-1 rounded"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', MozUserSelect: 'none', msUserSelect: 'none' }}
        onClick={() => { setEditing(true); setTimeout(() => ref.current?.focus(), 50) }}
      >
        {value || <span className="text-gray-300 italic">Clic para editar</span>}
      </span>
    )
  }

  if (options) {
    const BADGE = ESTADO_BADGE
    if (isEstado) {
      return (
        <div className="relative" ref={ref}>
          <div className="flex flex-col gap-1 absolute z-50 left-0 top-0 bg-white border border-primary-200 rounded-xl shadow-xl p-1.5 min-w-[170px] animate-popup-in">
            {options.map(o => (
              <button key={o}
                className={`text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer text-left transition-all hover:scale-[1.03] ${BADGE[o] || 'bg-gray-100 text-gray-800 border border-gray-300'} ${local === o ? 'ring-2 ring-primary-400' : ''}`}
                onMouseDown={e => { e.preventDefault(); setLocal(o); setTimeout(() => { onChange(o); setEditing(false) }, 50) }}
              >{o}</button>
            ))}
          </div>
        </div>
      )
    }
    return (
      <select ref={ref} value={local} onChange={e => setLocal(e.target.value)} onBlur={commit} autoFocus
        className="text-sm text-gray-900 bg-white border border-primary-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    )
  }

  return (
    <input ref={ref} value={local} onChange={e => setLocal(e.target.value)} onBlur={commit}
      onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLocal(value); setEditing(false) } }}
      autoFocus className="text-sm text-gray-900 bg-white border border-primary-400 rounded px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-primary-500 w-full" />
  )
}

// ── Icon components ───────────────────────────────────────────────
function IconTable() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M3 15h18M9 3v18"/>
    </svg>
  )
}

function IconGrid() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
      <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
    </svg>
  )
}

function IconCamera() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function IconTrash() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
    </svg>
  )
}

function IconPencil() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  )
}

// ── Equipment Edit Modal ───────────────────────────────────────────
function EquipoEditModal({ eq, labs, onSave, onClose }) {
  const { isVisual } = useVisual()
  const [tab, setTab]   = useState('editar') // 'editar' | 'historial'
  const [form, setForm] = useState({
    nombre:       eq.nombre       || '',
    laboratorio:  eq.laboratorio  || '',
    estado:       eq.estado       || 'funcional',
    numero_serie: eq.numero_serie || '',
  })
  const [detalles, setDetalles] = useState(eq.detalles || [])
  const [saving, setSaving]     = useState(false)
  const [hist, setHist]         = useState([])
  const [histLoading, setHistLoading] = useState(false)
  const dragIdx = useRef(null)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  // Load historial when switching to that tab
  useEffect(() => {
    if (tab !== 'historial') return
    setHistLoading(true)
    historialApi.getByEquipo(eq.id)
      .then(r => setHist(r.data))
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [tab, eq.id])

  const handleSave = async () => {
    setSaving(true)
    try { await onSave(eq.id, { ...form, detalles }); onClose() }
    finally { setSaving(false) }
  }

  // ── Drag & drop handlers ──
  const onDragStart = (i) => { dragIdx.current = i }
  const onDragOver  = (e, i) => {
    e.preventDefault()
    if (dragIdx.current === null || dragIdx.current === i) return
    const next = [...detalles]
    const [item] = next.splice(dragIdx.current, 1)
    next.splice(i, 0, item)
    dragIdx.current = i
    setDetalles(next)
  }
  const onDragEnd = () => { dragIdx.current = null }

  const addDetalle    = () => setDetalles(p => [...p, ''])
  const removeDetalle = (i) => setDetalles(p => p.filter((_, j) => j !== i))
  const editDetalle   = (i, v) => setDetalles(p => p.map((d, j) => j === i ? v : d))

  // ── Historial helpers ──
  const fmtFecha = (iso) => new Date(iso).toLocaleDateString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
  const CAMPO_LABEL = { nombre: 'Nombre', laboratorio: 'Laboratorio', estado: 'Estado', numero_serie: 'N° Serie', detalles: 'Detalles' }

  // ── Style tokens ──
  const glass      = isVisual
  const panelCls   = glass ? 'bg-slate-900/80 backdrop-blur-xl border border-white/15 shadow-2xl' : 'bg-white shadow-2xl'
  const headerCls  = glass ? 'border-white/10' : 'border-gray-100'
  const titleCls   = glass ? 'text-white'       : 'text-gray-800'
  const closeCls   = glass ? 'text-white/50 hover:text-white hover:bg-white/10' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
  const labelCls   = glass ? 'text-slate-400'   : 'text-gray-500'
  const inputCls   = glass ? 'border-white/15 text-white placeholder-white/30 focus:ring-blue-400' : 'bg-white border-gray-200 text-gray-900 focus:ring-primary-400'
  const inputBg    = glass ? { backgroundColor: 'rgba(255,255,255,0.07)' } : {}
  const footerCls  = glass ? 'border-white/10' : 'border-gray-100'
  const tabActive  = glass ? 'text-white border-b-2 border-primary-400' : 'text-primary-600 border-b-2 border-primary-500'
  const tabInact   = glass ? 'text-slate-500 hover:text-slate-300' : 'text-gray-400 hover:text-gray-600'
  const dragRowCls = glass ? 'bg-white/5 border border-white/10 rounded-lg' : 'bg-gray-50 border border-gray-200 rounded-lg'

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col animate-modal-in ${panelCls}`}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${headerCls}`}>
          <h2 className={`text-base font-bold flex items-center gap-2 ${titleCls}`}>
            <IconPencil /> Editar equipo
          </h2>
          <button onClick={onClose} className={`p-1 rounded-lg transition-colors ${closeCls}`}>✕</button>
        </div>

        {/* Tabs */}
        <div className={`flex gap-4 px-6 border-b ${headerCls}`}>
          {['editar', 'historial'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-xs font-semibold uppercase tracking-wide py-2.5 transition-colors ${tab === t ? tabActive : tabInact}`}>
              {t === 'editar' ? '✏️ Editar' : '🕒 Historial'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {tab === 'editar' ? (
            <div className="space-y-4">
              {/* Nombre */}
              <div>
                <label className={`block text-xs font-semibold mb-1 uppercase tracking-wide ${labelCls}`}>Nombre</label>
                <input className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${inputCls}`}
                  style={inputBg} value={form.nombre} onChange={e => set('nombre', e.target.value)} />
              </div>

              {/* Lab + Estado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-xs font-semibold mb-1 uppercase tracking-wide ${labelCls}`}>Laboratorio</label>
                  <select className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${inputCls}`}
                    style={inputBg} value={form.laboratorio} onChange={e => set('laboratorio', e.target.value)}>
                    {labs.map(l => <option key={l.nombre} value={l.nombre} style={{ background: '#1e293b', color: '#fff' }}>{l.nombre}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-xs font-semibold mb-1 uppercase tracking-wide ${labelCls}`}>Estado</label>
                  <select className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${inputCls}`}
                    style={inputBg} value={form.estado} onChange={e => set('estado', e.target.value)}>
                    {ESTADOS.map(o => <option key={o} value={o} style={{ background: '#1e293b', color: '#fff' }}>{o}</option>)}
                  </select>
                </div>
              </div>

              {/* N° serie */}
              <div>
                <label className={`block text-xs font-semibold mb-1 uppercase tracking-wide ${labelCls}`}>Número de serie</label>
                <input className={`w-full text-sm font-mono border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 ${inputCls}`}
                  style={inputBg} value={form.numero_serie} onChange={e => set('numero_serie', e.target.value)} />
              </div>

              {/* Detalles drag & drop */}
              <div>
                <label className={`block text-xs font-semibold mb-2 uppercase tracking-wide ${labelCls}`}>
                  Detalles <span className={`font-normal normal-case ${glass ? 'text-slate-500' : 'text-gray-400'}`}>(arrastra para reordenar)</span>
                </label>
                <div className="space-y-1.5">
                  {detalles.map((d, i) => (
                    <div key={i} draggable
                      onDragStart={() => onDragStart(i)}
                      onDragOver={e => onDragOver(e, i)}
                      onDragEnd={onDragEnd}
                      className={`flex items-center gap-2 px-2 py-1.5 ${dragRowCls} cursor-grab active:cursor-grabbing`}>
                      {/* Handle */}
                      <svg className={`w-3.5 h-3.5 flex-shrink-0 ${glass ? 'text-slate-600' : 'text-gray-300'}`}
                        fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm-6 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4zm6 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4z"/>
                      </svg>
                      <input
                        className={`flex-1 text-sm bg-transparent border-none outline-none ${glass ? 'text-white placeholder-white/30' : 'text-gray-800'}`}
                        value={d} onChange={e => editDetalle(i, e.target.value)}
                        placeholder="Detalle del equipo…" />
                      <button onClick={() => removeDetalle(i)}
                        className={`flex-shrink-0 p-0.5 rounded transition-colors ${glass ? 'text-slate-600 hover:text-red-400' : 'text-gray-300 hover:text-red-500'}`}>
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={addDetalle}
                  className={`mt-2 text-xs font-medium flex items-center gap-1 transition-colors ${glass ? 'text-primary-400 hover:text-primary-300' : 'text-primary-600 hover:text-primary-800'}`}>
                  + Agregar detalle
                </button>
              </div>
            </div>
          ) : (
            /* ── Historial tab ── */
            <div className="space-y-1">
              {histLoading ? (
                <p className={`text-sm text-center py-8 ${glass ? 'text-slate-500' : 'text-gray-400'}`}>Cargando historial…</p>
              ) : hist.length === 0 ? (
                <p className={`text-sm text-center py-8 ${glass ? 'text-slate-500' : 'text-gray-400'}`}>Sin cambios registrados aún.</p>
              ) : hist.map(h => (
                <div key={h.id} className={`rounded-lg px-3 py-2.5 ${glass ? 'bg-white/5 border border-white/8' : 'bg-gray-50 border border-gray-100'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-xs font-semibold ${glass ? 'text-primary-400' : 'text-primary-600'}`}>
                      {CAMPO_LABEL[h.campo] || h.campo}
                    </span>
                    <span className={`text-[10px] ${glass ? 'text-slate-600' : 'text-gray-400'}`}>{fmtFecha(h.fecha)}</span>
                  </div>
                  <p className={`text-[11px] ${glass ? 'text-slate-400' : 'text-gray-500'}`}>
                    <span className="font-medium">{h.usuarioNombre}</span>
                    {' · '}
                    <span className={`line-through ${glass ? 'text-red-400/70' : 'text-red-400'}`}>
                      {Array.isArray(h.valorAnterior) ? `${h.valorAnterior.length} detalles` : (h.valorAnterior || '—')}
                    </span>
                    {' → '}
                    <span className={glass ? 'text-green-400' : 'text-green-600'}>
                      {Array.isArray(h.valorNuevo) ? `${h.valorNuevo.length} detalles` : (h.valorNuevo || '—')}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {tab === 'editar' && (
          <div className={`flex items-center justify-end gap-2 px-6 py-4 border-t ${footerCls}`}>
            <button onClick={onClose} className={glass ? 'btn-secondary' : 'btn-ghost'}>Cancelar</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Detalles expandibles ──────────────────────────────────────────
function DetallesCard({ detalles }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="text-xs">
      <button
        onClick={() => setOpen(s => !s)}
        className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium transition-colors"
      >
        <svg
          className={`w-3 h-3 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/>
        </svg>
        {open ? 'Ocultar detalles' : 'Ver detalles'}
      </button>
      {open && (
        <ul className="mt-1.5 space-y-0.5 text-gray-600 border-l-2 border-primary-100 pl-2">
          {detalles.map((d, i) => (
            <li key={i} className="leading-tight">{d}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Equipment Card ────────────────────────────────────────────────
function EquipoCard({ eq, isAdmin, getColor, onDelete, onUpload, onSelectFormato, uploading, onUpdate, onEdit }) {
  const c = getColor(eq.laboratorio)
  const imgSrc = eq.imagen ? `${API_BASE}${eq.imagen}` : null
  const fileRef = useRef()

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) onUpload(eq.id, file)
    e.target.value = ''
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
      {/* Photo area */}
      <div className="relative bg-gray-100 aspect-[4/3] overflow-hidden rounded-t-xl">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={eq.nombre}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <rect x="2" y="6" width="20" height="14" rx="2"/><circle cx="12" cy="13" r="3"/>
              <path d="M8 6V5a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v1"/>
            </svg>
            <span className="text-xs font-medium">Sin foto</span>
          </div>
        )}

        {/* Lab badge overlay */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium" style={c.badgeStyle}>
            <span className="w-1.5 h-1.5 rounded-full" style={c.dotStyle}></span>
            {eq.laboratorio}
          </span>
        </div>

        {/* Admin upload button */}
        {isAdmin && (
          <div className="absolute bottom-2 right-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Cambiar foto"
              className="flex items-center gap-1 text-xs px-2 py-1 bg-black/60 hover:bg-black/80 text-white rounded-lg backdrop-blur-sm transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : <IconCamera />}
              <span>{uploading ? 'Subiendo…' : 'Foto'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold text-gray-800 leading-tight line-clamp-2">{eq.nombre}</p>
          {eq.numero_serie && (
            <p className="text-xs text-gray-400 font-mono mt-0.5">{eq.numero_serie}</p>
          )}
        </div>

        {/* Detalles extra expandibles */}
        {eq.detalles?.length > 0 && <DetallesCard detalles={eq.detalles} />}

        <div className="mt-auto flex items-center justify-between gap-2 pt-1 relative">
          <CeldaEditable
            value={eq.estado}
            options={isAdmin ? ESTADOS : null}
            onChange={v => onUpdate(eq.id, 'estado', v)}
            readOnly={!isAdmin}
          />
          <div className="flex items-center gap-1 relative z-10">
            <SolicitudDropdown equipo={eq} onSelectFormato={onSelectFormato} />
            {isAdmin && (
              <>
                <button
                  onClick={() => onEdit(eq)}
                  className="text-primary-400 hover:text-primary-600 p-1 rounded hover:bg-primary-50 transition-colors"
                  title="Editar equipo"
                >
                  <IconPencil />
                </button>
                <button
                  onClick={() => onDelete(eq.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Eliminar"
                >
                  <IconTrash />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Controles de paginación ────────────────────────────────────
function PaginacionControles({ pagina, totalPaginas, totalItems, porPagina, onChange, top }) {
  const borderCls = top ? 'border-b' : 'border-t'
  if (totalPaginas <= 1) return (
    <div className={`px-4 py-2 bg-gray-50 ${borderCls} border-gray-100 text-xs text-gray-400`}>
      {totalItems} equipo{totalItems !== 1 ? 's' : ''}
    </div>
  )
  const desde = (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, totalItems)
  return (
    <div className={`px-4 py-2 bg-gray-50 ${borderCls} border-gray-100 flex items-center justify-between gap-3 flex-wrap`}>
      <span className="text-xs text-gray-500">
        Mostrando <span className="font-semibold text-gray-700">{desde}–{hasta}</span> de <span className="font-semibold text-gray-700">{totalItems}</span> equipos
      </span>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(1)} disabled={pagina === 1}
          className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >«</button>
        <button
          onClick={() => onChange(pagina - 1)} disabled={pagina === 1}
          className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >‹ Anterior</button>
        <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-primary-50 border border-primary-200 rounded">
          {pagina} / {totalPaginas}
        </span>
        <button
          onClick={() => onChange(pagina + 1)} disabled={pagina === totalPaginas}
          className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >Siguiente ›</button>
        <button
          onClick={() => onChange(totalPaginas)} disabled={pagina === totalPaginas}
          className="px-2 py-1 text-xs rounded border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >»</button>
      </div>
    </div>
  )
}

export default function Equipos() {
  const { user } = useAuth()
  const isAdmin = user?.rol === 'admin'
  const [lista, setLista] = useState([])
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroLab, setFiltroLab] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [showLabEditor, setShowLabEditor] = useState(false)
  const [sortEstado, setSortEstado] = useState(false)
  const [nuevoLab, setNuevoLab] = useState('')
  const [mostrarNuevoLab, setMostrarNuevoLab] = useState(false)
  const [nuevo, setNuevo] = useState({ nombre: '', laboratorio: '', estado: 'funcional', numero_serie: '', imagen: '' })
  const [formatoModal, setFormatoModal] = useState(null)
  const [editModal, setEditModal] = useState(null)   // equipo being edited
  const [viewMode, setViewMode] = useState('table') // 'table' | 'cards'
  const [uploadingIds, setUploadingIds] = useState(new Set())
  const [pagina, setPagina]             = useState(1)
  const POR_PAGINA = 50

  // Resetear página al cambiar filtros o vista
  useEffect(() => { setPagina(1) }, [busqueda, filtroLab, filtroEstado, viewMode])

  // Labs from backend → derive colors dynamically
  const labsDisponibles = useMemo(() => labs.map(l => l.nombre), [labs])
  const getColor = useCallback((nombre) => {
    const lab = labs.find(l => l.nombre === nombre)
    return makeLabStyle(lab?.color || '#6b7280')
  }, [labs])

  const DEFAULT_LABS = [
    { nombre: 'Gastronomía',     color: '#f59e0b', prefix: 'GAS' },
    { nombre: 'Básicas',         color: '#3b82f6', prefix: 'BAS' },
    { nombre: 'Electromecánica', color: '#22c55e', prefix: 'ELC' },
    { nombre: 'Industrial',      color: '#a855f7', prefix: 'IND' },
    { nombre: 'Impresoras 3D',   color: '#06b6d4', prefix: 'IMP' },
    { nombre: 'Química Orgánica',color: '#10b981', prefix: 'QOR' },
    { nombre: 'Mobiliario',      color: '#78716c', prefix: 'MOB' },
  ]

  useEffect(() => {
    const fetchEquipos = equiposApi.getAll()
    const fetchLabs = labsApi.getAll().catch(() => ({ data: DEFAULT_LABS }))

    Promise.all([fetchEquipos, fetchLabs])
      .then(([eqRes, labsRes]) => {
        setLista(eqRes.data)
        const labData = labsRes.data?.length ? labsRes.data : DEFAULT_LABS
        setLabs(labData)
        setNuevo(prev => ({ ...prev, laboratorio: labData[0]?.nombre || '' }))
      })
      .catch(() => {
        // Si equipos también falla, al menos mostramos la lista vacía
      })
      .finally(() => setLoading(false))
  }, [])

  const saveLabsHandler = async (updatedLabs) => {
    const res = await labsApi.save(updatedLabs)
    setLabs(res.data)
  }

  // Exportar lista de equipos a CSV (compatible con Excel)
  const exportarCSV = () => {
    const headers = ['Nombre', 'Laboratorio', 'Estado', 'N° Serie', 'Detalles']
    const escapar = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const filas = lista.map(e => [
      escapar(e.nombre),
      escapar(e.laboratorio),
      escapar(e.estado),
      escapar(e.numero_serie),
      escapar((e.detalles || []).join('; ')),
    ].join(','))
    const csv = [headers.join(','), ...filas].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `equipos_${new Date().toLocaleDateString('es-MX').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const autoSerial = (labName) => {
    const lab = labs.find(l => l.nombre === labName)
    const prefix = lab?.prefix || labName.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
    const count = lista.filter(e => e.laboratorio === labName).length + 1
    return `${prefix}-${String(count).padStart(3, '0')}`
  }

  // Supports both (id, 'campo', valor) for inline edits
  // and (id, { ...fields }) for the full edit modal
  const actualizar = async (id, campoOrObj, valor) => {
    const eq = lista.find(e => e.id === id)
    const patch = typeof campoOrObj === 'object' ? campoOrObj : { [campoOrObj]: valor }
    const updated = { ...eq, ...patch }
    await equiposApi.update(id, updated)
    setLista(prev => prev.map(e => e.id === id ? updated : e))
  }

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este equipo?')) return
    await equiposApi.delete(id)
    setLista(prev => prev.filter(e => e.id !== id))
  }

  const subirImagen = async (id, file) => {
    setUploadingIds(prev => new Set(prev).add(id))
    try {
      const r = await equiposApi.uploadImagen(id, file)
      setLista(prev => prev.map(e => e.id === id ? { ...e, imagen: r.data.imagen } : e))
    } catch (err) {
      alert('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setUploadingIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  // Colores disponibles para asignar a nuevas áreas
  const PALETTE_COLORS = [
    '#f59e0b','#3b82f6','#22c55e','#a855f7','#06b6d4',
    '#10b981','#ef4444','#f97316','#8b5cf6','#ec4899',
    '#14b8a6','#84cc16','#0ea5e9','#d946ef','#f43f5e',
  ]

  const crearEquipo = async (e) => {
    e.preventDefault()
    const labFinal = mostrarNuevoLab ? nuevoLab.trim() : nuevo.laboratorio
    if (!labFinal) return

    // ── Si es un área nueva, guardarla en labs con color único ──
    let currentLabs = labs
    const esLabNuevo = mostrarNuevoLab && !labs.find(l => l.nombre === labFinal)
    if (esLabNuevo) {
      const usedColors = new Set(labs.map(l => l.color?.toLowerCase()))
      const freeColor  = PALETTE_COLORS.find(c => !usedColors.has(c.toLowerCase()))
                         ?? `#${Math.floor(Math.random() * 0xFFFFFF).toString(16).padStart(6, '0')}`
      const prefix     = labFinal.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ]/g, '').slice(0, 3).toUpperCase() || 'LAB'
      const newLab     = { nombre: labFinal, color: freeColor, prefix }
      const res        = await labsApi.save([...labs, newLab])
      currentLabs      = res.data
      setLabs(currentLabs)
    }

    // ── Serial automático usando los labs actualizados ──
    const labObj  = currentLabs.find(l => l.nombre === labFinal)
    const prefix  = labObj?.prefix || labFinal.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase() || 'EQ'
    const count   = lista.filter(eq => eq.laboratorio === labFinal).length + 1
    const serial  = `${prefix}-${String(count).padStart(3, '0')}`

    const data = { ...nuevo, laboratorio: labFinal }
    if (!data.numero_serie) data.numero_serie = serial

    const r = await equiposApi.create(data)
    setLista(prev => [...prev, r.data])
    setShowForm(false)
    setNuevo({ nombre: '', laboratorio: currentLabs[0]?.nombre || '', estado: 'funcional', numero_serie: '', imagen: '' })
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

  // Reset página cuando cambian filtros
  const totalItems   = filtrado.length
  const totalPaginas = Math.max(1, Math.ceil(totalItems / POR_PAGINA))
  const paginaActual = Math.min(pagina, totalPaginas)
  const filtradoPag  = filtrado.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA)

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>
  )

  // Filas con encabezados de grupo (tabla)
  const rows = []
  let currentLab = null
  filtradoPag.forEach(eq => {
    if (eq.laboratorio !== currentLab) {
      currentLab = eq.laboratorio
      const count = filtradoPag.filter(e => e.laboratorio === currentLab).length
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
            {lista.length} equipos registrados{isAdmin && viewMode === 'table' && ' · Clic en celda para editar'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden bg-white">
            <button
              onClick={() => setViewMode('table')}
              title="Vista tabla"
              className={`px-3 py-2 transition-colors ${viewMode === 'table' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <IconTable />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              title="Vista tarjetas"
              className={`px-3 py-2 transition-colors ${viewMode === 'cards' ? 'bg-primary-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              <IconGrid />
            </button>
          </div>

          {isAdmin && (
            <>
              <button onClick={exportarCSV} className="btn-secondary" title="Exportar lista a Excel/CSV">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exportar
              </button>
              <button onClick={() => setShowLabEditor(true)} className="btn-secondary" title="Editar áreas y colores">
                🏷 Áreas
              </button>
              <button onClick={() => setShowForm(s => !s)} className="btn-primary">
                {showForm ? '✕ Cancelar' : '+ Agregar equipo'}
              </button>
            </>
          )}
        </div>
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
              className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border font-medium transition-all cursor-pointer ${active ? 'ring-2 ring-offset-1 ring-primary-400 shadow-sm' : ''}`}
              style={c.badgeStyle}
            >
              <span className="w-2 h-2 rounded-full" style={c.dotStyle}></span>
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

      {/* ── CARD VIEW ────────────────────────────────────────────── */}
      {viewMode === 'cards' && (
        <div>
          <div className="card p-0 no-zoom mb-3">
            <PaginacionControles pagina={paginaActual} totalPaginas={totalPaginas} totalItems={totalItems} porPagina={POR_PAGINA} onChange={setPagina} top />
          </div>
          {filtradoPag.length === 0 ? (
            <div className="card py-12 text-center text-gray-400">Sin equipos encontrados</div>
          ) : (
            (() => {
              // Group cards by lab
              const groups = []
              let grpLab = null
              filtradoPag.forEach(eq => {
                if (eq.laboratorio !== grpLab) {
                  grpLab = eq.laboratorio
                  groups.push({ lab: grpLab, items: [] })
                }
                groups[groups.length - 1].items.push(eq)
              })
              return groups.map(({ lab, items }) => {
                const c = getColor(lab)
                return (
                  <div key={lab} className="mb-6">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3" style={c.headerStyle}>
                      <span className="w-2.5 h-2.5 rounded-full" style={c.dotStyle}></span>
                      <span className="font-semibold text-xs uppercase tracking-wider">{lab}</span>
                      <span className="text-xs opacity-50">{items.length} equipo{items.length !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                      {items.map(eq => (
                        <EquipoCard
                          key={eq.id}
                          eq={eq}
                          isAdmin={isAdmin}
                          getColor={getColor}
                          onDelete={eliminar}
                          onUpload={subirImagen}
                          onSelectFormato={(fid) => setFormatoModal({ equipo: eq, formatoId: fid })}
                          uploading={uploadingIds.has(eq.id)}
                          onUpdate={actualizar}
                          onEdit={setEditModal}
                        />
                      ))}
                    </div>
                  </div>
                )
              })
            })()
          )}
          <PaginacionControles pagina={paginaActual} totalPaginas={totalPaginas} totalItems={totalItems} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      {/* ── TABLE VIEW ───────────────────────────────────────────── */}
      {viewMode === 'table' && (
        <div className="card p-0 no-zoom">
          <PaginacionControles pagina={paginaActual} totalPaginas={totalPaginas} totalItems={totalItems} porPagina={POR_PAGINA} onChange={setPagina} top />
          <div className="overflow-x-auto overflow-y-visible rounded-xl">
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
                {filtradoPag.length === 0 ? (
                  <tr>
                    <td colSpan={colSpan} className="px-4 py-8 text-center text-gray-400">Sin equipos encontrados</td>
                  </tr>
                ) : rows.map((row) => {
                  if (row.type === 'header') {
                    const c = getColor(row.lab)
                    return (
                      <tr key={`h-${row.lab}`} style={c.headerStyle}>
                        <td colSpan={colSpan} className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={c.dotStyle}></span>
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
                      <td className="w-1 p-0 border-l-4" style={c.rowStyle}></td>
                      <td className="px-4 py-2.5 min-w-[180px]">
                        <NombreTooltip nombre={eq.nombre} imagen={eq.imagen} detalles={eq.detalles}>
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
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setEditModal(eq)}
                              className="text-primary-400 hover:text-primary-600 p-1 rounded hover:bg-primary-50 transition-colors"
                              title="Editar equipo"
                            >
                              <IconPencil />
                            </button>
                            <button
                              onClick={() => eliminar(eq.id)}
                              className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                              title="Eliminar"
                            >
                              <IconTrash />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <PaginacionControles pagina={paginaActual} totalPaginas={totalPaginas} totalItems={totalItems} porPagina={POR_PAGINA} onChange={setPagina} />
        </div>
      )}

      {/* Formato modal */}
      {formatoModal && (
        <FormatoModal
          equipo={formatoModal.equipo}
          formatoId={formatoModal.formatoId}
          onClose={() => setFormatoModal(null)}
        />
      )}

      {/* Edit modal */}
      {editModal && (
        <EquipoEditModal
          eq={editModal}
          labs={labs}
          onSave={async (id, data) => { await actualizar(id, data) }}
          onClose={() => setEditModal(null)}
        />
      )}

      {/* ── Lab editor modal ─────────────────────────────────────── */}
      {showLabEditor && (
        <LabEditorModal
          labs={labs}
          equipos={lista}
          onSave={saveLabsHandler}
          onClose={() => setShowLabEditor(false)}
        />
      )}
    </div>
  )
}
