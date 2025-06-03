# 📅 Calendar Frontend

Un moderno sistema de gestión de calendarios desarrollado con tecnologías web de vanguardia para proporcionar una experiencia de usuario fluida e intuitiva.

## 🚀 Características Principales

- **Vista Múltiple**: Soporte para vistas mensual, semanal y diaria
- **Gestión de Eventos**: Crear, editar, eliminar y visualizar eventos
- **Recordatorios**: Sistema de notificaciones y alertas
- **Múltiples Calendarios**: Organización por categorías y colores
- **Sincronización en Tiempo Real**: Actualizaciones automáticas
- **Interfaz Responsive**: Optimizado para desktop, tablet y móvil
- **Drag & Drop**: Reorganización intuitiva de eventos
- **Búsqueda Avanzada**: Filtros por fecha, categoría y texto
- **Exportación**: Soporte para iCal y otros formatos

## 🛠️ Tecnologías Utilizadas

- **Framework**: React 18+ / Vue 3+ / Angular 15+
- **Estado**: Redux Toolkit / Vuex / NgRx
- **Styling**: Tailwind CSS / Styled Components
- **Calendario**: FullCalendar.js / React Big Calendar
- **HTTP Client**: Axios
- **Fechas**: Day.js / Moment.js
- **Build Tool**: Vite / Webpack
- **Testing**: Jest + React Testing Library

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn
- Git

## ⚡ Instalación y Configuración

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/calendar-frontend.git
cd calendar-frontend
```

### 2. Instalar dependencias
```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```

Edita el archivo `.env` con tus configuraciones:
```env
REACT_APP_API_BASE_URL=http://localhost:3001/api
REACT_APP_WEBSOCKET_URL=ws://localhost:3001
REACT_APP_ENVIRONMENT=development
REACT_APP_GOOGLE_CALENDAR_API_KEY=your_api_key_here
```

### 4. Ejecutar en modo desarrollo
```bash
npm start
# o
yarn dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Scripts Disponibles

```bash
# Desarrollo
npm start          # Inicia el servidor de desarrollo
npm run dev        # Alias para desarrollo

# Construcción
npm run build      # Genera build de producción
npm run preview    # Preview del build de producción

# Testing
npm test           # Ejecuta tests unitarios
npm run test:watch # Tests en modo watch
npm run test:coverage # Coverage de tests

# Linting y Formateo
npm run lint       # Ejecuta ESLint
npm run lint:fix   # Corrige errores de linting
npm run format     # Formatea código con Prettier

# Análisis
npm run analyze    # Analiza el bundle size
```

## 📁 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── Calendar/       # Componentes del calendario
│   ├── Events/         # Componentes de eventos
│   ├── UI/             # Componentes de interfaz
│   └── common/         # Componentes comunes
├── pages/              # Páginas/Vistas principales
├── hooks/              # Custom hooks
├── services/           # Servicios y API calls
├── store/              # Gestión de estado global
├── utils/              # Utilidades y helpers
├── styles/             # Estilos globales
├── types/              # Definiciones de TypeScript
└── constants/          # Constantes de la aplicación
```

## 🔌 APIs del Backend

### Base URL
```
https://api.calendario.com/v1
```

### Autenticación
Todas las APIs requieren un token JWT en el header:
```
Authorization: Bearer <jwt_token>
```

### 📊 Endpoints Principales

#### **Autenticación**

##### POST `/auth/login`
Inicia sesión de usuario
```json
{
  "email": "usuario@email.com",
  "password": "password123"
}
```
**Response:**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "name": "Juan Pérez",
    "email": "usuario@email.com"
  }
}
```

##### POST `/auth/register`
Registro de nuevo usuario
```json
{
  "name": "Juan Pérez",
  "email": "usuario@email.com",
  "password": "password123"
}
```

##### POST `/auth/logout`
Cierra sesión del usuario

---

#### **Calendarios**

