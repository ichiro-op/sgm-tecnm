const router = require('express').Router()
const fs     = require('fs')
const path   = require('path')
const { db, calcularPrioridad } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const NOTI_FILE = path.join(__dirname, '../data/notificaciones.json')
const genId = () => Math.random().toString(36).slice(2, 10)

function pushNotificacion(noti) {
  try {
    const lista = fs.existsSync(NOTI_FILE) ? JSON.parse(fs.readFileSync(NOTI_FILE, 'utf8')) : []
    lista.unshift({ id: genId(), fecha: new Date().toISOString(), visto: false, ...noti })
    if (lista.length > 200) lista.splice(200)
    fs.writeFileSync(NOTI_FILE, JSON.stringify(lista, null, 2))
  } catch (_) {}
}

// GET todos los tickets
router.get('/', requireAuth, (req, res) => {
  const tickets = db.prepare('SELECT * FROM tickets ORDER BY fecha DESC').all()
  res.json(tickets)
})

// GET tickets del usuario actual
router.get('/mis-tickets', requireAuth, (req, res) => {
  const tickets = db.prepare(
    'SELECT * FROM tickets WHERE usuario_id = ? ORDER BY fecha DESC'
  ).all(req.user.id)
  res.json(tickets)
})

// GET estadísticas para dashboard
router.get('/stats', requireAuth, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as c FROM tickets').get().c
  const pendientes = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE estado = 'pendiente'").get().c
  const enProceso = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE estado = 'en proceso'").get().c
  const resueltos = db.prepare("SELECT COUNT(*) as c FROM tickets WHERE estado = 'resuelto'").get().c

  const porEquipo = db.prepare(`
    SELECT equipo_nombre, laboratorio, COUNT(*) as total
    FROM tickets GROUP BY equipo_id ORDER BY total DESC LIMIT 5
  `).all()

  const porLaboratorio = db.prepare(`
    SELECT laboratorio, COUNT(*) as total
    FROM tickets GROUP BY laboratorio ORDER BY total DESC
  `).all()

  const porTipo = db.prepare(`
    SELECT tipo_falla, COUNT(*) as total
    FROM tickets GROUP BY tipo_falla ORDER BY total DESC LIMIT 6
  `).all()

  res.json({ total, pendientes, enProceso, resueltos, porEquipo, porLaboratorio, porTipo })
})

// GET tickets activos de un equipo específico
router.get('/equipo/:equipoId', requireAuth, (req, res) => {
  const tickets = db.prepare(`
    SELECT * FROM tickets
    WHERE equipo_id = ? AND estado != 'resuelto'
    ORDER BY fecha DESC
  `).all(req.params.equipoId)
  res.json(tickets)
})

// POST crear ticket
router.post('/', requireAuth, (req, res) => {
  const { equipo_id, equipo_nombre, laboratorio, tipo_falla, descripcion } = req.body
  if (!equipo_id || !tipo_falla || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos requeridos' })
  }

  const prioridad = calcularPrioridad(equipo_id)

  const result = db.prepare(`
    INSERT INTO tickets (equipo_id, equipo_nombre, laboratorio, tipo_falla, descripcion,
      usuario_id, usuario_nombre, usuario_email, prioridad)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    equipo_id, equipo_nombre, laboratorio, tipo_falla, descripcion,
    req.user.id, req.user.nombre, req.user.email, prioridad
  )

  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(result.lastInsertRowid)

  // Notificar a todos los admins (excepto si el creador ya es admin)
  const admins = db.prepare("SELECT id FROM usuarios WHERE rol = 'admin'").all()
  for (const admin of admins) {
    if (admin.id !== req.user.id) {
      pushNotificacion({
        tipo: 'nuevo_ticket',
        ticketId: ticket.id,
        equipoNombre: equipo_nombre,
        laboratorio,
        tipo_falla,
        usuarioId: admin.id,
        usuarioNombre: req.user.nombre || req.user.email,
      })
    }
  }

  // Confirmar al creador que su ticket fue registrado
  pushNotificacion({
    tipo: 'ticket_creado',
    ticketId: ticket.id,
    equipoNombre: equipo_nombre,
    laboratorio,
    tipo_falla,
    usuarioId: req.user.id,
    usuarioNombre: req.user.nombre || req.user.email,
  })

  res.status(201).json(ticket)
})

// PUT actualizar estado/prioridad/nota (admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { estado, prioridad, nota_resolucion } = req.body
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' })

  const nuevoEstado = estado || ticket.estado
  const fecha_resolucion = nuevoEstado === 'resuelto'
    ? (ticket.fecha_resolucion || new Date().toISOString())
    : null

  const nuevaNota = nota_resolucion !== undefined ? nota_resolucion : (ticket.nota_resolucion || '')

  db.prepare(`
    UPDATE tickets
    SET estado = ?, prioridad = ?, fecha_resolucion = ?, nota_resolucion = ?
    WHERE id = ?
  `).run(
    nuevoEstado,
    prioridad || ticket.prioridad,
    fecha_resolucion,
    nuevaNota,
    req.params.id
  )

  // Notificar al usuario cuando el ticket pasa a "en proceso"
  if (nuevoEstado === 'en proceso' && ticket.estado !== 'en proceso') {
    pushNotificacion({
      tipo: 'ticket_en_proceso',
      ticketId: ticket.id,
      equipoNombre: ticket.equipo_nombre,
      laboratorio: ticket.laboratorio,
      usuarioId: ticket.usuario_id,
      usuarioNombre: ticket.usuario_nombre,
    })
  }

  // Notificar al usuario cuando el ticket se resuelve
  if (nuevoEstado === 'resuelto' && ticket.estado !== 'resuelto') {
    pushNotificacion({
      tipo: 'ticket_resuelto',
      ticketId: ticket.id,
      equipoNombre: ticket.equipo_nombre,
      laboratorio: ticket.laboratorio,
      usuarioId: ticket.usuario_id,
      usuarioNombre: ticket.usuario_nombre,
    })
  }

  res.json(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id))
})

// DELETE ticket (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' })
  db.prepare('DELETE FROM tickets WHERE id = ?').run(req.params.id)
  res.json({ ok: true })
})

module.exports = router
