import { useState } from 'react'
import { formatos as formatosApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'

// jsPDF se importa dinámicamente para evitar SSR issues
async function generarPDF(formato, datos, campos) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF()
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  // Header
  doc.setFillColor(30, 64, 175)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('TecNM — Sistema de Gestión de Mantenimiento', 14, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(`Formato: ${formato}`, 14, 21)

  // Fecha en header
  doc.text(fecha, 196, 21, { align: 'right' })

  doc.setTextColor(0, 0, 0)

  // Título del formato
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(`FORMATO ${formato}`, 105, 38, { align: 'center' })

  // Contenido
  const rows = Object.entries({ ...datos, ...campos }).map(([k, v]) => [
    k.replace(/_/g, ' ').toUpperCase(),
    v || '—',
  ])

  autoTable(doc, {
    startY: 45,
    head: [['CAMPO', 'VALOR']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 10, cellPadding: 5 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } },
  })

  const finalY = doc.lastAutoTable.finalY || 120

  // Firma
  doc.setDrawColor(180, 180, 180)
  doc.line(20, finalY + 30, 90, finalY + 30)
  doc.line(120, finalY + 30, 190, finalY + 30)
  doc.setFontSize(8)
  doc.setTextColor(120, 120, 120)
  doc.text('Firma del solicitante', 55, finalY + 36, { align: 'center' })
  doc.text('Firma del responsable', 155, finalY + 36, { align: 'center' })

  doc.save(`${formato.replace(/[^a-zA-Z0-9-]/g, '_')}.pdf`)
}

const FORMATOS_INFO = [
  {
    id: '001-01',
    titulo: 'TecNM-AD-PO-001-01',
    descripcion: 'Reporte de revisión de espacio físico',
    campos_manuales: [
      { key: 'espacio_revisado', label: 'Espacio revisado', required: true },
      { key: 'hallazgo', label: 'Hallazgo encontrado', required: true, multiline: true },
    ],
  },
  {
    id: '001-02',
    titulo: 'TecNM-AD-PO-001-02',
    descripcion: 'Solicitud de servicio de mantenimiento',
    campos_manuales: [
      { key: 'descripcion_servicio', label: 'Descripción del servicio solicitado', required: true, multiline: true },
    ],
  },
  {
    id: '001-03',
    titulo: 'TecNM-AD-PO-001-03',
    descripcion: 'Formato en blanco (descarga vacía)',
    campos_manuales: [],
    vacio: true,
  },
  {
    id: '001-04',
    titulo: 'TecNM-AD-PO-001-04',
    descripcion: 'Orden de trabajo de mantenimiento',
    campos_manuales: [
      { key: 'tipo_mantenimiento', label: 'Tipo de mantenimiento', required: true, options: ['Interno', 'Externo'] },
      { key: 'tipo_servicio', label: 'Tipo de servicio', required: true },
      { key: 'asignado_a', label: 'Asignado a', required: true },
    ],
  },
  {
    id: 'IT-001-05',
    titulo: 'TecNM-AD-IT-001-05',
    descripcion: 'Informe técnico de mantenimiento',
    campos_manuales: [],
  },
]

function FormatoCard({ formato, onGenerar }) {
  const [open, setOpen] = useState(false)
  const [campos, setCampos] = useState({})
  const [generating, setGenerating] = useState(false)
  const [datos, setDatos] = useState(null)

  const abrirFormato = async () => {
    if (!open) {
      if (!formato.vacio) {
        const r = await formatosApi.getDatos(formato.id)
        setDatos(r.data.datos)
        const init = {}
        formato.campos_manuales.forEach(c => { init[c.key] = '' })
        setCampos(init)
      }
    }
    setOpen(o => !o)
  }

  const camposCompletos = formato.campos_manuales.every(c => !c.required || campos[c.key]?.trim())

  const handleGenerar = async () => {
    setGenerating(true)
    try {
      if (formato.vacio) {
        await generarPDF(formato.titulo, { nota: 'Formato en blanco para llenado manual' }, {})
      } else {
        await generarPDF(formato.titulo, datos, campos)
      }
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className={`card transition-all ${open ? 'ring-2 ring-primary-300' : ''}`}>
      <button
        onClick={abrirFormato}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">{formato.titulo}</p>
            <p className="text-sm text-slate-500">{formato.descripcion}</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
      </button>

      {open && (
        <div className="mt-5 pt-5 border-t border-white/10 space-y-4">
          {/* Campos automáticos */}
          {datos && Object.keys(datos).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Campos automáticos</p>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(datos).map(([k, v]) => (
                  <div key={k} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-xs text-gray-400 capitalize">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm font-medium text-gray-700">{v || '—'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campos manuales */}
          {formato.campos_manuales.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Campos a completar</p>
              <div className="space-y-3">
                {formato.campos_manuales.map(campo => (
                  <div key={campo.key}>
                    <label className="label">{campo.label}{campo.required && ' *'}</label>
                    {campo.options ? (
                      <select className="input" value={campos[campo.key] || ''} onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))}>
                        <option value="">Seleccionar...</option>
                        {campo.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    ) : campo.multiline ? (
                      <textarea rows={3} className="input resize-none" value={campos[campo.key] || ''} onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))} />
                    ) : (
                      <input type="text" className="input" value={campos[campo.key] || ''} onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleGenerar}
            disabled={generating || (!formato.vacio && !camposCompletos)}
            className="btn-primary w-full py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Generando PDF...</>
            ) : (
              <><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Descargar PDF</>
            )}
          </button>
          {!formato.vacio && !camposCompletos && (
            <p className="text-xs text-amber-600 text-center">Completa todos los campos requeridos (*) para descargar</p>
          )}
        </div>
      )}
    </div>
  )
}

export default function Formatos() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="page-title">Formatos Oficiales</h1>
        <p className="page-subtitle">Genera y descarga los formatos TecNM. Los datos se rellenan automáticamente.</p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-800 flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <span>Sección disponible solo para administradores. Los PDFs se generan directamente en tu navegador.</span>
      </div>

      <div className="space-y-3">
        {FORMATOS_INFO.map(f => (
          <FormatoCard key={f.id} formato={f} />
        ))}
      </div>
    </div>
  )
}
