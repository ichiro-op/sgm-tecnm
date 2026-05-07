const router  = require('express').Router()
const multer  = require('multer')
const path    = require('path')
const fs      = require('fs')
const { getEquipos, saveEquipos } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')
const { registrar: logHistorial } = require('./historial')

const uploadsDir = path.join(__dirname, '../uploads/equipos')
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, uploadsDir),
  filename: (_, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')
    cb(null, `${Date.now()}_${safe}`)
  }
})
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

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

  const anterior = equipos[idx]
  const campos = ['nombre', 'laboratorio', 'estado', 'numero_serie', 'detalles']
  const cambios = campos.filter(c => {
    const a = JSON.stringify(anterior[c] ?? '')
    const b = JSON.stringify(req.body[c] ?? '')
    return a !== b
  })

  equipos[idx] = { ...anterior, ...req.body, id: req.params.id }
  saveEquipos(equipos)

  // Log cada campo que cambió
  if (cambios.length > 0) {
    cambios.forEach(campo => {
      logHistorial({
        equipoId:      req.params.id,
        equipoNombre:  equipos[idx].nombre,
        campo,
        valorAnterior: anterior[campo],
        valorNuevo:    equipos[idx][campo],
        usuarioId:     req.user?.id,
        usuarioNombre: req.user?.nombre || req.user?.email || 'Admin',
      })
    })
  }

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

// POST imagen de un equipo (admin)
router.post('/:id/imagen', requireAdmin, upload.single('imagen'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió imagen' })
  const equipos = getEquipos()
  const idx = equipos.findIndex(e => e.id === req.params.id)
  if (idx === -1) return res.status(404).json({ error: 'Equipo no encontrado' })
  equipos[idx].imagen = `/uploads/equipos/${req.file.filename}`
  saveEquipos(equipos)
  res.json({ imagen: equipos[idx].imagen })
})

module.exports = router
