import mysql from 'mysql2/promise';

async function inspect() {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'stevedb'
  });
  
  // Inspeccionar tabla user
  const [cols1] = await conn.query('DESCRIBE user');
  console.log('📋 Tabla USER columns:');
  (cols1 as any[]).forEach(c => console.log(`  - ${c.Field}`));
  
  console.log();
  
  // Inspeccionar tabla transaction
  const [cols2] = await conn.query('DESCRIBE transaction');
  console.log('📋 Tabla TRANSACTION columns:');
  (cols2 as any[]).forEach(c => console.log(`  - ${c.Field}`));
  
  console.log();
  
  // Ver datos de ejemplo
  const [users] = await conn.query('SELECT * FROM user LIMIT 2');
  console.log('📊 Ejemplo de users:');
  console.log(JSON.stringify(users, null, 2));
  
  await conn.end();
}

inspect().catch(console.error);
