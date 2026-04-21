/**
 * SCRIPT DE DIAGNÓSTICO COMPLETO
 * Valida todas las conexiones, bases de datos y estado del sistema
 * 
 * Uso: npm run diagnostic
 */

import mysql from 'mysql2/promise';
import { config } from './src/config/env';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

interface DiagnosticResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string;
}

const results: DiagnosticResult[] = [];

function log(type: 'info' | 'success' | 'error' | 'warn', message: string) {
  const prefix = {
    info: `${COLORS.cyan}ℹ${COLORS.reset}`,
    success: `${COLORS.green}✅${COLORS.reset}`,
    error: `${COLORS.red}❌${COLORS.reset}`,
    warn: `${COLORS.yellow}⚠️${COLORS.reset}`,
  }[type];
  console.log(`${prefix} ${message}`);
}

async function testLocalDatabase(): Promise<DiagnosticResult> {
  try {
    const connection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
    });

    await connection.ping();
    await connection.end();

    return {
      name: 'Local Database Connection',
      status: 'PASS',
      message: `✅ Conectado a MySQL en ${config.db.host}:3306`,
    };
  } catch (error: any) {
    return {
      name: 'Local Database Connection',
      status: 'FAIL',
      message: `❌ Error conectando a MySQL`,
      details: error.message,
    };
  }
}

async function testLocalDatabaseExists(): Promise<DiagnosticResult> {
  try {
    const connection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
    });

    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [config.db.database]
    );

    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      return {
        name: 'Local Database Exists',
        status: 'PASS',
        message: `✅ BD local "${config.db.database}" existe`,
      };
    } else {
      return {
        name: 'Local Database Exists',
        status: 'FAIL',
        message: `❌ BD local "${config.db.database}" NO existe`,
        details: 'Necesitas ejecutar: npm run init-db',
      };
    }
  } catch (error: any) {
    return {
      name: 'Local Database Exists',
      status: 'FAIL',
      message: `❌ Error verificando BD`,
      details: error.message,
    };
  }
}

