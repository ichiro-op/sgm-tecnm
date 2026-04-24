import { useState, useEffect } from 'react'
import { formatos as formatosApi } from '../utils/api'

// ── Carga logo como base64 para jsPDF ──────────────────────────────
async function loadLogoBase64() {
  try {
    const res = await fetch('/logo-sgm.png')
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target.result)
      reader.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

// ── Encabezado oficial TecNM ───────────────────────────────────────
function dibujarHeader(doc, formato, logo) {
  const M = 14          // margen lateral
  const W = 182         // ancho útil (210 - 2*14)
  const TOP = 10        // posición Y del encabezado
  const H = 26          // altura del encabezado
  const LOGO_W = 32     // ancho celda logo
  const COD_W = 44      // ancho celda código
  const AZUL = [0, 70, 127]

  // Borde externo
  doc.setDrawColor(...AZUL)
  doc.setLineWidth(0.5)
  doc.rect(M, TOP, W, H, 'S')

  // Líneas divisorias verticales
  doc.line(M + LOGO_W, TOP, M + LOGO_W, TOP + H)
  doc.line(M + W - COD_W, TOP, M + W - COD_W, TOP + H)

  // ── Logo ──
  if (logo) {
    doc.addImage(logo, 'PNG', M + 1.5, TOP + 1.5, LOGO_W - 3, H - 3)
  } else {
    doc.setFontSize(7)
    doc.setTextColor(...AZUL)
    doc.setFont('helvetica', 'bold')
    doc.text('SGC ISO 9001', M + LOGO_W / 2, TOP + H / 2 + 1, { align: 'center' })
  }

  // ── Centro: nombre institución + título formato ──
  const CX = M + LOGO_W + (W - LOGO_W - COD_W) / 2
  doc.setTextColor(...AZUL)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text('TECNOLÓGICO NACIONAL DE MÉXICO', CX, TOP + 7, { align: 'center' })
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.text('TECNOLÓGICO DE ESTUDIOS SUPERIORES DE ECATEPEC', CX, TOP + 12, { align: 'center' })
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(7.5)
  const titulo = formato.titulo_largo || formato.titulo
  doc.text(titulo, CX, TOP + 19, { align: 'center', maxWidth: W - LOGO_W - COD_W - 4 })

  // ── Derecha: código, versión, fecha, página ──
  const RX = M + W - COD_W
  const codH = H / 4
  const AZUL_FILL = [...AZUL]

  // Líneas divisoras horizontales en celda código
  ;[1, 2, 3].forEach(i => {
    doc.line(RX, TOP + codH * i, M + W, TOP + codH * i)
  })

  const rowLabels = ['CÓDIGO:', 'VERSIÓN:', 'FECHA:', 'PÁGINA:']
  const rowValues = [
    formato.codigo || formato.titulo,
    '01',
    new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    '1 DE 1',
  ]

  rowLabels.forEach((label, i) => {
    const ry = TOP + codH * i + codH / 2 + 1.5
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(5.5)
    doc.setTextColor(...AZUL)
    doc.text(label, RX + 2, ry)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(5.5)
    doc.setTextColor(30, 30, 30)
    doc.text(rowValues[i], RX + COD_W - 2, ry, { align: 'right' })
  })

  // Devuelve la Y donde termina el header
  return TOP + H
}

// ── Línea de firma ──────────────────────────────────────────────────
function firmas(doc, y, left = 'Elaboró', right = 'Autorizó') {
  doc.setDrawColor(150, 150, 150)
  doc.setTextColor(80, 80, 80)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.line(20, y, 90, y)
  doc.line(120, y, 190, y)
  doc.text(left, 55, y + 5, { align: 'center' })
  doc.text(right, 155, y + 5, { align: 'center' })
}

// ══════════════════════════════════════════════════════════════════════
// GENERADORES DE PDF
// ══════════════════════════════════════════════════════════════════════

// 001-01 Lista de Verificación de Espacio Físico
async function generarPDF001_01(formato, datos, campos, equipos) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const logo = await loadLogoBase64()

  const doc = new jsPDF()
  const AZUL = [0, 70, 127]
  let y = dibujarHeader(doc, formato, logo) + 4

  // Subtítulo
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...AZUL)
  doc.text('LISTA DE VERIFICACIÓN DE ESPACIO FÍSICO', 105, y + 5, { align: 'center' })
  y += 12

  // Datos generales
  const lab = campos.laboratorio || datos.laboratorio || ''
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  const infoRows = [
    ['Fecha:', fecha, 'Laboratorio / Espacio:', lab],
    ['Jefe de Departamento:', datos.jefe_departamento || '', 'Jefe de Área:', datos.jefe_area || ''],
  ]

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 44, textColor: AZUL },
      1: { cellWidth: 50 },
      2: { fontStyle: 'bold', cellWidth: 44, textColor: AZUL },
      3: { cellWidth: 44 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 4

  // Tabla de equipos
  const equiposFiltrados = lab
    ? equipos.filter(e => e.laboratorio?.toLowerCase() === lab.toLowerCase())
    : equipos

  const equipoRows = equiposFiltrados.map((e, i) => [
    i + 1,
    e.nombre,
    e.numero_serie || '—',
    e.estado === 'funcional' ? 'Funcional' :
      e.estado === 'mantenimiento' ? 'En mantenimiento' :
      e.estado === 'fuera_servicio' ? 'Fuera de servicio' : e.estado,
    '',
  ])

  autoTable(doc, {
    startY: y,
    head: [['No.', 'Equipo / Descripción', 'Nº Serie', 'Estado', 'Observaciones']],
    body: equipoRows.length > 0 ? equipoRows : [['—', 'Sin equipos registrados', '', '', '']],
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 30 },
      3: { cellWidth: 32 },
      4: { cellWidth: 50 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 12

  // Hallazgos
  if (campos.hallazgo) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.setTextColor(...AZUL)
    doc.text('HALLAZGOS / OBSERVACIONES GENERALES:', 14, y)
    y += 5
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(30, 30, 30)
    const lines = doc.splitTextToSize(campos.hallazgo, 182)
    doc.text(lines, 14, y)
    y += lines.length * 5 + 8
  }

  if (y > 250) y = 250
  firmas(doc, y, 'Responsable del Espacio', 'Jefe de Departamento')

  doc.save('TecNM-AD-PO-001-01_Lista-Verificacion.pdf')
}

// 001-02 Solicitud de Servicio de Mantenimiento
async function generarPDF001_02(formato, datos, campos) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const logo = await loadLogoBase64()

  const doc = new jsPDF()
  const AZUL = [0, 70, 127]
  let y = dibujarHeader(doc, formato, logo) + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...AZUL)
  doc.text('SOLICITUD DE SERVICIO DE MANTENIMIENTO', 105, y + 5, { align: 'center' })
  y += 12

  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  const infoRows = [
    ['Fecha:', fecha, 'Número de Control:', datos.numero_control || ''],
    ['Solicitante:', datos.nombre_solicitante || '', 'Email:', datos.email_solicitante || ''],
  ]

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40, textColor: AZUL },
      1: { cellWidth: 54 },
      2: { fontStyle: 'bold', cellWidth: 44, textColor: AZUL },
      3: { cellWidth: 44 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 6

  // Descripción del servicio
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...AZUL)
  doc.text('DESCRIPCIÓN DEL SERVICIO SOLICITADO:', 14, y)
  y += 5

  const descLines = doc.splitTextToSize(campos.descripcion_servicio || '—', 182)
  autoTable(doc, {
    startY: y,
    body: [[descLines.join('\n')]],
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 4, minCellHeight: 30 },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 10

  // Tabla tipo / prioridad
  autoTable(doc, {
    startY: y,
    head: [['Tipo de Servicio', 'Prioridad', 'Área / Laboratorio', 'Equipo']],
    body: [['', 'Media', '', '']],
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 6 },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 14

  if (y > 250) y = 250
  firmas(doc, y, 'Firma del Solicitante', 'V°B° Responsable')

  doc.save('TecNM-AD-PO-001-02_Solicitud-Servicio.pdf')
}

// 001-03 Formato en Blanco
async function generarPDF001_03(formato) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const logo = await loadLogoBase64()

  const doc = new jsPDF()
  const AZUL = [0, 70, 127]
  let y = dibujarHeader(doc, formato, logo) + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...AZUL)
  doc.text('FORMATO EN BLANCO', 105, y + 5, { align: 'center' })
  y += 14

  // Filas vacías para llenado manual
  const emptyRows = Array(16).fill(['', '', '', ''])
  autoTable(doc, {
    startY: y,
    head: [['No.', 'Descripción', 'Responsable', 'Observaciones']],
    body: emptyRows,
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 6 },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 66 },
      2: { cellWidth: 50 },
      3: { cellWidth: 50 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 14

  if (y > 250) y = 250
  firmas(doc, y)

  doc.save('TecNM-AD-PO-001-03_Formato-Blanco.pdf')
}

