const router = require('express').Router()
const { v4: uuidv4 } = require('crypto').webcrypto ? (() => {
  try { return require('uuid') } catch { return { v4: () => Date.now().toString() } }
})() : { v4: () => Date.now().toString() }
const { getEquipos, saveEquipos } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const genId = () => Math.random().toString(36).slice(2, 10)

// GET todos los equipos
router.get('/', requireAuth, (req, res) => {
  res.json(getEquipos())
})

// POST nuevo equipo (admin)
router.post('/', requireAdmin, (req, res) => {
  const { nombre, laboratorio, estado, numero_serie, icono, imagen } = req.body
  if (!nombre || !laboratorio) {
    return res.status(400).json({ error: 'Nombre y laboratorio son requeridos' })
  }
  const equipos = getEquipos()
  const nuevo = {
    id: genId(),
    nombre,
    laboratorio,
    estado: estado || 'funcional',
    numero_serie: numero_serie || '',
    icono: icono || '🔧',
    imagen: imagen || '',
  }
  equipos.push(nuevo)
  saveEquipos(equipos)
  res.status(201).json(nuevo)
})

// PUT actualizar equipo (admin)
router.put('/:id', requireAdmin, (req, res) => {
  const equipos = getEquipos()
  const idx = equipos.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Equipo no encontrado' })
  equipos[idx] = { ...equipos[idx], ...req.body, id: req.params.id }
  saveEquipos(equipos)
  res.json(equipos[idx])
})

// DELETE equipo (admin)
router.delete('/:id', requireAdmin, (req, res) => {
  const equipos = getEquipos()
  const filtrados = equipos.filter(e => e.id !== req.params.id)
  if (filtrados.length === equipos.length) {
    return res.status(404).json({ error: 'Equipo no encontrado' })
  }
  saveEquipos(filtrados)
  res.json({ ok: true })
})

module.exports = router
