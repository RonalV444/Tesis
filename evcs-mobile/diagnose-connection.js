#!/usr/bin/env node

/**
 * Script de diagnóstico para problemas de conexión
 * 
 * USO:
 *   node diagnose-connection.js
 */

const http = require('http');
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
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
    test: `${colors.cyan}→${colors.reset}`,
  };
  console.log(`${prefix[type]} ${message}`);
}

async function checkBackend(host, port) {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: host,
      port: port,
      path: '/health',
      method: 'GET',
      timeout: 5000,
    }, (res) => {
      resolve({ status: res.statusCode, success: res.statusCode === 200 });
    });

    req.on('error', (error) => {
      resolve({ status: null, error: error.message, success: false });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ status: null, error: 'Timeout', success: false });
    });

    req.end();
  });
}

async function runDiagnostics() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}🔧 DIAGNÓSTICO DE CONEXIÓN${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════${colors.reset}\n`);

  // Test 1: Backend en localhost
  log('test', 'Verificando backend en localhost:3000...');
  const localResult = await checkBackend('localhost', 3000);
  if (localResult.success) {
    log('success', 'Backend accesible en localhost:3000');
  } else {
    log('error', `No se puede conectar a localhost:3000: ${localResult.error}`);
  }

  // Test 2: Backend en 0.0.0.0
  log('test', 'Verificando backend en 0.0.0.0:3000...');
  const zeroResult = await checkBackend('0.0.0.0', 3000);
  if (zeroResult.success) {
    log('success', 'Backend accesible en 0.0.0.0:3000');
  } else {
    log('warn', `0.0.0.0 no accesible (es normal): ${zeroResult.error}`);
  }

  // Test 3: Si no funciona localhost, buscar IP local
  if (!localResult.success) {
    log('warn', 'Localhost no funciona. Aquí están los pasos para usar IP local:\n');
    
    console.log(`${colors.yellow}OPCIÓN 1: Usar IP Local${colors.reset}`);
    console.log(`
  1. En tu PC, abre Command Prompt y ejecuta:
     ${colors.cyan}ipconfig${colors.reset}
     
  2. Busca tu IP local (probablemente empiece con 192.168 o 10.x.x.x)
     Ejemplo: ${colors.cyan}192.168.1.100${colors.reset}

  3. En evcs-mobile/src/services/api.ts, cambia:
     ${colors.cyan}const API_URL = 'http://192.168.1.100:3000/api';${colors.reset}

  4. Reinicia la app móvil
    `);

    console.log(`${colors.yellow}OPCIÓN 2: Usar ADB Reverse (USB)${colors.reset}`);
    console.log(`
  1. Conecta tu dispositivo por USB
  2. En Command Prompt, ejecuta:
     ${colors.cyan}adb reverse tcp:3000 tcp:3000${colors.reset}
     
  3. Verifica que quedó configurado:
     ${colors.cyan}adb reverse --list${colors.reset}
     
  4. Mantén localhost:3000 en api.ts (ya está configurado)

  5. Reinicia la app móvil
    `);
  }

  console.log(`\n${colors.bright}${colors.cyan}════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}📋 Checklist:${colors.reset}`);
  console.log(`${colors.cyan}□${colors.reset} Backend está corriendo: ${colors.cyan}npm start${colors.reset} en evcs-backend`);
  console.log(`${colors.cyan}□${colors.reset} Firewall permite puerto 3000`);
  console.log(`${colors.cyan}□${colors.reset} ADB reverse configurado (si usas USB): ${colors.cyan}adb reverse tcp:3000 tcp:3000${colors.reset}`);
  console.log(`${colors.cyan}□${colors.reset} O API_URL con IP local correcta`);
  console.log(`${colors.cyan}□${colors.reset} Emulador/dispositivo tiene acceso a la red`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════${colors.reset}\n`);
}

runDiagnostics().catch(error => {
  log('error', `Error: ${error.message}`);
  process.exit(1);
});
