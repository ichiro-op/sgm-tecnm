const router = require('express').Router()
const path   = require('path')
const fs     = require('fs')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const FILE  = path.join(__dirname, '../data/notificaciones.json')
const get   = () => JSON.parse(fs.readFileSync(FILE, 'utf8'))
const save  = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
const genId = () => Math.random().toString(36).slice(2, 10)

// POST — crear notificación (cualquier usuario autenticado)
router.post('/', requireAuth, (req, res) => {
  const lista = get()
  const nueva = {
    id:           genId(),
    fecha:        new Date().toISOString(),
    visto:        false,
    ...req.body,
    usuarioId:    req.user.id,
    usuarioNombre: req.user.nombre || req.user.email,
  }
  lista.unshift(nueva)
  if (lista.length > 200) lista.splice(200)
  save(lista)
  res.json(nueva)
})

// Tipos que se envían al usuario que creó el ticket (no al admin)
const TIPOS_USUARIO = ['ticket_creado', 'ticket_en_proceso', 'ticket_resuelto']

// GET notificaciones del usuario actual
// Admin: ve nuevo_ticket + solicitud_formato (+ sus propios ticket_*)
// Usuario: ve sus ticket_creado / ticket_en_proceso / ticket_resuelto
router.get('/', requireAuth, (req, res) => {
  const lista = get()
  const isAdmin = req.user.rol === 'admin'
  const filtradas = isAdmin
    ? lista.filter(n => !TIPOS_USUARIO.includes(n.tipo) || n.usuarioId === req.user.id)
    : lista.filter(n => TIPOS_USUARIO.includes(n.tipo) && n.usuarioId === req.user.id)
  res.json({
    items:    filtradas,
    noLeidas: filtradas.filter(n => !n.visto).length,
  })
})

// GET solo el conteo no leído — para el badge
router.get('/count', requireAuth, (req, res) => {
  const lista = get()
  const isAdmin = req.user.rol === 'admin'
  const filtradas = isAdmin
    ? lista.filter(n => !TIPOS_USUARIO.includes(n.tipo) || n.usuarioId === req.user.id)
    : lista.filter(n => TIPOS_USUARIO.includes(n.tipo) && n.usuarioId === req.user.id)
  res.json({ noLeidas: filtradas.filter(n => !n.visto).length })
})

// PUT marcar una como leída
router.put('/:id/vista', requireAuth, (req, res) => {
  const lista = get()
  const item = lista.find(n => n.id === req.params.id)
  if (!item) return res.status(404).json({ error: 'No encontrada' })
  item.visto = true
  save(lista)
  res.json(item)
})

// PUT marcar todas como leídas (solo las del usuario actual)
router.put('/todas-vistas', requireAuth, (req, res) => {
  const lista = get()
  const isAdmin = req.user.rol === 'admin'
  lista.forEach(n => {
    const esPropia = isAdmin
      ? !TIPOS_USUARIO.includes(n.tipo) || n.usuarioId === req.user.id
      : TIPOS_USUARIO.includes(n.tipo) && n.usuarioId === req.user.id
    if (esPropia) n.visto = true
  })
  save(lista)
  res.json({ ok: true })
})

module.exports = router
