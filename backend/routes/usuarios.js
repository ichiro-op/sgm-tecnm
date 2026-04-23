const router = require('express').Router()
const { db } = require('../db')
const { requireAuth, requireAdmin } = require('../middleware/auth')

// GET todos los usuarios (admin)
router.get('/', requireAdmin, (req, res) => {
  const usuarios = db.prepare('SELECT id, email, nombre, foto, numero_control, rol, created_at FROM usuarios').all()
  res.json(usuarios)
})

// PUT cambiar rol (admin)
router.put('/:id/rol', requireAdmin, (req, res) => {
  const { rol } = req.body
  if (!['admin', 'usuario'].includes(rol)) {
    return res.status(400).json({ error: 'Rol inválido' })
  }
  db.prepare('UPDATE usuarios SET rol = ? WHERE id = ?').run(rol, req.params.id)
  res.json({ ok: true })
})

// POST registrar admin por email (admin)
router.post('/hacer-admin', requireAdmin, (req, res) => {
  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Email requerido' })

  const user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email)
  if (!user) return res.status(404).json({ error: 'Usuario no encontrado' })

  db.prepare('UPDATE usuarios SET rol = ? WHERE email = ?').run('admin', email)
  res.json({ ok: true, message: `${email} ahora es administrador` })
})

module.exports = router
