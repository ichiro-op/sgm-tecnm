const router = require('express').Router()
const path   = require('path')
const fs     = require('fs')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const FILE = path.join(__dirname, '../data/historial.json')
const get  = () => JSON.parse(fs.readFileSync(FILE, 'utf8'))
const save = (d) => fs.writeFileSync(FILE, JSON.stringify(d, null, 2))
const genId = () => Math.random().toString(36).slice(2, 10)

// POST — registrar cambio (uso interno, llamado desde equipos.js)
router.post('/', requireAdmin, (req, res) => {
  const entradas = get()
  const nueva = { id: genId(), fecha: new Date().toISOString(), ...req.body }
  entradas.unshift(nueva)
  // Conservar máximo 500 entradas
  if (entradas.length > 500) entradas.splice(500)
  save(entradas)
  res.json(nueva)
})

// GET todas las entradas (admin)
router.get('/', requireAdmin, (req, res) => {
  res.json(get())
})

// GET entradas de un equipo
router.get('/equipo/:id', requireAuth, (req, res) => {
  const todo = get()
  res.json(todo.filter(e => e.equipoId === req.params.id).slice(0, 50))
})

module.exports = router
module.exports.registrar = (entrada) => {
  try {
    const entradas = get()
    entradas.unshift({ id: genId(), fecha: new Date().toISOString(), ...entrada })
    if (entradas.length > 500) entradas.splice(500)
    save(entradas)
  } catch {}
}
