# 📦 Estructura de Archivos - EVCS Mobile

## 🗂️ Árbol Completo del Proyecto

```
evcs-mobile/
│
├── 📄 Archivos de Configuración
│   ├── package.json                 # Dependencias y scripts
│   ├── app.json                     # Configuración de Expo
│   ├── tsconfig.json                # Configuración TypeScript
│   ├── babel.config.js              # Configuración Babel
│   ├── .env.example                 # Variables de entorno (ejemplo)
│   ├── .gitignore                   # Archivos ignorados por git
│   │
│   └── 📖 Documentación
│       ├── README.md                # Documentación principal
│       ├── QUICK_START.md           # Inicio rápido
│       ├── INSTALLATION.md          # Instrucciones de instalación
│       ├── ARCHITECTURE.md          # Arquitectura y diseño
│       └── FILE_STRUCTURE.md        # Este archivo
│
├── 📁 src/
│   │
│   ├── 📱 screens/
│   │   ├── LoginScreen.tsx          # Pantalla de autenticación
│   │   ├── HomeScreen.tsx           # Pantalla principal
│   │   ├── NotificationsScreen.tsx  # Historial de notificaciones
│   │   ├── ProfileScreen.tsx        # Perfil del usuario
│   │   └── index.ts                 # Exportar todas las screens
│   │
│   ├── 🔧 services/
│   │   ├── api.ts                   # Servicio de llamadas HTTP
│   │   ├── notifications.ts         # Servicio de notificaciones push
│   │   └── firebase.ts              # Configuración Firebase (futura)
│   │
│   ├── 🏪 store/
│   │   ├── authStore.ts             # Estado de autenticación (Zustand)
│   │   └── notificationStore.ts     # Estado de notificaciones (Zustand)
│   │
│   ├── 🎨 components/
│   │   ├── Button.tsx               # Componente botón reutilizable
│   │   ├── NotificationItem.tsx     # Item para lista de notificaciones
│   │   ├── ConnectionStatus.tsx     # Estado de conexión con backend
│   │   └── index.ts                 # LoadingScreen, EmptyState, ErrorAlert
│   │
│   ├── 🧭 navigation/
│   │   └── AppNavigator.tsx         # Navegación principal (Stack + Tabs)
│   │
│   └── 📝 types/
│       └── index.ts                 # Tipos TypeScript globales
│
├── App.tsx                          # Componente raíz
│
└── 📦 node_modules/                 # Dependencias (generado por npm)
```

---

## 📋 Descripción de Archivos

### Configuración

| Archivo | Propósito |
|---------|-----------|
| `package.json` | Define dependencias, scripts y metadatos del proyecto |
| `app.json` | Configuración de Expo (nombre, icono, permisos, etc) |
| `tsconfig.json` | Configuración de TypeScript (strict mode, rutas, etc) |
| `babel.config.js` | Configuración de Babel para transpilación |
| `.env.example` | Template para variables de entorno |
| `.gitignore` | Archivos a ignorar en git |

### Pantallas (screens/)

| Archivo | Descripción |
|---------|-------------|
| `LoginScreen.tsx` | Formulario de login con email/password. Llama a authStore.login() |
| `HomeScreen.tsx` | Pantalla principal que muestra notificaciones recientes y conexión. Usa useFocusEffect para recargar |
| `NotificationsScreen.tsx` | Historial completo de notificaciones agrupadas por regla (R1-R5) |
| `ProfileScreen.tsx` | Perfil del usuario, estadísticas, estado del sistema y botón de logout |
| `index.ts` | Exporta todas las screens para importación simplificada |

### Servicios (services/)

| Archivo | Descripción |
|---------|-------------|
| `api.ts` | Cliente HTTP con axios. Maneja: login, register token, deactivate token, get logs |
| `notifications.ts` | Gestión de FCM con Expo Notifications. Obtiene token, configura listeners, pide permisos |
| `firebase.ts` | Placeholder para configuración futura de Firebase Admin SDK |

### Estado Global (store/)

| Archivo | Descripción |
|---------|-------------|
| `authStore.ts` | Zustand store. Mantiene user, token, y métodos login/logout |
| `notificationStore.ts` | Zustand store. Mantiene notificaciones recibidas y del backend |

### Componentes (components/)

| Archivo | Descripción |
|---------|-------------|
| `Button.tsx` | Botón reutilizable con variantes (primary, secondary, danger) |
| `NotificationItem.tsx` | Tarjeta individual de notificación con badge de regla (R1-R5) |
| `ConnectionStatus.tsx` | Widget que muestra estado de conexión con backend |
| `index.ts` | LoadingScreen (modal), ErrorAlert, EmptyState |

### Navegación (navigation/)

| Archivo | Descripción |
|---------|-------------|
| `AppNavigator.tsx` | Navegador principal con Stack (login) y Tabs (home, notif, profile) |

### Tipos (types/)

| Archivo | Descripción |
|---------|-------------|
| `index.ts` | Interfaces TypeScript: User, Notification, ApiResponse, etc |

---

## 🔗 Flujos de Datos Clave

