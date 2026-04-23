const router = require('express').Router()
const { db, getEquipos } = require('../db')
const { requireAdmin } = require('../middleware/auth')

// Retorna datos pre-llenados para cada formato
// El PDF se genera en el frontend con jspdf

router.get('/datos/:numero', requireAdmin, (req, res) => {
  const { numero } = req.params
  const user = req.user
  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  const bases = {
    '001-01': {
      fecha,
      jefe_departamento: 'Ing. [Nombre Jefe Departamento]',
      jefe_area: 'Ing. [Nombre Jefe Área]',
      espacio_revisado: '',
      hallazgo: '',
    },
    '001-02': {
      fecha,
      nombre_solicitante: user.nombre,
      email_solicitante: user.email,
      numero_control: user.numero_control || '',
      descripcion_servicio: '',
    },
    '001-03': {},
    '001-04': {
      numero_control: user.numero_control || '',
      tipo_mantenimiento: '',
      tipo_servicio: '',
      asignado_a: '',
    },
    'IT-001-05': {
      fecha,
    },
  }

  const datos = bases[numero]
  if (!datos) return res.status(404).json({ error: 'Formato no encontrado' })

  res.json({ formato: `TecNM-AD-PO-${numero}`, datos })
})

// Obtener lista de equipos para formatos
router.get('/equipos', requireAdmin, (req, res) => {
  res.json(getEquipos())
})

module.exports = router
