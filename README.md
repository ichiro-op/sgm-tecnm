# LabMaintain — Sistema de Gestión de Mantenimiento de Laboratorios

Sistema web académico para gestión de mantenimiento de laboratorios universitarios (TecNM).

---

## Estructura del proyecto

```
PAGINA/
├── backend/
│   ├── config/
│   │   └── passport.js          # Configuración Google OAuth
│   ├── data/                    # Creado automáticamente
│   │   ├── database.sqlite      # Base de datos SQLite
│   │   ├── sessions.sqlite      # Sesiones
│   │   └── equipos.json         # Equipos (editable tipo spreadsheet)
│   ├── middleware/
│   │   └── auth.js              # Middlewares de autenticación
│   ├── routes/
│   │   ├── auth.js              # Google OAuth + dev login
│   │   ├── equipos.js           # CRUD equipos
│   │   ├── tickets.js           # CRUD tickets + stats
│   │   ├── formatos.js          # Datos para formatos PDF
│   │   └── usuarios.js          # Gestión de usuarios/roles
│   ├── db.js                    # Setup SQLite + operaciones JSON
│   ├── server.js                # Express app
│   ├── .env.example             # Variables de entorno de ejemplo
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Login.jsx          # Pantalla de login
    │   │   ├── CompletarPerfil.jsx # Registro número de control
    │   │   ├── Layout.jsx         # Sidebar + navegación
    │   │   ├── Dashboard.jsx      # Estadísticas y resumen
    │   │   ├── Equipos.jsx        # Tabla editable tipo spreadsheet
    │   │   ├── ReporteFallas.jsx  # Formulario de reporte
    │   │   ├── Tickets.jsx        # Lista y gestión de tickets
    │   │   ├── Formatos.jsx       # Generación de PDFs
    │   │   └── Usuarios.jsx       # Gestión de usuarios (admin)
    │   ├── context/
    │   │   └── AuthContext.jsx    # Estado global de autenticación
    │   ├── utils/
    │   │   └── api.js             # Cliente HTTP (axios)
    │   ├── App.jsx                # Rutas y protección
    │   ├── main.jsx
    │   └── index.css
    └── package.json
```

---

## Requisitos

- Node.js 18+
- npm o yarn

---

## Instalación y ejecución

### 1. Clonar / abrir el proyecto

```bash
cd PAGINA
```

### 2. Instalar dependencias del backend

```bash
cd backend
npm install
```

### 3. Configurar variables de entorno

```bash
# Copia el archivo de ejemplo
cp .env.example .env
```

Edita `.env`:

```env
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_client_secret
SESSION_SECRET=cualquier_cadena_aleatoria_larga
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### Obtener credenciales de Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto nuevo
3. Habilita la **Google+ API** o **Google Identity**
4. Ve a **Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
5. Tipo: **Aplicación web**
6. URI de redirección autorizada: `http://localhost:3001/api/auth/google/callback`
7. Copia el **Client ID** y **Client Secret** en tu `.env`

### 4. Instalar dependencias del frontend

```bash
cd ../frontend
npm install
```

### 5. Correr ambos servidores (en terminales separadas)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Corre en http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Corre en http://localhost:5173
```

### 6. Abrir en el navegador

```
http://localhost:5173
```

---

## Modo de prueba (sin Google OAuth)

Si no tienes credenciales de Google configuradas, usa el **modo dev**:

1. En la pantalla de login, haz clic en **"Modo prueba (desarrollo)"**
2. Ingresa cualquier email (ej: `admin@test.com`)
3. El primer usuario creado será automáticamente **administrador**
4. Completa tu número de control cuando se solicite

> ⚠️ Este modo solo funciona con `NODE_ENV !== 'production'`

---

## Módulos del sistema

| Módulo | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| Dashboard | `/dashboard` | Todos | Estadísticas, fallas frecuentes, estado de equipos |
| Equipos | `/equipos` | Todos | Tabla editable tipo Excel; admins pueden modificar |
| Reportar falla | `/reportar` | Todos | Autocompletado de equipos, tipos de falla, crea ticket |
| Tickets | `/tickets` | Todos | Lista de tickets; admins cambian estado y prioridad |
| Formatos | `/formatos` | Admin | Genera PDFs TecNM con campos automáticos y manuales |
| Usuarios | `/usuarios` | Admin | Gestión de roles, asignación de administradores |

---

## Laboratorios incluidos

- Gastronomía
- Química
- Electromecánica
- Industrial
- Impresoras 3D
- Química Orgánica

---

## Formatos generados

| Código | Descripción |
|--------|-------------|
| TecNM-AD-PO-001-01 | Revisión de espacio físico |
| TecNM-AD-PO-001-02 | Solicitud de servicio |
| TecNM-AD-PO-001-03 | Formato en blanco |
| TecNM-AD-PO-001-04 | Orden de trabajo |
| TecNM-AD-IT-001-05 | Informe técnico |

Los PDFs se generan directamente en el navegador con **jsPDF**.

---

## Notas técnicas

- La base de datos SQLite se crea automáticamente en `backend/data/`
- Los equipos se almacenan en `backend/data/equipos.json` (16 equipos de ejemplo precargados)
- El primer usuario que se registra es administrador automáticamente
- Las sesiones duran 7 días
- La prioridad de tickets se calcula automáticamente: baja (< 2 fallas), media (2-4), alta (≥ 5)
