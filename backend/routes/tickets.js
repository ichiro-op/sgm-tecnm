const router = require('express').Router()
const { db, calcularPrioridad } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

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

  res.json({ total, pendientes, enProceso, resueltos, porEquipo })
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
  res.status(201).json(ticket)
})

// PUT actualizar estado/prioridad (admin)
router.put('/:id', requireAdmin, (req, res) => {
  const { estado, prioridad } = req.body
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id)
  if (!ticket) return res.status(404).json({ error: 'Ticket no encontrado' })

  const fecha_resolucion = estado === 'resuelto' ? new Date().toISOString() : ticket.fecha_resolucion

  db.prepare(`
    UPDATE tickets SET estado = ?, prioridad = ?, fecha_resolucion = ? WHERE id = ?
  `).run(estado || ticket.estado, prioridad || ticket.prioridad, fecha_resolucion, req.params.id)

  res.json(db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id))
})

module.exports = router
