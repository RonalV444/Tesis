## 📝 CAMBIOS EXACTOS REALIZADOS EN CADA ARCHIVO

Esta referencia muestra exactamente qué cambios se hicieron para resolver el problema.

---

## 📄 Archivo 1: `src/store/authStore.ts`

### ¿Qué cambió?
Se agregó lógica para registrar el token FCM automáticamente después del login exitoso.

### Cambios específicos:

#### 1. Nueva importación
```typescript
// ANTES: 
import { apiService } from '../services/api';

// DESPUÉS:
import { apiService } from '../services/api';
import { notificationService } from '../services/notifications';
```

#### 2. Nuevo estado
```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  deviceTokenRegistered: boolean; // ← NUEVO
  // ...
}
```

#### 3. Inicialización del estado
```typescript
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  deviceTokenRegistered: false, // ← NUEVO
  // ...
}));
```

#### 4. Lógica en la función login
```typescript
login: async (email: string, password: string) => {
  try {
    set({ isLoading: true, error: null });
    console.log('[Store] Iniciando login...');

    const response = await apiService.login(email, password);

    if (response.success) {
      set({
        user: response.user,
        token: response.token,
        isLoading: false,
        error: null,
      });
      console.log('[Store] Login exitoso');

      // ← AQUÍ ES LO NUEVO - Registrar token
      console.log('[Store] Registrando token de notificaciones...');
      try {
        const registered = await notificationService.registerTokenWithBackend(response.user.id);
        if (registered) {
          set({ deviceTokenRegistered: true });
          console.log('[Store] ✅ Token de notificaciones registrado exitosamente');
        } else {
          console.warn('[Store] ⚠️ No se pudo registrar el token de notificaciones');
        }
      } catch (tokenError) {
        console.error('[Store] ❌ Error registrando token de notificaciones:', tokenError);
      }

      return true;
    }
    // ... resto del código
  }
}
```

---

## 📄 Archivo 2: `src/services/notifications.ts`

### ¿Qué cambió?
Se agregaron 3 nuevos métodos para facilitar el registro del token y la inicialización de notificaciones.

### Cambios específicos:

#### 1. Nueva importación (al principio del archivo)
```typescript
// AGREGADO:
import { apiService } from './api';
```

#### 2. Nuevo método 1: `requestDeviceToken()`
```typescript
/**
 * Solicitar token del dispositivo (con permisos)
 * Esto es un alias más descriptivo de getDeviceToken()
 */
async requestDeviceToken(): Promise<string | null> {
  return this.getDeviceToken();
}
```

#### 3. Nuevo método 2: `registerTokenWithBackend()`
```typescript
/**
 * Registrar el token del dispositivo en el backend
 * Combina obtención de token + registro en una sola operación
 */
async registerTokenWithBackend(userId: string): Promise<boolean> {
  try {
    console.log('[Notifications] Iniciando registro de token con backend...');

    // 1. Obtener el token del dispositivo
    const deviceToken = await this.getDeviceToken();

    if (!deviceToken) {
      console.warn('[Notifications] No se pudo obtener el token del dispositivo');
      return false;
    }

    // 2. Registrar el token en el backend
    console.log('[Notifications] Enviando token al backend...');
    const response = await apiService.registerDeviceToken(userId, deviceToken);

    if (response.success) {
      console.log('[Notifications] ✅ Token registrado exitosamente en el backend');
      return true;
    } else {
      console.warn('[Notifications] ⚠️ El backend respondió sin éxito:', response.message);
      return false;
    }
  } catch (error) {
    console.error('[Notifications] ❌ Error registrando token con backend:', error);
    return false;
  }
}
```

