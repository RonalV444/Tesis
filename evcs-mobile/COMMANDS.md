# 🎯 COMANDOS EXACTOS - Copia y Pega

## 1️⃣ INSTALACIÓN INICIAL

Abre PowerShell o terminal y copia estos comandos:

### Windows (PowerShell)
```powershell
cd "e:\Ronaldo\Escuela y Trabajo\proyectos\Sistema de Notificaciones Electromovilidad\evcs-mobile"
npm install
```

### macOS/Linux
```bash
cd ~/path/to/evcs-mobile
npm install
```

---

## 2️⃣ EJECUTAR LA APLICACIÓN

### Opción A: Expo Go (RECOMENDADO)
```bash
npm start
```

**En tu teléfono:**
- Android: Abre Expo Go → Escanea QR
- iOS: Abre Cámara → Escanea QR

---

### Opción B: Emulador Android
```bash
npm run android
```

---

### Opción C: Emulador iOS (macOS)
```bash
npm run ios
```

---

### Opción D: Navegador Web
```bash
npm run web
```

---

## 3️⃣ INICIAR EL BACKEND (en OTRA terminal)

```bash
cd e:\Ronaldo\Escuela y Trabajo\proyectos\Sistema de Notificaciones Electromovilidad\evcs-backend
npm run dev
```

O alternatively:
```bash
node test-system.js
```

---

## 4️⃣ VERIFICAR QUE TODO FUNCIONA

### Comprobar Node.js
```bash
node --version
npm --version
```

### Comprobar Backend
```bash
curl http://10.125.19.125:3000/api/
```

En PowerShell:
```powershell
Invoke-WebRequest -Uri "http://10.125.19.125:3000/api/" -Method GET
```

### Comprobar Expo
```bash
npx expo --version
```

---

## 5️⃣ PRUEBA DE FUNCIONAMIENTO

### 1. En la app (Expo Go)
```
Email: test@test.com
Password: 123456
Botón: Iniciar Sesión
```

### 2. Abrir simulador en navegador
```
Archivo: evcs-backend/demo-interactive.html
```

### 3. En el simulador
```
Haz clic en: "▶ Start Transaction"
```

### 4. En la app
```
Observa la notificación en la pantalla Home
```

---

## 🐛 SOLUCIÓN RÁPIDA DE PROBLEMAS

### Error: "npm: command not found"
```bash
# Descargar Node.js desde https://nodejs.org/
# Reinstalar PowerShell o terminal
```

### Error: "Cannot find module"
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

### Backend no disponible
```bash
# Verifica que está corriendo
cd evcs-backend
npm run dev
```

### No recibe notificaciones
```bash
# 1. Revisa los logs en Expo Go
# 2. Ve a Perfil → Verifica que tienes Token
# 3. Revisa los logs del backend
```

---

## 📱 DESCARGAR EXPO GO

- **Android**: Busca "Expo Go" en Play Store
- **iOS**: Busca "Expo Go" en App Store

---

## 📋 CHECKLIST RÁPIDO

```
□ Node.js v16+ instalado
□ npm disponible
□ Expo Go descargado en teléfono
□ Backend EVCS corriendo
□ WiFi habilitado
□ Permisos de notificaciones activos

Si todo ✓, entonces ejecuta:
npm install
npm start
```

---

## 📞 RECURSOS

| Recurso | URL |
|---------|-----|
| Node.js | https://nodejs.org/ |
| Expo Go Android | https://play.google.com/store/apps/details?id=host.exp.exponent |
| Expo Go iOS | https://apps.apple.com/app/expo-go/id982107779 |
| Documentación | /evcs-mobile/README.md |
| Quick Start | /evcs-mobile/QUICK_START.md |

---

## ✅ VERIFICACIÓN FINAL

Antes de reportar error:

```bash
# 1
node --version

# 2
npm --version

# 3
cd evcs-mobile
npm list | head -20

# 4
npx expo --version

# 5
curl http://10.125.19.125:3000/api/
```

Si todos dan resultado, entonces:
```bash
npm start
```

---

**¡LISTO! 🚀**

Escanea el código QR en Expo Go y a disfrutar de la app.
