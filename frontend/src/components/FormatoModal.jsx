import { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { notificaciones as notiApi } from '../utils/api'
import _logoUrl from '../assets/logo-sgm.png'

/* ── Utilidades ─────────────────────────────────────────────── */
const today = () => new Date().toISOString().split('T')[0]
const fmtDate = (d) => d
  ? new Date(d + 'T12:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })
  : '___________________________'

/* ── Tooltip de instrucciones de llenado ───────────────────── */
function Tip({ txt }) {
  return (
    <span className="relative group inline-flex items-center ml-1 align-middle">
      <svg
        className="w-3.5 h-3.5 text-slate-400 cursor-help opacity-55 group-hover:opacity-100 transition-opacity duration-150"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span className="pointer-events-none absolute left-0 top-full mt-1.5 z-[60] w-72 bg-slate-900 border border-white/10 text-slate-200 text-xs rounded-xl px-3 py-2.5 shadow-2xl leading-relaxed opacity-0 group-hover:opacity-100 transition-opacity duration-150 whitespace-normal">
        {txt}
        <span className="absolute bottom-full left-3 border-[5px] border-transparent border-b-slate-900" />
      </span>
    </span>
  )
}

/* ── Indicador de campo obligatorio ────────────────────────── */
function Req() { return <span className="text-red-500 ml-0.5">*</span> }

/* ── CSS de impresión base ──────────────────────────────────── */
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

/* ── Logo SGC / TecNM ───────────────────────────────────────── */
// Se convierte a base64 para que funcione en ventana about:blank
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

/* ── Encabezado institucional ───────────────────────────────── */
function instHeader({ titulo, codigo, normas, pagLabel = 'Página 1 de 2', rev = 'Revisión 0', tituloCenter = false }, logo) {
  const logoCell = logo
    ? `<img src="${logo}" style="width:68px;height:68px;object-fit:contain;display:block;margin:auto" alt="SGC TecNM">`
    : `<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
        <rect x="1" y="1" width="68" height="68" fill="white" stroke="#222" stroke-width="2"/>
        <text x="35" y="13" font-family="Arial" font-size="10" font-weight="bold" fill="#000" text-anchor="middle" letter-spacing="3">S G C</text>
        <circle cx="35" cy="38" r="18" fill="none" stroke="#333" stroke-width="1.5"/>
        <text x="35" y="26.5" font-family="Arial" font-size="5.5" fill="#333" text-anchor="middle">CERTIFICADO</text>
        <polyline points="25,38 31,46 46,29" fill="none" stroke="#000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <text x="35" y="53" font-family="Arial" font-size="5.5" fill="#333" text-anchor="middle">ISO 9001</text>
        <text x="35" y="65" font-family="Arial" font-size="8" font-weight="bold" fill="#000" text-anchor="middle">TecNM</text>
       </svg>`
  return `
  <table style="width:100%;border-collapse:collapse;border:1.5px solid #000;margin-bottom:0">
    <tr>
      <td rowspan="3" style="width:76px;border-right:1.5px solid #000;vertical-align:middle;text-align:center;padding:4px">
        ${logoCell}
      </td>
      <td style="padding:5px 10px;font-weight:700;font-size:11pt;border-bottom:1px solid #000;${tituloCenter ? 'text-align:center;' : ''}">
        ${titulo}
      </td>
      <td style="width:140px;border-left:1.5px solid #000;border-bottom:1px solid #000;padding:3px 8px;font-size:8.5pt;font-weight:700">
        Código: ${codigo}
      </td>
    </tr>
    <tr>
      <td style="padding:2px 10px;font-size:8pt;border-bottom:1px solid #000">
        ${normas[0] || '&nbsp;'}
      </td>
      <td style="border-left:1.5px solid #000;border-bottom:1px solid #000;padding:3px 8px;font-size:8.5pt">
        ${rev}
      </td>
    </tr>
    <tr>
      <td style="padding:2px 10px;font-size:8pt">
        ${normas.slice(1).map(n => `<div>${n}</div>`).join('') || '&nbsp;'}
      </td>
      <td style="border-left:1.5px solid #000;padding:3px 8px;font-size:8.5pt">
        ${pagLabel}
      </td>
    </tr>
  </table>`
}

function openPrintWin(html, titulo, landscape = false) {
  const pw = window.open('', '_blank', 'width=960,height=720')
  const css = landscape ? LANDSCAPE_CSS : BASE_CSS
  const cls = landscape ? 'page-landscape' : 'page'
  pw.document.write(`<!DOCTYPE html><html lang="es"><head>
    <meta charset="UTF-8"><title>${titulo}</title>
    <style>${css}</style>
  </head><body><div class="${cls}">${html}</div></body></html>`)
  pw.document.close()
  pw.focus()
  setTimeout(() => pw.print(), 350)
}

/* ════════════════════════════════════════════════════════════
   FORMATO 01 — Lista de Verificación de Infraestructura y Equipo
   TecNM-AD-PO-001-01
════════════════════════════════════════════════════════════ */
const Formato01 = forwardRef(function F01({ equipo }, ref) {
  const [data, setData] = useState({
    jefeDpto: '',
    jefeArea: equipo.laboratorio,
    fecha: today(),
    filas: [{ espacio: equipo.nombre, hallazgo: '', atendido: 'si' }],
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))
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
        ${instHeader({ titulo: 'Formato para la Lista de Verificación de Infraestructura y equipo', codigo: 'TecNM-AD-PO-001-01', normas: ['Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1','Referencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2'] }, logo)}
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
          <label className="label">
            Departamento responsable y nombre del Jefe(a) <Req />
            <Tip txt="Anotar el Departamento responsable del mantenimiento y el nombre del Jefe(a) (Recursos Materiales y Servicios, Cómputo o Mantenimiento) según sea el caso, que realiza la verificación de instalaciones." />
          </label>
          <input required className="input" value={data.jefeDpto} onChange={e => s('jefeDpto', e.target.value)} placeholder="Recursos Materiales / Cómputo / Mantenimiento" />
        </div>
        <div>
          <label className="label">
            Jefe(a) del área verificada <Req />
            <Tip txt="Anotar el nombre del Jefe(a) del área, que realiza la verificación de instalaciones." />
          </label>
          <input required className="input" value={data.jefeArea} onChange={e => s('jefeArea', e.target.value)} />
        </div>
        <div>
          <label className="label">
            Fecha de verificación <Req />
            <Tip txt="Anotar la fecha en que se realiza la verificación de las instalaciones." />
          </label>
          <input type="date" required className="input" value={data.fecha} onChange={e => s('fecha', e.target.value)} />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-semibold text-primary-700 uppercase">
                Espacio revisado
                <Tip txt="Relacionar los espacios de las instalaciones que se van a verificar." />
              </th>
              <th className="px-3 py-2 text-left text-xs font-semibold text-primary-700 uppercase">
                Hallazgo
                <Tip txt="Anotar el hallazgo encontrado." />
              </th>
              <th className="px-3 py-2 text-xs font-semibold text-primary-700 uppercase w-28 text-center">
                Atendido
                <Tip txt="Marcar con una X en SÍ, si el mantenimiento se atenderá inmediatamente y NO en caso de que se requiera programar o contratar." />
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.filas.map((f, i) => (
              <tr key={i}>
                <td className="px-3 py-2"><input className="input text-xs" value={f.espacio} onChange={e => setFila(i, 'espacio', e.target.value)} /></td>
                <td className="px-3 py-2"><input className="input text-xs" value={f.hallazgo} onChange={e => setFila(i, 'hallazgo', e.target.value)} /></td>
                <td className="px-3 py-2 text-center">
                  <select className="input text-xs w-20" value={f.atendido} onChange={e => setFila(i, 'atendido', e.target.value)}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-3">
        <div>
          <label className="label">
            Nombre y firma — Jefe(a) del Departamento de Recursos Materiales <Req />
            <Tip txt="Escribir el nombre y firma de la persona del Jefe(a) del Departamento de Recursos Materiales." />
          </label>
          <input required className="input" value={data.jefeDpto} onChange={e => s('jefeDpto', e.target.value)} />
        </div>
        <div>
          <label className="label">
            Nombre y firma — Jefe(a) del área verificada <Req />
            <Tip txt="Escribir el nombre y firma del jefe(a) del área que se verifica." />
          </label>
          <input required className="input" value={data.jefeArea} onChange={e => s('jefeArea', e.target.value)} />
        </div>
      </div>
      <button type="button" onClick={addFila} className="btn-secondary text-xs">+ Agregar espacio</button>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════
   FORMATO 02 — Solicitud de Mantenimiento Correctivo
   TecNM-AD-PO-001-02
════════════════════════════════════════════════════════════ */
const DEPTOS_02 = ['Recursos Materiales y Servicios', 'Mantenimiento de Equipo', 'Centro de Cómputo']

const Formato02 = forwardRef(function F02({ equipo, user }, ref) {
  const [data, setData] = useState({
    dirigidoA: 'Mantenimiento de Equipo',
    folio: '',
    areasolicitante: equipo.laboratorio,
    solicitante: user?.nombre || '',
    fecha: today(),
    descripcion: `Equipo: ${equipo.nombre}\nNúm. de Serie: ${equipo.numero_serie}\nUbicación: ${equipo.laboratorio}\n\nDescripción de la falla o servicio requerido:\n`,
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const chkTable = DEPTOS_02.map(d => `<tr>
        <td style="padding:2px 6px;border:none;font-size:10pt">${d}</td>
        <td style="padding:2px 6px;border:none;text-align:center;width:36px">
          <div style="width:12px;height:12px;border:1px solid #000;display:inline-flex;align-items:center;justify-content:center;font-size:10pt;font-weight:bold">
            ${data.dirigidoA === d ? 'X' : '&nbsp;'}
          </div>
        </td>
      </tr>`).join('')

      const html = `
        ${instHeader({
          titulo: 'Formato para Solicitud de Mantenimiento Correctivo',
          codigo: 'TecNM-AD-PO-001-02',
          normas: [
            'Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.4, 7.5.1',
            'Referencia a la Norma ISO 14001:2015 6.1',
          ],
          rev: 'Revisión: 0',
        }, logo)}
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
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Área Solicitante: &nbsp;&nbsp;${data.areasolicitante || ''}</b><br>&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Nombre y Firma del Solicitante: &nbsp;&nbsp;${data.solicitante || ''}</b><br>&nbsp;<br>&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Fecha de Elaboración: &nbsp;&nbsp;${fmtDate(data.fecha)}</b><br>&nbsp;</td>
          </tr>
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Descripción del servicio solicitado o falla a reparar:</b></td>
          </tr>
          <tr>
            <td style="padding:5px 8px;vertical-align:top;min-height:120px">
              <p class="pre" style="font-size:11pt;min-height:100px">${data.descripcion.replace(/\n/g, '<br>')}</p>
            </td>
          </tr>
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
        <label className="label">
          Departamento al que va dirigida la solicitud <Req />
          <Tip txt="Marcar con una X el Departamento a quien se dirige la solicitud." />
        </label>
        <div className="flex flex-wrap gap-5 mt-1">
          {DEPTOS_02.map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="dir02" value={opt} checked={data.dirigidoA === opt} onChange={e => s('dirigidoA', e.target.value)} className="accent-primary-600" />
              {opt}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">
          Número de folio
          <Tip txt="El Departamento a quien va dirigida la solicitud asigna número de folio a la solicitud recibida. Dejar en blanco si aún no ha sido asignado." />
        </label>
        <input className="input" value={data.folio} onChange={e => s('folio', e.target.value)} placeholder="Asignado por el departamento receptor" />
      </div>
      <div>
        <label className="label">
          Área solicitante <Req />
          <Tip txt="El solicitante anota nombre del área correspondiente (Dirección, Subdirección, Departamento ó División). La solicitud puede ser llenada por cualquier trabajador de la institución." />
        </label>
        <input required className="input" value={data.areasolicitante} onChange={e => s('areasolicitante', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Nombre y firma del solicitante <Req />
          <Tip txt="El Jefe(a) del área anota su nombre y firma en la solicitud de mantenimiento." />
        </label>
        <input required className="input" value={data.solicitante} onChange={e => s('solicitante', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Fecha de elaboración <Req />
          <Tip txt="El(la) solicitante anota la fecha en la que se elabora y entrega la solicitud en el Departamento al que va dirigida." />
        </label>
        <input type="date" required className="input" value={data.fecha} onChange={e => s('fecha', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="label">
          Descripción del servicio o falla <Req />
          <Tip txt="El(la) solicitante anota la descripción de las modificaciones o reparación de fallas en los equipos identificadas o requeridas y su ubicación." />
        </label>
        <textarea required className="input resize-none" rows={6} value={data.descripcion} onChange={e => s('descripcion', e.target.value)} />
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════
   FORMATO 03 — Programa de Mantenimiento Preventivo
   TecNM-AD-PO-001-03
════════════════════════════════════════════════════════════ */
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const Formato03 = forwardRef(function F03({ equipo, user }, ref) {
  const [data, setData] = useState({
    semestre: 'Ene–Jun',
    anio: String(new Date().getFullYear()),
    jefe: user?.nombre || '',
    subdirector: '',
    fechaElab: today(),
    fechaApro: '',
    servicios: [{
      desc: `Mantenimiento preventivo: ${equipo.nombre} (S/N: ${equipo.numero_serie})`,
      tipo: 'I',
      mesesP: {},
      mesesR: {},
      mesesO: {},
      obsTexto: '',
    }],
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))
  const addSvc = () => setData(p => ({ ...p, servicios: [...p.servicios, { desc: '', tipo: 'I', mesesP: {}, mesesR: {}, mesesO: {}, obsTexto: '' }] }))
  const setSvc = (i, k, v) => setData(p => { const ss = [...p.servicios]; ss[i] = { ...ss[i], [k]: v }; return { ...p, servicios: ss } })
  const delSvc = (i) => setData(p => ({ ...p, servicios: p.servicios.filter((_, j) => j !== i) }))
  const toggleMes = (i, row, m) => setData(p => {
    const ss = [...p.servicios]
    const ms = { ...ss[i][row] }
    ms[m] ? delete ms[m] : (ms[m] = true)
    ss[i] = { ...ss[i], [row]: ms }
    return { ...p, servicios: ss }
  })
  const setMesO = (i, m, v) => setData(p => {
    const ss = [...p.servicios]
    ss[i] = { ...ss[i], mesesO: { ...ss[i].mesesO, [m]: v } }
    return { ...p, servicios: ss }
  })

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const mesHeaders = MESES.map(m => `<th style="width:26px;text-align:center;font-size:8pt;background:#d9d9d9;text-transform:uppercase;padding:2px">${m}</th>`).join('')

      const svcRows = data.servicios.map((svc, i) => {
        const mesCellsP = MESES.map(m => `<td style="text-align:center;font-size:9pt;padding:2px">${svc.mesesP[m] ? 'X' : '&nbsp;'}</td>`).join('')
        const mesCellsR = MESES.map(m => `<td style="text-align:center;font-size:9pt;padding:2px">${svc.mesesR[m] ? 'X' : '&nbsp;'}</td>`).join('')
        const mesCellsO = MESES.map(m => `<td style="text-align:center;font-size:8pt;padding:2px">${svc.mesesO[m] || '&nbsp;'}</td>`).join('')
        return `
          <tr>
            <td rowspan="3" style="text-align:center;vertical-align:middle;font-size:10pt;padding:2px">${i+1}</td>
            <td rowspan="2" style="font-size:9pt;padding:3px">${svc.desc || '&nbsp;'}</td>
            <td style="text-align:center;font-size:9pt;padding:2px;width:26px">${svc.tipo === 'I' ? 'X' : '&nbsp;'}</td>
            <td style="text-align:center;font-size:9pt;padding:2px;width:26px">${svc.tipo === 'E' ? 'X' : '&nbsp;'}</td>
            <td style="text-align:center;font-size:8pt;font-weight:bold;padding:2px;background:#e8f0ff">P</td>
            ${mesCellsP}
          </tr>
          <tr>
            <td style="text-align:center;font-size:9pt;padding:2px">&nbsp;</td>
            <td style="text-align:center;font-size:9pt;padding:2px">&nbsp;</td>
            <td style="text-align:center;font-size:8pt;font-weight:bold;padding:2px;background:#e8ffe8">R</td>
            ${mesCellsR}
          </tr>
          <tr>
            <td colspan="3" style="font-size:8pt;padding:2px;color:#555">${svc.obsTexto || '&nbsp;'}</td>
            <td style="text-align:center;font-size:8pt;font-weight:bold;padding:2px;background:#fff8e0">O</td>
            ${mesCellsO}
          </tr>`
      }).join('')

      const html = `
        ${instHeader({
          titulo: 'Formato para Programa de Mantenimiento Preventivo',
          codigo: 'TecNM-AD-PO-001-03',
          normas: [
            'Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1',
            'Referencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2',
          ],
          rev: 'Revisión: 0',
        }, logo)}
        <p style="font-size:11pt;font-weight:bold;margin:6px 0">
          Semestre: &nbsp;${data.semestre}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
          Año: &nbsp;${data.anio}
        </p>
        <table class="ft" style="border-top:1.5px solid #000;font-size:9pt">
          <thead>
            <tr>
              <th style="width:28px;background:#d9d9d9;font-size:8pt;padding:2px">No.</th>
              <th style="text-align:left;background:#d9d9d9;font-size:8pt;text-transform:uppercase;padding:3px">Servicio</th>
              <th colspan="2" style="text-align:center;background:#d9d9d9;font-size:8pt;text-transform:uppercase;padding:2px">Tipo</th>
              <th style="width:26px;background:#d9d9d9;font-size:8pt;padding:2px">P/R/O</th>
              ${mesHeaders}
            </tr>
            <tr>
              <th style="background:#e8e8e8;padding:2px"></th>
              <th style="background:#e8e8e8;padding:2px"></th>
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
          <label className="label">
            Semestre <Req />
            <Tip txt="Anotar el Semestre correspondiente. Ejemplo: Ene/Jun o Ago/Dic." />
          </label>
          <select required className="input" value={data.semestre} onChange={e => s('semestre', e.target.value)}>
            <option>Ene–Jun</option>
            <option>Ago–Dic</option>
          </select>
        </div>
        <div>
          <label className="label">
            Año <Req />
            <Tip txt="Anotar el año correspondiente." />
          </label>
          <input type="number" required className="input" value={data.anio} onChange={e => s('anio', e.target.value)} min="2020" max="2099" />
        </div>
        <div>
          <label className="label">
            Fecha de elaboración <Req />
            <Tip txt="Anotar la fecha de elaboración del programa de mantenimiento." />
          </label>
          <input type="date" required className="input" value={data.fechaElab} onChange={e => s('fechaElab', e.target.value)} />
        </div>
        <div>
          <label className="label">
            Fecha de aprobación
            <Tip txt="Anotar la fecha de Aprobación." />
          </label>
          <input type="date" className="input" value={data.fechaApro} onChange={e => s('fechaApro', e.target.value)} />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        <span className="inline-block w-3 h-3 bg-blue-100 border border-blue-300 rounded mr-1"></span>Fila <b>P</b> = Programado &nbsp;
        <span className="inline-block w-3 h-3 bg-green-100 border border-green-300 rounded mr-1"></span>Fila <b>R</b> = Realizado &nbsp;
        <span className="inline-block w-3 h-3 bg-amber-100 border border-amber-300 rounded mr-1"></span>Fila <b>O</b> = Observación/Reprogramación
      </p>

      <div className="overflow-x-auto">
        <table className="w-full text-xs border border-slate-200 rounded-lg overflow-hidden">
          <thead className="bg-primary-50">
            <tr>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-8">#</th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase text-left">
                Servicio
                <Tip txt="Anotar la descripción de los servicios de mantenimiento a realizar." />
              </th>
              <th className="px-2 py-2 text-primary-700 font-semibold uppercase w-16">
                Tipo
                <Tip txt="'I' = personal interno del plantel. 'E' = servicio contratado externamente." />
              </th>
              <th className="px-2 py-2 text-primary-700 font-semibold text-center" colSpan={12}>
                Meses
                <Tip txt="P: día programado en el mes. R: día realizado. O: causa de reprogramación / fecha nueva." />
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.servicios.map((svc, i) => (
              <>
                {/* P row */}
                <tr key={`${i}-p`} className="bg-blue-50/40">
                  <td rowSpan={3} className="px-2 py-1 text-center text-slate-400 font-mono align-middle border-r border-slate-200">{i+1}</td>
                  <td rowSpan={2} className="px-2 py-1 min-w-[180px] align-middle">
                    <input required className="input text-xs" value={svc.desc} onChange={e => setSvc(i,'desc',e.target.value)} />
                  </td>
                  <td rowSpan={2} className="px-1 py-1 align-middle">
                    <select className="input text-xs w-12" value={svc.tipo} onChange={e => setSvc(i,'tipo',e.target.value)}>
                      <option value="I">I</option>
                      <option value="E">E</option>
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
                {/* R row */}
                <tr key={`${i}-r`} className="bg-green-50/40">
                  {MESES.map(m => (
                    <td key={m} className="px-0.5 py-1 text-center">
                      <div className="text-green-600 text-[9px] font-bold leading-none mb-0.5">R</div>
                      <input type="checkbox" checked={!!svc.mesesR[m]} onChange={() => toggleMes(i,'mesesR',m)} className="accent-green-600" />
                    </td>
                  ))}
                </tr>
                {/* O row */}
                <tr key={`${i}-o`} className="bg-amber-50/40">
                  <td className="px-2 py-1">
                    <input className="input text-[10px] py-0.5" value={svc.obsTexto} onChange={e => setSvc(i,'obsTexto',e.target.value)} placeholder="Causa de reprogramación…" />
                  </td>
                  <td className="px-1 py-1 text-center text-[9px] font-bold text-amber-600">O</td>
                  {MESES.map(m => (
                    <td key={m} className="px-0.5 py-0.5 text-center">
                      <input
                        className="w-7 text-[9px] text-center border border-slate-300 rounded px-0 py-0.5"
                        value={svc.mesesO[m] || ''}
                        onChange={e => setMesO(i, m, e.target.value)}
                        placeholder=""
                        maxLength={5}
                      />
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
          <label className="label">
            Nombre y firma — Jefe(a) del Departamento <Req />
            <Tip txt="Anotar el nombre y firma del jefe(a) del departamento de Recursos Materiales, Centro de Cómputo o Mantenimiento de Equipo." />
          </label>
          <input required className="input" value={data.jefe} onChange={e => s('jefe', e.target.value)} placeholder="Recursos Materiales / Cómputo / Mantenimiento" />
        </div>
        <div>
          <label className="label">
            Nombre y firma — Subdirector(a) de Servicios Administrativos
            <Tip txt="Anotar el nombre y firma del Subdirector(a) de Servicios Administrativos y/o el Director del Plantel." />
          </label>
          <input className="input" value={data.subdirector} onChange={e => s('subdirector', e.target.value)} />
        </div>
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════
   FORMATO 04 — Orden de Trabajo de Mantenimiento
   TecNM-AD-PO-001-04
════════════════════════════════════════════════════════════ */
const Formato04 = forwardRef(function F04({ equipo, user }, ref) {
  const [data, setData] = useState({
    noControl: '',
    tipoMant: 'Interno',
    tipoServicio: '',
    asignadoA: '',
    fechaRealizacion: today(),
    trabajoRealizado: `Equipo: ${equipo.nombre}\nNúm. Serie: ${equipo.numero_serie}\nLaboratorio: ${equipo.laboratorio}\n\nDescripción del trabajo realizado:\n`,
    verificadoPor: '',
    fechaVerificacion: today(),
    aprobadoPor: '',
    fechaAprobacion: today(),
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))

  useImperativeHandle(ref, () => ({
    print: async () => {
      const logo = await getLogoBase64()
      const html = `
        ${instHeader({
          titulo: 'Formato para Orden de Trabajo de Mantenimiento',
          codigo: 'TecNM-AD-PO-001-04',
          normas: [
            'Referencia a la Norma ISO 9001:2015 6.1, 7.1, 7.2, 7.4, 7.5.1, 8.1',
            'Referencia a la Norma ISO 14001:2015 4.1, 6.1, 8.1, 8.2',
          ],
          rev: 'Revisión: 0',
        }, logo)}
        <p style="font-size:11pt;font-weight:bold;text-align:right;margin:6px 0">
          Número de control: &nbsp;${data.noControl || '_______________'}
        </p>
        <table class="ft" style="border-top:1.5px solid #000">
          <tr>
            <td style="padding:5px 8px">
              <b style="font-size:11pt">Mantenimiento: &nbsp;&nbsp;&nbsp;
                Interno &nbsp;<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:12px;vertical-align:middle">${data.tipoMant==='Interno'?'X':''}</span>
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                Externo &nbsp;<span style="display:inline-block;width:12px;height:12px;border:1px solid #000;text-align:center;line-height:12px;vertical-align:middle">${data.tipoMant==='Externo'?'X':''}</span>
              </b>
            </td>
          </tr>
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Tipo de servicio: &nbsp;&nbsp;${data.tipoServicio || ''}</b></td>
          </tr>
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Asignado a: &nbsp;&nbsp;${data.asignadoA || ''}</b></td>
          </tr>
          <tr>
            <td style="padding:5px 8px"><b style="font-size:11pt">Fecha de realización: &nbsp;&nbsp;${fmtDate(data.fechaRealizacion)}</b></td>
          </tr>
          <tr>
            <td style="padding:5px 8px">
              <b style="font-size:11pt">Trabajo Realizado:</b><br>
              <p class="pre" style="font-size:11pt;min-height:90px;margin-top:4px;line-height:1.6">${data.trabajoRealizado.replace(/\n/g,'<br>')}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0">
              <table style="width:100%;border-collapse:collapse">
                <tr>
                  <td style="border-right:1px solid #000;padding:5px 8px;width:57%">
                    <b style="font-size:11pt">Verificado y Liberado por:</b><br>&nbsp;<br>${data.verificadoPor || '&nbsp;'}<br>&nbsp;
                  </td>
                  <td style="padding:5px 8px">
                    <b style="font-size:11pt">Fecha y Firma:</b><br>&nbsp;<br>${fmtDate(data.fechaVerificacion)}<br>&nbsp;
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #000;border-right:1px solid #000;padding:5px 8px">
                    <b style="font-size:11pt">Aprobado por:</b><br>&nbsp;<br>${data.aprobadoPor || '&nbsp;'}<br>&nbsp;
                  </td>
                  <td style="border-top:1px solid #000;padding:5px 8px">
                    <b style="font-size:11pt">Fecha y Firma:</b><br>&nbsp;<br>${fmtDate(data.fechaAprobacion)}<br>&nbsp;
                  </td>
                </tr>
              </table>
            </td>
          </tr>
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
      <div>
        <label className="label">
          Número de control
          <Tip txt="Anotar número de control de la orden de trabajo asignado por el Jefe del Departamento de Rec. Materiales y Servicios o de Mantenimiento y/o centro de cómputo según sea el caso." />
        </label>
        <input className="input" value={data.noControl} onChange={e => s('noControl', e.target.value)} placeholder="Asignado por Jefe de Depto." />
      </div>
      <div>
        <label className="label">
          Tipo de mantenimiento <Req />
          <Tip txt="Anotar una X: Interno o Externo según el tipo de servicio de que se trate." />
        </label>
        <div className="flex gap-6 mt-1">
          {['Interno','Externo'].map(opt => (
            <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="tm04" value={opt} checked={data.tipoMant===opt} onChange={e => s('tipoMant',e.target.value)} className="accent-primary-600" />{opt}
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="label">
          Tipo de servicio <Req />
          <Tip txt="Anotar la clase de mantenimiento a realizar: eléctrico, plomería, herrería, pintura, obra civil, entre otros. Si es externo aplica el Instructivo de Compras Directas TecNM-AD-IT-001." />
        </label>
        <input required className="input" value={data.tipoServicio} onChange={e => s('tipoServicio', e.target.value)} placeholder="Eléctrico, plomería, pintura…" />
      </div>
      <div>
        <label className="label">
          Asignado a <Req />
          <Tip txt="Anotar el nombre del trabajador de mantenimiento y/o servicios generales al que se le asigna el trabajo a realizar o a supervisar." />
        </label>
        <input required className="input" value={data.asignadoA} onChange={e => s('asignadoA', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Fecha de realización <Req />
          <Tip txt="Anotar la fecha durante la cual se realizó el servicio de mantenimiento." />
        </label>
        <input type="date" required className="input" value={data.fechaRealizacion} onChange={e => s('fechaRealizacion', e.target.value)} />
      </div>
      <div className="md:col-span-2">
        <label className="label">
          Trabajo realizado <Req />
          <Tip txt="Anotar la descripción del trabajo desarrollado. En caso de ser necesario utilizar hojas adicionales." />
        </label>
        <textarea required className="input resize-none" rows={5} value={data.trabajoRealizado} onChange={e => s('trabajoRealizado', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Verificado y liberado por <Req />
          <Tip txt="Anotar el nombre del Jefe(a) del Área que solicitó el trabajo y quien verifica, acepta y libera." />
        </label>
        <input required className="input" value={data.verificadoPor} onChange={e => s('verificadoPor', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Fecha y firma de liberación <Req />
          <Tip txt="Anotar la fecha y firma del jefe(a) que libera el trabajo." />
        </label>
        <input type="date" required className="input" value={data.fechaVerificacion} onChange={e => s('fechaVerificacion', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Aprobado por <Req />
          <Tip txt="Anotar el nombre del Jefe(a) del Departamento de Recursos Materiales y Servicios y/o Mantenimiento y/o centro de cómputo según sea el caso, quien aprueba el trabajo liberado." />
        </label>
        <input required className="input" value={data.aprobadoPor} onChange={e => s('aprobadoPor', e.target.value)} />
      </div>
      <div>
        <label className="label">
          Fecha y firma de aprobación <Req />
          <Tip txt="Anotar la fecha y firma del Jefe(a) del Departamento de Recursos Materiales y/o Mantenimiento y/o centro de cómputo, quien aprueba el trabajo liberado." />
        </label>
        <input type="date" required className="input" value={data.fechaAprobacion} onChange={e => s('fechaAprobacion', e.target.value)} />
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════
   FORMATO 05 — Orden de Compra del Bien o Servicio
   TecNM-AD-IT-001-05   (LANDSCAPE)
════════════════════════════════════════════════════════════ */
const Formato05 = forwardRef(function F05({ equipo, user }, ref) {
  const [data, setData] = useState({
    instituto: 'Tijuana',
    proveedor: '',
    noOrden: '',
    fecha: today(),
    items: [{ cant: 1, unidad: 'Pieza', desc: equipo.nombre, area: equipo.laboratorio, noReq: '', precio: '' }],
    jefeAdq: '',
    jefeRec: '',
    subdirector: '',
  })
  const s = (k, v) => setData(p => ({ ...p, [k]: v }))
  const addItem = () => setData(p => ({ ...p, items: [...p.items, { cant:1, unidad:'Pieza', desc:'', area: equipo.laboratorio, noReq:'', precio:'' }] }))
  const setItem = (i, k, v) => setData(p => { const its=[...p.items]; its[i]={...its[i],[k]:v}; return {...p,items:its} })
  const delItem = (i) => setData(p => ({ ...p, items: p.items.filter((_,j)=>j!==i) }))
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
        ${instHeader({
          titulo: 'Formato para Orden de Compra del Bien o Servicio',
          codigo: 'TecNM-AD-IT-001-05',
          normas: [
            'Referencia a la norma ISO 9001:2015 &nbsp;&nbsp; 6.1, 7.1.1, 7.1.5.2, 8.2',
            'Referencia a la norma ISO 14001:2015 &nbsp;&nbsp; 4.2, 6.1, 7.1',
            'Referencia a la norma ISO 50001:2018 8.3',
          ],
          pagLabel: 'Hoja: 1 de 2',
          tituloCenter: true,
        }, logo)}
        <p style="text-align:center;font-size:13pt;font-weight:bold;text-transform:uppercase;margin:8px 0 2px">
          INSTITUTO TECNOLÓGICO DE ${data.instituto.toUpperCase()}
        </p>
        <p style="text-align:center;font-size:11pt;font-weight:bold">DEPARTAMENTO DE RECURSOS MATERIALES Y SERVICIOS</p>
        <p style="text-align:center;font-size:11pt;font-weight:bold">OFICINA DE ADQUISICIONES</p>
        <p style="text-align:center;font-size:12pt;font-weight:bold;margin-bottom:10px">ORDEN DE COMPRA DEL BIEN O SERVICIO</p>
        <p style="font-size:10pt;margin-bottom:4px">
          <b>PROVEEDOR:</b> &nbsp;${data.proveedor || '________________________________'}&nbsp;&nbsp;&nbsp;&nbsp;
          <b>No. DE ORDEN DE COMPRA:</b> &nbsp;${data.noOrden || '__________'}
        </p>
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
          <label className="label">
            Instituto Tecnológico de… <Req />
            <Tip txt="Anotar el nombre del Instituto Tecnológico (ej. Tijuana, Ensenada, Mexicali…)." />
          </label>
          <input required className="input" value={data.instituto} onChange={e => s('instituto',e.target.value)} placeholder="Ej. Tijuana" />
        </div>
        <div className="md:col-span-2">
          <label className="label">
            Proveedor <Req />
            <Tip txt="La Oficina de Adquisiciones y/o el Departamento de Recursos Materiales anotan el nombre del proveedor que va a suministrar los Bienes o Servicios." />
          </label>
          <input required className="input" value={data.proveedor} onChange={e => s('proveedor',e.target.value)} />
        </div>
        <div>
          <label className="label">
            Núm. de orden <Req />
            <Tip txt="La Oficina de Adquisiciones y/o el Departamento de Recursos Materiales anota el número consecutivo de la orden de compra." />
          </label>
          <input required className="input" value={data.noOrden} onChange={e => s('noOrden',e.target.value)} />
        </div>
        <div>
          <label className="label">
            Fecha <Req />
            <Tip txt="La Oficina de Adquisiciones y/o el Departamento de Recursos Materiales anota la fecha en que levanta el pedido." />
          </label>
          <input type="date" required className="input" value={data.fecha} onChange={e => s('fecha',e.target.value)} />
        </div>
      </div>

      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">Bienes o servicios</label>
        <button type="button" onClick={addItem} className="btn-secondary text-xs">+ Agregar ítem</button>
      </div>
      <div className="space-y-3">
        {data.items.map((it,i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítem #{i+1}</span>
              {data.items.length > 1 && (
                <button type="button" onClick={() => delItem(i)} className="text-xs text-red-400 hover:text-red-600 transition-colors">Eliminar</button>
              )}
            </div>
            {/* Descripción */}
            <div>
              <label className="label text-xs">
                Descripción del bien o servicio <Req />
                <Tip txt="Anotar la descripción del Bien o Servicio que se va a adquirir." />
              </label>
              <input required className="input text-sm" value={it.desc} onChange={e=>setItem(i,'desc',e.target.value)} placeholder="Descripción del bien o servicio a adquirir" />
            </div>
            {/* Cant / Unidad / Área */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">
                  Cantidad
                  <Tip txt="Cantidad de Bienes o Servicios que se solicitan." />
                </label>
                <input type="number" min="1" className="input text-sm" value={it.cant} onChange={e=>setItem(i,'cant',e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">
                  Unidad
                  <Tip txt="Unidad de medida del Bien o Servicio (pieza, litro, kg, etc.)." />
                </label>
                <input className="input text-sm" value={it.unidad} onChange={e=>setItem(i,'unidad',e.target.value)} />
              </div>
              <div>
                <label className="label text-xs">
                  Área solicitante
                  <Tip txt="Nombre del área a la que corresponde el Bien o Servicio." />
                </label>
                <input className="input text-sm" value={it.area} onChange={e=>setItem(i,'area',e.target.value)} />
              </div>
            </div>
            {/* No. Req / Precio / Importe */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="label text-xs">
                  No. Requisición
                  <Tip txt="Número de requisición. Permite surtir varias requisiciones con un solo proveedor." />
                </label>
                <input className="input text-sm" value={it.noReq} onChange={e=>setItem(i,'noReq',e.target.value)} placeholder="REQ-001" />
              </div>
              <div>
                <label className="label text-xs">
                  Precio unitario ($)
                  <Tip txt="Precio unitario del Bien o Servicio considerando el IVA." />
                </label>
                <input type="number" min="0" step="1" className="input text-sm" value={it.precio} onChange={e=>setItem(i,'precio',e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="label text-xs">
                  Importe parcial
                  <Tip txt="Importe parcial calculado automáticamente (cant. × precio)." />
                </label>
                <div className="input text-sm font-mono text-primary-700 bg-primary-50 cursor-default select-none">
                  {parcial(it) ? fmt(parcial(it)) : '—'}
                </div>
              </div>
            </div>
          </div>
        ))}
        {/* Total */}
        <div className="flex justify-end items-center gap-3 px-4 py-3 bg-primary-50 border border-primary-100 rounded-xl">
          <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            Importe total
            <Tip txt="Importe total de los Bienes o Servicios a adquirir, considerando el IVA." />
          </span>
          <span className="text-lg font-bold font-mono text-primary-700">{fmt(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
        <div>
          <label className="label">
            Jefe de Adquisiciones <Req />
            <Tip txt="Anotar nombre del jefe de oficina de adquisiciones o jefe del Departamento de Recursos Materiales y firma." />
          </label>
          <input required className="input" value={data.jefeAdq} onChange={e=>s('jefeAdq',e.target.value)} />
        </div>
        <div>
          <label className="label">
            Jefe de Recursos Materiales y Servicios
            <Tip txt="Anotar el nombre del Jefe del Departamento de Recursos Materiales y Servicios y lo firma." />
          </label>
          <input className="input" value={data.jefeRec} onChange={e=>s('jefeRec',e.target.value)} />
        </div>
        <div>
          <label className="label">
            Subdirector de Servicios Adm. — Vo.Bo.
            <Tip txt="Anotar el nombre del Subdirector de Servicios Administrativos y recabar firma para Vo.Bo." />
          </label>
          <input className="input" value={data.subdirector} onChange={e=>s('subdirector',e.target.value)} />
        </div>
      </div>
    </div>
  )
})

/* ════════════════════════════════════════════════════════════
   MODAL WRAPPER
════════════════════════════════════════════════════════════ */
const FORMATOS_META = {
  '01': { nombre: 'Lista de Verificación de Infraestructura y Equipo', codigo: 'TecNM-AD-PO-001-01', Comp: Formato01 },
  '02': { nombre: 'Solicitud de Mantenimiento Correctivo',              codigo: 'TecNM-AD-PO-001-02', Comp: Formato02 },
  '03': { nombre: 'Programa de Mantenimiento Preventivo',               codigo: 'TecNM-AD-PO-001-03', Comp: Formato03 },
  '04': { nombre: 'Orden de Trabajo de Mantenimiento',                  codigo: 'TecNM-AD-PO-001-04', Comp: Formato04 },
  '05': { nombre: 'Orden de Compra del Bien o Servicio',                codigo: 'TecNM-AD-IT-001-05', Comp: Formato05 },
}

export default function FormatoModal({ equipo, formatoId, onClose }) {
  const { user } = useAuth()
  const compRef = useRef(null)
  const meta = FORMATOS_META[formatoId]

  const handlePrint = () => {
    compRef.current?.print()
    // Registrar notificación (fire-and-forget)
    notiApi.crear({
      equipoId:     equipo.id,
      equipoNombre: equipo.nombre,
      formatoId,
      formatoNombre: meta?.nombre || formatoId,
    }).catch(() => {})
  }
  if (!meta) return null
  const { nombre, codigo, Comp } = meta

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-8 bg-black/70 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-4xl my-auto border border-blue-400/25 backdrop-blur-xl animate-modal-in"
        style={{ background: 'rgba(8, 18, 60, 0.97)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-primary-700 to-primary-600 rounded-t-2xl">
          <div>
            <p className="text-primary-200 text-xs font-mono tracking-wider">{codigo}</p>
            <h3 className="font-bold text-white text-base mt-0.5">{nombre}</h3>
            <p className="text-primary-200 text-xs mt-1">
              <span className="text-white font-semibold">{equipo.nombre}</span>
              <span className="mx-2 opacity-40">·</span>
              <span className="font-mono">{equipo.numero_serie}</span>
              <span className="mx-2 opacity-40">·</span>
              {equipo.laboratorio}
            </p>
          </div>
          <button onClick={onClose} className="text-primary-200 hover:text-white text-2xl leading-none ml-4 cursor-pointer transition-colors">×</button>
        </div>

        {/* Body */}
        <div className="modal-body-dark px-6 py-5 max-h-[68vh] overflow-y-auto">
          <p className="text-xs text-slate-400 mb-4 flex items-center gap-1.5 flex-wrap">
            Los campos marcados con <span className="text-red-400 font-bold">*</span> son obligatorios.
            Pasa el cursor sobre
            <svg className="w-3.5 h-3.5 text-slate-400 inline" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
            para ver las instrucciones de llenado.
          </p>
          <Comp ref={compRef} equipo={equipo} user={user} />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-blue-400/20 flex items-center justify-between rounded-b-2xl" style={{ background: 'rgba(6, 14, 46, 0.70)' }}>
          <p className="text-xs text-slate-400">Los campos pre-llenados pueden editarse antes de imprimir.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary">Cancelar</button>
            <button onClick={handlePrint} className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Imprimir / Guardar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