async function testLocalDatabaseTables(): Promise<DiagnosticResult> {
  try {
    const connection = await mysql.createConnection({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
    });

    const requiredTables = [
      'device_tokens',
      'notifications_log',
      'transaction_events',
      'polling_status',
    ];

    const [rows] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [config.db.database]
    );

    const existingTables = (rows as any[]).map((r) => r.TABLE_NAME);
    const missingTables = requiredTables.filter(
      (t) => !existingTables.includes(t)
    );

    await connection.end();

    if (missingTables.length === 0) {
      return {
        name: 'Local Database Tables',
        status: 'PASS',
        message: `✅ Todas las tablas existen: ${requiredTables.join(', ')}`,
      };
    } else {
      return {
        name: 'Local Database Tables',
        status: 'FAIL',
        message: `❌ Tablas faltantes: ${missingTables.join(', ')}`,
        details: `Existen: ${existingTables.join(', ')}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Local Database Tables',
      status: 'FAIL',
      message: `❌ Error verificando tablas`,
      details: error.message,
    };
  }
}

async function testSteveDatabase(): Promise<DiagnosticResult> {
  try {
    const connection = await mysql.createConnection({
      host: config.steveDb.host,
      user: config.steveDb.user,
      password: config.steveDb.password,
    });

    await connection.ping();
    await connection.end();

    return {
      name: 'Steve Database Connection',
      status: 'PASS',
      message: `✅ Conectado a Steve DB en ${config.steveDb.host}:3306`,
    };
  } catch (error: any) {
    return {
      name: 'Steve Database Connection',
      status: 'FAIL',
      message: `❌ Error conectando a Steve DB`,
      details: error.message,
    };
  }
}

async function testSteveDatabaseExists(): Promise<DiagnosticResult> {
  try {
    const connection = await mysql.createConnection({
      host: config.steveDb.host,
      user: config.steveDb.user,
      password: config.steveDb.password,
    });

    const [rows] = await connection.query(
      `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`,
      [config.steveDb.database]
    );

    await connection.end();

    if (Array.isArray(rows) && rows.length > 0) {
      return {
        name: 'Steve Database Exists',
        status: 'PASS',
        message: `✅ BD Steve "${config.steveDb.database}" existe`,
      };
    } else {
      return {
        name: 'Steve Database Exists',
        status: 'FAIL',
        message: `❌ BD Steve "${config.steveDb.database}" NO existe`,
        details: 'Steve debe estar corriendo con BD inicializada',
      };
    }
  } catch (error: any) {
    return {
      name: 'Steve Database Exists',
      status: 'FAIL',
      message: `❌ Error verificando BD Steve`,
      details: error.message,
    };
  }
}

async function testSteveCoreTables(): Promise<DiagnosticResult> {
  try {
    const connection = await mysql.createConnection({
      host: config.steveDb.host,
      user: config.steveDb.user,
      password: config.steveDb.password,
      database: config.steveDb.database,
    });

    const requiredTables = ['charge_box', 'user', 'transaction'];

    const [rows] = await connection.query(
      `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?`,
      [config.steveDb.database]
    );

    const existingTables = (rows as any[]).map((r) => r.TABLE_NAME);
    const missingTables = requiredTables.filter(
      (t) => !existingTables.includes(t)
    );

    await connection.end();

    if (missingTables.length === 0) {
      return {
        name: 'Steve Core Tables',
        status: 'PASS',
        message: `✅ Tablas de Steve existen`,
      };
    } else {
      return {
        name: 'Steve Core Tables',
        status: 'FAIL',
        message: `❌ Tablas faltantes en Steve`,
        details: `Faltantes: ${missingTables.join(', ')}`,
      };
    }
  } catch (error: any) {
    return {
      name: 'Steve Core Tables',
      status: 'FAIL',
      message: `❌ Error verificando tablas de Steve`,
      details: error.message,
    };
  }
}

async function testConfiguration(): Promise<DiagnosticResult> {
  const issues = [];

  if (!config.fcm.serverKey || config.fcm.serverKey === 'your_fcm_server_key_here') {
    issues.push('FCM_SERVER_KEY no configurado (notificaciones push no funcionarán)');
  }

  if (config.isProduction && (!config.db.password || !config.steveDb.password)) {
    issues.push('Contraseñas de BD vacías en producción (inseguro)');
  }

  if (issues.length > 0) {
    return {
      name: 'Configuration',
      status: config.isProduction ? 'FAIL' : 'WARN',
      message: `⚠️ Problemas de configuración detectados`,
      details: issues.join('\n'),
    };
  }

  return {
    name: 'Configuration',
    status: 'PASS',
    message: `✅ Configuración OK (NODE_ENV=${config.nodeEnv})`,
  };
}

function printResults() {
  console.log('\n');
  console.log(`${COLORS.bright}╔════════════════════════════════════════════════════════╗${COLORS.reset}`);
  console.log(`${COLORS.bright}║        DIAGNÓSTICO DEL SISTEMA EVCS BACKEND            ║${COLORS.reset}`);
  console.log(`${COLORS.bright}╚════════════════════════════════════════════════════════╝${COLORS.reset}`);
  console.log('');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const warned = results.filter((r) => r.status === 'WARN').length;

  for (const result of results) {
    const icon =
      result.status === 'PASS'
        ? '✅'
        : result.status === 'FAIL'
          ? '❌'
          : '⚠️';

    console.log(`${icon} ${result.name}`);
    console.log(`   ${result.message}`);
    if (result.details) {
      console.log(`   📝 ${result.details}`);
    }
    console.log('');
  }

  console.log(`${COLORS.bright}RESUMEN:${COLORS.reset}`);
  console.log(
    `  ${COLORS.green}✅ Pasados: ${passed}${COLORS.reset} | ${COLORS.red}❌ Fallidos: ${failed}${COLORS.reset} | ${COLORS.yellow}⚠️ Advertencias: ${warned}${COLORS.reset}`
  );
  console.log('');

  if (failed === 0) {
    console.log(
      `${COLORS.green}${COLORS.bright}🎉 TODO ESTÁ OK - Puedes iniciar el backend${COLORS.reset}`
    );
    console.log('');
    console.log(`Comando para iniciar:  ${COLORS.cyan}npm run dev${COLORS.reset}`);
  } else {
    console.log(
      `${COLORS.red}${COLORS.bright}⚠️ HAY PROBLEMAS - Revisa los errores arriba${COLORS.reset}`
    );
  }

  console.log('');
}

async function runDiagnostics() {
  console.log(`\n${COLORS.cyan}${COLORS.bright}Iniciando diagnóstico...${COLORS.reset}\n`);

  // Local DB
  results.push(await testLocalDatabase());
  results.push(await testLocalDatabaseExists());
  results.push(await testLocalDatabaseTables());

  console.log('');

  // Steve DB
  results.push(await testSteveDatabase());
  results.push(await testSteveDatabaseExists());
  results.push(await testSteveCoreTables());

  console.log('');

  // Configuration
  results.push(await testConfiguration());

  printResults();

  // Exit with appropriate code
  const hasFailed = results.some((r) => r.status === 'FAIL');
  process.exit(hasFailed ? 1 : 0);
}

runDiagnostics().catch((error) => {
  console.error('Error en diagnóstico:', error);
  process.exit(1);
});