// 001-04 Orden de Trabajo de Mantenimiento
async function generarPDF001_04(formato, datos, campos) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const logo = await loadLogoBase64()

  const doc = new jsPDF()
  const AZUL = [0, 70, 127]
  let y = dibujarHeader(doc, formato, logo) + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...AZUL)
  doc.text('ORDEN DE TRABAJO DE MANTENIMIENTO', 105, y + 5, { align: 'center' })
  y += 12

  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  const infoRows = [
    ['Fecha:', fecha, 'Nº Control Solicitante:', datos.numero_control || ''],
    ['Tipo de Mantenimiento:', campos.tipo_mantenimiento || '', 'Tipo de Servicio:', campos.tipo_servicio || ''],
    ['Asignado a:', campos.asignado_a || '', '', ''],
  ]

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 52, textColor: AZUL },
      1: { cellWidth: 42 },
      2: { fontStyle: 'bold', cellWidth: 46, textColor: AZUL },
      3: { cellWidth: 42 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 6

  // Tabla actividades
  autoTable(doc, {
    startY: y,
    head: [['No.', 'Actividad / Tarea', 'Fecha Inicio', 'Fecha Fin', 'Estado']],
    body: Array(8).fill(['', '', '', '', '']),
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 12, halign: 'center' },
      1: { cellWidth: 74 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 30, halign: 'center' },
      4: { cellWidth: 36 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 8

  // Materiales
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...AZUL)
  doc.text('MATERIALES / REFACCIONES UTILIZADOS:', 14, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [['Descripción', 'Cantidad', 'Unidad', 'Observaciones']],
    body: Array(4).fill(['', '', '', '']),
    theme: 'grid',
    headStyles: { fillColor: AZUL, textColor: 255, fontStyle: 'bold', fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 5 },
    columnStyles: {
      0: { cellWidth: 80 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30 },
      3: { cellWidth: 42 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 12

  if (y > 250) y = 250
  firmas(doc, y, 'Técnico Responsable', 'Jefe de Área')

  doc.save('TecNM-AD-PO-001-04_Orden-Trabajo.pdf')
}

// IT-001-05 Informe Técnico de Mantenimiento
async function generarPDFIT001_05(formato, datos, campos) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')
  const logo = await loadLogoBase64()

  const doc = new jsPDF()
  const AZUL = [0, 70, 127]
  let y = dibujarHeader(doc, formato, logo) + 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...AZUL)
  doc.text('INFORME TÉCNICO DE MANTENIMIENTO', 105, y + 5, { align: 'center' })
  y += 12

  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  const infoRows = [
    ['Fecha:', fecha, 'Técnico responsable:', campos.tecnico || ''],
    ['Equipo atendido:', campos.equipo || '', 'Nº Serie:', campos.numero_serie || ''],
    ['Laboratorio / Área:', campos.laboratorio || '', 'Tipo de mantenimiento:', campos.tipo_mantenimiento || ''],
  ]

  autoTable(doc, {
    startY: y,
    body: infoRows,
    theme: 'plain',
    styles: { fontSize: 8, cellPadding: 2.5 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 52, textColor: AZUL },
      1: { cellWidth: 42 },
      2: { fontStyle: 'bold', cellWidth: 46, textColor: AZUL },
      3: { cellWidth: 42 },
    },
    tableWidth: 182,
    margin: { left: 14 },
  })
  y = doc.lastAutoTable.finalY + 6

  const secciones = [
    ['DIAGNÓSTICO:', campos.diagnostico || ''],
    ['TRABAJO REALIZADO:', campos.trabajo_realizado || ''],
    ['CONCLUSIONES Y RECOMENDACIONES:', campos.conclusiones || ''],
  ]

  for (const [titulo, contenido] of secciones) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(...AZUL)
    doc.text(titulo, 14, y)
    y += 4
    autoTable(doc, {
      startY: y,
      body: [[contenido || ' ']],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 4, minCellHeight: 20 },
      tableWidth: 182,
      margin: { left: 14 },
    })
    y = doc.lastAutoTable.finalY + 5
  }

  if (y > 250) y = 250
  firmas(doc, y, 'Técnico Responsable', 'Jefe de Departamento')

  doc.save('TecNM-AD-IT-001-05_Informe-Tecnico.pdf')
}

