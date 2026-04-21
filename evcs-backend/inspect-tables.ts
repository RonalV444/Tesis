import mysql from 'mysql2/promise';

async function inspect() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'stevedb',
  });

  console.log('=== TRANSACTION_START ===');
  const [cols] = await conn.query('DESCRIBE transaction_start');
  (cols as any).forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

  console.log('\n=== TRANSACTION_STOP ===');
  const [cols2] = await conn.query('DESCRIBE transaction_stop');
  (cols2 as any).forEach((c: any) => console.log(`${c.Field} (${c.Type})`));

  console.log('\n=== DATA: Primeras 3 transaction_start ===');
  const [data] = await conn.query('SELECT * FROM transaction_start LIMIT 3');
  console.log(JSON.stringify(data, null, 2));

  console.log('\n=== OCPP_TAG sample ===');
  const [tags] = await conn.query('SELECT * FROM ocpp_tag LIMIT 3');
  console.log(JSON.stringify(tags, null, 2));

  await conn.end();
}

inspect();
