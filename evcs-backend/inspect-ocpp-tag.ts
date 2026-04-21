import mysql from 'mysql2/promise';

async function inspect() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stevedb',
  });

  console.log('=== OCPP_TAG ===');
  const [cols] = await conn.query('DESCRIBE ocpp_tag');
  (cols as any).forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

  await conn.end();
}

inspect();
