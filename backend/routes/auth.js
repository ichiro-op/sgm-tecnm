const router = require('express').Router()
const passport = require('passport')
const { db } = require('../db')
const { requireAuth } = require('../middleware/auth')

// ── Google OAuth ──────────────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=true' }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    if (!req.user.numero_control) {
      return res.redirect(`${frontendUrl}/completar-perfil`)
    }
    res.redirect(`${frontendUrl}/dashboard`)
  }
)

// ── Login dev (sin Google, solo para pruebas locales) ─────────────
router.post('/dev-login', (req, res) => {
  const { email } = req.body
  const allowedEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(Boolean)
  const isAllowed = allowedEmails.includes(email)
  if (process.env.NODE_ENV === 'production' && !isAllowed) {
    return res.status(403).json({ error: 'No disponible en producción' })
  }
  if (!email) return res.status(400).json({ error: 'Email requerido' })

  let user = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email)
  if (!user) {
    const count = db.prepare('SELECT COUNT(*) as c FROM usuarios').get()
    const rol = count.c === 0 ? 'admin' : 'usuario'
    const r = db.prepare(
      'INSERT INTO usuarios (google_id, email, nombre, foto, rol) VALUES (?, ?, ?, ?, ?)'
    ).run(`dev-${Date.now()}`, email, email.split('@')[0], '', rol)
    user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(r.lastInsertRowid)
  }

  req.login(user, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ user })
  })
})

// ── Sesión actual ──────────────────────────────────────────────────
router.get('/me', (req, res) => {
  if (!req.isAuthenticated()) return res.json({ user: null })
  res.json({ user: req.user })
})

// ── Completar perfil (número de control) ──────────────────────────
router.post('/complete-profile', requireAuth, (req, res) => {
  const { numero_control } = req.body
  if (!numero_control) return res.status(400).json({ error: 'Número de control requerido' })

  db.prepare('UPDATE usuarios SET numero_control = ? WHERE id = ?')
    .run(numero_control, req.user.id)

  const updated = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(req.user.id)
  req.login(updated, (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ user: updated })
  })
})

// ── Logout ─────────────────────────────────────────────────────────
router.post('/logout', (req, res) => {
  req.logout(() => res.json({ ok: true }))
})

module.exports = router
