npx ts-node test-firebase.ts/**
 * Script de Setup de Datos de Prueba en Steve
 * Crea estación, usuario y transacción para testing
 */

import mysql from 'mysql2/promise';

async function setupTestData() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stevedb',
  });

  try {
    console.log('🔧 Creando datos de prueba en Steve...\n');

    // 1. Crear estación de carga
    console.log('1️⃣  Creando estación de carga...');
    await conn.query(`
      INSERT IGNORE INTO charge_box (charge_box_id, registration_status)
      VALUES ('TEST-STATION-01', 'Accepted')
    `);
    const [chargeBox] = await conn.query(
      'SELECT * FROM charge_box WHERE charge_box_id = ?',
      ['TEST-STATION-01']
    );
    const chargeBoxPk = (chargeBox as any)[0]?.charge_box_pk;
    console.log(`   ✅ Estación creada con PK: ${chargeBoxPk}`);

    // 2. Crear conector
    console.log('\n2️⃣  Creando conector...');
    await conn.query(`
      INSERT IGNORE INTO connector (charge_box_id, connector_id)
      VALUES (?, 1)
    `, ['TEST-STATION-01']);
    const [connector] = await conn.query(
      'SELECT * FROM connector WHERE charge_box_id = ? AND connector_id = ?',
      ['TEST-STATION-01', 1]
    );
    const connectorPk = (connector as any)[0]?.connector_pk;
    console.log(`   ✅ Conector creado con PK: ${connectorPk}`);

    // 3. Crear usuario RFID
    console.log('\n3️⃣  Creando usuario RFID...');
    const testIdTag = 'TEST-USER-001';
    await conn.query(`
      INSERT IGNORE INTO ocpp_tag (id_tag, expiry_date)
      VALUES (?, DATE_ADD(NOW(), INTERVAL 1 YEAR))
    `, [testIdTag]);
    console.log(`   ✅ Usuario RFID creado: ${testIdTag}`);

    // 4. Iniciar transacción (transaction_start)
    console.log('\n4️⃣  Iniciando transacción...');
    const startTimestamp = new Date();
    const eventTimestamp = new Date();
    await conn.query(`
      INSERT INTO transaction_start (
        event_timestamp,
        connector_pk,
        id_tag,
        start_timestamp,
        start_value
      ) VALUES (?, ?, ?, ?, ?)
    `, [
      eventTimestamp,
      connectorPk,
      testIdTag,
      startTimestamp,
      '0'
    ]);
    
    const [txStart] = await conn.query(
      'SELECT * FROM transaction_start WHERE id_tag = ? ORDER BY transaction_pk DESC LIMIT 1',
      [testIdTag]
    );
    const transactionPk = (txStart as any)[0]?.transaction_pk;
    console.log(`   ✅ Transacción iniciada con PK: ${transactionPk}`);

    // Mostrar resumen
    console.log('\n' + '='.repeat(50));
    console.log('✅ DATOS DE PRUEBA CREADOS');
    console.log('='.repeat(50));
    console.log(`
📊 Resumen:
  Estación: TEST-STATION-01 (PK: ${chargeBoxPk})
  Conector: 1 (PK: ${connectorPk})
  Usuario: ${testIdTag}
  Transacción: PK ${transactionPk}
  Estado: ACTIVA

🔍 Para verificar:
  SELECT * FROM transaction_start WHERE id_tag = '${testIdTag}';
  SELECT * FROM charge_box WHERE charge_box_id = 'TEST-STATION-01';
    `);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await conn.end();
  }
}

setupTestData();
