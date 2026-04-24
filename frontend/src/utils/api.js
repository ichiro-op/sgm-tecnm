import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  withCredentials: true,
})

export const auth = {
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  completeProfile: (numero_control) => api.post('/auth/complete-profile', { numero_control }),
  devLogin: (email) => api.post('/auth/dev-login', { email }),
}

export const equipos = {
  getAll: () => api.get('/equipos'),
  create: (data) => api.post('/equipos', data),
  update: (id, data) => api.put(`/equipos/${id}`, data),
  delete: (id) => api.delete(`/equipos/${id}`),
}

export const tickets = {
  getAll: () => api.get('/tickets'),
  getMios: () => api.get('/tickets/mis-tickets'),
  getStats: () => api.get('/tickets/stats'),
  create: (data) => api.post('/tickets', data),
  update: (id, data) => api.put(`/tickets/${id}`, data),
}

export const usuarios = {
  getAll: () => api.get('/usuarios'),
  cambiarRol: (id, rol) => api.put(`/usuarios/${id}/rol`, { rol }),
  hacerAdmin: (email) => api.post('/usuarios/hacer-admin', { email }),
}

export const formatos = {
  getDatos: (numero) => api.get(`/formatos/datos/${numero}`),
  getEquipos: () => api.get('/formatos/equipos'),
}

export default api
