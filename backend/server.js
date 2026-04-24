require('dotenv').config()
const express = require('express')
const session = require('express-session')
const SQLiteStore = require('connect-sqlite3')(session)
const passport = require('passport')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const app = express()
const PORT = process.env.PORT || 3001
app.set('trust proxy', 1)

// ── Sesiones (persistentes en SQLite) ────────────────────────────
const isProd = process.env.NODE_ENV === 'production'
const dataDir = path.join(__dirname, 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir)

app.use(session({
  store: new SQLiteStore({ db: 'sessions.sqlite', dir: dataDir }),
  secret: process.env.SESSION_SECRET || 'lab-secret-dev-2024',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 días
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
  origin: true,
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
