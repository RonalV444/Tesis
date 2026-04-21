/**
 * Test simple de Firebase
 * Ejecuta: npx ts-node test-firebase.ts
 */

import { initializeFirebase } from './src/services/firebase';

async function testFirebase() {
  try {
    console.log('🔍 Probando conexión con Firebase...\n');
    const app = initializeFirebase();
    console.log('✅ ¡Conectado a Firebase correctamente!\n');
    console.log('📊 Info del proyecto:');
    console.log(`   - App Name: ${app.name}`);
    console.log(`   - Messaging disponible: ${app.messaging() ? 'SÍ ✅' : 'NO ❌'}`);
  } catch (error) {
    console.error('❌ Error de conexión:', error);
    process.exit(1);
  }
}

testFirebase();
