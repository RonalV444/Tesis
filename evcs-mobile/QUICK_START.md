# 🚀 EVCS Mobile - Quick Start

## Instalación y ejecución rápida

### ⚡ 1-2-3 Pasos para empezar

#### Paso 1: Instalar dependencias
```bash
cd evcs-mobile
npm install
```

#### Paso 2: Iniciar la app
```bash
npm start
```

#### Paso 3: Abrir en tu teléfono
- **Android**: Abre Expo Go y escanea el código QR
- **iOS**: Abre la cámara y escanea el código QR

---

## 📋 Requisitos Previos

✅ Node.js 16+  
✅ npm o yarn  
✅ Expo Go instalado en el teléfono  
✅ Backend EVCS corriendo (`http://10.125.19.125:3000/api`)  

### Instalar Expo Go

- **Android**: [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)
- **iOS**: [App Store](https://apps.apple.com/app/expo-go/id982107779)

---

## 🧪 Prueba Rápida

### 1. Inicia sesión
```
Email: test@test.com
Password: 123456
```

### 2. Abre el simulador web (en tu PC)
```
File: evcs-backend/demo-interactive.html
```

### 3. Simula un evento OCPP
Haz clic en: **"▶ Start Transaction"** en el panel de control

### 4. ¡Observa la notificación en tu teléfono!

---

## 📱 Pantallas Principales

| Pantalla | Descripción |
|----------|-------------|
| **Login** | Autenticación con credenciales de demostración |
| **Home** 🏠 | Notificaciones recientes y estado de conexión |
| **Historial** 📊 | Todas las notificaciones con filtros por regla |
| **Perfil** 👤 | Información del usuario y estadísticas |

---

## 🔌 Comandos Útiles

```bash
# Iniciar en desarrollo
npm start

# Android
npm run android

# iOS (solo macOS)
npm run ios

# Web
npm run web

# Limpiar caché
npm cache clean --force

# Reinstalar dependencias
rm -rf node_modules
npm install
```

---

## 🐛 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| "Cannot find module" | `npm install` |
| "Backend no disponible" | `npm run dev` en evcs-backend |
| "No recibe notificaciones" | Verifica permisos en Perfil |
| "QR no funciona" | Reinicia Expo Go o app |

---

## 📍 Configuración de Endpoint

### Para IP local (LAN)
```
http://10.125.19.125:3000/api
```

### Para localhost
Edita `.env`:
```
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

---

## 🎯 Reglas de Notificación (R1-R5)

- **R1** ⚡ - SOC ≥ 90%
- **R2** ⏱️ - Tiempo < 10 minutos
- **R3** ✅ - Cargador disponible
- **R4** ✨ - Carga finalizando
- **R5** ❌ - Error o fallo

---

## 💡 Tips

1. **Logs**: Abre la consola en Expo Go para ver mensajes de depuración
2. **Tokens**: Ve a Perfil para ver tu token FCM
3. **Historial**: El historial se guarda en memoria (se limpia al cerrar sesión)
4. **Simulador**: El archivo `demo-interactive.html` es donde se crean eventos

---

**¿Listo para empezar?** 🎉

```bash
npm start
```

Escanea el código QR y ¡a disfrutar! 📱