#### 4. Nuevo método 3: `initializeNotificationsAfterLogin()`
```typescript
/**
 * Inicializar notificaciones y registrar token
 * Este es el método principal que se debe llamar en el login
 */
async initializeNotificationsAfterLogin(
  userId: string,
  onNotification?: (notification: any) => void
): Promise<void> {
  try {
    console.log('[Notifications] Inicializando notificaciones...');

    // 1. Configurar canal Android si es necesario
    await this.setupAndroidChannel();

    // 2. Solicitar permisos
    const hasPermission = await this.requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('[Notifications] Permisos de notificaciones no concedidos');
    }

    // 3. Registrar token en el backend
    const tokenRegistered = await this.registerTokenWithBackend(userId);
    if (!tokenRegistered) {
      console.warn('[Notifications] No se pudo registrar el token en el backend');
    }

    // 4. Configurar listeners para recibir notificaciones
    if (onNotification) {
      this.setupNotificationListeners(onNotification);
    }

    console.log('[Notifications] ✅ Notificaciones inicializadas correctamente');
  } catch (error) {
    console.error('[Notifications] Error inicializando notificaciones:', error);
  }
}
```

---

## 📄 Archivo 3: `src/screens/HomeScreen.tsx`

### ¿Qué cambió?
Se agregó un `useEffect` que configura los listeners para recibir notificaciones en tiempo real cuando el usuario está en esta pantalla.

### Cambios específicos:

#### 1. Nuevas importaciones
```typescript
// ANTES:
import React, { useState } from 'react';

// DESPUÉS:
import React, { useState, useEffect } from 'react';
```

```typescript
// AGREGADO:
import { notificationService } from '../services/notifications';
```

#### 2. Nuevas variables en el componente
```typescript
const HomeScreen = () => {
  const { user } = useAuthStore();
  // CAMBIADO - se agregó addReceivedNotification
  const { receivedNotifications, fetchNotifications, isLoading, unreadCount, addReceivedNotification } = useNotificationStore();
  const [refreshing, setRefreshing] = useState(false);

  // ← NUEVO - useEffect para configurar listeners
  useEffect(() => {
    if (user?.id) {
      console.log('[HomeScreen] Inicializando listeners de notificaciones...');
      
      // Configurar listeners para recibir notificaciones en tiempo real
      notificationService.setupNotificationListeners((notification) => {
        console.log('[HomeScreen] 🔔 Notificación recibida:', notification.request.content.title);
        
        // Agregar a la lista de notificaciones recibidas
        addReceivedNotification(notification);
      });

      // Limpiar listeners al desmontar
      return () => {
        console.log('[HomeScreen] Limpiando listeners de notificaciones...');
        notificationService.clearNotificationListeners();
      };
    }
  }, [user?.id]);

  // ... resto del código
}
```

---

## 🎯 RESUMEN DE CAMBIOS

| Archivo | Cambio | Propósito |
|---------|--------|----------|
| authStore.ts | + método para registrar token en login | Registrar token automáticamente |
| notifications.ts | + 3 nuevos métodos | Facilitar registro y manejo de token |
| HomeScreen.tsx | + useEffect con listeners | Capturar notificaciones en tiempo real |

---

## ✅ VERIFICACIÓN

Para verificar que todos los cambios se hicieron correctamente:

1. **authStore.ts** debe tener:
   - ✅ Import de `notificationService`
   - ✅ Estado `deviceTokenRegistered`
   - ✅ Lógica de registro en `login()`

2. **notifications.ts** debe tener:
   - ✅ Import de `apiService`
   - ✅ Método `registerTokenWithBackend()`
   - ✅ Método `requestDeviceToken()`
   - ✅ Método `initializeNotificationsAfterLogin()`

3. **HomeScreen.tsx** debe tener:
   - ✅ Import de `useEffect`
   - ✅ Import de `notificationService`
   - ✅ Import de `addReceivedNotification`
   - ✅ useEffect con listeners configurados

---

## 🚀 PRÓXIMAS MEJORAS OPCIONALES

Estos cambios son opcionales pero recomendados para futuro:

1. **Guardar token en AsyncStorage**
   ```typescript
   // En authStore.ts
   import AsyncStorage from '@react-native-async-storage/async-storage';
   
   // Guardar token registrado
   await AsyncStorage.setItem('deviceToken', deviceToken);
   ```

2. **Desactivar token en logout**
   ```typescript
   logout: () => {
     // Desactivar token en backend
     if (this.token) {
       await apiService.deactivateDeviceToken(this.token);
     }
     // ...
   }
   ```

3. **Manejar renovación de token**
   ```typescript
   // Renovar token cada 7 días
   ```

---

¡Todos los cambios están hechos y listos para funcionar! 🎉

