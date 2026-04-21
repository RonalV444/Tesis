import mysql from 'mysql2/promise';

async function inspect() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stevedb',
  });

  console.log('=== CONNECTOR ===');
  const [cols] = await conn.query('DESCRIBE connector');
  (cols as any).forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

  console.log('\n=== CHARGE_BOX ===');
  const [cols2] = await conn.query('DESCRIBE charge_box');
  (cols2 as any).forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

  console.log('\n=== Existing connectors ===');
  const [data] = await conn.query('SELECT * FROM connector LIMIT 5');
  console.log(JSON.stringify(data, null, 2));

  await conn.end();
}

inspect();
