const router = require('express').Router()
const fs = require('fs')
const path = require('path')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const LABS_PATH = path.join(__dirname, '../data/labs.json')

const DEFAULT_LABS = [
  { nombre: 'Gastronomía',     color: '#f59e0b', prefix: 'GAS' },
  { nombre: 'Básicas',         color: '#3b82f6', prefix: 'BAS' },
  { nombre: 'Electromecánica', color: '#22c55e', prefix: 'ELC' },
  { nombre: 'Industrial',      color: '#a855f7', prefix: 'IND' },
  { nombre: 'Impresoras 3D',   color: '#06b6d4', prefix: 'IMP' },
  { nombre: 'Química Orgánica',color: '#10b981', prefix: 'QOR' },
  { nombre: 'Mobiliario',      color: '#78716c', prefix: 'MOB' },
]

function getLabs() {
  if (!fs.existsSync(LABS_PATH)) {
    fs.writeFileSync(LABS_PATH, JSON.stringify(DEFAULT_LABS, null, 2))
    return DEFAULT_LABS
  }
  return JSON.parse(fs.readFileSync(LABS_PATH, 'utf-8'))
}

function saveLabs(labs) {
  fs.writeFileSync(LABS_PATH, JSON.stringify(labs, null, 2))
}

router.get('/', requireAuth, (req, res) => res.json(getLabs()))

router.put('/', requireAdmin, (req, res) => {
  const labs = req.body
  if (!Array.isArray(labs)) return res.status(400).json({ error: 'Se esperaba un arreglo' })
  saveLabs(labs)
  res.json(labs)
})

module.exports = router
