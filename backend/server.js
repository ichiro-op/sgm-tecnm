require('dotenv').config()
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3001
app.set('trust proxy', 1)

// ── Sesiones ──────────────────────────────────────────────────────
const isProd = process.env.NODE_ENV === 'production'
app.use(session({
  secret: process.env.SESSION_SECRET || 'lab-secret-dev-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  },
}))

// ── Passport ──────────────────────────────────────────────────────
require('./config/passport')(passport)
app.use(passport.initialize())
app.use(passport.session())

// ── Middleware ────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// ── Rutas API ─────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'))
app.use('/api/equipos', require('./routes/equipos'))
app.use('/api/tickets', require('./routes/tickets'))
app.use('/api/formatos', require('./routes/formatos'))
app.use('/api/usuarios', require('./routes/usuarios'))

// ── Health check ──────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
})
