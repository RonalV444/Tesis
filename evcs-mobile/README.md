# EVCS Mobile - Aplicación de Notificaciones de Electromovilidad

Aplicación móvil React Native con Expo para recibir y monitorear notificaciones inteligentes del sistema de gestión de sesiones de carga en electromovilidad.

## 📋 Descripción

Esta es una **aplicación cliente demostrativa** que recibe notificaciones push desde el backend basadas en el motor de reglas (R1-R5):

- **R1**: SOC ≥ 90%
- **R2**: Tiempo de carga < 10 minutos
- **R3**: Cargador disponible
- **R4**: Carga finalizando
- **R5**: Error o cargador en fallo

## 🎯 Características

✅ **Autenticación**: Login con credenciales de demostración  
✅ **Notificaciones Push**: Recibir notificaciones en foreground y background  
✅ **Historial**: Visualizar todas las notificaciones recibidas  
✅ **Estadísticas**: Ver estadísticas por regla y período  
✅ **Perfil**: Información del usuario y estado del sistema  
✅ **Estado de Conexión**: Verificar conexión con el backend en tiempo real  

## ⚠️ Lo que NO hace

❌ NO envía notificaciones (son generadas por el backend)  
❌ NO simula eventos OCPP (se usan desde el web: demo-interactive.html)  
❌ NO controla sesiones de carga  
❌ NO monitorea SOC en tiempo real  

## 🛠️ Requisitos

- **Node.js** 16+ con npm o yarn
- **Expo CLI**: `npm install -g expo-cli`
- **Smartphone**: Android o iOS (o emulador)
- **Expo Go**: Descargada en el dispositivo (disponible en App Store/Play Store)
- **Backend ejecutándose**: `http://10.125.19.125:3000/api` o `http://localhost:3000/api`

## 📦 Instalación

### 1. Clonar o descargar la aplicación

```bash
cd evcs-mobile
```

### 2. Instalar dependencias

```bash
npm install
# o
yarn install
```

### 3. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar .env con tu configuración
# EXPO_PUBLIC_API_URL=http://10.125.19.125:3000/api
```

### 4. Verificar que el backend está ejecutándose

```bash
# En otra terminal, desde evcs-backend/
npm run dev
# o
node test-system.js
```

## 🚀 Ejecución

### Opción 1: Usar Expo Go (Recomendado)

```bash
npm start
# o
expo start
```

Luego:
- **Android**: Escanea el código QR con Expo Go
- **iOS**: Escanea el código QR con la cámara (abre Expo Go automáticamente)
- **Web**: Presiona `w` en la terminal

### Opción 2: Emulador

```bash
# Para Android
npm run android

# Para iOS (solo en macOS)
npm run ios
```

### Opción 3: Navegador Web

```bash
npm run web
```

## 🧪 Prueba de Funcionamiento

### 1. Abrir la app

Una vez que la app está corriendo en Expo Go:
- Verás la pantalla de login
- Usa las credenciales: `test@test.com` / `123456`

### 2. Usar el simulador web para enviar eventos

En otra ventana del navegador, abre el simulador:
```
Abre: evcs-backend/demo-interactive.html
```

### 3. Simular eventos OCPP

En el panel de control del simulador web:
1. Haz clic en **"▶ Start Transaction"**
2. Observa cómo en la app móvil aparece una notificación
3. Prueba con otros eventos: Meter Values, Status, Stop Transaction

### 4. Ver las notificaciones en la app

- **Pantalla Home**: Muestra las notificaciones más recientes
- **Pantalla Historial**: Muestra todas las notificaciones con filtros por regla
- **Pantalla Perfil**: Estadísticas y estado del sistema

## 📱 Credenciales de Prueba

```
Email:    test@test.com
Password: 123456
```

## 📊 Estructura del Proyecto

```
evcs-mobile/
├── src/
│   ├── screens/           # Pantallas de la app
│   │   ├── LoginScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── NotificationsScreen.tsx
│   │   └── ProfileScreen.tsx
│   ├── services/          # Servicios (API, FCM, notificaciones)
│   │   ├── api.ts         # Llamadas HTTP al backend
│   │   ├── notifications.ts  # Gestión de notificaciones push
│   │   └── firebase.ts    # Configuración de Firebase
│   ├── store/             # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── notificationStore.ts
│   ├── components/        # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── NotificationItem.tsx
│   │   ├── ConnectionStatus.tsx
│   │   └── index.ts       # LoadingScreen, EmptyState
│   ├── types/             # Tipos TypeScript
│   │   └── index.ts
│   └── navigation/        # Navegación
│       └── AppNavigator.tsx
├── App.tsx                # Componente raíz
├── app.json               # Configuración de Expo
├── package.json
├── tsconfig.json
└── babel.config.js
```

## 🔌 API Endpoints Usados

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/auth/login` | Login del usuario |
| POST | `/notifications/register-token` | Registrar token FCM |
| DELETE | `/notifications/register-token/:token` | Desactivar token |
| GET | `/notifications/logs` | Obtener historial |
| GET | `/notifications/logs/user/:userId` | Historial del usuario |