### LoginScreen → authStore → AppNavigator
```
Usuario escribe credenciales
  ↓
LoginScreen.tsx
  ↓
apiService.login() → POST /auth/login
  ↓
useAuthStore.login()
  ↓
AppNavigator detecta isAuthenticated() = true
  ↓
Navega a AppTabs (Home + Notificaciones + Perfil)
  ↓
setupNotifications():
  - getDeviceToken()
  - registerDeviceToken() → POST /notifications/register-token
  - setupNotificationListeners()
```

### Notificación Push
```
Backend dispara regla (R1-R5)
  ↓
Firebase Cloud Messaging
  ↓
notificationService.setupNotificationListeners()
  ↓
useNotificationStore.addReceivedNotification()
  ↓
HomeScreen re-renderiza
  ↓
NotificationItem aparece en lista
```

---

## 📊 Dependencias Principales

```json
{
  "react": "^18.2.0",           // Framework React
  "react-native": "^0.73.0",    // Framework mobile
  "expo": "^51.0.0",             // Plataforma para apps RN
  "axios": "^1.6.0",             // Cliente HTTP
  "zustand": "^4.4.0",           // State management
  "@react-navigation/native": "^6.1.0",        // Navegación
  "@react-navigation/bottom-tabs": "^6.5.0",  // Bottom tabs
  "expo-notifications": "^0.28.0" // Notificaciones push
}
```

---

## 🎨 Temas de Color

```javascript
// Colores principales
#667eea  - Púrpura (principal)
#764ba2  - Púrpura oscuro (gradiente)
#333     - Texto oscuro
#666     - Texto secundario
#999     - Texto terciario
#fff     - Blanco

// Colores de Reglas
#fbbf24  - R1 (Amarillo)
#60a5fa  - R2 (Azul)
#34d399  - R3 (Verde)
#a78bfa  - R4 (Púrpura)
#f87171  - R5 (Rojo)

// Estados
#d1fae5  - Verde claro (éxito)
#fee2e2  - Rojo claro (error)
#f0f0f0  - Gris claro (fondo)
```

---

## 📞 Endpoints de API Usados

| Método | Endpoint | Archivo | Línea |
|--------|----------|---------|-------|
| POST | `/auth/login` | api.ts | ~45 |
| POST | `/notifications/register-token` | api.ts | ~65 |
| DELETE | `/notifications/register-token/:token` | api.ts | ~80 |
| GET | `/notifications/logs` | api.ts | ~93 |
| GET | `/notifications/logs/user/:userId` | api.ts | ~93 |

---

## 🔐 Manejo de Datos Sensibles

- **Tokens**: Se guardan en memoria (Zustand)
- **Usuario**: Se guarda en memoria (Zustand)
- **Credenciales**: Se envían una sola vez al login
- **Permisos**: Se solicitan al iniciar notificaciones

Para producción: usar AsyncStorage o SecureStore

---

## 🧪 Puntos de Prueba

```
1. LoginScreen
   - Input vacío → error
   - Credenciales incorrectas → error
   - Credenciales correctas → Home

2. HomeScreen
   - Conexión rechazada → mostrar desconectado
   - Notificación push → agregar a lista

3. NotificationsScreen
   - Filtros por regla → mostrar solo R1-R5
   - Sin datos → EmptyState

4. ProfileScreen
   - Token visible → copiar
   - Estadísticas → contar correctamente
   - Logout → limpiar y volver a Login
```

---

## 📈 Estadísticas del Proyecto

```
Total de archivos:    19
Líneas de código:     ~4,500
Componentes:          4 pantallas + 4 componentes
Servicios:            3 servicios
Stores:               2 stores
Configuración:        6 archivos
Documentación:        5 archivos

Tamaño del bundle: ~3-5 MB (sin optimizar)
```

---

## 🚀 Scripts Disponibles

```bash
npm start          # Iniciar en desarrollo
npm run android    # Abrir en Android
npm run ios        # Abrir en iOS
npm run web        # Abrir en web
npm run lint       # Lint del código (si se configura)
npm run type-check # Verificar tipos TypeScript
```

---

## 🔄 Ciclo de Vida de la Aplicación

```
1. App.tsx carga
2. AppNavigator inicializa
3. Si no autenticado → mostrar LoginScreen
4. Si autenticado:
   - initializeApp()
   - setupAndroidChannel()
   - getDeviceToken()
   - registerDeviceToken()
   - setupNotificationListeners()
   - renderizar AppTabs
5. Al recibir notificación:
   - addReceivedNotification()
   - HomeScreen se re-renderiza
6. Al logout:
   - deactivateDeviceToken()
   - clearNotificationListeners()
   - logout() store
   - volver a LoginScreen
```

---

## 💾 Archivos a Crear Manualmente

Para completar la app en producción, crear:

```
assets/
├── icon.png              # 1024x1024 px
├── splash.png            # 1242x2436 px
├── adaptive-icon.png     # 1024x1024 px (Android)
└── notification-icon.png # 256x256 px

firebase-config.json      # Configuración de Firebase (opcional)
```

---

## 📚 Referencias Rápidas

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Zustand Guide](https://zustand-demo.vercel.app/)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Producción
