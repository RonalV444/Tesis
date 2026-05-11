/**
 * 🧪 SCRIPT DE TESTING END-TO-END (JavaScript puro - sin dependencias)
 * Prueba todo el sistema sin necesidad de teléfono o Postman
 */

const API_URL = 'http://localhost:3000/api';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

const results = [];
let authToken = '';
let userId = '';

// ─────────────────────────────────────────────────────
// Helper: Fetch con timeout
// ─────────────────────────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeout = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ─────────────────────────────────────────────────────
// 1️⃣ TEST: API Health Check
// ─────────────────────────────────────────────────────
async function testHealthCheck() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/health`);
    const data = await response.json();

    results.push({
      name: '✅ API Health Check',
      status: 'PASS',
      message: 'API está respondiendo correctamente',
      data: { status: data.status },
    });
  } catch (error) {
    results.push({
      name: '❌ API Health Check',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 2️⃣ TEST: Crear Usuario
// ─────────────────────────────────────────────────────
async function testCreateUser() {
  try {
    const email = `test-${Date.now()}@evcs.com`;
    const response = await fetchWithTimeout(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User EVCS',
        email: email,
        password: 'password123',
        phoneNumber: '+34612345678',
      }),
    });

    const data = await response.json();

    if (data.success && data.data) {
      userId = data.data.id;
      results.push({
        name: '✅ Crear Usuario',
        status: 'PASS',
        message: 'Usuario creado correctamente',
        data: { userId: data.data.id, email: data.data.email },
      });
    } else {
      throw new Error(data.error?.message || 'Error desconocido');
    }
  } catch (error) {
    results.push({
      name: '❌ Crear Usuario',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 3️⃣ TEST: Login
// ─────────────────────────────────────────────────────
async function testLogin() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@evcs.com',
        password: 'password123',
      }),
    });

    const data = await response.json();

    if (data.success && data.data?.token) {
      authToken = data.data.token;
      results.push({
        name: '✅ Login',
        status: 'PASS',
        message: 'Autenticación exitosa',
        data: { token: authToken.substring(0, 20) + '...' },
      });
    } else {
      throw new Error(data.error?.message || 'Error en login');
    }
  } catch (error) {
    results.push({
      name: '⚠️ Login',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 4️⃣ TEST: Registrar Device Token FCM
// ─────────────────────────────────────────────────────
async function testRegisterDeviceToken() {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/users/device-tokens`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          token: `fcm-test-${Date.now()}`,
          platform: 'android',
        }),
      }
    );

    const data = await response.json();

    if (data.success) {
      results.push({
        name: '✅ Registrar Device Token',
        status: 'PASS',
        message: 'Token FCM registrado correctamente',
      });
    } else {
      throw new Error(data.error?.message || 'Error registrando token');
    }
  } catch (error) {
    results.push({
      name: '⚠️ Registrar Device Token',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 5️⃣ TEST: Obtener Perfil de Usuario
// ─────────────────────────────────────────────────────
async function testGetUserProfile() {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/users/profile`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.success && data.data) {
      results.push({
        name: '✅ Obtener Perfil',
        status: 'PASS',
        message: 'Perfil de usuario obtenido correctamente',
        data: {
          name: data.data.name,
          email: data.data.email,
        },
      });
    } else {
      throw new Error(data.error?.message || 'Error obteniendo perfil');
    }
  } catch (error) {
    results.push({
      name: '⚠️ Obtener Perfil',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 6️⃣ TEST: Obtener Sesiones Activas
// ─────────────────────────────────────────────────────
async function testGetActiveSessions() {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/sessions/active`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      results.push({
        name: '✅ Obtener Sesiones Activas',
        status: 'PASS',
        message: `Sesiones activas recuperadas (${data.data?.length || 0} sesiones)`,
      });
    } else {
      throw new Error(data.error?.message || 'Error obteniendo sesiones');
    }
  } catch (error) {
    results.push({
      name: '⚠️ Obtener Sesiones Activas',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 7️⃣ TEST: Obtener Notificaciones
// ─────────────────────────────────────────────────────
async function testGetNotifications() {
  try {
    const response = await fetchWithTimeout(
      `${API_URL}/notifications?page=1&limit=10`,
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    const data = await response.json();

    if (data.success) {
      results.push({
        name: '✅ Obtener Notificaciones',
        status: 'PASS',
        message: `Notificaciones recuperadas (${data.data?.items?.length || 0} notificaciones)`,
      });
    } else {
      throw new Error(data.error?.message || 'Error obteniendo notificaciones');
    }
  } catch (error) {
    results.push({
      name: '⚠️ Obtener Notificaciones',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 8️⃣ TEST: Backend Funcionando
// ─────────────────────────────────────────────────────
async function testBackendStatus() {
  try {
    const response = await fetchWithTimeout(`${API_URL}/health`, {}, 3000);
    const data = await response.json();

    results.push({
      name: '✅ Backend Status',
      status: 'PASS',
      message: 'Backend EVCS está operacional y respondiendo',
      data: { uptime: data.uptime, port: 3000 },
    });
  } catch (error) {
    results.push({
      name: '❌ Backend Status',
      status: 'FAIL',
      message: `Backend no está disponible: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// PRINT HEADER
// ─────────────────────────────────────────────────────
function printHeader() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         🧪 TESTING END-TO-END - SISTEMA EVCS                  ║');
  console.log('║              Backend + API + Rules + Notifications               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
}

// ─────────────────────────────────────────────────────
// PRINT RESULTS
// ─────────────────────────────────────────────────────
function printResults() {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                       RESULTADOS FINALES                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warnings = results.filter((r) => r.name.includes('⚠️')).length;

  results.forEach((result) => {
    console.log(`${colors.bright}${result.name}${colors.reset}`);
    console.log(`   └─ ${result.message}`);
    if (result.data) {
      console.log(`   └─ ${JSON.stringify(result.data)}`);
    }
    console.log();
  });

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`│  ✅ Pasadas: ${passed}       ⚠️  Advertencias: ${warnings}       ❌ Fallos: ${failed}`);
  console.log(`│  Total: ${results.length} tests ejecutados`);
  console.log(
    `│  Tasa de éxito: ${((passed / results.length) * 100).toFixed(1)}%`
  );
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (passed === results.length) {
    console.log(
      `${colors.green}${colors.bright}✅ TODOS LOS TESTS PASARON - SISTEMA FUNCIONANDO CORRECTAMENTE${colors.reset}\n`
    );
  } else if (failed === 0) {
    console.log(
      `${colors.yellow}⚠️ Tests completados con advertencias (conexión a DB puede estar ausente)${colors.reset}\n`
    );
  } else {
    console.log(
      `${colors.red}❌ ${failed} test(s) fallaron - Revisar errores arriba${colors.reset}\n`
    );
  }
}

// ─────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────
async function runAllTests() {
  printHeader();
  console.log('🔍 Iniciando tests...\n');

  // Test 1: Backend
  await testBackendStatus();
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test 2: Health
  await testHealthCheck();
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test 3: Crear usuario
  await testCreateUser();
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Test 4: Login
  await testLogin();
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Tests restantes solo si tenemos token
  if (authToken) {
    await testRegisterDeviceToken();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testGetUserProfile();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testGetActiveSessions();
    await new Promise((resolve) => setTimeout(resolve, 500));

    await testGetNotifications();
    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  printResults();
}

// Ejecutar
runAllTests().catch((err) => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
