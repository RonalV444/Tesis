import mysql from 'mysql2/promise';

async function inspect() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stevedb',
  });

  console.log('Buscando tablas con "meter" o "value"...');
  const [tables] = await conn.query(`
    SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
    WHERE TABLE_SCHEMA = 'stevedb' 
    AND (TABLE_NAME LIKE '%meter%' OR TABLE_NAME LIKE '%value%')
  `);
  
  console.log(JSON.stringify(tables, null, 2));

  await conn.end();
}

inspect();
