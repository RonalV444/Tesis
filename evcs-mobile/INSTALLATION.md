# 🎯 Comandos de Instalación y Ejecución

## Resumen Rápido

```bash
# 1. Navegar a la carpeta
cd evcs-mobile

# 2. Instalar dependencias
npm install

# 3. Iniciar la app
npm start

# 4. Abrir en Expo Go
# - Android: Abre Expo Go y escanea el código QR
# - iOS: Abre la cámara y escanea el código QR
```

---

## Comandos Detallados

### 1️⃣ Instalación Inicial

#### Windows (PowerShell)
```powershell
# Navegar a la carpeta
cd "e:\Ronaldo\Escuela y Trabajo\proyectos\Sistema de Notificaciones Electromovilidad\evcs-mobile"

# Instalar Node.js (si no lo tienes)
# Descargalo de https://nodejs.org/ (versión LTS 18+)

# Verificar que npm está instalado
npm --version

# Instalar dependencias
npm install

# Verificar que expo está disponible
npx expo --version
```

#### macOS/Linux
```bash
# Navegar a la carpeta
cd ~/path/to/evcs-mobile

# Instalar dependencias
npm install

# Verificar que expo está disponible
npx expo --version
```

---

### 2️⃣ Ejecutar la Aplicación

#### Opción A: Usar Expo Go (Recomendado)
```bash
# Desde la carpeta evcs-mobile/
npm start

# Verás un código QR en la terminal
# Escanea con:
#   - Android: Expo Go (descárgalo desde Play Store)
#   - iOS: Cámara nativa (abre Expo Go automáticamente)

# Comandos en el terminal:
# i  - Abrir en iOS Simulator
# a  - Abrir en Android Emulator
# w  - Abrir en navegador web
# r  - Reiniciar servidor
# q  - Salir
```

#### Opción B: Emulador Android
```bash
# Necesitas tener Android Studio y un emulador configurado

# Iniciar la app en emulador
npm run android

# Alternativa
npx expo start --android
```

#### Opción C: Emulador iOS (solo macOS)
```bash
# Necesitas Xcode instalado

# Iniciar la app en emulador iOS
npm run ios

# Alternativa
npx expo start --ios
```

#### Opción D: Navegador Web
```bash
# Prueba rápida en web (sin notificaciones)
npm run web

# Alternativa
npx expo start --web
```

---

### 3️⃣ Configuración Inicial (Una sola vez)

#### Configurar el backend
```bash
# En OTRA terminal, navega a evcs-backend
cd evcs-backend

# Instala dependencias (si no están instaladas)
npm install

# Corre el servidor
npm run dev

# O si prefieres
node test-system.js
```

#### Verificar conexión al backend
```bash
# En tu terminal principal, verifica que el backend responde
curl http://10.125.19.125:3000/api/

# O usa en PowerShell
Invoke-WebRequest -Uri "http://10.125.19.125:3000/api/" -Method GET
```

---

### 4️⃣ Pruebas

#### Prueba de Login
```bash
# La app abrirá en Expo Go
# Usa estas credenciales:
# Email: test@test.com
# Password: 123456
```

#### Prueba de Notificaciones
```bash
# En tu navegador, abre el simulador
# File: evcs-backend/demo-interactive.html

# En el panel de control, haz clic en:
# - "▶ Start Transaction"
# - Observa la notificación en tu teléfono

# O simula otros eventos:
# - "📊 Meter Values (SOC 92%)"
# - "⚠️ Status: Available"
# - "⏹ Stop Transaction"
```

---

### 5️⃣ Troubleshooting

#### Error: "npm: command not found"
```bash
# Instala Node.js desde https://nodejs.org/

# Verifica la instalación
node --version
npm --version
```

#### Error: "Cannot find module"
```bash
# Limpia el cache
npm cache clean --force

# Reinstala las dependencias
rm -rf node_modules
npm install
```

#### Error: "Backend no disponible"
```bash
# Verifica que el backend está corriendo
curl http://10.125.19.125:3000/api/

# Si no funciona, inicia el backend
cd evcs-backend
npm run dev
```

