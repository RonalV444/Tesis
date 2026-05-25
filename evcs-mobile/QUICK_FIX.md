# 🚨 SOLUCIÓN RÁPIDA: Error de Conectividad Backend

## Problema Detectado

```
ERROR  [API Error] 404 <!DOCTYPE html>
ERROR  [API] Backend no disponible
ERROR  [Notifications] Error obteniendo token: Network request failed
```

Esto significa: **La app móvil NO puede conectar con el backend**

---

## ✅ Solución Rápida (5 minutos)

### Paso 1: Verifica que el backend está corriendo

```bash
cd evcs-backend
npm start
```

Deberías ver:
```
🚀 API listening on port 3000
📍 API routes available at http://localhost:3000/api
```

---

### Paso 2: Identifica tu IP local

**En Command Prompt (Windows):**
```bash
ipconfig
```

Busca `IPv4 Address:` - probablemente algo como `192.168.1.100`

---

### Paso 3: Usa tu IP en lugar de localhost

En `evcs-mobile/src/services/api.ts`:

```typescript
// ANTES:
const API_URL = 'http://localhost:3000/api';

// DESPUÉS (reemplaza con TU IP):
const API_URL = 'http://192.168.1.100:3000/api';
```

---

### Paso 4: Reinicia la app

En la consola de Expo:
```
Press r to reload
```

---

### Paso 5: Verifica en los logs

Deberías ver:
```
✅ [API] Login exitoso: test@test.com
✅ [Store] Login exitoso
✅ [Notifications] Token obtenido: ExponentPushToken[...]
✅ [Store] ✅ Token de notificaciones registrado exitosamente
```

---

## ❌ Si aún no funciona

### Opción A: Usa ADB Reverse (si conectas por USB)

```bash
# En Command Prompt
adb reverse tcp:3000 tcp:3000

# Verifica que se configuró
adb reverse --list
```

Luego cambia `api.ts` a:
```typescript
const API_URL = 'http://localhost:3000/api';
```

---

### Opción B: Ejecuta el script de diagnóstico

```bash
cd evcs-mobile
node diagnose-connection.js
```

Esto te dará más detalles sobre qué está bloqueado.

---

## 🔧 Checklist de Diagnóstico

- [ ] Backend corriendo: `npm start` en evcs-backend
- [ ] Backend escucha en puerto 3000
- [ ] Firewall permite conexión al puerto 3000
- [ ] IP local es correcta en `api.ts` (O tienes ADB reverse configurado)
- [ ] App móvil reiniciada después de cambiar `api.ts`
- [ ] Red del emulador/dispositivo está activa

---

## 📋 URLs Que Deberían Funcionar

Elige UNA según tu configuración:

| Configuración | URL |
|---------------|-----|
| Emulador + ADB Reverse | `http://localhost:3000/api` |
| Emulador + IP Local | `http://192.168.1.100:3000/api` |
| Dispositivo físico + USB + ADB Reverse | `http://localhost:3000/api` |
| Dispositivo físico + WiFi | `http://192.168.1.100:3000/api` |

---

## 🧪 Verifica que funciona

Una vez que veas los logs de éxito, ejecuta:

```bash
node test-notifications.js
```

Debería enviar una notificación de prueba que llegue a tu app.

---

## 💡 Notas Importantes

1. **localhost desde emulador** = la máquina del emulador, no tu PC
2. **ADB Reverse** hace que localhost:3000 en el emulador apunte a tu PC
3. **Cambios en api.ts requieren reiniciar** la app
4. **Token de Expo es secundario** - si no funciona, usa mock token

---

¿Sigues teniendo problemas? Ejecuta el diagnóstico y comparte los resultados.

