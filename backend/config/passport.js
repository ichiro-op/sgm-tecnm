const GoogleStrategy = require('passport-google-oauth20').Strategy
const { db } = require('../db')

module.exports = (passport) => {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback',
  }, (accessToken, refreshToken, profile, done) => {
    const email = profile.emails[0].value
    const nombre = profile.displayName
    const foto = profile.photos[0]?.value || ''
    const google_id = profile.id

    let user = db.prepare('SELECT * FROM usuarios WHERE google_id = ?').get(google_id)

    if (!user) {
      // Primer admin: primer usuario registrado es admin
      const count = db.prepare('SELECT COUNT(*) as c FROM usuarios').get()
      const rol = count.c === 0 ? 'admin' : 'usuario'

      const insert = db.prepare(
        'INSERT INTO usuarios (google_id, email, nombre, foto, rol) VALUES (?, ?, ?, ?, ?)'
      )
      const result = insert.run(google_id, email, nombre, foto, rol)
      user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(result.lastInsertRowid)
    } else {
      // Actualizar foto y nombre por si cambiaron
      db.prepare('UPDATE usuarios SET nombre = ?, foto = ? WHERE id = ?')
        .run(nombre, foto, user.id)
      user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(user.id)
    }

    return done(null, user)
  }))

  passport.serializeUser((user, done) => done(null, user.id))
  passport.deserializeUser((id, done) => {
    const user = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(id)
    done(null, user || false)
  })
}
