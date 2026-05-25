#!/usr/bin/env node

/**
 * Script de prueba para verificar que el sistema de notificaciones funciona
 * 
 * USO:
 *   node test-notifications.js
 * 
 * REQUISITOS:
 *   - Backend corriendo en localhost:3000
 *   - App móvil logueada
 *   - Node.js instalado
 */

const http = require('http');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString();
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    success: `${colors.green}[✓]${colors.reset}`,
    error: `${colors.red}[✗]${colors.reset}`,
    warn: `${colors.yellow}[⚠]${colors.reset}`,
    test: `${colors.cyan}[TEST]${colors.reset}`,
  };
  console.log(`${prefix[type]} ${timestamp} ${message}`);
}

function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testNotificationSystem() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}================================${colors.reset}`);
  console.log(`${colors.bright}  🔔 PRUEBA DEL SISTEMA DE NOTIFICACIONES${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}================================${colors.reset}\n`);

  // Test 1: Verificar que el backend está disponible
  log('test', 'Test 1: Verificando conexión con backend...');
  try {
    const healthRes = await makeRequest('GET', '/health');
    if (healthRes.status === 200) {
      log('success', `Backend está corriendo: ${JSON.stringify(healthRes.data)}`);
    } else {
      throw new Error(`Status ${healthRes.status}`);
    }
  } catch (error) {
    log('error', `❌ Backend no disponible: ${error.message}`);
    log('error', 'Asegúrate de que el backend esté corriendo en localhost:3000');
    process.exit(1);
  }

  console.log();

  // Test 2: Verificar que hay tokens registrados
  log('test', 'Test 2: Verificando tokens de dispositivo registrados...');
  try {
    // Este test es informativo - mostrará los tokens del backend
    log('info', '(Los tokens se registran automáticamente cuando el usuario hace login en la app)');
    log('info', 'Verifica los logs del backend para ver los tokens registrados');
  } catch (error) {
    log('warn', `No se puede obtener lista de tokens: ${error.message}`);
  }

  console.log();

  // Test 3: Simular envío de notificación
  log('test', 'Test 3: Simulando envío de notificación...');
  const testUserId = 'test@test.com'; // Cambia esto si es diferente
  const testNotification = {
    userId: testUserId,
    title: '🧪 Notificación de Prueba',
    body: 'Si ves esto en la app, ¡las notificaciones funcionan correctamente!',
    data: {
      type: 'test',
      timestamp: new Date().toISOString(),
    },
  };

  try {
    log('info', `Enviando notificación a usuario: ${testUserId}`);
    const sendRes = await makeRequest('POST', '/notifications/send', testNotification);
    
    if (sendRes.status === 200 && sendRes.data.success) {
      log('success', 'Notificación enviada correctamente');
      log('info', `Respuesta: ${JSON.stringify(sendRes.data)}`);
      
      console.log();
      log('success', '✅ VERIFICACIÓN COMPLETADA');
      console.log();
      log('info', '📱 Ahora verifica en tu app móvil:');
      log('info', '   1. La notificación debería llegar en ~2-5 segundos');
      log('info', '   2. Aparecerá en la lista del HomeScreen');
      log('info', '   3. Verifica los logs de la app en Expo');
    } else {
      log('warn', `El servidor respondió sin éxito:`);
      log('info', JSON.stringify(sendRes.data));
    }
  } catch (error) {
    log('error', `Error enviando notificación: ${error.message}`);
  }

  console.log();
  console.log(`${colors.bright}${colors.cyan}================================${colors.reset}`);
  console.log(`${colors.bright}Pasos para solucionar si no funciona:${colors.reset}`);
  console.log(`${colors.cyan}1.${colors.reset} Verifica que el backend está corriendo`);
  console.log(`${colors.cyan}2.${colors.reset} Verifica que la app móvil está logueada`);
  console.log(`${colors.cyan}3.${colors.reset} Verifica los logs en Expo: [Notifications] y [Store]`);
  console.log(`${colors.cyan}4.${colors.reset} Verifica los logs del backend`);
  console.log(`${colors.cyan}5.${colors.reset} Si el token no se registra, revisa si el login fue exitoso`);
  console.log(`${colors.bright}${colors.cyan}================================${colors.reset}\n`);
}

testNotificationSystem().catch(error => {
  log('error', `Error inesperado: ${error.message}`);
  process.exit(1);
});