#### Error: "No se reciben notificaciones"
```bash
# 1. Verifica los permisos en el teléfono
# 2. Abre Expo Go y revisa los logs (🔴 panel derecho)
# 3. Verifica que el token está registrado (Perfil > Mostrar Token)
# 4. Revisa los logs del backend
```

---

## 📋 Checklist de Instalación

```
✓ Node.js instalado (v16+)
✓ npm o yarn disponible
✓ Expo Go descargado en teléfono
✓ Backend EVCS corriendo
✓ Navegador con acceso a demo-interactive.html
✓ WiFi habilitado (para comunicarse entre dispositivos)
✓ Permisos de notificaciones en teléfono

Si todo está ✓, puedes empezar:
npm install
npm start
```

---

## 🔗 URLs Importantes

| Componente | URL | Estado |
|-----------|-----|--------|
| Backend API | `http://10.125.19.125:3000/api` | Debe estar corriendo |
| Simulador | `evcs-backend/demo-interactive.html` | Abrir en navegador |
| Expo | `npm start` | Ejecutar en terminal |
| Expo Go | App en teléfono | Descargar desde store |

---

## 📱 Instalación de Expo Go

### Android
1. Abre Google Play Store
2. Busca "Expo Go"
3. Instala la app oficial de Expo
4. Abre la app

### iOS
1. Abre App Store
2. Busca "Expo Go"
3. Instala la app oficial de Expo
4. Abre la app

---

## 🎯 Flujo Completo de Ejecución

### Paso 1: Terminal 1 - Backend
```bash
cd evcs-backend
npm install (si es necesario)
npm run dev
```

### Paso 2: Terminal 2 - Aplicación Móvil
```bash
cd evcs-mobile
npm install (primera vez)
npm start
```

### Paso 3: Teléfono
- Abre Expo Go
- Escanea el código QR que aparece en la terminal
- Inicia sesión con test@test.com / 123456

### Paso 4: Navegador - Simulador
- Abre `evcs-backend/demo-interactive.html` en tu navegador
- Haz clic en "▶ Start Transaction"
- ¡Observa la notificación en tu teléfono!

---

## 🚀 Optimizaciones

### Para desarrollo más rápido
```bash
# Usa expo con modo directo (más rápido)
npm start -- --localhost

# O con IP específica
npm start -- --tunnel
```

### Limpiar cache si algo falla
```bash
# Limpiar todo
npm cache clean --force
npx expo cache clean

# Reinstalar
rm -rf node_modules
npm install
```

### Usar terminal específica
```bash
# PowerShell
npm start

# GitBash
npm start

# CMD
npm start
```

---

## 💾 Variables de Entorno

### Archivo `.env`
```
# URL del backend
EXPO_PUBLIC_API_URL=http://10.125.19.125:3000/api

# Para localhost
# EXPO_PUBLIC_API_URL=http://localhost:3000/api

# Firebase (opcional)
EXPO_PUBLIC_FIREBASE_PROJECT_ID=evcs-notifications
```

---

## 🎓 Recursos Adicionales

- [Documentación Expo](https://docs.expo.dev)
- [Documentación React Native](https://reactnative.dev)
- [Documentación npm](https://docs.npmjs.com)
- [Troubleshooting Expo](https://docs.expo.dev/troubleshooting/runtime-issues)

---

## ✅ Verificación Final

Antes de reportar un error, asegúrate de:

```bash
# 1. Node.js está instalado
node --version  # Debería ser v16+

# 2. npm está disponible
npm --version   # Debería ser v8+

# 3. Backend está corriendo
curl http://10.125.19.125:3000/api/  # Debería responder

# 4. Expo está disponible
npx expo --version  # Debería mostrar versión

# 5. Dependencias están instaladas
ls node_modules | wc -l  # Debería ser > 100
```

---

**¿Listo? ¡Vamos!** 🚀

```bash
npm start
```

---

**Última actualización**: Mayo 2026  
**Versión**: 1.0.0  
**Autor**: Sistema de Notificaciones Electromovilidad
