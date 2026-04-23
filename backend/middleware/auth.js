function requireAuth(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.status(401).json({ error: 'No autenticado' })
}

function requireAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.rol === 'admin') return next()
  res.status(403).json({ error: 'Se requiere rol de administrador' })
}

function requireProfile(req, res, next) {
  if (req.isAuthenticated() && !req.user.numero_control) {
    return res.status(403).json({ error: 'Perfil incompleto', code: 'INCOMPLETE_PROFILE' })
  }
  next()
}

module.exports = { requireAuth, requireAdmin, requireProfile }
