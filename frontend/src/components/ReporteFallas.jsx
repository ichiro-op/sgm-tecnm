import { useState, useEffect } from 'react'
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

export default function ReporteFallas() {
  const { user } = useAuth()
  const [equipos, setEquipos] = useState([])
  const [form, setForm] = useState({ equipo_id: '', tipo_falla: '', descripcion: '' })
  const [busqueda, setBusqueda] = useState('')
  const [showSugerencias, setShowSugerencias] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [ticketCreado, setTicketCreado] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.equipo_id) return setError('Selecciona un equipo de la lista')
    if (!form.descripcion.trim()) return setError('La descripción es obligatoria')
    setError('')
    setLoading(true)
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
    }
  }

  const resetear = () => {
    setForm({ equipo_id: '', tipo_falla: '', descripcion: '' })
    setBusqueda('')
    setEnviado(false)
    setTicketCreado(null)
    setError('')
  }

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
              <span className={`font-bold capitalize ${ticketCreado.prioridad === 'alta' ? 'text-red-600' : ticketCreado.prioridad === 'media' ? 'text-yellow-600' : 'text-green-600'}`}>
                {ticketCreado.prioridad}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Estado</span>
              <span className="font-medium capitalize">{ticketCreado.estado}</span>
            </div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={resetear} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              Reportar otra falla
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
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
          {showSugerencias && sugerencias.length > 0 && (
            <div className="absolute z-30 top-full left-0 right-0 bg-slate-900/95 backdrop-blur-md border border-white/15 rounded-xl shadow-2xl mt-1 overflow-hidden">
              {sugerencias.map(eq => (
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
              ))}
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
  )
}
