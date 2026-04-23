import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function CompletarPerfil() {
  const { user, completeProfile } = useAuth()
  const navigate = useNavigate()
  const [numero, setNumero] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!numero.trim()) return setError('El número de control es obligatorio')
    setLoading(true)
    try {
      await completeProfile(numero.trim())
      navigate('/dashboard')
    } catch {
      setError('Error al guardar. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">👤</div>
          <h2 className="text-2xl font-bold text-gray-800">Completa tu perfil</h2>
          <p className="text-gray-500 mt-1">
            Bienvenido, <strong>{user?.nombre}</strong>. Solo falta un dato para continuar.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Número de control *</label>
            <input
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
              placeholder="Ej: 20BC0001"
              className="input"
              autoFocus
            />
            <p className="text-xs text-gray-400 mt-1">Este dato aparecerá en los formatos oficiales</p>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Guardando...' : 'Continuar al sistema →'}
          </button>
        </form>
      </div>
    </div>
  )
}
