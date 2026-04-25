import { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import { formatos as formatosApi } from '../utils/api'
import { useAuth } from '../context/AuthContext'
import _logoUrl from '../assets/logo-sgm.png'

/* ── Inyección de CSS para animación de partículas ─────────────── */
if (typeof document !== 'undefined' && !document.getElementById('fmt-anim-css')) {
  const _s = document.createElement('style')
  _s.id = 'fmt-anim-css'
  _s.textContent = `
    @keyframes fmt-pt-fly {
      0%   { transform:translate(-50%,-50%) rotate(var(--pt-a)) translateX(0px)     scale(1);   opacity:.85; }
      60%  { opacity:.6; }
      100% { transform:translate(-50%,-50%) rotate(var(--pt-a)) translateX(var(--pt-d)) scale(.15); opacity:0; }
    }
    @keyframes fmt-btn-glow {
      0%,100% { box-shadow:0 0 0 0 rgba(99,102,241,.22), 0 4px 14px rgba(99,102,241,.28); }
      50%     { box-shadow:0 0 0 8px rgba(99,102,241,0),  0 4px 26px rgba(99,102,241,.68); }
    }
    @keyframes fmt-btn-enter {
      from { opacity:.55; transform:scale(.98); }
      to   { opacity:1;   transform:scale(1); }
    }
    .fmt-btn-ready {
      animation: fmt-btn-glow 1.9s ease-in-out infinite,
                 fmt-btn-enter .35s ease-out both;
    }
    .fmt-particle {
      position:absolute; border-radius:50%;
      top:50%; left:50%; pointer-events:none; z-index:20;
      animation: fmt-pt-fly 1.05s ease-out forwards;
    }
  `
  document.head.appendChild(_s)
}

/* ── Utilidades de impresión (igual que FormatoModal) ─────────── */
const today = () => new Date().toISOString().split('T')[0]
const fmtDate = (d) => d
  ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  : '___________________________'

const BASE_CSS = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11pt; color: #000; background: #fff; }
  .page { padding: 10mm 12mm; max-width: 210mm; margin: 0 auto; }
  .page-landscape { padding: 8mm 12mm; max-width: 297mm; margin: 0 auto; }
  .ft { width: 100%; border-collapse: collapse; border: 1.5px solid #000; border-top: none; }
  .ft td, .ft th { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  .ft-sep { width: 100%; border-collapse: collapse; border: 1.5px solid #000; margin-bottom: 6px; }
  .ft-sep td, .ft-sep th { border: 1px solid #000; padding: 3px 5px; vertical-align: top; }
  .pre { white-space: pre-wrap; line-height: 1.5; }
  .sign-t { width: 100%; border-collapse: collapse; margin-top: 10px; }
  .sign-t td { border: 1px solid #000; padding: 3px 6px; text-align: center; vertical-align: top; height: 42px; font-size: 9pt; }
  .ccp { font-size: 9pt; margin-top: 4px; }
  @media print { body { margin: 0; } .page { padding: 6mm 8mm; } .page-landscape { padding: 5mm 8mm; } }
`
const LANDSCAPE_CSS = BASE_CSS + `@page { size: A4 landscape; }`

let _logoBase64 = null
async function getLogoBase64() {
  if (_logoBase64) return _logoBase64
  try {
    const absUrl = new URL(_logoUrl, window.location.href).href
    const res = await fetch(absUrl)
    const blob = await res.blob()
    _logoBase64 = await new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => resolve(e.target.result)
      reader.readAsDataURL(blob)
    })
  } catch { _logoBase64 = null }
  return _logoBase64
}

function instHeader({ titulo, codigo, normas, pagLabel = 'Página 1 de 2', rev = 'Revisión 0', tituloCenter = false }, logo) {
  const logoCell = logo
    ? `<img src="${logo}" style="width:68px;height:68px;object-fit:contain;display:block;margin:auto" alt="SGC TecNM">`
    : `<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="68" height="68" fill="white" stroke="#222" stroke-width="2"/>
        <text x="35" y="13" font-family="Arial" font-size="10" font-weight="bold" fill="#000" text-anchor="middle" letter-spacing="3">S G C</text>
        <circle cx="35" cy="38" r="18" fill="none" stroke="#333" stroke-width="1.5"/>
        <polyline points="25,38 31,46 46,29" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="35" y="53" font-family="Arial" font-size="5.5" fill="#333" text-anchor="middle">ISO 9001</text>
        <text x="35" y="65" font-family="Arial" font-size="8" font-weight="bold" fill="#000" text-anchor="middle">TecNM</text>
       </svg>`
  return `
  <table style="width:100%;border-collapse:collapse;border:1.5px solid #000;margin-bottom:0">
    <tr>
      <td rowspan="3" style="width:76px;border-right:1.5px solid #000;vertical-align:middle;text-align:center;padding:4px">${logoCell}</td>
      <td style="padding:5px 10px;font-weight:700;font-size:11pt;border-bottom:1px solid #000;${tituloCenter ? 'text-align:center;' : ''}">${titulo}</td>
      <td style="width:140px;border-left:1.5px solid #000;border-bottom:1px solid #000;padding:3px 8px;font-size:8.5pt;font-weight:700">Código: ${codigo}</td>
    </tr>
    <tr>
      <td style="padding:2px 10px;font-size:8pt;border-bottom:1px solid #000">${normas[0] || '&nbsp;'}</td>
      <td style="border-left:1.5px solid #000;border-bottom:1px solid #000;padding:3px 8px;font-size:8.5pt">${rev}</td>
    </tr>
    <tr>
      <td style="padding:2px 10px;font-size:8pt">${normas.slice(1).map(n => `<div>${n}</div>`).join('') || '&nbsp;'}</td>
      <td style="border-left:1.5px solid #000;padding:3px 8px;font-size:8.5pt">${pagLabel}</td>
    </tr>
  </table>`
}

function openPrintWin(html, titulo, landscape = false) {
  const pw = window.open('', '_blank', 'width=960,height=720')
  const css = landscape ? LANDSCAPE_CSS : BASE_CSS
  const cls = landscape ? 'page-landscape' : 'page'
  pw.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"><title>${titulo}</title><style>${css}</style>
  </head><body><div class="${cls}">${html}</div></body></html>`)
  pw.document.close()
  pw.focus()
  setTimeout(() => pw.print(), 350)
}

/* ── Botón de impresión con partículas ────────────────────────── */
const PARTICLE_COLORS = ['#818cf8', '#6366f1', '#a5b4fc', '#c7d2fe', '#4f46e5', '#e0e7ff', '#7c3aed', '#a78bfa']

function PrintButton({ isReady, onClick }) {
  const [particles, setParticles] = useState([])
  const prevReady = useRef(false)

  useEffect(() => {
    // Solo disparar cuando cambia de false → true
    if (isReady && !prevReady.current) {
      const burst = Array.from({ length: 22 }, (_, i) => ({
        id: i,
        angle: (360 / 22) * i + Math.random() * 10,
        dist: 44 + Math.random() * 36,
        color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)],
        size: 3 + Math.random() * 3.5,
      }))
      setParticles(burst)
      setTimeout(() => setParticles([]), 1100)
    }
    if (!isReady) setParticles([])
    prevReady.current = isReady
  }, [isReady])

  return (
    <div className="relative w-full" style={{ isolation: 'isolate' }}>
      {particles.map(pt => (
        <span
          key={pt.id}
          className="fmt-particle"
          style={{
            '--pt-a': `${pt.angle}deg`,
            '--pt-d': `${pt.dist}px`,
            width: pt.size,
            height: pt.size,
            background: pt.color,
          }}
        />
      ))}
      <button
        onClick={isReady ? onClick : undefined}
        disabled={!isReady}
        title={isReady ? 'Generar PDF' : 'Completa los campos obligatorios (*)'}
        className={[
          'btn-primary w-full py-3 justify-center relative select-none',
          'transition-all duration-500',
          isReady
            ? 'fmt-btn-ready'
            : 'opacity-50 cursor-not-allowed saturate-50',
        ].join(' ')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="6 9 6 2 18 2 18 9"/>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
          <rect x="6" y="14" width="12" height="8"/>
        </svg>
        {isReady ? 'Imprimir / Guardar PDF' : 'Completa los campos obligatorios'}
      </button>
    </div>
  )
}

/* ── Componentes UI reutilizables ─────────────────────────────── */
function Tip({ txt }) {
  return (
    <span className="relative group inline-flex items-center ml-1 align-middle">
      <svg className="w-3.5 h-3.5 text-slate-400 cursor-help opacity-55 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span className="pointer-events-none absolute left-0 top-full mt-1.5 z-[60] w-72 bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-2.5 shadow-2xl leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal">
        {txt}
        <span className="absolute bottom-full left-3 border-[5px] border-transparent border-b-slate-900" />
      </span>
    </span>
  )
}
function Req() { return <span className="text-red-500 ml-0.5">*</span> }

function LabSelect({ equipos, value, onChange, required, className = 'input' }) {
  const labs = [...new Set(equipos.map(e => e.laboratorio).filter(Boolean))].sort()
  return (
    <select value={value} onChange={onChange} required={required} className={className} style={{ background: '#fff', color: '#1e293b' }}>
      <option value="">— Seleccionar laboratorio —</option>
      {labs.map(l => <option key={l} value={l}>{l}</option>)}
    </select>
  )
}

function EquipoSelect({ equipos, value, onChange, required, className = 'input', labFiltro }) {
  const lista = labFiltro ? equipos.filter(e => e.laboratorio === labFiltro) : equipos
  return (
    <select value={value} onChange={onChange} required={required} className={className} style={{ background: '#fff', color: '#1e293b' }}>
      <option value="">— Seleccionar equipo —</option>
      {lista.map(e => (
        <option key={e.id} value={e.id}>
          {e.nombre}{e.numero_serie ? ` · ${e.numero_serie}` : ''} — {e.laboratorio}
        </option>
      ))}
    </select>
  )
}

/* ════════════════════════════════════════════════════════════════
   FORMATO 01 — Lista de Verificación de Infraestructura y Equipo
════════════════════════════════════════════════════════════════ */
const Formato01 = forwardRef(function F01({ equipos, onReadyChange }, ref) {
  const [data, setData] = useState({
    lab: '',
    jefeDpto: '',
    jefeArea: '',
    fecha: today(),
    filas: [{ espacio: '', hallazgo: '', atendido: 'si' }],
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    onReadyChange?.(!!(data.lab && data.jefeArea.trim() && data.jefeDpto.trim() && data.fecha))
  }, [data, onReadyChange])

  const handleLab = (lab) => {
    const equiposLab = equipos.filter(e => e.laboratorio === lab)
    setData(p => ({
      ...p,
      lab,
      jefeArea: lab,
      filas: equiposLab.length > 0
        ? equiposLab.map(e => ({ espacio: e.nombre, hallazgo: '', atendido: 'si' }))
        : [{ espacio: '', hallazgo: '', atendido: 'si' }],
    }))
  }

  const addFila = () => setData(p => ({ ...p, filas: [...p.filas, { espacio: '', hallazgo: '', atendido: '' }] }))
  const setFila = (i, k, v) => setData(p => { const f = [...p.filas]; f[i] = { ...f[i], [k]: v }; return { ...p, filas: f } })
  const delFila = (i) => setData(p => ({ ...p, filas: p.filas.filter((_, j) => j !== i) }))

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const rows = [...data.filas]
      while (rows.length < 15) rows.push({ espacio: '', hallazgo: '', atendido: '' })
      const filasHTML = rows.map(f => `<tr>
        <td style="width:27%;font-size:10pt">${f.espacio || '&nbsp;'}</td>
        <td style="width:55%;font-size:10pt">${f.hallazgo || '&nbsp;'}</td>
        <td style="width:9%;text-align:center;font-size:10pt">${f.atendido === 'si' ? 'X' : '&nbsp;'}</td>
        <td style="width:9%;text-align:center;font-size:10pt">${f.atendido === 'no' ? 'X' : '&nbsp;'}</td>
      </tr>`).join('')
      const html = `
        ${instHeader({ titulo: 'Formato para la Lista de Verificación de Infraestructura y equipo', codigo: 'TecNM-AD-PO-001-01', normas: ['Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1', 'Referencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2'] }, logo)}
        <table class="ft-sep" style="border-top:1.5px solid #000;margin-bottom:0">
          <tr><td style="width:55%;font-size:11pt">Jefe(a) del departamento de</td><td style="text-align:center;font-size:10pt">${data.jefeDpto || '&nbsp;'}</td></tr>
          <tr><td style="font-size:11pt">Jefe(a) del área verificada</td><td style="text-align:center;font-size:10pt">${data.jefeArea || '&nbsp;'}</td></tr>
        </table>
        <table class="ft" style="border-top:1.5px solid #000">
          <tr><td colspan="4" style="font-size:10pt"><b>FECHA: &nbsp;&nbsp;${fmtDate(data.fecha)}</b></td></tr>
          <tr style="background:#e8e8e8">
            <th style="width:27%;text-transform:uppercase;font-size:10pt">Espacio Revisado</th>
            <th style="width:55%;text-transform:uppercase;font-size:10pt">Hallazgo</th>
            <th colspan="2" style="text-align:center;font-size:9pt;text-transform:uppercase">ATENDIDO</th>
          </tr>
          <tr style="background:#f0f0f0"><th></th><th></th>
            <th style="width:9%;text-align:center;font-size:10pt"><b>Sí</b></th>
            <th style="width:9%;text-align:center;font-size:10pt"><b>No</b></th>
          </tr>
          ${filasHTML}
        </table>
        <p style="font-size:11pt;font-weight:bold;margin:8px 0 4px 6px;text-transform:uppercase">Realizó:</p>
        <table class="ft-sep" style="border-top:1.5px solid #000">
          <tr style="height:32px"><td style="width:55%;font-size:11pt">Depto. de Recursos Materiales y Servicios y/o Mantenimiento de Equipo</td><td style="text-align:center;font-size:11pt">${data.jefeDpto || '&nbsp;'}</td></tr>
          <tr style="height:32px"><td style="font-size:11pt">Jefe(a) del Área Verificada</td><td style="text-align:center;font-size:11pt">${data.jefeArea || '&nbsp;'}</td></tr>
        </table>`
      openPrintWin(html, 'Lista de Verificación — TecNM-AD-PO-001-01')
    }
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="label">Laboratorio / Área a verificar <Req />
            <Tip txt="Selecciona el laboratorio. Los equipos registrados se cargarán automáticamente en la tabla." />
          </label>
          <LabSelect equipos={equipos} value={data.lab} onChange={e => handleLab(e.target.value)} required />
        </div>
        <div>
          <label className="label">Jefe(a) del área verificada <Req />
            <Tip txt="Se rellena automáticamente con el laboratorio. Puedes editarlo." />
          </label>
          <input className="input" value={data.jefeArea} onChange={e => s('jefeArea', e.target.value)} required />
        </div>
        <div>
          <label className="label">Departamento responsable y nombre del Jefe(a) <Req />
            <Tip txt="Anotar el Departamento responsable del mantenimiento (Recursos Materiales, Cómputo o Mantenimiento)." />
          </label>
          <input className="input" value={data.jefeDpto} onChange={e => s('jefeDpto', e.target.value)} placeholder="Recursos Materiales / Cómputo / Mantenimiento" required />
        </div>
        <div>
          <label className="label">Fecha de verificación <Req /></label>
          <input type="date" className="input" value={data.fecha} onChange={e => s('fecha', e.target.value)} required />
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
          Espacios / Equipos a verificar
          {data.lab && <span className="ml-2 font-normal text-primary-600 normal-case">({data.filas.length} equipos de {data.lab})</span>}
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-primary-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-semibold text-primary-700 uppercase">Espacio / Equipo</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-primary-700 uppercase">Hallazgo</th>
                <th className="px-3 py-2 text-xs font-semibold text-primary-700 uppercase w-28 text-center">Atendido</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.filas.map((f, i) => (
                <tr key={i}>
                  <td className="px-3 py-2"><input className="input text-xs" value={f.espacio} onChange={e => setFila(i, 'espacio', e.target.value)} placeholder="Nombre del equipo o espacio" /></td>
                  <td className="px-3 py-2"><input className="input text-xs" value={f.hallazgo} onChange={e => setFila(i, 'hallazgo', e.target.value)} placeholder="Observación o falla encontrada" /></td>
                  <td className="px-3 py-2 text-center">
                    <select className="input text-xs w-20" value={f.atendido} onChange={e => setFila(i, 'atendido', e.target.value)} style={{ background: '#fff', color: '#1e293b' }}>
                      <option value="si">Sí</option>
                      <option value="no">No</option>
                      <option value="">—</option>
                    </select>
                  </td>
                  <td className="px-2">{data.filas.length > 1 && <button type="button" onClick={() => delFila(i)} className="text-red-400 hover:text-red-600 text-xl leading-none cursor-pointer">×</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button type="button" onClick={addFila} className="btn-secondary text-xs mt-2">+ Agregar espacio</button>
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════════
   FORMATO 02 — Solicitud de Mantenimiento Correctivo
════════════════════════════════════════════════════════════════ */
const DEPTOS_02 = ['Recursos Materiales y Servicios', 'Mantenimiento de Equipo', 'Centro de Cómputo']

const Formato02 = forwardRef(function F02({ equipos, user, onReadyChange }, ref) {
  const [data, setData] = useState({
    equipoId: '',
    dirigidoA: 'Mantenimiento de Equipo',
    folio: '',
    areasolicitante: '',
    solicitante: user?.nombre || '',
    fecha: today(),
    descripcion: '',
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    onReadyChange?.(!!(
      data.dirigidoA &&
      data.areasolicitante.trim() &&
      data.solicitante.trim() &&
      data.fecha &&
      data.descripcion.trim()
    ))
  }, [data, onReadyChange])

  const handleEquipo = (id) => {
    const eq = equipos.find(e => e.id === id)
    setData(p => ({
      ...p,
      equipoId: id,
      areasolicitante: eq?.laboratorio || p.areasolicitante,
      descripcion: eq
        ? `Equipo: ${eq.nombre}\nNúm. de Serie: ${eq.numero_serie || 'N/D'}\nUbicación: ${eq.laboratorio}\n\nDescripción de la falla o servicio requerido:\n`
        : p.descripcion,
    }))
  }

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const chkTable = DEPTOS_02.map(d => `<tr>
        <td style="padding:2px 6px;border:none;font-size:10pt">${d}</td>
        <td style="padding:2px 6px;border:none;text-align:center;width:36px">
          <div style="width:12px;height:12px;border:1px solid #000;display:inline-flex;align-items:center;justify-content:center;font-size:10pt;font-weight:bold">${data.dirigidoA === d ? 'X' : '&nbsp;'}</div>
        </td>
      </tr>`).join('')
      const html = `
        ${instHeader({ titulo: 'Formato para Solicitud de Mantenimiento Correctivo', codigo: 'TecNM-AD-PO-001-02', normas: ['Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.4, 7.5.1', 'Referencia a la Norma ISO 14001:2015 6.1'], rev: 'Revisión: 0' }, logo)}
        <table class="ft" style="border-top:1.5px solid #000">
          <tr>
            <td style="padding:5px 8px">
              <p style="text-align:center;font-size:12pt;font-weight:bold;text-transform:uppercase;margin-bottom:8px">Solicitud de Mantenimiento Correctivo</p>
              <div style="display:flex;justify-content:space-between;align-items:flex-start">
                <div>
                  <p style="font-size:10pt;font-weight:bold;margin-bottom:4px">Departamento al que va dirigida la solicitud:</p>
                  <table style="border:1px solid #000;border-collapse:collapse">${chkTable}</table>
                </div>
                <div style="text-align:right;padding-left:20px">
                  <p style="font-size:11pt"><b>Folio:</b> &nbsp;${data.folio || '_______________'}</p>
                </div>
              </div>
            </td>
          </tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Área Solicitante: &nbsp;&nbsp;${data.areasolicitante || ''}</b><br>&nbsp;</td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Nombre y Firma del Solicitante: &nbsp;&nbsp;${data.solicitante || ''}</b><br>&nbsp;<br>&nbsp;</td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Fecha de Elaboración: &nbsp;&nbsp;${fmtDate(data.fecha)}</b><br>&nbsp;</td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Descripción del servicio solicitado o falla a reparar:</b></td></tr>
          <tr><td style="padding:5px 8px;vertical-align:top;min-height:120px"><p class="pre" style="font-size:11pt;min-height:100px">${data.descripcion.replace(/\n/g, '<br>')}</p></td></tr>
        </table>
        <div class="ccp" style="margin-top:20px">
          <p>C.c.p.&nbsp;&nbsp;&nbsp;&nbsp; Departamento de Planeación Programación y Presupuestación</p>
          <p>C.c.p.&nbsp;&nbsp;&nbsp;&nbsp; Área Solicitante.</p>
        </div>`
      openPrintWin(html, 'Solicitud de Mantenimiento Correctivo — TecNM-AD-PO-001-02')
    }
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="label">Equipo a reportar
          <Tip txt="Selecciona el equipo para pre-rellenar los datos automáticamente. Si no aparece, llena los campos manualmente." />
        </label>
        <EquipoSelect equipos={equipos} value={data.equipoId} onChange={e => handleEquipo(e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Departamento al que va dirigida la solicitud <Req /></label>
        <div className="flex flex-wrap gap-5 mt-1">
          {DEPTOS_02.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="dir02f" value={opt} checked={data.dirigidoA === opt} onChange={e => s('dirigidoA', e.target.value)} className="accent-primary-600" />
              {opt}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Número de folio
          <Tip txt="El Departamento receptor asigna el folio. Dejar en blanco si aún no fue asignado." />
        </label>
        <input className="input" value={data.folio} onChange={e => s('folio', e.target.value)} placeholder="Asignado por el departamento receptor" />
      </div>
      <div>
        <label className="label">Área solicitante <Req />
          <Tip txt="Se rellena automáticamente al seleccionar equipo. Puedes editarlo." />
        </label>
        <input required className="input" value={data.areasolicitante} onChange={e => s('areasolicitante', e.target.value)} />
      </div>
      <div>
        <label className="label">Nombre y firma del solicitante <Req /></label>
        <input required className="input" value={data.solicitante} onChange={e => s('solicitante', e.target.value)} />
      </div>
      <div>
        <label className="label">Fecha de elaboración <Req /></label>
        <input type="date" required className="input" value={data.fecha} onChange={e => s('fecha', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Descripción del servicio o falla <Req />
          <Tip txt="Se pre-rellena al seleccionar un equipo. Añade la descripción de la falla al final." />
        </label>
        <textarea required className="input resize-none" rows={6} value={data.descripcion} onChange={e => s('descripcion', e.target.value)} placeholder="Selecciona un equipo arriba o escribe la descripción aquí…" />
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════════
   FORMATO 03 — Programa de Mantenimiento Preventivo
════════════════════════════════════════════════════════════════ */
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const Formato03 = forwardRef(function F03({ equipos, user, onReadyChange }, ref) {
  const [data, setData] = useState({
    semestre: 'Ene–Jun',
    anio: String(new Date().getFullYear()),
    jefe: user?.nombre || '',
    subdirector: '',
    fechaElab: today(),
    fechaApro: '',
    servicios: [{ equipoId: '', desc: '', tipo: 'I', mesesP: {}, mesesR: {}, mesesO: {}, obsTexto: '' }],
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const ok = !!(
      data.anio &&
      data.fechaElab &&
      data.jefe.trim() &&
      data.servicios.some(sv => sv.desc.trim())
    )
    onReadyChange?.(ok)
  }, [data, onReadyChange])

  const addSvc = () => setData(p => ({ ...p, servicios: [...p.servicios, { equipoId: '', desc: '', tipo: 'I', mesesP: {}, mesesR: {}, mesesO: {}, obsTexto: '' }] }))
  const setSvc = (i, k, v) => setData(p => { const ss = [...p.servicios]; ss[i] = { ...ss[i], [k]: v }; return { ...p, servicios: ss } })
  const delSvc = (i) => setData(p => ({ ...p, servicios: p.servicios.filter((_, j) => j !== i) }))
  const handleSvcEquipo = (i, id) => {
    const eq = equipos.find(e => e.id === id)
    setSvc(i, 'equipoId', id)
    if (eq) setSvc(i, 'desc', `Mantenimiento preventivo: ${eq.nombre} (S/N: ${eq.numero_serie || 'N/D'})`)
  }
  const toggleMes = (i, row, m) => setData(p => {
    const ss = [...p.servicios]; const ms = { ...ss[i][row] }
    ms[m] ? delete ms[m] : (ms[m] = true)
    ss[i] = { ...ss[i], [row]: ms }; return { ...p, servicios: ss }
  })
  const setMesO = (i, m, v) => setData(p => {
    const ss = [...p.servicios]; ss[i] = { ...ss[i], mesesO: { ...ss[i].mesesO, [m]: v } }; return { ...p, servicios: ss }
  })

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const mesHeaders = MESES.map(m => `<th style="width:26px;text-align:center;font-size:8pt;background:#d9d9d9;text-transform:uppercase;padding:2px">${m}</th>`).join('')
      const svcRows = data.servicios.map((svc, i) => {
        const mesCellsP = MESES.map(m => `<td style="text-align:center;font-size:9pt;padding:2px">${svc.mesesP[m] ? 'X' : '&nbsp;'}</td>`).join('')
        const mesCellsR = MESES.map(m => `<td style="text-align:center;font-size:9pt;padding:2px">${svc.mesesR[m] ? 'X' : '&nbsp;'}</td>`).join('')
        const mesCellsO = MESES.map(m => `<td style="text-align:center;font-size:8pt;padding:2px">${svc.mesesO[m] || '&nbsp;'}</td>`).join('')
        return `<tr>
          <td rowspan="3" style="text-align:center;vertical-align:middle;font-size:10pt;padding:2px">${i+1}</td>
          <td rowspan="2" style="font-size:9pt;padding:3px">${svc.desc || '&nbsp;'}</td>
          <td style="text-align:center;font-size:9pt;padding:2px;width:26px">${svc.tipo === 'I' ? 'X' : '&nbsp;'}</td>
          <td style="text-align:center;font-size:9pt;padding:2px;width:26px">${svc.tipo === 'E' ? 'X' : '&nbsp;'}</td>
          <td style="text-align:center;font-size:8pt;font-weight:bold;padding:2px;background:#e8f0ff">P</td>${mesCellsP}
        </tr>
        <tr>
          <td style="text-align:center;font-size:9pt;padding:2px">&nbsp;</td>
          <td style="text-align:center;font-size:9pt;padding:2px">&nbsp;</td>
          <td style="text-align:center;font-size:8pt;font-weight:bold;padding:2px;background:#e8ffe8">R</td>${mesCellsR}
        </tr>
        <tr>
          <td colspan="3" style="font-size:8pt;padding:2px;color:#555">${svc.obsTexto || '&nbsp;'}</td>
          <td style="text-align:center;font-size:8pt;font-weight:bold;padding:2px;background:#fff8e0">O</td>${mesCellsO}
        </tr>`
      }).join('')
      const html = `
        ${instHeader({ titulo: 'Formato para Programa de Mantenimiento Preventivo', codigo: 'TecNM-AD-PO-001-03', normas: ['Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1', 'Referencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2'], rev: 'Revisión: 0' }, logo)}
        <p style="font-size:11pt;font-weight:bold;margin:6px 0">Semestre: &nbsp;${data.semestre}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Año: &nbsp;${data.anio}</p>
        <table class="ft" style="border-top:1.5px solid #000;font-size:9pt">
          <thead>
            <tr>
              <th style="width:28px;background:#d9d9d9;font-size:8pt;padding:2px">No.</th>
              <th style="text-align:left;background:#d9d9d9;font-size:8pt;text-transform:uppercase;padding:3px">Servicio</th>
              <th colspan="2" style="text-align:center;background:#d9d9d9;font-size:8pt;text-transform:uppercase;padding:2px">Tipo</th>
              <th style="width:26px;background:#d9d9d9;font-size:8pt;padding:2px">P/R/O</th>${mesHeaders}
            </tr>
            <tr>
              <th style="background:#e8e8e8;padding:2px"></th><th style="background:#e8e8e8;padding:2px"></th>
              <th style="width:26px;text-align:center;background:#e8e8e8;font-size:8pt;padding:2px">I</th>
              <th style="width:26px;text-align:center;background:#e8e8e8;font-size:8pt;padding:2px">E</th>
              <th style="background:#e8e8e8;padding:2px"></th>
              ${MESES.map(() => '<th style="background:#e8e8e8;padding:2px"></th>').join('')}
            </tr>
          </thead>
          <tbody>${svcRows}</tbody>
        </table>
        <table class="sign-t" style="margin-top:12px">
          <tr>
            <td style="text-align:left"><span style="font-size:9pt;font-weight:bold">Fecha de Elaboración:</span><br>${fmtDate(data.fechaElab)}</td>
            <td style="text-align:left"><span style="font-size:9pt;font-weight:bold">Nombre y Firma — Jefe del Depto.:</span><br>${data.jefe || '&nbsp;'}</td>
            <td style="text-align:left"><span style="font-size:9pt;font-weight:bold">Fecha de Aprobación:</span><br>${fmtDate(data.fechaApro)}</td>
            <td style="text-align:left"><span style="font-size:9pt;font-weight:bold">Nombre y Firma — Subdirector S.A.:</span><br>${data.subdirector || '&nbsp;'}</td>
          </tr>
        </table>`
      openPrintWin(html, 'Programa de Mantenimiento Preventivo — TecNM-AD-PO-001-03')
    }
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Semestre <Req /></label>
          <select required className="input" value={data.semestre} onChange={e => s('semestre', e.target.value)} style={{ background: '#fff', color: '#1e293b' }}>
            <option>Ene–Jun</option><option>Ago–Dic</option>
          </select>
        </div>
        <div>
          <label className="label">Año <Req /></label>
          <input type="number" required className="input" value={data.anio} onChange={e => s('anio', e.target.value)} min="2020" max="2099" />
        </div>
        <div>
          <label className="label">Fecha de elaboración <Req /></label>
          <input type="date" required className="input" value={data.fechaElab} onChange={e => s('fechaElab', e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha de aprobación</label>
          <input type="date" className="input" value={data.fechaApro} onChange={e => s('fechaApro', e.target.value)} />
        </div>
      </div>
      <p className="text-xs text-slate-500">
        <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></span>Fila <b>P</b> = Programado &nbsp;
        <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>Fila <b>R</b> = Realizado &nbsp;
        <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded mr-1"></span>Fila <b>O</b> = Observación
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-8">#</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase text-left">Equipo / Servicio</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-16">Tipo</th>
              <th className="px-2 py-2 text-primary-700 font-semibold text-center" colSpan={12}>Meses</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.servicios.map((svc, i) => (
              <>
                <tr key={`${i}-sel`} className="bg-slate-50">
                  <td rowSpan={3} className="px-2 py-1 text-center text-slate-400 font-mono align-middle border-r border-slate-200">{i+1}</td>
                  <td className="px-2 py-1" colSpan={2}>
                    <EquipoSelect equipos={equipos} value={svc.equipoId} onChange={e => handleSvcEquipo(i, e.target.value)} className="input text-xs mb-1" />
                    <input required className="input text-xs" value={svc.desc} onChange={e => setSvc(i,'desc',e.target.value)} placeholder="O escribe la descripción del servicio…" />
                  </td>
                  <td className="px-1 py-1 align-middle">
                    <select className="input text-xs w-12" value={svc.tipo} onChange={e => setSvc(i,'tipo',e.target.value)} style={{ background: '#fff', color: '#1e293b' }}>
                      <option value="I">I</option><option value="E">E</option>
                    </select>
                  </td>
                  {MESES.map(m => (
                    <td key={m} className="px-0.5 py-1 text-center">
                      <div className="text-blue-600 text-[9px] font-bold leading-none mb-0.5">{m}</div>
                      <input type="checkbox" checked={!!svc.mesesP[m]} onChange={() => toggleMes(i,'mesesP',m)} className="accent-primary-600" />
                    </td>
                  ))}
                  <td rowSpan={3} className="px-1 align-middle">{data.servicios.length > 1 && <button type="button" onClick={() => delSvc(i)} className="text-red-400 hover:text-red-600 text-xl cursor-pointer">×</button>}</td>
                </tr>
                <tr key={`${i}-r`} className="bg-green-50/40">
                  <td className="px-2 py-0.5 text-[10px] text-green-700 font-bold" colSpan={3}>R — Realizado</td>
                  {MESES.map(m => (
                    <td key={m} className="px-0.5 py-1 text-center">
                      <input type="checkbox" checked={!!svc.mesesR[m]} onChange={() => toggleMes(i,'mesesR',m)} className="accent-green-600" />
                    </td>
                  ))}
                </tr>
                <tr key={`${i}-o`} className="bg-amber-50/40">
                  <td className="px-2 py-1" colSpan={3}>
                    <input className="input text-[10px] py-0.5" value={svc.obsTexto} onChange={e => setSvc(i,'obsTexto',e.target.value)} placeholder="Causa de reprogramación…" />
                  </td>
                  {MESES.map(m => (
                    <td key={m} className="px-0.5 py-0.5 text-center">
                      <input className="w-7 text-[9px] text-center border border-slate-300 rounded px-0 py-0.5" value={svc.mesesO[m] || ''} onChange={e => setMesO(i, m, e.target.value)} maxLength={5} />
                    </td>
                  ))}
                </tr>
              </>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addSvc} className="btn-secondary text-xs">+ Agregar servicio</button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
        <div>
          <label className="label">Nombre y firma — Jefe(a) del Departamento <Req /></label>
          <input required className="input" value={data.jefe} onChange={e => s('jefe', e.target.value)} placeholder="Recursos Materiales / Cómputo / Mantenimiento" />
        </div>
        <div>
          <label className="label">Nombre y firma — Subdirector(a) de Servicios Administrativos</label>
          <input className="input" value={data.subdirector} onChange={e => s('subdirector', e.target.value)} />
        </div>
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════════
   FORMATO 04 — Orden de Trabajo de Mantenimiento
════════════════════════════════════════════════════════════════ */
const Formato04 = forwardRef(function F04({ equipos, onReadyChange }, ref) {
  const [data, setData] = useState({
    equipoId: '',
    noControl: '',
    tipoMant: 'Interno',
    tipoServicio: '',
    asignadoA: '',
    fechaRealizacion: today(),
    trabajoRealizado: '',
    verificadoPor: '',
    fechaVerificacion: today(),
    aprobadoPor: '',
    fechaAprobacion: today(),
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    onReadyChange?.(!!(
      data.tipoServicio.trim() &&
      data.asignadoA.trim() &&
      data.fechaRealizacion &&
      data.trabajoRealizado.trim() &&
      data.verificadoPor.trim() &&
      data.fechaVerificacion &&
      data.aprobadoPor.trim()
    ))
  }, [data, onReadyChange])

  const handleEquipo = (id) => {
    const eq = equipos.find(e => e.id === id)
    setData(p => ({
      ...p,
      equipoId: id,
      trabajoRealizado: eq
        ? `Equipo: ${eq.nombre}\nNúm. Serie: ${eq.numero_serie || 'N/D'}\nLaboratorio: ${eq.laboratorio}\n\nDescripción del trabajo realizado:\n`
        : p.trabajoRealizado,
    }))
  }

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const html = `
        ${instHeader({ titulo: 'Formato para Orden de Trabajo de Mantenimiento', codigo: 'TecNM-AD-PO-001-04', normas: ['Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1', 'Referencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2'], rev: 'Revisión: 0' }, logo)}
        <p style="font-size:11pt;font-weight:bold;text-align:right;margin:6px 0">Número de control: &nbsp;${data.noControl || '_______________'}</p>
        <table class="ft" style="border-top:1.5px solid #000">
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Mantenimiento: &nbsp;&nbsp;&nbsp;
            Interno &nbsp;<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:12px;vertical-align:middle">${data.tipoMant==='Interno'?'X':''}</span>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            Externo &nbsp;<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:12px;vertical-align:middle">${data.tipoMant==='Externo'?'X':''}</span>
          </b></td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Tipo de servicio: &nbsp;&nbsp;${data.tipoServicio || ''}</b></td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Asignado a: &nbsp;&nbsp;${data.asignadoA || ''}</b></td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Fecha de realización: &nbsp;&nbsp;${fmtDate(data.fechaRealizacion)}</b></td></tr>
          <tr><td style="padding:5px 8px"><b style="font-size:11pt">Trabajo Realizado:</b><br>
            <p class="pre" style="font-size:11pt;min-height:90px;margin-top:4px;line-height:1.6">${data.trabajoRealizado.replace(/\n/g,'<br>')}</p>
          </td></tr>
          <tr><td style="padding:0">
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="border-right:1px solid #000;padding:5px 8px;width:57%"><b style="font-size:11pt">Verificado y Liberado por:</b><br>&nbsp;<br>${data.verificadoPor || '&nbsp;'}<br>&nbsp;</td>
                <td style="padding:5px 8px"><b style="font-size:11pt">Fecha y Firma:</b><br>&nbsp;<br>${fmtDate(data.fechaVerificacion)}<br>&nbsp;</td>
              </tr>
              <tr>
                <td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px 8px"><b style="font-size:11pt">Aprobado por:</b><br>&nbsp;<br>${data.aprobadoPor || '&nbsp;'}<br>&nbsp;</td>
                <td style="border-top:1px solid #000;padding:5px 8px"><b style="font-size:11pt">Fecha y Firma:</b><br>&nbsp;<br>${fmtDate(data.fechaAprobacion)}<br>&nbsp;</td>
              </tr>
            </table>
          </td></tr>
        </table>
        <div class="ccp" style="margin-top:16px">
          <p>C.c.p.&nbsp;&nbsp;&nbsp;&nbsp; Departamento de Planeación Programación y Presupuestación</p>
          <p>C.c.p.&nbsp;&nbsp;&nbsp;&nbsp; Área Solicitante.</p>
        </div>`
      openPrintWin(html, 'Orden de Trabajo — TecNM-AD-PO-001-04')
    }
  }))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="md:col-span-2">
        <label className="label">Equipo a atender
          <Tip txt="Selecciona el equipo para pre-rellenar la descripción del trabajo." />
        </label>
        <EquipoSelect equipos={equipos} value={data.equipoId} onChange={e => handleEquipo(e.target.value)} />
      </div>
      <div>
        <label className="label">Número de control
          <Tip txt="Asignado por el Jefe del Depto. de Recursos Materiales o Mantenimiento." />
        </label>
        <input className="input" value={data.noControl} onChange={e => s('noControl', e.target.value)} placeholder="Asignado por Jefe de Depto." />
      </div>
      <div>
        <label className="label">Tipo de mantenimiento <Req /></label>
        <div className="flex gap-6 mt-1">
          {['Interno','Externo'].map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="tm04f" value={opt} checked={data.tipoMant===opt} onChange={e => s('tipoMant',e.target.value)} className="accent-primary-600" />{opt}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">Tipo de servicio <Req />
          <Tip txt="Clase de mantenimiento: eléctrico, plomería, pintura, obra civil, etc." />
        </label>
        <input required className="input" value={data.tipoServicio} onChange={e => s('tipoServicio', e.target.value)} placeholder="Eléctrico, plomería, pintura…" />
      </div>
      <div>
        <label className="label">Asignado a <Req /></label>
        <input required className="input" value={data.asignadoA} onChange={e => s('asignadoA', e.target.value)} placeholder="Nombre del técnico responsable" />
      </div>
      <div>
        <label className="label">Fecha de realización <Req /></label>
        <input type="date" required className="input" value={data.fechaRealizacion} onChange={e => s('fechaRealizacion', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="label">Trabajo realizado <Req /></label>
        <textarea required className="input resize-none" rows={5} value={data.trabajoRealizado} onChange={e => s('trabajoRealizado', e.target.value)} placeholder="Selecciona un equipo arriba o describe el trabajo…" />
      </div>
      <div>
        <label className="label">Verificado y liberado por <Req /></label>
        <input required className="input" value={data.verificadoPor} onChange={e => s('verificadoPor', e.target.value)} />
      </div>
      <div>
        <label className="label">Fecha de liberación <Req /></label>
        <input type="date" required className="input" value={data.fechaVerificacion} onChange={e => s('fechaVerificacion', e.target.value)} />
      </div>
      <div>
        <label className="label">Aprobado por <Req /></label>
        <input required className="input" value={data.aprobadoPor} onChange={e => s('aprobadoPor', e.target.value)} />
      </div>
      <div>
        <label className="label">Fecha de aprobación <Req /></label>
        <input type="date" required className="input" value={data.fechaAprobacion} onChange={e => s('fechaAprobacion', e.target.value)} />
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════════
   FORMATO 05 — Orden de Compra del Bien o Servicio
════════════════════════════════════════════════════════════════ */
const Formato05 = forwardRef(function F05({ equipos, onReadyChange }, ref) {
  const [data, setData] = useState({
    instituto: 'Ecatepec',
    proveedor: '',
    noOrden: '',
    fecha: today(),
    items: [{ equipoId: '', cant: 1, unidad: 'Pieza', desc: '', area: '', noReq: '', precio: '' }],
    jefeAdq: '',
    jefeRec: '',
    subdirector: '',
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useEffect(() => {
    const ok = !!(
      data.instituto.trim() &&
      data.proveedor.trim() &&
      data.noOrden.trim() &&
      data.fecha &&
      data.items.some(it => it.desc.trim()) &&
      data.jefeAdq.trim()
    )
    onReadyChange?.(ok)
  }, [data, onReadyChange])

  const addItem = () => setData(p => ({ ...p, items: [...p.items, { equipoId: '', cant: 1, unidad: 'Pieza', desc: '', area: '', noReq: '', precio: '' }] }))
  const setItem = (i, k, v) => setData(p => { const its=[...p.items]; its[i]={...its[i],[k]:v}; return {...p,items:its} })
  const delItem = (i) => setData(p => ({ ...p, items: p.items.filter((_,j)=>j!==i) }))
  const handleItemEquipo = (i, id) => {
    const eq = equipos.find(e => e.id === id)
    setItem(i, 'equipoId', id)
    if (eq) { setItem(i, 'desc', eq.nombre); setItem(i, 'area', eq.laboratorio) }
  }
  const parcial = (it) => (Number(it.cant)*Number(it.precio))||0
  const total = data.items.reduce((acc,it)=>acc+parcial(it),0)
  const fmt = (n) => n.toLocaleString('es-MX',{style:'currency',currency:'MXN'})

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const itemRows = data.items.map((it, i) => `<tr>
        <td style="text-align:center;font-size:9pt;padding:3px">${i+1}</td>
        <td style="text-align:center;font-size:9pt;padding:3px">${it.cant}</td>
        <td style="font-size:9pt;padding:3px">${it.unidad}</td>
        <td style="font-size:9pt;padding:3px">${it.desc}</td>
        <td style="font-size:9pt;padding:3px">${it.area}</td>
        <td style="font-size:9pt;padding:3px">${it.noReq}</td>
        <td style="text-align:right;font-size:9pt;padding:3px">${it.precio ? fmt(Number(it.precio)) : ''}</td>
        <td style="text-align:right;font-size:9pt;padding:3px">${parcial(it) ? fmt(parcial(it)) : ''}</td>
      </tr>`).join('')
      const html = `
        ${instHeader({ titulo: 'Formato para Orden de Compra del Bien o Servicio', codigo: 'TecNM-AD-IT-001-05', normas: ['Referencia a la norma ISO 9001:2015 &nbsp;&nbsp; 6.1, 7.1.1, 7.1.5.2, 8.2', 'Referencia a la norma ISO 14001:2015 &nbsp;&nbsp; 4.2, 6.1, 7.1', 'Referencia a la norma ISO 50001:2018 8.3'], pagLabel: 'Hoja: 1 de 2', tituloCenter: true }, logo)}
        <p style="text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;margin:8px 0 2px">INSTITUTO TECNOLÓGICO DE ${data.instituto.toUpperCase()}</p>
        <p style="text-align:center;font-size:11pt;font-weight:bold">DEPARTAMENTO DE RECURSOS MATERIALES Y SERVICIOS</p>
        <p style="text-align:center;font-size:11pt;font-weight:bold">OFICINA DE ADQUISICIONES</p>
        <p style="text-align:center;font-size:12pt;font-weight:bold;margin-bottom:10px">ORDEN DE COMPRA DEL BIEN O SERVICIO</p>
        <p style="font-size:10pt;margin-bottom:4px"><b>PROVEEDOR:</b> &nbsp;${data.proveedor || '________________________________'}&nbsp;&nbsp;&nbsp;&nbsp;<b>No. DE ORDEN DE COMPRA:</b> &nbsp;${data.noOrden || '__________'}</p>
        <p style="font-size:10pt;margin-bottom:8px"><b>FECHA:</b> &nbsp;${fmtDate(data.fecha)}</p>
        <table class="ft" style="border-top:1.5px solid #000;font-size:9pt">
          <thead>
            <tr>
              <th style="width:26px;text-align:center;padding:3px">No.</th>
              <th style="width:36px;text-align:center;padding:3px">CANT.</th>
              <th style="width:52px;padding:3px">UNIDAD</th>
              <th style="text-align:left;padding:3px">DESCRIPCIÓN</th>
              <th style="width:90px;text-align:center;padding:3px">ÁREA SOLICITANTE</th>
              <th style="width:72px;text-align:center;padding:3px">NO. REQUISICIÓN</th>
              <th style="width:74px;text-align:center;padding:3px">PRECIO UNITARIO</th>
              <th style="width:80px;text-align:center;padding:3px">IMPORTE PARCIAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemRows}
            <tr style="background:#e8e8e8;font-weight:bold">
              <td colspan="7" style="text-align:right;font-size:9pt;padding:3px">IMPORTE TOTAL:</td>
              <td style="text-align:right;font-size:9pt;padding:3px">${fmt(total)}</td>
            </tr>
          </tbody>
        </table>
        <table class="sign-t">
          <tr>
            <td><span style="font-size:9pt;font-weight:bold">Jefe de Oficina de Adquisiciones</span><br><br><br>${data.jefeAdq || '&nbsp;'}</td>
            <td><span style="font-size:9pt;font-weight:bold">Jefe de Recursos Materiales y Servicios</span><br><br><br>${data.jefeRec || '&nbsp;'}</td>
            <td><span style="font-size:9pt;font-weight:bold">Subdirector de Servicios Administrativos — Vo.Bo.</span><br><br><br>${data.subdirector || '&nbsp;'}</td>
          </tr>
        </table>`
      openPrintWin(html, 'Orden de Compra — TecNM-AD-IT-001-05', true)
    }
  }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="label">Instituto Tecnológico de… <Req /></label>
          <input required className="input" value={data.instituto} onChange={e => s('instituto',e.target.value)} placeholder="Ej. Ecatepec" />
        </div>
        <div className="md:col-span-2">
          <label className="label">Proveedor <Req /></label>
          <input required className="input" value={data.proveedor} onChange={e => s('proveedor',e.target.value)} />
        </div>
        <div>
          <label className="label">Núm. de orden <Req /></label>
          <input required className="input" value={data.noOrden} onChange={e => s('noOrden',e.target.value)} />
        </div>
        <div>
          <label className="label">Fecha <Req /></label>
          <input type="date" required className="input" value={data.fecha} onChange={e => s('fecha',e.target.value)} />
        </div>
      </div>
      <label className="label">Bienes o servicios</label>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-8">#</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase">Equipo (opcional)</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-14">Cant.</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-20">Unidad</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase text-left">Descripción</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase">Área</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-20">No. Req.</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-24">P. Unit. $</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-24">Importe</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.items.map((it,i) => (
              <tr key={i}>
                <td className="px-2 py-2 text-center text-slate-400 font-mono">{i+1}</td>
                <td className="px-2 py-2 min-w-[160px]">
                  <EquipoSelect equipos={equipos} value={it.equipoId} onChange={e => handleItemEquipo(i, e.target.value)} className="input text-xs" />
                </td>
                <td className="px-2 py-2"><input type="number" min="1" className="input text-xs" value={it.cant} onChange={e=>setItem(i,'cant',e.target.value)} /></td>
                <td className="px-2 py-2"><input className="input text-xs" value={it.unidad} onChange={e=>setItem(i,'unidad',e.target.value)} /></td>
                <td className="px-2 py-2 min-w-[160px]"><input required className="input text-xs" value={it.desc} onChange={e=>setItem(i,'desc',e.target.value)} placeholder="Descripción del bien o servicio" /></td>
                <td className="px-2 py-2 min-w-[110px]"><input className="input text-xs" value={it.area} onChange={e=>setItem(i,'area',e.target.value)} /></td>
                <td className="px-2 py-2"><input className="input text-xs" value={it.noReq} onChange={e=>setItem(i,'noReq',e.target.value)} /></td>
                <td className="px-2 py-2"><input type="number" min="0" step="0.01" className="input text-xs" value={it.precio} onChange={e=>setItem(i,'precio',e.target.value)} placeholder="0.00" /></td>
                <td className="px-2 py-2 text-right font-mono text-slate-700">{parcial(it)?fmt(parcial(it)):'—'}</td>
                <td className="px-2">{data.items.length>1&&<button type="button" onClick={()=>delItem(i)} className="text-red-400 hover:text-red-600 text-xl cursor-pointer">×</button>}</td>
              </tr>
            ))}
            <tr className="bg-primary-50 font-semibold">
              <td colSpan={8} className="px-3 py-2 text-right text-xs text-slate-700 uppercase tracking-wide">Importe total</td>
              <td className="px-2 py-2 text-right font-bold font-mono text-primary-700">{fmt(total)}</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
      <button type="button" onClick={addItem} className="btn-secondary text-xs">+ Agregar ítem</button>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
        <div><label className="label">Jefe de Adquisiciones <Req /></label><input required className="input" value={data.jefeAdq} onChange={e=>s('jefeAdq',e.target.value)} /></div>
        <div><label className="label">Jefe de Recursos Materiales</label><input className="input" value={data.jefeRec} onChange={e=>s('jefeRec',e.target.value)} /></div>
        <div><label className="label">Subdirector S.A. — Vo.Bo.</label><input className="input" value={data.subdirector} onChange={e=>s('subdirector',e.target.value)} /></div>
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════════
   CONFIGURACIÓN DE FORMATOS
════════════════════════════════════════════════════════════════ */
const FORMATOS_META = [
  { id: '001-01', titulo: 'TecNM-AD-PO-001-01', nombre: 'Lista de Verificación de Infraestructura y Equipo', Comp: Formato01 },
  { id: '001-02', titulo: 'TecNM-AD-PO-001-02', nombre: 'Solicitud de Mantenimiento Correctivo',              Comp: Formato02 },
  { id: '001-03', titulo: 'TecNM-AD-PO-001-03', nombre: 'Programa de Mantenimiento Preventivo',               Comp: Formato03 },
  { id: '001-04', titulo: 'TecNM-AD-PO-001-04', nombre: 'Orden de Trabajo de Mantenimiento',                  Comp: Formato04 },
  { id: '001-05', titulo: 'TecNM-AD-IT-001-05', nombre: 'Orden de Compra del Bien o Servicio',                Comp: Formato05 },
]

/* ════════════════════════════════════════════════════════════════
   TARJETA DE FORMATO (acordeón)
════════════════════════════════════════════════════════════════ */
function FormatoCard({ formato, equipos, user }) {
  const [open, setOpen] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const compRef = useRef(null)
  const { id, titulo, nombre, Comp } = formato

  const handleToggle = () => {
    setOpen(o => {
      if (o) setIsReady(false)
      return !o
    })
  }

  return (
    <div className={`card transition-all duration-200 ${open ? 'ring-2 ring-primary-300' : ''}`}>
      <button onClick={handleToggle} className="w-full flex items-center justify-between text-left">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary-50 border border-primary-100 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-slate-800">{titulo}</p>
            <p className="text-sm text-slate-500">{nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          {open && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full transition-all duration-300 ${
              isReady
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-50 text-amber-600'
            }`}>
              {isReady ? 'Listo para imprimir' : 'Campos pendientes'}
            </span>
          )}
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </button>

      {open && (
        <div className="mt-5 pt-5 border-t border-gray-100 space-y-5">
          <p className="text-xs text-slate-400 flex items-center gap-1.5 flex-wrap">
            Los campos marcados con <span className="text-red-400 font-bold">*</span> son obligatorios.
            Pasa el cursor sobre
            <svg className="w-3.5 h-3.5 text-slate-400 inline" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            para ver instrucciones de llenado.
          </p>

          <Comp ref={compRef} equipos={equipos} user={user} onReadyChange={setIsReady} />

          <PrintButton isReady={isReady} onClick={() => compRef.current?.print()} />
        </div>
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
════════════════════════════════════════════════════════════════ */
export default function Formatos() {
  const { user } = useAuth()
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
        <p className="page-subtitle">Genera los formatos TecNM con encabezado oficial. Los equipos se seleccionan de la base de datos.</p>
      </div>

      <div className="bg-primary-50 border border-primary-200 rounded-xl px-4 py-3 text-sm text-primary-800 flex items-center gap-2">
        <svg className="w-4 h-4 flex-shrink-0 text-primary-600" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
        <span>Sección disponible solo para administradores. Los PDFs se generan directamente en tu navegador con el encabezado oficial TecNM.</span>
      </div>

      <div className="space-y-3">
        {FORMATOS_META.map(f => (
          <FormatoCard key={f.id} formato={f} equipos={equipos} user={user} />
        ))}
      </div>
    </div>
  )
}
