/**
 * Script para validar que las consultas a Steve funcionan
 */

import mysql from 'mysql2/promise';

const config = {
  steveDb: {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stevedb',
  },
};

async function validateQueries() {
  const connection = await mysql.createConnection(config.steveDb);

  try {
    console.log('🔍 Validando queries de Steve...\n');

    // Test 1: Active Transactions
    console.log('1️⃣ Testing getActiveTransactions query...');
    const [rows1] = await connection.query(`
      SELECT 
        t.transaction_pk,
        t.connector_pk,
        t.id_tag AS idTag,
        t.start_timestamp AS startTimestamp,
        t.start_value AS startValue,
        t.stop_timestamp AS stopTimestamp,
        t.stop_value AS stopValue,
        c.charge_box_id
      FROM transaction t
      JOIN connector c ON t.connector_pk = c.connector_pk
      WHERE t.stop_timestamp IS NULL
      ORDER BY t.start_timestamp DESC
    `);
    console.log(`   ✅ ${(rows1 as any[]).length} transacciones activas encontradas\n`);

    // Test 2: All Transactions
    console.log('2️⃣ Testing getAllTransactions query...');
    const [rows2] = await connection.query(`
      SELECT 
        t.transaction_pk,
        t.connector_pk,
        t.id_tag AS idTag,
        t.start_timestamp AS startTimestamp,
        t.start_value AS startValue,
        t.stop_timestamp AS stopTimestamp,
        t.stop_value AS stopValue,
        c.charge_box_id
      FROM transaction t
      JOIN connector c ON t.connector_pk = c.connector_pk
      ORDER BY t.start_timestamp DESC
      LIMIT 5
    `);
    console.log(`   ✅ ${(rows2 as any[]).length} transacciones totales encontradas`);
    if ((rows2 as any[]).length > 0) {
      console.log('   Ejemplo:', JSON.stringify((rows2 as any[])[0], null, 2));
    }
    console.log();

    // Test 3: All Users
    console.log('3️⃣ Testing getAllUsers query...');
    const [rows3] = await connection.query(
      'SELECT user_pk, id_tag AS idTag, first_name AS firstName, last_name AS lastName, e_mail AS email, phone FROM user LIMIT 5'
    );
    console.log(`   ✅ ${(rows3 as any[]).length} usuarios encontrados`);
    if ((rows3 as any[]).length > 0) {
      console.log('   Ejemplo:', JSON.stringify((rows3 as any[])[0], null, 2));
    }
    console.log();

    // Test 4: Charge Boxes
    console.log('4️⃣ Testing getAllChargePoints query...');
    const [rows4] = await connection.query('SELECT * FROM charge_box LIMIT 5');
    console.log(`   ✅ ${(rows4 as any[]).length} estaciones de carga encontradas`);
    if ((rows4 as any[]).length > 0) {
      console.log('   Ejemplo:', JSON.stringify((rows4 as any[])[0], null, 2));
    }
    console.log();

    console.log('✅ ✅ ✅ Todas las queries funcionan correctamente ✅ ✅ ✅');

  } catch (error: any) {
    console.error('❌ Error en query:', error.message);
    console.error(error);
  } finally {
    await connection.end();
  }
}

validateQueries();