##### GET `/calendars`
Obtiene todos los calendarios del usuario
```json
[
  {
    "id": 1,
    "name": "Personal",
    "color": "#3498db",
    "isDefault": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

##### POST `/calendars`
Crea un nuevo calendario
```json
{
  "name": "Trabajo",
  "color": "#e74c3c",
  "description": "Calendario para eventos laborales"
}
```

##### PUT `/calendars/:id`
Actualiza un calendario existente

##### DELETE `/calendars/:id`
Elimina un calendario

---

#### **Eventos**

##### GET `/events`
Obtiene eventos con filtros opcionales
**Query Parameters:**
- `start`: Fecha inicio (ISO 8601)
- `end`: Fecha fin (ISO 8601)
- `calendar_id`: ID del calendario
- `search`: Búsqueda por texto

```json
[
  {
    "id": 1,
    "title": "Reunión de equipo",
    "description": "Reunión semanal del equipo",
    "start": "2024-06-03T09:00:00Z",
    "end": "2024-06-03T10:00:00Z",
    "calendar_id": 1,
    "color": "#3498db",
    "isAllDay": false,
    "reminder": 30,
    "recurrence": null
  }
]
```

##### POST `/events`
Crea un nuevo evento
```json
{
  "title": "Nueva reunión",
  "description": "Descripción del evento",
  "start": "2024-06-03T14:00:00Z",
  "end": "2024-06-03T15:00:00Z",
  "calendar_id": 1,
  "reminder": 15,
  "recurrence": {
    "frequency": "weekly",
    "interval": 1,
    "endDate": "2024-12-31T23:59:59Z"
  }
}
```

##### PUT `/events/:id`
Actualiza un evento existente

##### DELETE `/events/:id`
Elimina un evento

##### POST `/events/:id/duplicate`
Duplica un evento existente

---

#### **Recordatorios**

##### GET `/reminders`
Obtiene recordatorios pendientes
```json
[
  {
    "id": 1,
    "event_id": 5,
    "type": "notification",
    "minutes_before": 15,
    "triggered": false
  }
]
```

##### POST `/reminders`
Crea un nuevo recordatorio

##### PUT `/reminders/:id/mark-triggered`
Marca un recordatorio como activado

---

#### **Configuraciones**

##### GET `/settings`
Obtiene configuraciones del usuario
```json
{
  "timezone": "America/Mexico_City",
  "defaultView": "month",
  "weekStartDay": 1,
  "workingHours": {
    "start": "09:00",
    "end": "18:00"
  },
  "notifications": {
    "email": true,
    "push": true
  }
}
```

##### PUT `/settings`
Actualiza configuraciones del usuario

---

#### **Exportación**

##### GET `/export/ical`
Exporta eventos en formato iCal
**Query Parameters:**
- `calendar_id`: ID del calendario (opcional)
- `start`: Fecha inicio
- `end`: Fecha fin

##### GET `/export/pdf`
Exporta calendario en formato PDF

---

### 🔄 WebSocket Events

La aplicación se conecta via WebSocket para actualizaciones en tiempo real:

```javascript
// Eventos que escucha el cliente
'event:created'    // Nuevo evento creado
'event:updated'    // Evento actualizado
'event:deleted'    // Evento eliminado
'calendar:updated' // Calendario modificado
'reminder:triggered' // Recordatorio activado

// Eventos que envía el cliente
'join:calendar'    // Unirse a actualizaciones de calendario
'leave:calendar'   // Salir de actualizaciones
```

### 📋 Códigos de Estado HTTP

- `200` - Éxito
- `201` - Recurso creado
- `400` - Error en la petición
- `401` - No autorizado
- `403` - Prohibido
- `404` - Recurso no encontrado
- `422` - Error de validación
- `500` - Error interno del servidor

### 🔍 Ejemplo de Uso con Axios

```javascript
import axios from 'axios';

// Configuración base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Obtener eventos
const getEvents = async (start, end) => {
  const response = await api.get('/events', {
    params: { start, end }
  });
  return response.data;
};

// Crear evento
const createEvent = async (eventData) => {
  const response = await api.post('/events', eventData);
  return response.data;
};
```

## 🧪 Testing

### Ejecutar Tests
```bash
npm test                 # Tests unitarios
npm run test:integration # Tests de integración
npm run test:e2e        # Tests end-to-end
```

### Estructura de Tests
```
src/
├── __tests__/          # Tests unitarios
├── integration/        # Tests de integración
└── e2e/               # Tests end-to-end
```

## 🚀 Despliegue

### Build de Producción
```bash
npm run build
```

### Variables de Entorno de Producción
```env
REACT_APP_API_BASE_URL=https://api.production.com/v1
REACT_APP_WEBSOCKET_URL=wss://api.production.com
REACT_APP_ENVIRONMENT=production
```

### Deploy con Netlify/Vercel
1. Conecta tu repositorio
2. Configura las variables de entorno
3. Deploy automático en cada push a main

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. Commit tus cambios (`git commit -m 'Add amazing feature'`)
4. Push a la rama (`git push origin feature/amazing-feature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## 👥 Equipo

- **Frontend Lead**: [Tu Nombre]
- **Backend Lead**: [Nombre del desarrollador backend]
- **UI/UX Designer**: [Nombre del diseñador]

## 📞 Soporte

¿Necesitas ayuda? Contacta al equipo:
- 📧 Email: support@calendario.com
- 💬 Slack: #calendar-support
- 📱 Discord: [Link del servidor]

---

⭐ Si te gusta este proyecto, ¡dale una estrella en GitHub!