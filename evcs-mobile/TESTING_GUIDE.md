## 🧪 GUÍA DE VERIFICACIÓN PASO A PASO

Esta guía te ayudará a verificar que las notificaciones push funcionan correctamente después de las correcciones.

---

## ✅ FASE 1: Preparar el entorno

### 1. Backend está corriendo
```bash
# En la carpeta evcs-backend
npm start
# Deberías ver: Server running on port 3000
```

### 2. App móvil está preparada
```bash
# En la carpeta evcs-mobile
npx expo start --localhost
# Abre en tu emulador/dispositivo
```

### 3. Recuerda tener ADB reverse configurado (si usas USB)
```bash
adb reverse tcp:3000 tcp:3000
adb reverse tcp:8081 tcp:8081
```

---

## ✅ FASE 2: Test de Login con Registro de Token

### Pasos:
1. **Abre la app móvil**
2. **En la consola de Expo, busca estos logs:**
   ```
   [Store] Iniciando login...
   [API] Iniciando login para: test@test.com
   ```

3. **Haz login con:**
   - Email: `test@test.com`
   - Password: `123456`

4. **Después del login exitoso, deberías ver INMEDIATAMENTE:**
   ```
   [Store] Login exitoso
   [Store] Registrando token de notificaciones...
   [Notifications] Iniciando registro de token con backend...
   [Notifications] Obteniendo token del dispositivo...
   [Notifications] Token obtenido: ExponentPushToken[xxxx...]
   [Notifications] Enviando token al backend...
   [API] Registrando token FCM para usuario: test@test.com
   [API] Token registrado exitosamente
   [Store] ✅ Token de notificaciones registrado exitosamente
   ```

5. **En el backend, deberías ver:**
   ```
   ✅ Token registrado para usuario test@test.com: ExponentPushToken[xxxx...]
   ```

### ✨ Si ves todos estos logs = ÉXITO ✨

---

## ✅ FASE 3: Test de Notificación

### Opción A: Usar el script de prueba (Recomendado)

```bash
# En la carpeta evcs-mobile
node test-notifications.js
```

Este script:
- ✅ Verifica que el backend está disponible
- ✅ Envía una notificación de prueba
- ✅ Te dice qué verificar en la app

### Opción B: Usar cURL (Manual)

```bash
curl -X POST http://localhost:3000/api/notifications/send \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test@test.com",
    "title": "🧪 Notificación de Prueba",
    "body": "¡Si ves esto, funciona!",
    "data": {"type": "test"}
  }'
```

### Opción C: Usar el simulador web (demo-interactive.html)

1. **Abre la carpeta del backend en tu navegador**
2. **Busca y abre: `demo-interactive.html`**
3. **En el simulador web:**
   - Selecciona un usuario
   - Simula un evento OCPP
   - El backend procesará y enviará la notificación

---

## ✅ FASE 4: Verificar que la notificación llega

### Después de enviar la notificación:

**En la app móvil (Expo console):**
```
[Notifications] Notificación recibida en foreground: 🧪 Notificación de Prueba
[HomeScreen] 🔔 Notificación recibida: 🧪 Notificación de Prueba
[NotificationStore] Nueva notificación recibida: 🧪 Notificación de Prueba
```

**Visualmente:**
- La notificación aparecerá en la lista del HomeScreen
- El badge mostrará el número de notificaciones sin leer
- Si haces scroll, verás la notificación con timestamp

**En el backend:**
```
✅ Notificación enviada a usuario test@test.com
Resultado:
  Mobile: 1 enviadas, 0 fallidas
```

---

## 🚨 PROBLEMAS COMUNES Y SOLUCIONES

### ❌ Problema: El token NO se registra después del login

**Síntomas:**
- No ves los logs de `[Store] Registrando token...`
- No ves `✅ Token registrado exitosamente`

**Soluciones:**
1. **Verifica que el login fue exitoso**
   - Deberías ver: `[Store] Login exitoso`
   - Si no lo ves, el login falló

2. **Verifica los permisos de notificaciones**
   - ¿Aceptaste los permisos cuando se solicitaron?
   - En iOS: Settings > [App] > Notifications > On

3. **Revisa si hay errores en los logs**
   - Busca logs con `[ERROR]` o `[Notifications] Error`
   - Lee el error completo

