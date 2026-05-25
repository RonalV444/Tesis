# 📋 Arquitectura y Guía Técnica

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                     EVCS Mobile App (React Native)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Navigation Layer                             │  │
│  │  ┌─────────────┬──────────────┬──────────────────────┐  │  │
│  │  │ LoginScreen │ HomeScreen   │ NotificationsScreen │  │  │
│  │  │             │ ProfileScreen│                      │  │  │
│  │  └─────────────┴──────────────┴──────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             State Management (Zustand)                  │  │
│  │  ┌────────────────────┬──────────────────────────────┐  │  │
│  │  │ useAuthStore       │ useNotificationStore         │  │  │
│  │  │ - user             │ - notifications              │  │  │
│  │  │ - token            │ - receivedNotifications      │  │  │
│  │  │ - login()          │ - addReceivedNotification()  │  │  │
│  │  │ - logout()         │ - fetchNotifications()       │  │  │
│  │  └────────────────────┴──────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
│                           │                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │             Services Layer                              │  │
│  │  ┌──────────────┬────────────────┬──────────────────┐  │  │
│  │  │ apiService   │ notification   │ firebase.ts      │  │  │
│  │  │              │ Service        │                  │  │  │
│  │  │ - login()    │ - getToken()   │ - Config FCM     │  │  │
│  │  │ - register   │ - setup        │ - Messages       │  │  │
│  │  │   DeviceToken│   Listeners()  │                  │  │  │
│  │  └──────────────┴────────────────┴──────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                           ▲                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            │ HTTP + WebSocket
                            ▼
        ┌───────────────────────────────────────┐
        │        Backend EVCS Services          │
        ├───────────────────────────────────────┤
        │ API                                   │
        │ - POST /auth/login                    │
        │ - POST /notifications/register-token  │
        │ - DELETE /notifications/register-...  │
        │ - GET /notifications/logs             │
        │                                       │
        │ Firebase Cloud Messaging              │
        │ - Send push notifications             │
        │ - Rule Engine (R1-R5)                 │
        └───────────────────────────────────────┘
                            ▲
                            │ OCPP Events
                            ▼
        ┌───────────────────────────────────────┐
        │   Simulator (demo-interactive.html)   │
        │   - Start/Stop Transactions           │
        │   - Meter Values (SOC)                │
        │   - Status Notifications              │
        └───────────────────────────────────────┘
```

## Flujo de Datos

### 1. Autenticación

```
User Input
    │
    ▼
LoginScreen
    │
    ├─→ useAuthStore.login()
    │       │
    │       ▼
    │   apiService.login()
    │       │
    │       ├─→ POST /auth/login
    │       │
    │       ▼
    │   Response: {user, token}
    │       │
    │       ▼
    │   useAuthStore.setUser() + setToken()
    │       │
    │       ▼
    └─→ Navigation → AppTabs
            │
            ▼
        setupNotifications()
            │
            ├─→ getDeviceToken()
            │
            ├─→ registerDeviceToken()
            │
            └─→ setupListeners()
```

### 2. Recepción de Notificaciones

```
Backend Event (OCPP)
    │
    ▼
Rule Engine (R1-R5)
    │
    ▼
Firebase Cloud Messaging
    │
    ├─ Foreground
    │   │
    │   └─→ onNotificationReceivedListener
    │           │
    │           ▼
    │       useNotificationStore.addReceivedNotification()
    │           │
    │           ▼
    │       receivedNotifications.push()
    │           │
    │           ▼
    │       HomeScreen re-renders
    │
    └─ Background
        │
        └─→ System Tray
            │
            └─→ User Tap
                │
                ▼
            App Opens
                │
                ▼
            onNotificationResponseListener