// ══════════════════════════════════════════════════════════════════════
// CONFIGURACIÓN DE FORMATOS
// ══════════════════════════════════════════════════════════════════════

const FORMATOS_INFO = [
  {
    id: '001-01',
    titulo: 'TecNM-AD-PO-001-01',
    codigo: 'AD-PO-001-01',
    titulo_largo: 'LISTA DE VERIFICACIÓN DE ESPACIO FÍSICO',
    descripcion: 'Revisión y verificación del estado de equipos por laboratorio',
    campos_manuales: [
      { key: 'laboratorio', label: 'Laboratorio / Espacio a revisar', required: true },
      { key: 'hallazgo', label: 'Hallazgos / Observaciones generales', multiline: true },
    ],
  },
  {
    id: '001-02',
    titulo: 'TecNM-AD-PO-001-02',
    codigo: 'AD-PO-001-02',
    titulo_largo: 'SOLICITUD DE SERVICIO DE MANTENIMIENTO',
    descripcion: 'Solicitud formal de servicio de mantenimiento',
    campos_manuales: [
      { key: 'descripcion_servicio', label: 'Descripción del servicio solicitado', required: true, multiline: true },
    ],
  },
  {
    id: '001-03',
    titulo: 'TecNM-AD-PO-001-03',
    codigo: 'AD-PO-001-03',
    titulo_largo: 'FORMATO EN BLANCO',
    descripcion: 'Formato en blanco para llenado manual',
    campos_manuales: [],
    vacio: true,
  },
  {
    id: '001-04',
    titulo: 'TecNM-AD-PO-001-04',
    codigo: 'AD-PO-001-04',
    titulo_largo: 'ORDEN DE TRABAJO DE MANTENIMIENTO',
    descripcion: 'Orden de trabajo de mantenimiento correctivo / preventivo',
    campos_manuales: [
      { key: 'tipo_mantenimiento', label: 'Tipo de mantenimiento', required: true, options: ['Correctivo', 'Preventivo', 'Predictivo'] },
      { key: 'tipo_servicio', label: 'Tipo de servicio', required: true },
      { key: 'asignado_a', label: 'Asignado a (técnico)', required: true },
    ],
  },
  {
    id: 'IT-001-05',
    titulo: 'TecNM-AD-IT-001-05',
    codigo: 'AD-IT-001-05',
    titulo_largo: 'INFORME TÉCNICO DE MANTENIMIENTO',
    descripcion: 'Informe técnico detallado del mantenimiento realizado',
    campos_manuales: [
      { key: 'tecnico', label: 'Técnico responsable', required: true },
      { key: 'equipo', label: 'Equipo atendido', required: true },
      { key: 'numero_serie', label: 'Número de serie' },
      { key: 'laboratorio', label: 'Laboratorio / Área' },
      { key: 'tipo_mantenimiento', label: 'Tipo de mantenimiento', required: true, options: ['Correctivo', 'Preventivo', 'Predictivo'] },
      { key: 'diagnostico', label: 'Diagnóstico', required: true, multiline: true },
      { key: 'trabajo_realizado', label: 'Trabajo realizado', required: true, multiline: true },
      { key: 'conclusiones', label: 'Conclusiones y recomendaciones', multiline: true },
    ],
  },
]