---

### ❌ Problema: La notificación se envía pero NO llega a la app

**Síntomas:**
- El script de prueba dice: ✅ Notificación enviada correctamente
- Pero la app no recibe nada
- No ves logs en `[HomeScreen]` o `[Notifications]`

**Soluciones:**
1. **Verifica que el token está registrado**
   - Mira los logs del backend
   - Debería decir: `✅ Token registrado para usuario...`

2. **Verifica que la app está en foreground**
   - Las notificaciones solo se capturan si la app está abierta
   - Si está en background, se guardan en el sistema

3. **Verifica que los listeners se configuraron**
   - En HomeScreen, deberías ver:
   ```
   [HomeScreen] Inicializando listeners de notificaciones...
   [Notifications] Configurando listeners...
   ```

4. **Reinicia la app**
   - A veces los listeners no se configuran correctamente
   - Cierra completamente y abre de nuevo

---

### ❌ Problema: Permisos de notificaciones denegados

**Síntomas:**
```
[Notifications] ⚠️ Permisos de notificaciones no concedidos
[Notifications] Usando token mock...
```

**Soluciones:**
1. **Dale permisos a la app:**
   - **Android**: Settings > Apps > [App Name] > Notifications > On
   - **iOS**: Settings > [App Name] > Notifications > Allow Notifications

2. **Desinstala y reinstala la app** (esto fuerza pedir permisos de nuevo)
   ```bash
   npx expo prebuild --clean
   npx expo start
   ```

3. **El token mock también funciona**, pero es menos confiable

---

### ❌ Problema: Backend no disponible

**Síntomas:**
```
[ERROR] Backend no disponible: connect ECONNREFUSED
```

**Soluciones:**
1. **Verifica que el backend está corriendo**
   ```bash
   cd evcs-backend
   npm start
   ```

2. **Verifica el puerto correcto**
   - Debería ser `3000`
   - Si cambiaste el puerto, actualiza `API_URL` en `src/services/api.ts`

3. **Verifica ADB reverse (si usas USB)**
   ```bash
   adb reverse tcp:3000 tcp:3000
   ```

4. **Intenta con la IP local si localhost no funciona**
   - En `src/services/api.ts`:
   ```typescript
   const API_URL = 'http://192.168.x.x:3000/api'; // Tu IP local
   ```

---

## 📊 CHECKLIST DE VERIFICACIÓN

Marca los items conforme los verifies:

- [ ] Backend está corriendo en puerto 3000
- [ ] App móvil logueada correctamente
- [ ] Logs de login exitoso en la app
- [ ] Logs de registro de token en la app
- [ ] Logs de token registrado en el backend
- [ ] Token visible en los logs (ExponentPushToken[...])
- [ ] Notificación enviada sin errores
- [ ] Notificación aparece en la app
- [ ] Notificación tiene timestamp correcto
- [ ] Badge muestra el número correcto
- [ ] Listeners configurados en HomeScreen

✅ **Si todos los items están marcados = TODO FUNCIONA** ✅

---

## 🎯 FLUJO ESPERADO COMPLETO

```
App se abre
  ↓
Usuario hace login: test@test.com / 123456
  ↓
✅ [Store] Login exitoso
  ↓
✅ [Notifications] Obteniendo token...
  ↓
✅ [Notifications] Token obtenido: ExponentPushToken[...]
  ↓
✅ [API] Registrando token en el backend...
  ↓
✅ [Backend] Token registrado para usuario test@test.com
  ↓
✅ Usuario navega a HomeScreen
  ↓
✅ [HomeScreen] Listeners configurados
  ↓
Alguien envía una notificación
  ↓
✅ [Backend] Notificación enviada al token
  ↓
✅ [Notifications] Notificación recibida en foreground
  ↓
✅ [HomeScreen] Notificación agregada a la lista
  ↓
✅ Usuario VE la notificación en tiempo real 🎉
```

---

## 📞 SOPORTE

Si algo no funciona después de intentar todas las soluciones:

1. **Revisa todos los logs** (app + backend)
2. **Copia los logs completos** que muestren el error
3. **Verifica que hayas hecho todos los cambios** en los archivos
4. **Reinicia todo** (app, backend, emulador)
5. **Limpia caches** si es necesario

---

¡Que funcione! 🚀

