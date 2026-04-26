import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { equipos as equiposApi, tickets as ticketsApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

const TIPOS_FALLA = [
  'Falla eléctrica',
  'Falla mecánica',
  'Falla de software',
  'Daño físico',
  'Falta de insumos / consumibles',
  'Calibración requerida',
  'Mantenimiento preventivo',
  'Otro',
]

const ESTADO_COLORS = {
  'pendiente':   { bg: 'bg-amber-100',  text: 'text-amber-700',  dot: 'bg-amber-400'  },
  'en proceso':  { bg: 'bg-blue-100',   text: 'text-blue-700',   dot: 'bg-blue-400'   },
  'resuelto':    { bg: 'bg-green-100',  text: 'text-green-700',  dot: 'bg-green-400'  },
}

const PRIORIDAD_COLORS = {
  'alta':  'text-red-600',
  'media': 'text-amber-600',
  'baja':  'text-green-600',
}

/* ── Modal de advertencia de ticket duplicado ─────────────────── */
function TicketDuplicadoModal({ tickets, equipoNombre, onConfirm, onCancel }) {
  const t = tickets[0]
  const estado = ESTADO_COLORS[t.estado] || ESTADO_COLORS['pendiente']
  const fechaFmt = new Date(t.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-[fadeInUp_.2s_ease-out]">
        {/* Ícono de advertencia */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base leading-snug">Ya existe un ticket abierto</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              El equipo <span className="font-medium text-slate-700">«{equipoNombre}»</span> ya tiene
              {tickets.length > 1 ? ` ${tickets.length} tickets activos` : ' un ticket activo'}.
            </p>
          </div>
        </div>

        {/* Resumen del ticket más reciente */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Ticket #</span>
            <span className="font-bold text-primary-700">{t.id}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Estado</span>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${estado.bg} ${estado.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`} />
              {t.estado}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Tipo de falla</span>
            <span className="font-medium text-slate-700">{t.tipo_falla}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Prioridad</span>
            <span className={`font-bold capitalize ${PRIORIDAD_COLORS[t.prioridad] || ''}`}>{t.prioridad}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-slate-500">Fecha</span>
            <span className="text-slate-600">{fechaFmt}</span>
          </div>
          {t.descripcion && (
            <div className="pt-1 border-t border-slate-200">
              <p className="text-slate-500 mb-0.5">Descripción</p>
              <p className="text-slate-700 text-xs leading-relaxed line-clamp-3">{t.descripcion}</p>
            </div>
          )}
          {tickets.length > 1 && (
            <p className="text-xs text-amber-600 font-medium pt-1 border-t border-slate-200">
              + {tickets.length - 1} ticket{tickets.length - 1 > 1 ? 's' : ''} adicional{tickets.length - 1 > 1 ? 'es' : ''} abierto{tickets.length - 1 > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold transition-colors"
          >
            Enviar de todas formas
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Componente principal ─────────────────────────────────────── */
export default function ReporteFallas() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [equipos, setEquipos] = useState([])
  const [form, setForm] = useState({ equipo_id: '', tipo_falla: '', descripcion: '' })
  const [busqueda, setBusqueda] = useState('')
  const [showSugerencias, setShowSugerencias] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [ticketCreado, setTicketCreado] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  // Modal de ticket duplicado
  const [ticketsDuplicados, setTicketsDuplicados] = useState(null)

  useEffect(() => {
    equiposApi.getAll().then(r => setEquipos(r.data))
  }, [])

  const equipoSeleccionado = equipos.find(e => e.id === form.equipo_id)

  const sugerencias = busqueda.length > 0
    ? equipos.filter(e =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.laboratorio.toLowerCase().includes(busqueda.toLowerCase())
      ).slice(0, 8)
    : []

  const seleccionarEquipo = (eq) => {
    setForm(p => ({ ...p, equipo_id: eq.id }))
    setBusqueda(`${eq.nombre} — ${eq.laboratorio}`)
    setShowSugerencias(false)
  }

  const enviarTicket = async () => {
    setLoading(true)
    setError('')
    try {
      const eq = equipos.find(e => e.id === form.equipo_id)
      const r = await ticketsApi.create({
        ...form,
        equipo_nombre: eq.nombre,
        laboratorio: eq.laboratorio,
      })
      setTicketCreado(r.data)
      setEnviado(true)
    } catch {
      setError('Error al enviar el reporte. Intenta de nuevo.')
    } finally {
      setLoading(false)
      setTicketsDuplicados(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.equipo_id) return setError('Selecciona un equipo de la lista')
    if (!form.descripcion.trim()) return setError('La descripción es obligatoria')
    setError('')
    setLoading(true)

    try {
      // Verificar si ya existen tickets activos para este equipo
      const { data: existentes } = await ticketsApi.getByEquipo(form.equipo_id)
      if (existentes.length > 0) {
        setTicketsDuplicados(existentes)
        setLoading(false)
        return
      }
    } catch {
      // Si falla la verificación, continuar igualmente
    }

    await enviarTicket()
  }

  const resetear = () => {
    setForm({ equipo_id: '', tipo_falla: '', descripcion: '' })
    setBusqueda('')
    setEnviado(false)
    setTicketCreado(null)
    setError('')
  }

  /* ── Pantalla de éxito ──────────────────────────────────────── */
  if (enviado && ticketCreado) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card text-center py-10">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-1">Reporte enviado</h2>
          <p className="text-slate-500 text-sm mb-6">Tu ticket fue creado exitosamente</p>
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 text-left mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Ticket #</span>
              <span className="font-bold text-primary-700">{ticketCreado.id}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Equipo</span>
              <span className="font-medium">{ticketCreado.equipo_nombre}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Laboratorio</span>
              <span className="font-medium">{ticketCreado.laboratorio}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Prioridad</span>
              <span className={`font-bold capitalize ${PRIORIDAD_COLORS[ticketCreado.prioridad] || ''}`}>
                {ticketCreado.prioridad}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estado</span>
              <span className="font-medium capitalize">{ticketCreado.estado}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button onClick={() => navigate('/dashboard')} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              Volver al inicio
            </button>
            <button onClick={resetear} className="btn-secondary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Reportar otra falla
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modal de ticket duplicado */}
      {ticketsDuplicados && (
        <TicketDuplicadoModal
          tickets={ticketsDuplicados}
          equipoNombre={equipoSeleccionado?.nombre || ''}
          onConfirm={enviarTicket}
          onCancel={() => setTicketsDuplicados(null)}
        />
      )}

      <div className="max-w-2xl mx-auto space-y-4">
        <div>
          <h1 className="page-title">Reportar Falla</h1>
          <p className="page-subtitle">Completa el formulario para crear un ticket de mantenimiento</p>
        </div>

        {/* Info del usuario */}
        <div className="bg-primary-50 border border-primary-200 rounded-xl p-3.5 flex items-center gap-3">
          {user?.foto ? (
            <img src={user.foto} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.nombre?.[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-primary-900 text-sm truncate">{user?.nombre}</p>
            <p className="text-xs text-primary-600 truncate">{user?.email} · Nº control: {user?.numero_control}</p>
          </div>
          <div className="ml-auto text-xs text-primary-500 flex-shrink-0">
            {new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          {/* Selección de equipo */}
          <div className="relative">
            <label className="label">Equipo afectado *</label>
            <input
              type="text"
              value={busqueda}
              onChange={e => { setBusqueda(e.target.value); setForm(p => ({ ...p, equipo_id: '' })); setShowSugerencias(true) }}
              onFocus={() => setShowSugerencias(true)}
              placeholder="Escribe el nombre del equipo..."
              className="input"
              autoComplete="off"
            />
            {showSugerencias && (sugerencias.length > 0 || busqueda.length > 0) && (
              <div className="absolute z-30 top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl mt-1 overflow-hidden">
                {sugerencias.length > 0 ? sugerencias.map(eq => (
                  <button
                    key={eq.id}
                    type="button"
                    onClick={() => seleccionarEquipo(eq)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left border-b border-white/8 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3.5 h-3.5 text-slate-300" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{eq.nombre}</p>
                      <p className="text-xs text-slate-400">{eq.laboratorio} · {eq.numero_serie}</p>
                    </div>
                    <span className={`ml-auto text-xs px-2 py-0.5 rounded-full ${
                      eq.estado === 'funcional' ? 'bg-green-500/20 text-green-300' :
                      eq.estado === 'en mantenimiento' ? 'bg-amber-500/20 text-amber-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>{eq.estado}</span>
                  </button>
                )) : (
                  <p className="px-4 py-3 text-sm text-slate-400">No se encontró «{busqueda}»</p>
                )}
                <button
                  type="button"
                  onClick={() => navigate('/equipos')}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-indigo-500/20 transition-colors text-left border-t border-white/10"
                >
                  <div className="w-7 h-7 rounded-md bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="w-3.5 h-3.5 text-indigo-300" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  </div>
                  <p className="font-medium text-indigo-300 text-sm">Agregar nuevo equipo…</p>
                </button>
              </div>
            )}
            {equipoSeleccionado && (
              <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span>{equipoSeleccionado.nombre} — {equipoSeleccionado.laboratorio}</span>
              </div>
            )}
          </div>

          {/* Tipo de falla */}
          <div>
            <label className="label">Tipo de falla *</label>
            <div className="grid grid-cols-2 gap-2">
              {TIPOS_FALLA.map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, tipo_falla: tipo }))}
                  className={`text-left px-3 py-2.5 rounded-lg border text-sm transition-all ${
                    form.tipo_falla === tipo
                      ? 'bg-primary-600 text-white border-primary-600 font-medium'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400 hover:bg-primary-50'
                  }`}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>

          {/* Descripción */}
          <div>
            <label className="label">Descripción detallada *</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value }))}
              placeholder="Describe qué ocurrió, desde cuándo, síntomas observados..."
              rows={4}
              className="input resize-none"
              required
            />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading || !form.equipo_id || !form.tipo_falla}
            className="btn-primary w-full justify-center py-2.5"
          >
            {loading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                Enviando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                Enviar reporte de falla
              </>
            )}
          </button>
        </form>
      </div>
    </>
  )
}
