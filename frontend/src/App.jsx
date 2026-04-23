import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { VisualProvider } from './context/VisualContext'
import VisualEffects from './components/VisualEffects'
import Layout from './components/Layout'
import Login from './components/Login'
import CompletarPerfil from './components/CompletarPerfil'
import Dashboard from './components/Dashboard'
import Equipos from './components/Equipos'
import ReporteFallas from './components/ReporteFallas'
import Tickets from './components/Tickets'
import Formatos from './components/Formatos'
import Usuarios from './components/Usuarios'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>
  if (!user) return <Navigate to="/login" replace />
  if (!user.numero_control) return <Navigate to="/completar-perfil" replace />
  if (adminOnly && user.rol !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div></div>

  return (
    <Routes>
      <Route path="/login" element={user && user.numero_control ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/completar-perfil" element={<CompletarPerfil />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/equipos" element={<ProtectedRoute><Equipos /></ProtectedRoute>} />
        <Route path="/reportar" element={<ProtectedRoute><ReporteFallas /></ProtectedRoute>} />
        <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
        <Route path="/formatos" element={<ProtectedRoute adminOnly><Formatos /></ProtectedRoute>} />
        <Route path="/usuarios" element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <VisualProvider>
        <AuthProvider>
          <VisualEffects />
          <AppRoutes />
        </AuthProvider>
      </VisualProvider>
    </BrowserRouter>
  )
}
