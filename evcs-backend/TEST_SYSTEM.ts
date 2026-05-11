/**
 * 🧪 SCRIPT DE TESTING END-TO-END
 * Prueba todo el sistema sin necesidad de teléfono o Postman
 */

import axios from 'axios';

const API_URL = 'http://localhost:3000/api';
const OCPP_WS = 'ws://localhost:9220/ocpp/';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  message: string;
  data?: any;
}

const results: TestResult[] = [];

// ─────────────────────────────────────────────────────
// 1️⃣ TEST: API Health Check
// ─────────────────────────────────────────────────────
async function testHealthCheck() {
  try {
    const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
    results.push({
      name: '✅ API Health Check',
      status: 'PASS',
      message: 'API está respondiendo correctamente',
      data: response.data,
    });
  } catch (error: any) {
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
    const response = await axios.post(`${API_URL}/auth/register`, {
      name: 'Test User EVCS',
      email: `test-${Date.now()}@evcs.com`,
      password: 'password123',
      phoneNumber: '+34612345678',
    });

    if (response.data.success) {
      results.push({
        name: '✅ Crear Usuario',
        status: 'PASS',
        message: 'Usuario creado correctamente',
        data: { userId: response.data.data?.id, email: response.data.data?.email },
      });
    }
  } catch (error: any) {
    results.push({
      name: '❌ Crear Usuario',
      status: 'FAIL',
      message: `Error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 3️⃣ TEST: Login
// ─────────────────────────────────────────────────────
let authToken = '';
async function testLogin() {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@evcs.com',
      password: 'password123',
    });

    if (response.data.success && response.data.data?.token) {
      authToken = response.data.data.token;
      results.push({
        name: '✅ Login',
        status: 'PASS',
        message: 'Autenticación exitosa',
        data: { token: authToken.substring(0, 20) + '...' },
      });
    }
  } catch (error: any) {
    results.push({
      name: '❌ Login',
      status: 'FAIL',
      message: `Error: ${error.response?.data?.error?.message || error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 4️⃣ TEST: Registrar Device Token FCM
// ─────────────────────────────────────────────────────
async function testRegisterDeviceToken() {
  try {
    const response = await axios.post(
      `${API_URL}/users/device-tokens`,
      {
        token: `fcm-test-token-${Date.now()}`,
        platform: 'android',
      },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    if (response.data.success) {
      results.push({
        name: '✅ Registrar Device Token',
        status: 'PASS',
        message: 'Token FCM registrado correctamente',
      });
    }
  } catch (error: any) {
    results.push({
      name: '❌ Registrar Device Token',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 5️⃣ TEST: RuleEngine Evaluation
// ─────────────────────────────────────────────────────
async function testRuleEngineEvaluation() {
  try {
    // Importar RuleEngine
    const { ruleEngine } = await import('./dist/services/ruleEngine.js');

    // Simular evento OCPP con SOC 92% (debe disparar R1)
    const event = {
      chargePointId: 'CP-TEST-001',
      userId: 'test-user',
      eventType: 'MeterValues',
      soc: 92,
      power: 7.5,
      current: 10,
      voltage: 230,
      timestamp: new Date().toISOString(),
    };

    const result = ruleEngine.evaluate(event);

    if (result && result.ruleTriggered === 'R1-SOC') {
      results.push({
        name: '✅ RuleEngine (R1 - SOC)',
        status: 'PASS',
        message: 'Regla R1 disparada correctamente en SOC 92%',
        data: {
          title: result.title,
          body: result.body,
          priority: result.priority,
        },
      });
    } else {
      results.push({
        name: '❌ RuleEngine (R1 - SOC)',
        status: 'FAIL',
        message: 'Regla R1 no se disparó como se esperaba',
      });
    }
  } catch (error: any) {
    results.push({
      name: '❌ RuleEngine (R1 - SOC)',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 6️⃣ TEST: Obtener Notificaciones
// ─────────────────────────────────────────────────────
async function testGetNotifications() {
  try {
    const response = await axios.get(`${API_URL}/notifications`, {
      headers: { Authorization: `Bearer ${authToken}` },
      params: { page: 1, limit: 10 },
    });

    if (response.data.success) {
      results.push({
        name: '✅ Obtener Notificaciones',
        status: 'PASS',
        message: `Notificaciones recuperadas correctamente (${response.data.data?.items?.length || 0} notificaciones)`,
      });
    }
  } catch (error: any) {
    results.push({
      name: '⚠️ Obtener Notificaciones',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 7️⃣ TEST: Obtener Sesiones Activas
// ─────────────────────────────────────────────────────
async function testGetActiveSessions() {
  try {
    const response = await axios.get(`${API_URL}/sessions/active`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.data.success) {
      results.push({
        name: '✅ Obtener Sesiones Activas',
        status: 'PASS',
        message: `Sesiones activas recuperadas (${response.data.data?.length || 0} sesiones)`,
      });
    }
  } catch (error: any) {
    results.push({
      name: '⚠️ Obtener Sesiones Activas',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// 8️⃣ TEST: Perfil de Usuario
// ─────────────────────────────────────────────────────
async function testGetUserProfile() {
  try {
    const response = await axios.get(`${API_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (response.data.success && response.data.data) {
      results.push({
        name: '✅ Obtener Perfil',
        status: 'PASS',
        message: 'Perfil de usuario obtenido correctamente',
        data: {
          name: response.data.data.name,
          email: response.data.data.email,
        },
      });
    }
  } catch (error: any) {
    results.push({
      name: '❌ Obtener Perfil',
      status: 'FAIL',
      message: `Error: ${error.message}`,
    });
  }
}

// ─────────────────────────────────────────────────────
// EJECUTAR TODOS LOS TESTS
// ─────────────────────────────────────────────────────
async function runAllTests() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         🧪 TESTING END-TO-END - SISTEMA EVCS                  ║');
  console.log('║              Backend + RuleEngine + API Integration             ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('🔍 Iniciando tests...\n');

  // Ejecutar tests secuencialmente
  await testHealthCheck();
  console.log('⏳ Test 1/8 completado\n');

  await testCreateUser();
  console.log('⏳ Test 2/8 completado\n');

  await testLogin();
  console.log('⏳ Test 3/8 completado\n');

  if (authToken) {
    await testRegisterDeviceToken();
    console.log('⏳ Test 4/8 completado\n');

    await testGetUserProfile();
    console.log('⏳ Test 5/8 completado\n');

    await testGetActiveSessions();
    console.log('⏳ Test 6/8 completado\n');

    await testGetNotifications();
    console.log('⏳ Test 7/8 completado\n');
  }

  await testRuleEngineEvaluation();
  console.log('⏳ Test 8/8 completado\n');

  // ─────────────────────────────────────────────────────
  // MOSTRAR RESULTADOS
  // ─────────────────────────────────────────────────────
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║                       RESULTADOS FINALES                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;

  results.forEach((result) => {
    console.log(`${result.name}`);
    console.log(`   └─ ${result.message}`);
    if (result.data) {
      console.log(`   └─ Data: ${JSON.stringify(result.data)}`);
    }
    console.log();
  });

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log(`║  Resultados: ${passed} PASADAS | ${failed} FALLOS`);
  console.log(`║  Total: ${results.length} tests ejecutados`);
  console.log(`║  Tasa de éxito: ${((passed / results.length) * 100).toFixed(1)}%`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (passed === results.length) {
    console.log('✅ TODOS LOS TESTS PASARON - SISTEMA FUNCIONANDO CORRECTAMENTE\n');
  } else {
    console.log(
      `⚠️ ${failed} test(s) fallaron - Revisar errores arriba\n`
    );
  }
}

// Ejecutar
runAllTests().catch(console.error);