// ══════════════════════════════════════════════════════════════════════
// COMPONENTE TARJETA DE FORMATO
// ══════════════════════════════════════════════════════════════════════

function FormatoCard({ formato, equipos }) {
  const [open, setOpen] = useState(false)
  const [campos, setCampos] = useState({})
  const [generating, setGenerating] = useState(false)
  const [datos, setDatos] = useState(null)

  const abrirFormato = async () => {
    if (!open && !formato.vacio) {
      const r = await formatosApi.getDatos(formato.id)
      setDatos(r.data.datos)
      const init = {}
      formato.campos_manuales.forEach(c => { init[c.key] = '' })
      setCampos(init)
    }
    setOpen(o => !o)
  }

  const camposCompletos = formato.vacio || formato.campos_manuales
    .filter(c => c.required)
    .every(c => campos[c.key]?.trim())

  const handleGenerar = async () => {
    setGenerating(true)
    try {
      if (formato.id === '001-01') {
        await generarPDF001_01(formato, datos || {}, campos, equipos)
      } else if (formato.id === '001-02') {
        await generarPDF001_02(formato, datos || {}, campos)
      } else if (formato.id === '001-03') {
        await generarPDF001_03(formato)
      } else if (formato.id === '001-04') {
        await generarPDF001_04(formato, datos || {}, campos)
      } else if (formato.id === 'IT-001-05') {
        await generarPDFIT001_05(formato, datos || {}, campos)
      }
    } finally {
      setGenerating(false)
    }
  }

  // Preview de equipos para 001-01
  const labSeleccionado = campos.laboratorio?.trim()
  const equiposDelLab = labSeleccionado
    ? equipos.filter(e => e.laboratorio?.toLowerCase() === labSeleccionado.toLowerCase())
    : []

  return (
    <div className={`card transition-all duration-200 ${open ? 'ring-2 ring-primary-300' : ''}`}>
      <button onClick={abrirFormato} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">{formato.titulo}</p>
            <p className="text-sm text-slate-500">{formato.descripcion}</p>
          </div>
        </div>
        <svg className={`w-4 h-4 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {open && (
        <div className="mt-5 pt-5 border-t border-gray-100 space-y-4">

          {/* Campos manuales */}
          {formato.campos_manuales.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Campos a completar</p>
              {formato.campos_manuales.map(campo => (
                <div key={campo.key}>
                  <label className="label">
                    {campo.label}
                    {campo.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  {campo.options ? (
                    <select
                      className="input"
                      value={campos[campo.key] || ''}
                      onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))}
                    >
                      <option value="">Seleccionar...</option>
                      {campo.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : campo.multiline ? (
                    <textarea
                      rows={3}
                      className="input resize-none"
                      value={campos[campo.key] || ''}
                      onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input"
                      value={campos[campo.key] || ''}
                      onChange={e => setCampos(p => ({ ...p, [campo.key]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Preview de equipos para 001-01 */}
          {formato.id === '001-01' && labSeleccionado && (
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3">
              <p className="text-xs font-semibold text-primary-700 mb-2">
                Equipos en "{labSeleccionado}" que se incluirán en el PDF:
              </p>
              {equiposDelLab.length > 0 ? (
                <ul className="space-y-1">
                  {equiposDelLab.map(e => (
                    <li key={e.id} className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                      <span className="font-medium">{e.nombre}</span>
                      {e.numero_serie && <span className="text-slate-400">— {e.numero_serie}</span>}
                      <span className={`ml-auto text-xs px-1.5 py-0.5 rounded-full ${
                        e.estado === 'funcional' ? 'bg-green-100 text-green-700' :
                        e.estado === 'mantenimiento' ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {e.estado === 'funcional' ? 'Funcional' :
                         e.estado === 'mantenimiento' ? 'En mantenimiento' :
                         'Fuera de servicio'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No hay equipos registrados para este laboratorio.</p>
              )}
            </div>
          )}

          <button
            onClick={handleGenerar}
            disabled={generating || !camposCompletos}
            className="btn-primary w-full py-3 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Generando PDF...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar PDF
              </>
            )}
          </button>

          {!camposCompletos && !formato.vacio && (
            <p className="text-xs text-amber-600 text-center">
              Completa todos los campos requeridos (*) para descargar
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════

export default function Formatos() {
  const [equipos, setEquipos] = useState([])

  useEffect(() => {
    formatosApi.getEquipos()
      .then(r => setEquipos(r.data))
      .catch(() => setEquipos([]))
  }, [])

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="page-title">Formatos Oficiales</h1>
        <p className="page-subtitle">Genera los formatos TecNM con encabezado oficial. Los datos de equipos se rellenan automáticamente.</p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-800 flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Sección disponible solo para administradores. Los PDFs se generan directamente en tu navegador con el encabezado oficial TecNM.</span>
      </div>

      <div className="space-y-3">
        {FORMATOS_INFO.map(f => (
          <FormatoCard key={f.id} formato={f} equipos={equipos} />
        ))}
      </div>
    </div>
  )
}
