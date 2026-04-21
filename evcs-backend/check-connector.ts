import mysql from 'mysql2/promise';

const config = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'stevedb',
};

async function checkConnectorTable() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);

    // Describe connector table
    const [columns] = await connection.query(`DESCRIBE connector`);
    
    console.log('\n📋 Tabla: connector');
    (columns as any[]).forEach(col => {
      console.log(`  • ${col.Field.padEnd(25)} ${col.Type.padEnd(25)} KEY:${col.Key}`);
    });

    // Sample query
    const [sample] = await connection.query(`SELECT * FROM connector LIMIT 1`);
    if (Array.isArray(sample) && sample.length > 0) {
      console.log('\n🔹 Ejemplo:');
      console.log(JSON.stringify(sample[0], null, 2));
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkConnectorTable();
