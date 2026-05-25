# 🔧 HERRAMIENTAS DE DIAGNÓSTICO Y CONFIGURACIÓN

Hemos creado 3 herramientas para ayudarte a solucionar problemas de conectividad:

---

## 1. 🚀 `setup-api-url.js` - Configuración Automática

**Configura automáticamente la IP correcta**

```bash
cd evcs-mobile

# Ver todas las IPs disponibles
node setup-api-url.js

# Configurar con localhost (si usas ADB Reverse)
node setup-api-url.js localhost

# Configurar con la primera IP local
node setup-api-url.js 1
```

**Qué hace:**
- Detecta todas las IPs locales de tu PC
- Actualiza automáticamente `src/services/api.ts`
- Te da instrucciones claras

---

## 2. 🔍 `diagnose-connection.js` - Diagnóstico

**Verifica qué está funcionando y qué no**

```bash
cd evcs-mobile
node diagnose-connection.js
```

**Qué hace:**
- Intenta conectar a localhost:3000
- Intenta conectar a 0.0.0.0:3000
- Te da instrucciones específicas si algo falla
- Explica cómo usar ADB Reverse

---

## 3. 📱 `test-notifications.js` - Prueba de Notificaciones

**Envía una notificación de prueba después de configurar todo**

```bash
cd evcs-mobile
node test-notifications.js
```

**Qué hace:**
- Verifica que el backend está disponible
- Envía una notificación de prueba
- Te dice si funcionó correctamente

---

## 🎯 FLUJO RECOMENDADO

### Paso 1: Ejecuta el diagnóstico
```bash
node diagnose-connection.js
```

Esto te dirá si:
- ✅ Backend está corriendo
- ❌ No puedes conectar a localhost
- 💡 Qué hacer exactamente

---

### Paso 2: Configura la IP

Si el diagnóstico dice "No puedes conectar a localhost":

```bash
# Opción A: Ver IPs disponibles
node setup-api-url.js

# Opción B: Configurar directamente
# (reemplaza X con el número que corresponda a tu IP)
node setup-api-url.js X
```

O si usas USB con ADB:
```bash
# En Command Prompt
adb reverse tcp:3000 tcp:3000

# En la carpeta evcs-mobile
node setup-api-url.js localhost
```

---

### Paso 3: Reinicia la app

En la consola de Expo:
```
r   (reload)
```

---

### Paso 4: Prueba el login

En la app:
- Email: `test@test.com`
- Password: `123456`

Deberías ver logs de éxito en Expo.

---

### Paso 5: Prueba notificaciones

```bash
node test-notifications.js
```

La notificación debería llegar a tu app en ~2 segundos.

---

## 🐛 ERRORES COMUNES

### "Cannot GET /api/"
**Causa:** La app está intentando acceder a un endpoint que no existe
**Solución:** Cambiar `const API_URL` en `src/services/api.ts`

### "Network request failed" (Token Expo)
**Causa:** La app no tiene internet o hay firewall
**Solución:** Los logs ahora usarán mock token como fallback

### "Backend no disponible"
**Causa:** Localhost no está accesible desde el emulador
**Solución:** Usa IP local o ADB Reverse

---

## 📋 CHECKLIST DE VERIFICACIÓN

Antes de reportar un problema, verifica:

- [ ] Backend corriendo: `npm start` en evcs-backend
- [ ] No hay firewall bloqueando puerto 3000
- [ ] ADB Reverse configurado (si usas USB)
- [ ] O API_URL tiene la IP local correcta
- [ ] App reiniciada después de cambios
- [ ] Logs muestran intentos de conexión

---

## 📊 MATRIZ DE CONFIGURACIÓN

| Escenario | Comando Recomendado | API_URL |
|-----------|-------------------|---------|
| **Emulador Android** | `node setup-api-url.js 1` | `http://[IP_LOCAL]:3000/api` |
| **Emulador + ADB** | `node setup-api-url.js localhost` | `http://localhost:3000/api` |
| **Dispositivo USB** | `adb reverse tcp:3000 tcp:3000` | `http://localhost:3000/api` |
| **Dispositivo WiFi** | `node setup-api-url.js [NUM]` | `http://[IP_LOCAL]:3000/api` |

---

## 🆘 SI NADA DE ESTO FUNCIONA

1. Ejecuta: `node diagnose-connection.js`
2. Lee toda la salida cuidadosamente
3. Sigue las instrucciones específicas que te da
4. Comparte los resultados si necesitas más ayuda

---

¡Las herramientas están listas! 🚀

