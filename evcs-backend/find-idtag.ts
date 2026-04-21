import mysql from 'mysql2/promise';

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost', user: 'root', password: '', database: 'stevedb'
  });
  
  // Ver donde está id_tag
  const [result] = await conn.query(
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE COLUMN_NAME = "id_tag" AND TABLE_SCHEMA = "stevedb"'
  );
  
  console.log('📍 Columna id_tag existe en:');
  (result as any[]).forEach(r => console.log(`  - Tabla: ${r.TABLE_NAME}`));
  
  // Ver todas las tablas
  const [tables] = await conn.query(
    'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = "stevedb" AND TABLE_TYPE = "BASE TABLE" ORDER BY TABLE_NAME'
  );
  
  console.log('\n📋 Tablas disponibles:');
  (tables as any[]).forEach(t => console.log(`  - ${t.TABLE_NAME}`));
  
  await conn.end();
})();