```

## Estructura de Componentes

### Componentes de Presentación

```
App
├── AppNavigator
│   ├── AuthStack (si no autenticado)
│   │   └── LoginScreen
│   │
│   └── AppTabs (si autenticado)
│       ├── HomeScreen
│       │   └── ConnectionStatus
│       │   └── NotificationItem (FlatList)
│       │
│       ├── NotificationsScreen
│       │   └── NotificationItem (SectionList)
│       │
│       └── ProfileScreen
│
├── Components
│   ├── Button (reutilizable)
│   ├── NotificationItem
│   ├── ConnectionStatus
│   ├── LoadingScreen
│   ├── ErrorAlert
│   └── EmptyState
```

## Tipos y Interfaces

### User
```typescript
interface User {
  id: string;
  email: string;
  name: string;
}
```

### Notification
```typescript
interface NotificationLog {
  id: string;
  userId: string;
  title: string;
  body: string;
  sentAt: string;
  type: 'R1' | 'R2' | 'R3' | 'R4' | 'R5';
  metadata?: Record<string, any>;
}
```

## Estados Globales (Zustand)

### authStore
- `user`: Usuario actual
- `token`: Token de sesión
- `isLoading`: Cargando
- `error`: Mensaje de error
- Métodos: `login()`, `logout()`, `setUser()`, `clearError()`

### notificationStore
- `notifications`: Array de notificaciones del backend
- `receivedNotifications`: Array de notificaciones recibidas en tiempo real
- `isLoading`: Cargando
- `unreadCount`: Contador de no leídas
- Métodos: `fetchNotifications()`, `addReceivedNotification()`, `markAsRead()`

## Servicios

### apiService
- **Responsabilidad**: Comunicación HTTP con backend
- **Métodos principales**:
  - `login(email, password)` - POST /auth/login
  - `registerDeviceToken(userId, token)` - POST /notifications/register-token
  - `deactivateDeviceToken(token)` - DELETE /notifications/register-token/:token
  - `getNotificationLogs(userId?)` - GET /notifications/logs

### notificationService
- **Responsabilidad**: Gestión de notificaciones push Expo
- **Métodos principales**:
  - `getDeviceToken()` - Obtener token del dispositivo
  - `setupNotificationListeners()` - Configurar listeners
  - `requestNotificationPermissions()` - Pedir permisos
  - `sendLocalNotification()` - Prueba local

## Enums y Constantes

### Tipos de Reglas
```typescript
type RuleType = 'R1' | 'R2' | 'R3' | 'R4' | 'R5';

const RULE_LABELS = {
  'R1': 'SOC ≥ 90%',
  'R2': 'Tiempo < 10min',
  'R3': 'Disponible',
  'R4': 'Finalizando',
  'R5': 'Error/Fallo'
};

const RULE_COLORS = {
  'R1': '#fbbf24',  // Amarillo
  'R2': '#60a5fa',  // Azul
  'R3': '#34d399',  // Verde
  'R4': '#a78bfa',  // Púrpura
  'R5': '#f87171'   // Rojo
};
```

## Configuración de Permisos

### Android (automático con Expo)
- `android.permission.POST_NOTIFICATIONS`
- `android.permission.INTERNET`
- `android.permission.ACCESS_NETWORK_STATE`

### iOS (automático con Expo)
- `NSUserNotificationUsageDescription`
- `NSLocalNotificationUsageDescription`

## Debugging

### Logs por Módulo

```typescript
// En cada módulo
console.log('[NombreModulo] Mensaje de depuración');

Ejemplos:
[LoginScreen] Iniciando login...
[API] Registrando token FCM
[Notifications] Notificación recibida
[Store] Actualizando estado
```

### Herramientas de Depuración

1. **Expo Go Console**: Ver logs en tiempo real
2. **React Native Debugger**: Debugging avanzado
3. **Redux DevTools**: Inspeccionar estado (si se agrega)
4. **Network Tab**: Ver peticiones HTTP

## Performance

### Optimizaciones

1. **Memoización**: Usar `React.memo()` para componentes que no cambian
2. **Lazy Loading**: Cargar notificaciones por páginas
3. **Caché**: Las notificaciones se guardan en memoria con Zustand
4. **Debouncing**: En búsquedas y filtros

### Límites de Datos

- Máximo 50 notificaciones en `receivedNotifications`
- Máximo 100 notificaciones del backend
- Timeout de API: 10 segundos

## Seguridad

### Mejoras Sugeridas para Producción

1. **Almacenamiento seguro**: Usar `AsyncStorage` o `SecureStore` para tokens
2. **Refresh Tokens**: Implementar refresh token flow
3. **SSL Pinning**: Usar certificados SSL en producción
4. **Encriptación**: Encriptar datos sensibles en almacenamiento
5. **CORS**: Configurar CORS correctamente en backend

## Escalabilidad

### Para Agregar en el Futuro

1. **Paginación**: Cargar notificaciones incrementalmente
2. **Búsqueda**: Filtrar notificaciones por texto
3. **Sincronización Offline**: Redux Persist
4. **Notificaciones Locales**: Reminders del usuario
5. **Estadísticas Avanzadas**: Gráficos de actividad
6. **Multi-idioma**: i18n para internacionalización

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0.0
