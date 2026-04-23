import { useEffect, useState } from 'react'
import { usuarios as usuariosApi } from '../utils/api'

export default function Usuarios() {
  const [lista, setLista] = useState([])
  const [loading, setLoading] = useState(true)
  const [emailAdmin, setEmailAdmin] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    usuariosApi.getAll().then(r => setLista(r.data)).finally(() => setLoading(false))
  }, [])

  const cambiarRol = async (id, rol) => {
    await usuariosApi.cambiarRol(id, rol)
    setLista(prev => prev.map(u => u.id === id ? { ...u, rol } : u))
  }

  const hacerAdmin = async (e) => {
    e.preventDefault()
    setMsg('')
    setError('')
    try {
      const r = await usuariosApi.hacerAdmin(emailAdmin)
      setMsg(r.data.message)
      setEmailAdmin('')
      const updated = await usuariosApi.getAll()
      setLista(updated.data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div></div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Gestión de Usuarios</h1>
        <p className="page-subtitle">{lista.length} usuarios registrados</p>
      </div>

      {/* Agregar admin */}
      <div className="card">
        <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          Registrar administrador por email
        </h2>
        <form onSubmit={hacerAdmin} className="flex gap-3">
          <input
            type="email"
            value={emailAdmin}
            onChange={e => setEmailAdmin(e.target.value)}
            placeholder="correo@ejemplo.com"
            className="input flex-1"
            required
          />
          <button type="submit" className="btn-primary whitespace-nowrap">Hacer admin</button>
        </form>
        {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>

      {/* Tabla usuarios */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Nº Control</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Rol</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-primary-800 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {lista.map((u, i) => (
                <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {u.foto ? (
                        <img src={u.foto} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center font-bold text-primary-700 text-sm">
                          {u.nombre?.[0]?.toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-gray-800">{u.nombre}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3 text-gray-600 font-mono">{u.numero_control || <span className="text-gray-300 italic">Sin completar</span>}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                      u.rol === 'admin' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {u.rol === 'admin' && <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>}
                      {u.rol === 'admin' ? 'Admin' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.rol}
                      onChange={e => cambiarRol(u.id, e.target.value)}
                      className="text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    >
                      <option value="usuario">Usuario</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
