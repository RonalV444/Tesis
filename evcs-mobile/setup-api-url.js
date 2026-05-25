#!/usr/bin/env node

/**
 * Script para configurar automáticamente la IP local
 * 
 * USO:
 *   node setup-api-url.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

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
  const prefix = {
    info: `${colors.blue}ℹ${colors.reset}`,
    success: `${colors.green}✓${colors.reset}`,
    error: `${colors.red}✗${colors.reset}`,
    warn: `${colors.yellow}⚠${colors.reset}`,
  };
  console.log(`${prefix[type]} ${message}`);
}

function getLocalIPAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Solo IPv4, skip si es loopback
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push({
          name: name,
          ip: iface.address,
        });
      }
    }
  }

  return addresses;
}

function updateApiUrl(newUrl) {
  const apiPath = path.join(__dirname, 'src', 'services', 'api.ts');

  if (!fs.existsSync(apiPath)) {
    log('error', `Archivo no encontrado: ${apiPath}`);
    process.exit(1);
  }

  let content = fs.readFileSync(apiPath, 'utf8');

  // Reemplazar la línea de API_URL
  content = content.replace(
    /const API_URL = ['"].*?['"];/,
    `const API_URL = '${newUrl}';`
  );

  fs.writeFileSync(apiPath, content, 'utf8');
  return true;
}

async function run() {
  console.clear();
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}⚙️  CONFIGURACIÓN DE API_URL${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════${colors.reset}\n`);

  const ips = getLocalIPAddresses();

  if (ips.length === 0) {
    log('error', 'No se encontró dirección IP local');
    process.exit(1);
  }

  log('info', 'IPs locales detectadas:');
  ips.forEach((item, index) => {
    console.log(`\n  ${colors.cyan}${index + 1}.${colors.reset} ${item.name}`);
    console.log(`     IP: ${colors.green}${item.ip}${colors.reset}`);
  });

  // Opción de ADB Reverse
  console.log(`\n  ${colors.cyan}0.${colors.reset} Usar ${colors.yellow}localhost${colors.reset} (con ADB Reverse)`);

  console.log(`\n${colors.cyan}Elige una opción (0-${ips.length}):${colors.reset}`);

  // Para testing, podemos usar argumentos de línea de comandos
  const arg = process.argv[2];
  let choice;

  if (arg === 'localhost' || arg === '0') {
    choice = 0;
  } else if (arg && !isNaN(arg)) {
    choice = parseInt(arg);
  } else {
    // En producción, aquí iría un readline prompt
    log('info', '\nUso: node setup-api-url.js [0-' + ips.length + ']');
    log('info', 'Ejemplos:');
    console.log(`  ${colors.cyan}node setup-api-url.js localhost${colors.reset} - Usar localhost con ADB Reverse`);
    console.log(`  ${colors.cyan}node setup-api-url.js 1${colors.reset} - Usar primera IP local`);
    return;
  }

  let apiUrl;

  if (choice === 0) {
    apiUrl = 'http://localhost:3000/api';
    log('info', 'Usando localhost (requiere ADB Reverse)');
    log('info', 'Ejecuta antes: adb reverse tcp:3000 tcp:3000');
  } else if (choice > 0 && choice <= ips.length) {
    const selectedIp = ips[choice - 1].ip;
    apiUrl = `http://${selectedIp}:3000/api`;
    log('info', `Usando IP: ${selectedIp}`);
  } else {
    log('error', 'Opción inválida');
    process.exit(1);
  }

  try {
    updateApiUrl(apiUrl);
    log('success', 'API_URL actualizado correctamente');
    console.log(`\n${colors.bright}Nueva URL:${colors.reset}`);
    console.log(`  ${colors.green}${apiUrl}${colors.reset}\n`);
    
    log('info', 'Pasos siguientes:');
    console.log(`  1. Reinicia la app móvil`);
    console.log(`  2. En Expo, presiona ${colors.cyan}r${colors.reset} para recargar`);
    console.log(`  3. Intenta hacer login\n`);
  } catch (error) {
    log('error', `Error actualizando archivo: ${error.message}`);
    process.exit(1);
  }
}

run();
