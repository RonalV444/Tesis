/**
 * Script para inspeccionar la estructura de Steve DB
 * Identifica las columnas reales de las tablas
 */

import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stevedb',
};

async function inspectTables() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);

    console.log('\n📊 ESTRUCTURA DE STEVE DATABASE\n');

    // Inspect transaction table
    console.log('═══════════════════════════════════════');
    console.log('📋 Tabla: transaction');
    console.log('═══════════════════════════════════════');
    
    const [transactionColumns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'stevedb' AND TABLE_NAME = 'transaction'
      ORDER BY ORDINAL_POSITION
    `);

    (transactionColumns as any[]).forEach(col => {
      console.log(`  • ${col.COLUMN_NAME.padEnd(25)} ${col.COLUMN_TYPE.padEnd(20)} NULL:${col.IS_NULLABLE}`);
    });

    // Inspect charge_box table
    console.log('\n═══════════════════════════════════════');
    console.log('📋 Tabla: charge_box');
    console.log('═══════════════════════════════════════');
    
    const [chargeBoxColumns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'stevedb' AND TABLE_NAME = 'charge_box'
      ORDER BY ORDINAL_POSITION
    `);

    (chargeBoxColumns as any[]).forEach(col => {
      console.log(`  • ${col.COLUMN_NAME.padEnd(25)} ${col.COLUMN_TYPE.padEnd(20)} NULL:${col.IS_NULLABLE}`);
    });

    // Inspect user table
    console.log('\n═══════════════════════════════════════');
    console.log('📋 Tabla: user');
    console.log('═══════════════════════════════════════');
    
    const [userColumns] = await connection.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_KEY
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'stevedb' AND TABLE_NAME = 'user'
      ORDER BY ORDINAL_POSITION
    `);

    (userColumns as any[]).forEach(col => {
      console.log(`  • ${col.COLUMN_NAME.padEnd(25)} ${col.COLUMN_TYPE.padEnd(20)} NULL:${col.IS_NULLABLE}`);
    });

    // Sample data
    console.log('\n═══════════════════════════════════════');
    console.log('📊 DATOS DE EJEMPLO');
    console.log('═══════════════════════════════════════');

    const [transactions] = await connection.query(`
      SELECT * FROM transaction LIMIT 5
    `);

    console.log('\n🔹 Transacciones activas:');
    if ((transactions as any[]).length > 0) {
      console.log(JSON.stringify(transactions, null, 2));
    } else {
      console.log('  (No hay transacciones)');
    }

    const [chargeBoxes] = await connection.query(`
      SELECT * FROM charge_box LIMIT 5
    `);

    console.log('\n🔹 Estaciones de carga:');
    if ((chargeBoxes as any[]).length > 0) {
      (chargeBoxes as any[]).forEach(cb => {
        console.log(`  • ${cb.charge_box_id || cb.chargeBoxId} - ${cb.charge_point_vendor || cb.vendor || 'N/A'}`);
      });
    } else {
      console.log('  (No hay estaciones)');
    }

    const [users] = await connection.query(`
      SELECT * FROM user LIMIT 5
    `);

    console.log('\n🔹 Usuarios:');
    if ((users as any[]).length > 0) {
      (users as any[]).forEach(u => {
        console.log(`  • ${u.id_tag || u.idTag || 'N/A'} - ${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`);
      });
    } else {
      console.log('  (No hay usuarios)');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

inspectTables();