## 🔐 Seguridad

- Los tokens se almacenan en memoria (Zustand)
- Para producción, usar AsyncStorage o similar
- Las credenciales son solo para demostración

## 📝 Logs y Depuración

La app incluye logs extensos con prefijo `[NombrePantalla]` o `[NombreServicio]`:

```typescript
console.log('[LoginScreen] Iniciando login...');
console.log('[API] Token registrado');
console.log('[Notifications] Notificación recibida');
```

Abre la consola en Expo Go para ver los logs en tiempo real.

## ❌ Solución de Problemas

### "Error: Cannot find module..."
```bash
npm install
# Limpia caché
npm cache clean --force
```

### "Backend no disponible"
```bash
# Verifica que el backend está corriendo
curl http://10.125.19.125:3000/api/
# O accede a http://localhost:3000/api
```

### "No se reciben notificaciones"
1. Verifica que el token FCM se registró (ve a Perfil)
2. Revisa los logs del backend en la terminal
3. Prueba enviando una notificación desde el simulador web

### "Errores de permisos en Android"
Expo Go pide permisos automáticamente. Si no aparece el diálogo:
1. Abre Configuración del dispositivo
2. Busca Expo Go
3. Activa "Notificaciones"

## 🔄 Flujo de Autenticación

```
┌─────────────────┐
│  LoginScreen    │
│ test@test.com   │
└────────┬────────┘
         │
         ▼
   ┌──────────────┐
   │ apiService   │ POST /auth/login
   │  .login()    │
   └──────┬───────┘
          │
          ▼
    ┌──────────────┐
    │ useAuthStore │ Guardar user y token
    │   .login()   │
    └──────┬───────┘
           │
           ▼
    ┌──────────────────┐
    │ getDeviceToken   │
    │  (FCM Token)     │
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ registerToken()  │ POST /notifications/register-token
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │ setupListeners() │ Escuchar notificaciones
    └──────┬───────────┘
           │
           ▼
    ┌──────────────────┐
    │   HomeScreen     │
    │  (AppTabs)       │
    └──────────────────┘
```

## 🔔 Flujo de Notificaciones

```
┌──────────────────┐
│ Backend (PC)     │
│ demo-interactive │
└────────┬─────────┘
         │ Simula OCPP event
         ▼
┌──────────────────┐
│ Backend Service  │
│ ruleEngine       │ R1-R5
└────────┬─────────┘
         │ Dispara regla
         ▼
┌──────────────────┐
│ Firebase Service │
│ sendNotification │
└────────┬─────────┘
         │ Envía push
         ▼
┌──────────────────┐
│ Mobile App       │
│ onNotification() │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ notificationStore│
│ addReceived()    │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│ HomeScreen       │
│ Muestra notif    │
└──────────────────┘
```

## 📚 Referencias

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Documentation](https://docs.expo.dev/)
- [Zustand - State Management](https://zustand-demo.vercel.app/)
- [React Navigation](https://reactnavigation.org/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

## 📄 Licencia

Este proyecto es parte de una tesis de electromovilidad y está disponible para fines educativos.

## 📞 Soporte

Para problemas o dudas:
1. Revisa los logs en Expo Go
2. Verifica que el backend está corriendo
3. Comprueba la conexión de red
4. Consulta el README del backend en `evcs-backend/README.md`

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0.0  
**Estado**: ✅ Producción (Demo)
